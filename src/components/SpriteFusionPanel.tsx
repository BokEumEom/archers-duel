import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check, AlertCircle, RefreshCw, ExternalLink, Image as ImageIcon, Shield, Crosshair } from 'lucide-react';
import { SpriteFusionAsset, EnemyDesignId, EnemyDesignOption } from '../types';
import { drawArcher } from '../graphics/sprites';

interface SpriteFusionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAsset: (category: 'player' | 'enemy' | 'scenery' | 'arrow' | 'logo', imageUrl: string) => void;
  currentAssets: SpriteFusionAsset[];
  selectedEnemyDesign: EnemyDesignId;
  onSelectEnemyDesign: (design: EnemyDesignId) => void;
}

export const ENEMY_DESIGN_OPTIONS: EnemyDesignOption[] = [
  {
    id: 'STAG_HELM',
    name: 'Armored Stag Knight',
    title: 'Champion of the High Crags',
    description: 'Heavy steel greathelm crowned with sweeping branching stag antlers, fluted plate cuirass, and a gold-trimmed crimson tabard.',
    equipment: 'Greathorn composite war bow, steel pauldrons, riveted sabatons',
    prompt: 'Armored medieval archer knight wearing full plate armor with a greathelm crowned with branching stag antlers, holding a heavy horn composite war bow, 16-color pixel art, 32x32, side battle stance',
  },
  {
    id: 'SHADOW_RANGER',
    name: 'Shadow Ranger',
    title: 'Scout of the Ravenwood',
    description: 'Midnight hooded cowl with a carved stag-bone half mask, glowing emerald eye slits, and raven feather shoulder mantle.',
    equipment: 'Obsidian recurve bow, blackened studded leather',
    prompt: 'Medieval shadow ranger archer wearing a dark hooded cowl and carved bone mask with glowing green eyes, holding an obsidian recurve bow, 16-color pixel art, 32x32',
  },
  {
    id: 'TEUTONIC_KNIGHT',
    name: 'Teutonic Marksman',
    title: 'Siege Archer of the Order',
    description: 'Iron kettle helmet with aventail chainmail coif, wearing an off-white surcoat emblazoned with a bold black heraldic cross.',
    equipment: 'Iron-reinforced siege longbow, chain hauberk',
    prompt: 'Teutonic knight archer wearing an iron kettle helmet and chainmail with a white surcoat with a black cross, holding a heavy siege longbow, 16-color pixel art, 32x32',
  },
  {
    id: 'ROYAL_CHAMPION',
    name: 'Royal Champion',
    title: 'Grand Guild Tournament Victor',
    description: 'Gilded open burgonet helmet with a sweeping emerald ostrich plume, wearing a velvet jerkin with gold filigree lace.',
    equipment: 'Masterwork carved yew longbow, golden bracers',
    prompt: 'Medieval royal champion archer wearing a gilded burgonet helmet with an emerald ostrich feather and gold embroidered doublet, holding a masterwork longbow, 16-color pixel art, 32x32',
  },
];

const EnemyDesignPreviewCanvas: React.FC<{ designId: EnemyDesignId }> = ({ designId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // Dark medieval vignette background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 56, 56);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 56, 56);

    // Ground line
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 44, 56, 12);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 44, 56, 1);

    // Draw archer facing left (as enemy) with selected design
    drawArcher(ctx, 28, 44, false, 'IDLE', 35, 60, 0, null, designId);
  }, [designId]);

  return (
    <canvas
      ref={canvasRef}
      width={56}
      height={56}
      className="h-14 w-14 shrink-0 rounded-lg border border-stone-700 bg-stone-950 shadow-md [image-rendering:pixelated]"
    />
  );
};

