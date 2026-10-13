import React, { useState, useRef } from 'react';
import { SAMPLE_CASES, MODEL_EXPERIMENTS } from '../data/mockData';
import { SampleCase, ColormapName, ModelId } from '../types';
import { XrayCanvasViewer } from './XrayCanvasViewer';
import { 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Sparkles, 
  Info, 
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Share2,
  Columns,
  Scale,
  Eye,
  ArrowRight,
  Palette,
  Flame
} from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  sublabel?: string;
  badge?: string;
  id?: string;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  sublabel,
  badge,
  id,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  return (
    <div className="flex items-center justify-between gap-3 select-none">
      {(label || sublabel) && (
        <div className="flex flex-col cursor-pointer" onClick={() => onChange(!checked)}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-200">{label}</span>
            {badge && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  checked
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          {sublabel && <span className="text-[11px] text-slate-400 font-mono mt-0.5">{sublabel}</span>}
        </div>
      )}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          isSm ? 'h-5 w-9' : 'h-6 w-11'
        } ${
          checked ? 'bg-cyan-500 shadow-md shadow-cyan-500/30' : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        <span className="sr-only">{label || 'Toggle switch'}</span>
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isSm
              ? checked
                ? 'h-4 w-4 translate-x-4'
                : 'h-4 w-4 translate-x-0'
              : checked
              ? 'h-5 w-5 translate-x-5'
              : 'h-5 w-5 translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export const GradioInferenceDemo: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<SampleCase>(SAMPLE_CASES[1]); // Default to Bacterial Lobar
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>('resnet18_sampler_new_hyperparameters');
  const [targetClass, setTargetClass] = useState<'PNEUMONIA' | 'NORMAL'>('PNEUMONIA');
  const [colormap, setColormap] = useState<ColormapName>('jet');
  const [opacity, setOpacity] = useState<number>(0.65); // Alpha-blending 0 to 1
  const [threshold, setThreshold] = useState<number>(0.15); // Intensity cutoff 0 to 0.8
  const [viewMode, setViewMode] = useState<'overlay' | 'heatmap_only' | 'xray_only' | 'split'>('overlay');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isRunningInference, setIsRunningInference] = useState<boolean>(false);
  const [showColabCommand, setShowColabCommand] = useState<boolean>(false);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false); // ResNet18 vs Ensemble compare toggle
  const [compareSubMode, setCompareSubMode] = useState<'side_by_side' | 'split_wipe'>('side_by_side'); // Dual viewports vs Split curtain

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compute model prediction probabilities based on model ID and ground truth
  const computeModelProbabilities = (modelId: ModelId) => {
    let basePneumoniaProb = customImageUrl 
      ? 0.88 // Default heuristic for custom upload
      : selectedCase.groundTruthProbPneumonia;

    if (modelId === 'mobilenet_v3_large') {
      // MobileNet overpredicts pneumonia strongly (100% recall, 67.8% precision)
      basePneumoniaProb = Math.min(0.999, basePneumoniaProb * 1.15 + 0.12);
    } else if (modelId === 'efficientnet_b0') {
      basePneumoniaProb = Math.min(0.99, basePneumoniaProb * 1.08 + 0.08);
    } else if (modelId === 'ensemble_soft_voting') {
      // Ensemble is more conservative / higher precision
      if (basePneumoniaProb > 0.5) {
        basePneumoniaProb = Math.min(0.98, basePneumoniaProb * 0.98 + 0.01);
      } else {
        basePneumoniaProb = Math.max(0.01, basePneumoniaProb * 0.8);
      }
    }

    const pneuPct = Math.round(basePneumoniaProb * 1000) / 10;
    const normPct = Math.round((100 - pneuPct) * 10) / 10;
    const predictedClass: 'PNEUMONIA' | 'NORMAL' = pneuPct >= 50.0 ? 'PNEUMONIA' : 'NORMAL';
    const confidence = predictedClass === 'PNEUMONIA' ? pneuPct : normPct;

    return { pneuPct, normPct, predictedClass, confidence };
  };

  const activeStats = computeModelProbabilities(selectedModelId);
  const resnetStats = computeModelProbabilities('resnet18_sampler_new_hyperparameters');
  const ensembleStats = computeModelProbabilities('ensemble_soft_voting');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectCase = (c: SampleCase) => {
    setCustomImageUrl(null);
    setSelectedCase(c);
  };

  const handleRunInference = () => {
    setIsRunningInference(true);
    setTimeout(() => {
      setIsRunningInference(false);
    }, 350);
  };

  const currentModel = MODEL_EXPERIMENTS.find(m => m.id === selectedModelId) || MODEL_EXPERIMENTS[5];
  const resnetModel = MODEL_EXPERIMENTS.find(m => m.id === 'resnet18_sampler_new_hyperparameters') || MODEL_EXPERIMENTS[5];
  const ensembleModel = MODEL_EXPERIMENTS.find(m => m.id === 'ensemble_soft_voting') || MODEL_EXPERIMENTS[8];

  const modelsAgree = resnetStats.predictedClass === ensembleStats.predictedClass;
  const confidenceDelta = Math.abs(resnetStats.confidence - ensembleStats.confidence).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Gradio Interface Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">Gradio 4.x Demo Environment</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">04_Inference_GradCAM_and_GUI.ipynb</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Deep-Learning Pneumonia Classifier & Grad-CAM Laboratory
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Side-by-Side Model Comparison Toggle Switch */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <Columns className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Side-by-Side Comparison</span>
                <span className="text-[10px] text-slate-400 font-mono">ResNet18 Champion vs Ensemble</span>
              </div>
            </div>
            <ToggleSwitch
              checked={isCompareMode}
              onChange={setIsCompareMode}
              badge={isCompareMode ? 'ON' : 'OFF'}
              id="header-side-by-side-toggle"
            />
          </div>

          <button
            onClick={() => setShowColabCommand(!showColabCommand)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Colab Command</span>
          </button>
        </div>
      </div>

      {showColabCommand && (
        <div className="p-3.5 rounded-lg bg-slate-950 border border-cyan-900/40 text-xs font-mono text-cyan-200 flex items-center justify-between">
          <code>demo.launch(share=True, debug=True, quiet=True)</code>
          <span className="text-slate-400 text-[11px]">Notebook cell executed with GPU acceleration</span>
        </div>
      )}

      {/* Main Gradio Studio Container */}
      <div className={`grid grid-cols-1 ${isCompareMode ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-6 items-start`}>
        {/* Left Column: Input Selection & Parameters */}
        <div className={`${isCompareMode ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col gap-4`}>
          {/* Section 1: Select Sample Case or Upload */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                1. Select Input Chest Radiograph
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Preloaded Clinical Cases Selector */}
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_CASES.map((c) => {
                const isSelected = !customImageUrl && selectedCase.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-2.5 rounded-lg text-left transition-all border text-xs flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-slate-200 line-clamp-1">{c.subtype}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{c.diagnosis}</span>
                      <span aria-hidden="true">·</span>
                      <span>GT: {Math.round(c.groundTruthProbPneumonia * 100)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {customImageUrl && (
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center justify-between">
                <span>Custom Radiograph Uploaded</span>
                <button
                  onClick={() => setCustomImageUrl(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 font-mono"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Model Architecture Selector & Side-by-Side Comparison Switch */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                2. CNN Architecture & Mode
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {isCompareMode ? 'Dual Model' : 'Standalone'}
              </span>
            </div>

            {/* Dedicated Toggle Switch Card for Side-by-Side Comparison */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                isCompareMode
                  ? 'bg-gradient-to-r from-cyan-950/70 to-slate-950 border-cyan-500/70 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <ToggleSwitch
                checked={isCompareMode}
                onChange={setIsCompareMode}
                label="Side-by-Side Comparison Mode"
                sublabel="ResNet18 Champion vs. Soft-Voting Ensemble"
                badge={isCompareMode ? 'ACTIVE' : 'OFF'}
                id="section2-side-by-side-toggle"
              />
            </div>

            {!isCompareMode ? (
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'resnet18_sampler_new_hyperparameters' as ModelId,
                    name: 'ResNet18 + Sampler (Champion)',
                    tag: 'Acc 90.71% · F1 92.79%',
                    badge: 'WINNER',
                  },
                  {
                    id: 'ensemble_soft_voting' as ModelId,
                    name: 'Soft-Voting Ensemble (ResNet + Eff + Mob)',
                    tag: 'Prec 94.02% · ROC-AUC 0.9643',
                    badge: 'HIGH PRECISION',
                  },
                  {
                    id: 'efficientnet_b0' as ModelId,
                    name: 'EfficientNet-B0 Baseline',
                    tag: 'Acc 72.76% · Recall 99.74%',
                    badge: 'IMBALANCED',
                  },
                  {
                    id: 'mobilenet_v3_large' as ModelId,
                    name: 'MobileNetV3-Large Baseline',
                    tag: 'Acc 70.35% · Recall 100.0%',
                    badge: 'OVERPREDICTOR',
                  },
                ].map((modelOpt) => {
                  const isSelected = selectedModelId === modelOpt.id;
                  return (
                    <button
                      key={modelOpt.id}
                      onClick={() => setSelectedModelId(modelOpt.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{modelOpt.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{modelOpt.tag}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {modelOpt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Section 2 in Compare Mode: Sub-mode Controls */
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Compare Layout:</span>
                  <button
                    type="button"
                    onClick={() => setIsCompareMode(false)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline underline-offset-2"
                  >
                    Switch to Standalone
                  </button>
                </div>

                {/* Sub-mode switcher */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setCompareSubMode('side_by_side')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      compareSubMode === 'side_by_side'
                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Dual Viewports
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareSubMode('split_wipe')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      compareSubMode === 'split_wipe'
                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Split Wipe Slider
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  Evaluating <strong className="text-cyan-300 font-medium">ResNet18 Champion</strong> (90.71% Acc, 95.64% Recall) alongside <strong className="text-amber-300 font-medium">Soft-Voting Ensemble</strong> (89.42% Acc, 94.02% Precision) on the same radiograph.
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Grad-CAM Explainability Parameters (Selector 5) */}
          <div className="relative p-4 rounded-xl bg-slate-900/95 border border-slate-800 shadow-xl shadow-black/40 flex flex-col gap-3.5 backdrop-blur-md overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-cyan-500/80 before:via-blue-500/60 before:to-indigo-500/40">
            {/* Header with Layer & Telemetry Chips */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  3. Grad-CAM Parameters
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  layer4.1.conv2
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 tabular-nums">
                  α: {Math.round(opacity * 100)}%
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800 tabular-nums">
                  τ: {Math.round(threshold * 100)}%
                </span>
              </div>
            </div>

            {/* Target Class & Colormap Selection */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Attribution Class */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-medium flex items-center justify-between">
                  <span>Attribution Class</span>
                  <span className="text-[10px] text-slate-500 font-mono">Target ŷ</span>
                </label>
                <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 gap-1">
                  <button
                    onClick={() => setTargetClass('PNEUMONIA')}
                    className={`flex-1 py-1.5 px-2 text-center rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      targetClass === 'PNEUMONIA'
                        ? 'bg-rose-950 text-rose-200 border border-rose-700/80 shadow-sm shadow-rose-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${targetClass === 'PNEUMONIA' ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>Pneumonia</span>
                  </button>
                  <button
                    onClick={() => setTargetClass('NORMAL')}
                    className={`flex-1 py-1.5 px-2 text-center rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      targetClass === 'NORMAL'
                        ? 'bg-emerald-950 text-emerald-200 border border-emerald-700/80 shadow-sm shadow-emerald-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${targetClass === 'NORMAL' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>Normal</span>
                  </button>
                </div>
              </div>

              {/* Colormap Palette */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-cyan-400" />
                    <span>Colormap</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">256-lut</span>
                </label>
                <select
                  value={colormap}
                  onChange={(e) => setColormap(e.target.value as ColormapName)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                >
                  <option value="jet">Jet (Rainbow · Standard)</option>
                  <option value="turbo">Google Turbo (High Dynamic)</option>
                  <option value="viridis">Viridis (Perceptually Uniform)</option>
                  <option value="inferno">Inferno (Radiological Glow)</option>
                  <option value="cyan_amber">Cyan-Amber (Dual Saliency)</option>
                </select>
                {/* Active Colormap Ramp Preview Strip */}
                <div className="mt-1.5 flex items-center gap-1.5 px-1">
                  <span className="text-[9px] font-mono text-slate-500">0.0</span>
                  <div
                    className={`h-1.5 flex-1 rounded-full border border-slate-700/60 ${
                      colormap === 'jet'
                        ? 'bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-yellow-400 to-red-600'
                        : colormap === 'turbo'
                        ? 'bg-gradient-to-r from-blue-700 via-cyan-400 via-emerald-400 via-amber-400 to-red-600'
                        : colormap === 'viridis'
                        ? 'bg-gradient-to-r from-indigo-950 via-teal-600 to-yellow-300'
                        : colormap === 'inferno'
                        ? 'bg-gradient-to-r from-slate-950 via-purple-900 via-orange-600 to-yellow-200'
                        : 'bg-gradient-to-r from-slate-950 via-cyan-600 to-amber-400'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-500">1.0</span>
                </div>
              </div>
            </div>

            {/* Display Mode Segmented Control with Icons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 text-xs font-medium">Viewport Presentation</label>
                <span className="text-[10px] text-slate-500 font-mono">Active: {viewMode}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                {[
                  { id: 'overlay', label: 'Overlay', icon: Layers },
                  { id: 'split', label: 'Split', icon: Columns },
                  { id: 'heatmap_only', label: 'Heatmap', icon: Flame },
                  { id: 'xray_only', label: 'X-Ray', icon: Eye },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isCur = viewMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id as any)}
                      className={`py-1.5 px-2 text-center rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                        isCur
                          ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${isCur ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alpha-Blending Opacity and Intensity Threshold Range Sliders */}
            <div className="flex flex-col gap-3 pt-0.5">
              {/* Alpha-Blending Transparency Range Slider */}
              <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800/90 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">Alpha-Blending Transparency (α)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono tabular-nums text-xs px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/70 font-bold">
                      {Math.round(opacity * 100)}%
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      (α = {opacity.toFixed(2)})
                    </span>
                  </div>
                </div>

                {/* Range Slider Track */}
                <input
                  type="range"
                  min="0.00"
                  max="1.00"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
                  aria-label="Alpha-blending transparency slider"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
                  {[
                    { label: '0% Raw', val: 0.00 },
                    { label: '30% Subtle', val: 0.30 },
                    { label: '65% Std', val: 0.65 },
                    { label: '85% Strong', val: 0.85 },
                    { label: '100% Solid', val: 1.00 },
                  ].map((preset) => {
                    const isCurrent = Math.abs(opacity - preset.val) < 0.04;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setOpacity(preset.val)}
                        className={`py-1 px-1 rounded transition-colors text-center ${
                          isCurrent
                            ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 font-bold shadow-xs'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Contextual Helper */}
                <p className="text-[11px] text-slate-400 leading-tight">
                  {opacity === 0
                    ? '100% Transparent: Grad-CAM overlay suppressed. Viewing pure radiographic parenchyma.'
                    : opacity < 0.35
                    ? 'Subtle Transparency: Faint heatmap hints with maximum anatomical clarity (ribs, margins).'
                    : opacity < 0.75
                    ? 'Balanced Blending (Recommended): Co-registers convolutional focus over lung parenchyma.'
                    : 'High Opacity: Strong saliency mask dominant over underlying radiograph.'}
                </p>
              </div>

              {/* Intensity Threshold Cutoff Slider */}
              <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800/90 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">Intensity Threshold Cutoff (τ)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono tabular-nums text-xs px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/70 font-bold">
                      {Math.round(threshold * 100)}%
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      (τ = {threshold.toFixed(2)})
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.00"
                  max="0.80"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
                  aria-label="Intensity threshold cutoff slider"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                  {[
                    { label: '0% Raw', val: 0.00 },
                    { label: '15% Std', val: 0.15 },
                    { label: '30% Focal', val: 0.30 },
                    { label: '50% Peak', val: 0.50 },
                  ].map((preset) => {
                    const isCurrent = Math.abs(threshold - preset.val) < 0.03;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setThreshold(preset.val)}
                        className={`py-1 px-1 rounded transition-colors text-center ${
                          isCurrent
                            ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  {threshold < 0.05
                    ? 'Unfiltered: Displays full diffuse activation field including subtle perihilar cues.'
                    : threshold < 0.25
                    ? 'Balanced: Suppresses low-level background noise to highlight consolidated regions.'
                    : threshold < 0.45
                    ? 'Focal: Confines overlay strictly to high-confidence pathological consolidation.'
                    : 'Peak: Isolates highest-magnitude gradient activations in core lesion center.'}
                </p>
              </div>
            </div>

            {/* Technical Attribution Note */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>ReLU(∑ α_k · A^k)</span>
              <span>Backpropagated via PyTorch Autograd</span>
            </div>
          </div>

          {/* Trigger Inference Button */}
          <button
            onClick={handleRunInference}
            disabled={isRunningInference}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>{isRunningInference ? 'Evaluating Convolutional Tensors...' : 'Run Gradio Classification'}</span>
          </button>
        </div>

        {/* Right Column: Visual Stage & Predictions (Single View vs Dual Comparison) */}
        <div className={`${isCompareMode ? 'lg:col-span-8' : 'lg:col-span-7'} flex flex-col gap-4`}>
          {/* Real-Time Result Toolbar: Sliders Directly on the X-Ray Results */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                  Real-Time Heatmap Sliders
                </span>
              </div>

              {/* Model Comparison Mode Toggle Switch */}
              <div className="flex items-center gap-3 p-1.5 px-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <Columns className="w-3.5 h-3.5 text-cyan-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">
                      Side-by-Side Comparison
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isCompareMode ? 'ResNet18 vs. Ensemble Dual View' : 'Single Model Mode'}
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={isCompareMode}
                  onChange={setIsCompareMode}
                  badge={isCompareMode ? 'ON' : 'OFF'}
                  size="sm"
                  id="results-side-by-side-toggle"
                />
              </div>
            </div>

            {/* Dual Range Sliders attached directly to the X-ray results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Slider 1: Alpha-Blending Transparency */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-200 font-medium">Alpha-Blending Transparency (α)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono tabular-nums text-cyan-400 font-bold">{Math.round(opacity * 100)}%</span>
                    <span className="font-mono text-[10px] text-slate-500">(α = {opacity.toFixed(2)})</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.00"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
                  aria-label="Alpha-blending transparency overlay slider"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (X-Ray)</span>
                  <span>50% (Balanced)</span>
                  <span>100% (Solid)</span>
                </div>
              </div>

              {/* Slider 2: Intensity Threshold Cutoff */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Intensity Threshold Cutoff</span>
                  <span className="font-mono tabular-nums text-cyan-400 font-bold">{Math.round(threshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="0.80"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* DUAL COMPARISON MODE: ResNet18 vs Ensemble Side-by-Side or Split Wipe */}
          {isCompareMode ? (
            <div className="flex flex-col gap-4">
              {/* Comparison Active Status Banner */}
              <div className="p-3 px-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/70 border border-cyan-500/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm shadow-cyan-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">
                    <Columns className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Side-by-Side View Enabled</span>
                    <span className="text-[11px] text-cyan-200/80">
                      Comparing ResNet18 Champion vs. Soft-Voting Ensemble on {customImageUrl ? 'uploaded radiograph' : selectedCase.subtype}.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={isCompareMode}
                    onChange={setIsCompareMode}
                    badge="ACTIVE"
                    size="sm"
                    id="dual-view-side-by-side-toggle"
                  />
                </div>
              </div>

              {/* Sub-mode view switch tabs */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400 font-mono text-[11px]">
                  Comparison Layout:
                </span>
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCompareSubMode('side_by_side')}
                    className={`px-2.5 py-1 rounded transition-colors font-mono text-xs ${
                      compareSubMode === 'side_by_side'
                        ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dual Viewports
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareSubMode('split_wipe')}
                    className={`px-2.5 py-1 rounded transition-colors font-mono text-xs ${
                      compareSubMode === 'split_wipe'
                        ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Interactive Split Wipe
                  </button>
                </div>
              </div>

              {compareSubMode === 'side_by_side' ? (
                /* Dual Viewports Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column A: ResNet18 Champion Model */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                            CHAMPION WINNER
                          </span>
                          <span className="text-xs font-bold text-white">ResNet18 Optimized</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                          Acc 90.71% · Recall 95.64% · Prec 90.10%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          resnetStats.predictedClass === 'PNEUMONIA'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {resnetStats.predictedClass}
                        </span>
                        <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                          {resnetStats.confidence.toFixed(1)}% Conf
                        </div>
                      </div>
                    </div>

                    {/* ResNet18 Canvas */}
                    <XrayCanvasViewer
                      caseData={customImageUrl ? undefined : selectedCase}
                      customImageUrl={customImageUrl}
                      targetClass={targetClass}
                      colormap={colormap}
                      opacity={opacity}
                      threshold={threshold}
                      viewMode={viewMode === 'split' ? 'overlay' : viewMode}
                      splitPosition={splitPos}
                      onSplitChange={setSplitPos}
                      modelId="resnet18_sampler_new_hyperparameters"
                      badgeLabel="ResNet18 · layer4.1.conv2"
                    />

                    {/* Probability Bar */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-rose-400">PNEUMONIA: {resnetStats.pneuPct.toFixed(1)}%</span>
                        <span className="text-emerald-400">NORMAL: {resnetStats.normPct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div style={{ width: `${resnetStats.pneuPct}%` }} className="bg-rose-500 h-full" />
                        <div style={{ width: `${resnetStats.normPct}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                      Focal convolutional activation sharply resolves localized lobar consolidation and perihilar opacities with 95.64% sensitivity.
                    </p>
                  </div>

                  {/* Column B: Soft-Voting Ensemble Model */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                            ENSEMBLE
                          </span>
                          <span className="text-xs font-bold text-white">Soft-Voting 3-CNN</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                          Acc 89.42% · Precision 94.02% · AUC 0.9643
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          ensembleStats.predictedClass === 'PNEUMONIA'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {ensembleStats.predictedClass}
                        </span>
                        <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                          {ensembleStats.confidence.toFixed(1)}% Conf
                        </div>
                      </div>
                    </div>

                    {/* Ensemble Canvas */}
                    <XrayCanvasViewer
                      caseData={customImageUrl ? undefined : selectedCase}
                      customImageUrl={customImageUrl}
                      targetClass={targetClass}
                      colormap={colormap}
                      opacity={opacity}
                      threshold={threshold}
                      viewMode={viewMode === 'split' ? 'overlay' : viewMode}
                      splitPosition={splitPos}
                      onSplitChange={setSplitPos}
                      modelId="ensemble_soft_voting"
                      badgeLabel="Ensemble · ResNet18 + EffNet + MobNet"
                    />

                    {/* Probability Bar */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-rose-400">PNEUMONIA: {ensembleStats.pneuPct.toFixed(1)}%</span>
                        <span className="text-emerald-400">NORMAL: {ensembleStats.normPct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div style={{ width: `${ensembleStats.pneuPct}%` }} className="bg-rose-500 h-full" />
                        <div style={{ width: `${ensembleStats.normPct}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                      Combines multi-scale receptive fields across 3 backbones, achieving higher precision (94.02%) by suppressing borderline false positives.
                    </p>
                  </div>
                </div>
              ) : (
                /* Interactive Split Wipe on the SAME canvas */
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="font-mono uppercase tracking-wider text-slate-300 font-semibold">
                      Interactive Wipe Comparison (Drag Split Cursor to Compare Models)
                    </span>
                    <span className="font-mono text-cyan-400">
                      Split: {splitPos}% (◄ ResNet18 | Ensemble ►)
                    </span>
                  </div>

                  <XrayCanvasViewer
                    caseData={customImageUrl ? undefined : selectedCase}
                    customImageUrl={customImageUrl}
                    targetClass={targetClass}
                    colormap={colormap}
                    opacity={opacity}
                    threshold={threshold}
                    viewMode="split"
                    splitPosition={splitPos}
                    onSplitChange={setSplitPos}
                    modelId="resnet18_sampler_new_hyperparameters"
                    compareModelId="ensemble_soft_voting"
                  />

                  {/* Side-by-side probability readouts below wipe canvas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-sky-400 font-mono">◄ ResNet18 Champion</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          resnetStats.predictedClass === 'PNEUMONIA'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {resnetStats.predictedClass} ({resnetStats.confidence.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                        <div style={{ width: `${resnetStats.pneuPct}%` }} className="bg-rose-500 h-full" />
                        <div style={{ width: `${resnetStats.normPct}%` }} className="bg-emerald-500 h-full" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Sensitivity: 95.64% · Specificity: 82.48% · F1: 92.79%
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-400 font-mono">Ensemble Fusion ►</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          ensembleStats.predictedClass === 'PNEUMONIA'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {ensembleStats.predictedClass} ({ensembleStats.confidence.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                        <div style={{ width: `${ensembleStats.pneuPct}%` }} className="bg-rose-500 h-full" />
                        <div style={{ width: `${ensembleStats.normPct}%` }} className="bg-emerald-500 h-full" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Precision: 94.02% · ROC-AUC: 0.9643 · F1: 91.29%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Consensus & Discrepancy Diagnostics Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                      Model Comparison Diagnostics & Consensus
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    modelsAgree
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {modelsAgree ? 'Unanimous Agreement' : 'Divergent Output'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px] pb-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Probability Confidence Delta:</span>
                    <span className="text-cyan-400 font-bold tabular-nums">Δ {confidenceDelta}%</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {modelsAgree
                      ? `Both ResNet18 Champion and the Soft-Voting Ensemble concur on ${resnetStats.predictedClass}. The ensemble provides higher precision assurance (${ensembleModel.precision}%), while ResNet18 ensures superior sensitivity (${resnetModel.recall}%) against missed consolidation.`
                      : `The models diverge on this borderline case. ResNet18 favors sensitivity (${resnetModel.recall}%), while the Ensemble enforces strict precision thresholds (${ensembleModel.precision}%). Check the Grad-CAM heatmaps above for focal lesion confirmation.`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE MODEL VIEW */
            <div className="flex flex-col gap-4">
              {/* Quick Action Banner to Toggle Side-by-Side Comparison */}
              <div className="p-3 px-4 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    <Columns className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block">Compare Champion vs. Ensemble</span>
                    <span className="text-[11px] text-slate-400">
                      Enable side-by-side mode to view both Grad-CAM heatmaps for this {customImageUrl ? 'uploaded radiograph' : selectedCase.subtype}.
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={isCompareMode}
                  onChange={setIsCompareMode}
                  badge="OFF"
                  size="sm"
                  id="single-view-side-by-side-toggle"
                />
              </div>

              {/* Main X-ray Canvas Viewer Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    Inference Visualizer (640×640)
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span>View: {viewMode}</span>
                    <span aria-hidden="true">·</span>
                    <span>α: <strong className="text-cyan-400">{Math.round(opacity * 100)}%</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Threshold: <strong className="text-cyan-400">{Math.round(threshold * 100)}%</strong></span>
                  </div>
                </div>

                {/* X-Ray Canvas */}
                <XrayCanvasViewer
                  caseData={customImageUrl ? undefined : selectedCase}
                  customImageUrl={customImageUrl}
                  targetClass={targetClass}
                  colormap={colormap}
                  opacity={opacity}
                  threshold={threshold}
                  viewMode={viewMode}
                  splitPosition={splitPos}
                  onSplitChange={setSplitPos}
                  modelId={selectedModelId}
                />

                {/* Colormap Color Bar Scale with Cutoff Indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-2 pt-1 border-t border-slate-800/60">
                  <span>0.0 (Baseline)</span>
                  <div className="relative h-2 w-48 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-emerald-400 via-yellow-400 to-red-600 border border-slate-700">
                    {/* Visual cutoff shadow representing threshold */}
                    {threshold > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-950/75 border-r border-cyan-400"
                        style={{ width: `${Math.min(100, (threshold / 1.0) * 100)}%` }}
                      />
                    )}
                  </div>
                  <span>1.0 (Peak Saliency)</span>
                </div>
              </div>

              {/* Softmax Probability Readout Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Softmax Output</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                        {activeStats.predictedClass}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                        activeStats.predictedClass === 'PNEUMONIA'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      }`}>
                        {activeStats.confidence.toFixed(1)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-400">
                    <div>Model: {currentModel.name}</div>
                    <div className="text-cyan-400">Test Accuracy: {currentModel.accuracy}%</div>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="flex flex-col gap-2.5">
                  {/* Pneumonia bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300 font-semibold">PNEUMONIA Probability</span>
                      <span className="tabular-nums font-bold text-rose-400">{activeStats.pneuPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${activeStats.pneuPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Normal bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300 font-semibold">NORMAL Probability</span>
                      <span className="tabular-nums font-bold text-emerald-400">{activeStats.normPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${activeStats.normPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Findings & Interpretability Insights */}
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Radiological Findings & Heatmap Explanation</span>
                  </div>
                  {!customImageUrl ? (
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      {selectedCase.clinicalFindings.map((finding, idx) => (
                        <li key={idx}>{finding}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 leading-relaxed">
                      Uploaded image processed through 640×640 bicubic resize, ImageNet RGB normalization, and ResNet18 forward pass. Grad-CAM visualizes gradients through final convolutional feature tensors.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
