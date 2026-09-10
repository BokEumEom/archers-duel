import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { buildGbaRom } from './src/gba/romBuilder.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API 1: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 2: Sprite Fusion Status & Credits Check
app.get('/api/sprites/status', async (req, res) => {
  const apiKey = process.env.SPRITE_FUSION_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_SPRITE_FUSION_API_KEY') {
    return res.json({
      hasKey: false,
      credits: null,
      message: 'No Sprite Fusion API key configured in .env',
    });
  }

  try {
    const resp = await fetch('https://www.spritefusion.com/api/v1/credits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return res.json({
        hasKey: true,
        credits: null,
        error: `Sprite Fusion API returned ${resp.status}: ${errBody}`,
      });
    }

    const data = await resp.json();
    return res.json({
      hasKey: true,
      credits: data.credits ?? null,
      message: 'Sprite Fusion API connected',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.json({
      hasKey: true,
      credits: null,
      error: `Network error reaching Sprite Fusion: ${errorMsg}`,
    });
  }
});

// API 3: Sprite Fusion Generation Proxy
app.post('/api/sprites/generate', async (req, res) => {
  const apiKey = process.env.SPRITE_FUSION_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_SPRITE_FUSION_API_KEY') {
    return res.status(400).json({
      error: 'SPRITE_FUSION_API_KEY environment variable is not configured. Please add your key in the AI Studio Settings / .env file.',
    });
  }

  const { prompt, size = 32, operation = 'generate', inputs, output_frames, colors } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const requestBody: Record<string, unknown> = {
      operation,
      prompt,
      size,
    };

    if (inputs) requestBody.inputs = inputs;
    if (output_frames) requestBody.output_frames = output_frames;
    if (colors) requestBody.colors = colors;

    const response = await fetch('https://www.spritefusion.com/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Sprite Fusion error (${response.status}): ${errorText}`,
      });
    }

    // Process Server-Sent Events stream from Sprite Fusion
    const textData = await response.text();
    const lines = textData.split('\n');
    const outputs: Array<{ id?: string; assetUrl?: string; type?: string }> = [];

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'output' && parsed.asset) {
            outputs.push(parsed.asset);
          }
        } catch {
          // Continue parsing lines
        }
      }
    }

    return res.json({
      success: true,
      operation,
      outputs,
      total: outputs.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: `Failed to communicate with Sprite Fusion API: ${errorMsg}`,
    });
  }
});

// API 4: Download compiled .gba ROM
app.get('/api/rom/download', (req, res) => {
  try {
    const rom = buildGbaRom();
    res.setHeader('Content-Type', 'application/x-gba-rom');
    res.setHeader('Content-Disposition', 'attachment; filename="archers_duel.gba"');
    res.setHeader('Content-Length', rom.length);
    res.send(Buffer.from(rom));
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to compile GBA ROM: ${errorMsg}` });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Archer's Duel GBA Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