export const SpriteFusionPanel: React.FC<SpriteFusionPanelProps> = ({
  isOpen,
  onClose,
  onApplyAsset,
  currentAssets,
  selectedEnemyDesign,
  onSelectEnemyDesign,
}) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Checking API status...');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Armored medieval archer knight wearing full plate armor with a greathelm crowned with branching stag antlers, holding a heavy horn composite war bow, 16-color pixel art, 32x32'
  );
  const [selectedTarget, setSelectedTarget] = useState<'player' | 'enemy' | 'scenery' | 'arrow' | 'logo'>('enemy');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [generatedList, setGeneratedList] = useState<SpriteFusionAsset[]>(currentAssets);
  const [activeTab, setActiveTab] = useState<'enemies' | 'generate' | 'gallery'>('enemies');

  // Check API status
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/sprites/status');
      const data = await res.json();
      setHasKey(data.hasKey);
      setCredits(data.credits);
      setStatusMessage(data.message || (data.hasKey ? 'Connected' : 'No API key in .env'));
      if (data.error) setErrorText(data.error);
      else setErrorText(null);
    } catch {
      setHasKey(false);
      setStatusMessage('Could not reach backend API');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const presets = [
    {
      label: 'Armored Archer with Stag Helmet',
      target: 'enemy' as const,
      prompt: 'Armored medieval archer knight wearing full plate armor with a greathelm crowned with branching stag antlers, holding a heavy horn composite war bow, 16-color pixel art, 32x32, side battle stance',
    },
    {
      label: 'Shadow Ranger (Ravenwood)',
      target: 'enemy' as const,
      prompt: 'Medieval shadow ranger archer wearing a dark hooded cowl and carved bone mask with glowing green eyes, holding an obsidian recurve bow, 16-color pixel art, 32x32',
    },
    {
      label: 'Teutonic Order Marksman',
      target: 'enemy' as const,
      prompt: 'Teutonic knight archer wearing an iron kettle helmet and chainmail with a white surcoat with a black cross, holding a heavy siege longbow, 16-color pixel art, 32x32',
    },
    {
      label: 'Player Archer (Sherwood Hero)',
      target: 'player' as const,
      prompt: 'Heroic medieval archer in green tunic with wooden longbow, 16-color pixel art, 32x32, side view',
    },
    {
      label: 'Autumn Oak Leaf (Wind Drift)',
      target: 'scenery' as const,
      prompt: 'One small dry golden ochre oak leaf drifting sideways in autumn wind. Simple asymmetrical pointed silhouette with a short thin stem and two darker ochre vein accents. Muted amber and warm brown palette, compact shape.',
    },
    {
      label: 'Medieval Broadhead Arrow',
      target: 'arrow' as const,
      prompt: 'Medieval wooden arrow with iron broadhead and white swan feathers, pixel art, 16x16',
    },
    {
      label: 'Castle Scenery Parapet',
      target: 'scenery' as const,
      prompt: 'Medieval stone castle tower battlement with fluttering banner, pixel art, 32x32',
    },
    {
      label: 'Title Splash Screen Logo',
      target: 'logo' as const,
      prompt: 'Medieval shield coat of arms with crossed longbows and gold filigree, pixel art, 64x64',
    },
  ];

  const handleGenerate = async (promptToUse?: string, targetToUse?: typeof selectedTarget) => {
    const prompt = promptToUse || customPrompt;
    const target = targetToUse || selectedTarget;

    setIsGenerating(true);
    setErrorText(null);

    try {
      const res = await fetch('/api/sprites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          size: target === 'arrow' ? 16 : target === 'logo' ? 64 : 32,
          operation: 'generate',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.outputs && data.outputs.length > 0) {
        const newAssetUrl = data.outputs[0].assetUrl;
        const newAsset: SpriteFusionAsset = {
          id: `sf-${Date.now()}`,
          category: target,
          name: prompt.slice(0, 30),
          imageUrl: newAssetUrl,
          generatedAt: new Date().toLocaleTimeString(),
        };
        setGeneratedList((prev) => [newAsset, ...prev]);
        onApplyAsset(target, newAssetUrl);
        // Refresh credits
        checkStatus();
      } else {
        throw new Error('Sprite Fusion did not return any assets for this prompt.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorText(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl sm:rounded-2xl border border-stone-700 bg-stone-900 p-3.5 sm:p-6 text-stone-100 shadow-2xl">
        {/* Sticky Header with Quick Close */}
        <div className="sticky top-0 z-20 -mx-3.5 -mt-3.5 sm:-mx-6 sm:-mt-6 flex items-center justify-between border-b border-stone-800 bg-stone-900/95 px-3.5 py-3 sm:px-6 sm:py-4 backdrop-blur-sm rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Sprite Fusion Art Studio</h2>
              <p className="text-[10px] sm:text-xs text-stone-400">
                Official API integration for medieval pixel art generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* API Key & Credit Status Banner */}
        <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 rounded-xl border border-stone-800 bg-stone-950/60 p-2.5 sm:p-3 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasKey ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
            <span className="font-medium text-stone-300">
              {hasKey ? 'API Key Configured' : 'No API Key Configured'}
            </span>
            {credits !== null && (
              <span className="rounded bg-indigo-950 px-2 py-0.5 font-bold text-indigo-300">
                {credits} Credits Remaining
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={checkStatus}
              className="flex items-center gap-1 text-stone-400 transition-colors hover:text-white"
              title="Refresh status"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
            <a
              href="https://www.spritefusion.com/docs/pixel-art-generator/api"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-400 underline hover:text-indigo-300"
            >
              <span>API Docs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {errorText && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5 text-red-300/90">{errorText}</p>
              {!hasKey && (
                <p className="mt-1 text-stone-400">
                  The game includes built-in hand-crafted 16-color GBA pixel art sprites that run immediately. Add your Sprite Fusion key to <code className="rounded bg-black/40 px-1">.env</code> to generate new custom assets anytime!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-stone-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('enemies')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              activeTab === 'enemies'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Enemy Design Alternatives</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              activeTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sprite Fusion Generator & Presets</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              activeTab === 'gallery'
                ? 'bg-stone-700 text-white shadow-md'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Asset Gallery ({generatedList.length})</span>
          </button>
        </div>

        {/* TAB 1: ENEMY DESIGN ALTERNATIVES */}
        {activeTab === 'enemies' && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5 text-xs text-amber-200">
              <p className="font-bold text-amber-300">⚔️ Genuine Enemy Visual Differentiation</p>
              <p className="mt-1 text-stone-300">
                Compare several tailored archer silhouettes in the same authentic GBA 16-color pixel art palette. Select a design to immediately animate it in your duel, or generate an AI-enhanced variation using Sprite Fusion.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ENEMY_DESIGN_OPTIONS.map((opt) => {
                const isSelected = selectedEnemyDesign === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-stone-900/90 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                        : 'border-stone-800 bg-stone-900/50 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <EnemyDesignPreviewCanvas designId={opt.id} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white">{opt.name}</h4>
                            {isSelected && (
                              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                ACTIVE FOE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-amber-400/90">{opt.title}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-stone-300">{opt.description}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2 text-[10px] text-stone-400">
                        <span className="font-bold text-stone-300">Gear: </span>
                        {opt.equipment}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-stone-800">
                      <button
                        onClick={() => onSelectEnemyDesign(opt.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black shadow'
                            : 'bg-stone-800 text-stone-200 hover:bg-amber-600 hover:text-white'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isSelected ? 'Selected for Duel' : 'Select & Animate'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTarget('enemy');
                          setCustomPrompt(opt.prompt);
                          handleGenerate(opt.prompt, 'enemy');
                        }}
                        disabled={isGenerating}
                        className="flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-950/40 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-900/60 disabled:opacity-50"
                        title="Generate a high-res custom sprite with Sprite Fusion using this prompt"
                      >
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        <span>Sprite Fusion</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SPRITE FUSION GENERATOR & PRESETS */}
        {activeTab === 'generate' && (
          <div className="mt-4 flex flex-col gap-4">
            {/* Quick Generation Presets */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                One-Click Medieval Asset Presets
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={isGenerating}
                    onClick={() => {
                      setSelectedTarget(p.target);
                      setCustomPrompt(p.prompt);
                      handleGenerate(p.prompt, p.target);
                    }}
                    className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-800/60 p-2.5 text-left text-xs transition-all hover:border-indigo-500 hover:bg-stone-800 disabled:opacity-50"
                  >
                    <div>
                      <p className="font-semibold text-stone-200">{p.label}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-400">{p.prompt}</p>
                    </div>
                    <Sparkles className="ml-2 h-4 w-4 shrink-0 text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Custom Sprite Generation
              </h3>
              <div className="mt-2.5 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-stone-400">Apply to:</label>
                  {(['player', 'enemy', 'scenery', 'arrow', 'logo'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedTarget(cat)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                        selectedTarget === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full rounded-lg border border-stone-700 bg-stone-900 p-2.5 text-sm sm:text-xs text-white placeholder-stone-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter pixel art prompt for Sprite Fusion..."
                />

                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Generating via Sprite Fusion API...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate & Apply to Game</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASSET GALLERY */}
        {activeTab === 'gallery' && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Active Sprites & Custom Assets
            </h3>
            {generatedList.length === 0 ? (
              <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-800 p-6 text-center text-xs text-stone-500">
                <ImageIcon className="h-8 w-8 text-stone-600" />
                <p className="mt-2">Currently using high-fidelity native 16-color GBA pixel art sprites.</p>
                <p className="text-[11px] text-stone-600">Generated custom assets from Sprite Fusion will appear here.</p>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {generatedList.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex flex-col items-center rounded-lg border border-stone-800 bg-stone-800/40 p-2.5 text-center"
                  >
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded object-contain [image-rendering:pixelated]"
                    />
                    <span className="mt-1.5 text-[11px] font-semibold text-stone-300">{asset.category}</span>
                    <span className="text-[9px] text-stone-500">{asset.generatedAt}</span>
                    <button
                      onClick={() => onApplyAsset(asset.category, asset.imageUrl)}
                      className="mt-2 flex items-center gap-1 rounded bg-stone-700 px-2 py-0.5 text-[10px] text-stone-200 hover:bg-indigo-600 hover:text-white"
                    >
                      <Check className="h-3 w-3" />
                      <span>Apply</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
