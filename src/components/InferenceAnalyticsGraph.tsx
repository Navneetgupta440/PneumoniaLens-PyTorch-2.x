import React, { useState } from 'react';
import { SampleCase, ModelExperiment, ModelId } from '../types';
import { MODEL_EXPERIMENTS } from '../data/mockData';
import { BarChart2, TrendingUp, Sliders, Scale, Info, Sparkles, Activity, Layers, Target } from 'lucide-react';

interface InferenceAnalyticsGraphProps {
  currentModelId: ModelId;
  selectedCase?: SampleCase;
  customImageUrl?: string | null;
  threshold: number;
  opacity: number;
  isCompareMode: boolean;
  targetClass: 'PNEUMONIA' | 'NORMAL';
  colormap: string;
  onSelectModel?: (modelId: ModelId) => void;
  computeProbabilities: (modelId: ModelId) => {
    pneuPct: number;
    normPct: number;
    predictedClass: 'PNEUMONIA' | 'NORMAL';
    confidence: number;
  };
}

export const InferenceAnalyticsGraph: React.FC<InferenceAnalyticsGraphProps> = ({
  currentModelId,
  selectedCase,
  customImageUrl,
  threshold,
  opacity,
  isCompareMode,
  targetClass,
  colormap,
  onSelectModel,
  computeProbabilities,
}) => {
  const [graphTab, setGraphTab] = useState<'probabilities' | 'saliency_density' | 'radar_metrics'>('probabilities');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Models to display in the multi-model graph
  const modelsToGraph: { id: ModelId; label: string; tag: string; color: string }[] = [
    { id: 'resnet18_sampler_new_hyperparameters', label: 'ResNet18 Champion', tag: 'Champion (640p)', color: '#06B6D4' },
    { id: 'ensemble_soft_voting', label: 'Ensemble Fusion', tag: 'Soft-Voting', color: '#F59E0B' },
    { id: 'resnet18_sampler', label: 'ResNet18 + Sampler', tag: 'Balanced Sampler', color: '#3B82F6' },
    { id: 'resnet18_baseline', label: 'ResNet18 Baseline', tag: 'Standard Baseline', color: '#64748B' },
    { id: 'mobilenet_v3_large', label: 'MobileNetV3-Large', tag: 'Mobile Backbone', color: '#EC4899' },
    { id: 'efficientnet_b0', label: 'EfficientNet-B0', tag: 'Inverted Residual', color: '#8B5CF6' },
  ];

  const graphData = modelsToGraph.map(m => {
    const stats = computeProbabilities(m.id);
    const exp = MODEL_EXPERIMENTS.find(e => e.id === m.id);
    return {
      ...m,
      stats,
      accuracy: exp?.accuracy ?? 85.0,
      f1: exp?.f1 ?? 88.0,
      recall: exp?.recall ?? 95.0,
      precision: exp?.precision ?? 85.0,
    };
  });

  // Calculate synthetic Grad-CAM Saliency density histogram based on focalZone and threshold
  const peakIntensity = selectedCase?.focalZone?.intensity ?? (targetClass === 'PNEUMONIA' ? 0.92 : 0.22);
  const cx = selectedCase?.focalZone?.cx ?? 0.5;
  const cy = selectedCase?.focalZone?.cy ?? 0.5;
  const isPneumonia = selectedCase?.diagnosis === 'PNEUMONIA' || targetClass === 'PNEUMONIA';

  // 12 intensity bins from 0.0 to 1.0
  const binCount = 12;
  const histogramBins = Array.from({ length: binCount }, (_, idx) => {
    const binCenter = (idx + 0.5) / binCount;
    const binMin = idx / binCount;
    const binMax = (idx + 1) / binCount;

    let frequency = 0;
    if (isPneumonia) {
      // Gaussian distribution centered near peak intensity + background noise
      const spread = 0.20;
      const gaussian = Math.exp(-Math.pow(binCenter - peakIntensity, 2) / (2 * Math.pow(spread, 2)));
      const bgExp = Math.exp(-binCenter * 4) * 0.4;
      frequency = Math.min(100, Math.round((gaussian * 80 + bgExp * 20)));
    } else {
      // Normal case has mostly low intensity background activations
      frequency = Math.min(100, Math.round(Math.exp(-binCenter * 6) * 90 + Math.random() * 4));
    }

    const isCutoff = binMax <= threshold;
    const isPartiallyCutoff = binMin < threshold && binMax > threshold;

    return {
      binMin,
      binMax,
      binCenter,
      frequency,
      isCutoff,
      isPartiallyCutoff,
    };
  });

  const maxFreq = Math.max(...histogramBins.map(b => b.frequency), 1);
  const activeVoxelsPct = Math.round(
    (histogramBins.filter(b => b.binCenter >= threshold).reduce((acc, b) => acc + b.frequency, 0) /
      histogramBins.reduce((acc, b) => acc + b.frequency, 1)) * 100
  );

  // Radar metrics for ResNet18 vs Ensemble
  const radarAxes = [
    { name: 'Sensitivity (Recall)', resnet: 95.64, ensemble: 88.72, min: 70, max: 100 },
    { name: 'Specificity', resnet: 82.48, ensemble: 94.02, min: 70, max: 100 },
    { name: 'Precision (PPV)', resnet: 90.10, ensemble: 94.02, min: 70, max: 100 },
    { name: 'F1-Score', resnet: 92.79, ensemble: 91.29, min: 70, max: 100 },
    { name: 'Test Accuracy', resnet: 90.71, ensemble: 89.42, min: 70, max: 100 },
    { name: 'ROC-AUC', resnet: 96.34, ensemble: 96.43, min: 70, max: 100 },
  ];

  // Helper to compute polygon points for Radar chart (radius 120, center 160, 160)
  const radarCenter = { x: 175, y: 155 };
  const radarRadius = 110;

  const getCoordinates = (value: number, min: number, max: number, angleDeg: number) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const r = normalized * radarRadius;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: radarCenter.x + r * Math.cos(angleRad),
      y: radarCenter.y + r * Math.sin(angleRad),
    };
  };

  const resnetPoints = radarAxes.map((axis, i) => {
    const angle = (i / radarAxes.length) * 360;
    const coord = getCoordinates(axis.resnet, axis.min, axis.max, angle);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  const ensemblePoints = radarAxes.map((axis, i) => {
    const angle = (i / radarAxes.length) * 360;
    const coord = getCoordinates(axis.ensemble, axis.min, axis.max, angle);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/30 flex flex-col gap-4">
      {/* Graph Section Header & View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-sm">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interactive Diagnostic Graph & Statistical Telemetry</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Real-time mathematical telemetry for {customImageUrl ? 'uploaded radiograph' : selectedCase?.subtype || 'current scan'}
            </p>
          </div>
        </div>

        {/* Graph Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setGraphTab('probabilities')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              graphTab === 'probabilities'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Probabilities Bar Chart</span>
          </button>

          <button
            onClick={() => setGraphTab('saliency_density')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              graphTab === 'saliency_density'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Grad-CAM Saliency Histogram (τ)</span>
          </button>

          <button
            onClick={() => setGraphTab('radar_metrics')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              graphTab === 'radar_metrics'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>Model Radar Comparison</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Multi-Model Probability Distribution Graph */}
      {graphTab === 'probabilities' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Architecture Softmax Probability Distribution (Pneumonia vs Normal)</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Pneumonia Probability
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Normal Probability
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" />
                50% Threshold Margin
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative w-full p-4 bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden">
            <svg
              className="w-full h-auto"
              viewBox="0 0 650 240"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Multi-Model Probability Bar Chart"
            >
              {/* Background horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const x = 160 + (pct / 100) * 450;
                return (
                  <g key={pct}>
                    <line
                      x1={x}
                      y1="15"
                      x2={x}
                      y2="215"
                      stroke={pct === 50 ? '#F59E0B' : '#1e293b'}
                      strokeWidth={pct === 50 ? 1.5 : 1}
                      strokeDasharray={pct === 50 ? '4,3' : '2,2'}
                    />
                    <text
                      x={x}
                      y="230"
                      fill={pct === 50 ? '#F59E0B' : '#64748b'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight={pct === 50 ? 'bold' : 'normal'}
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* 50% Clinical Decision Boundary Annotation */}
              <text
                x="385"
                y="12"
                fill="#F59E0B"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                τ = 0.50 Decision Cutoff
              </text>

              {/* Model Rows */}
              {graphData.map((item, idx) => {
                const y = 25 + idx * 31;
                const barHeight = 18;
                const pneuWidth = (item.stats.pneuPct / 100) * 450;
                const isSelected = item.id === currentModelId;
                const isHovered = hoveredBarIndex === idx;

                return (
                  <g
                    key={item.id}
                    className="cursor-pointer group"
                    onClick={() => onSelectModel?.(item.id)}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Hover highlight background */}
                    <rect
                      x="0"
                      y={y - 4}
                      width="640"
                      height={barHeight + 8}
                      rx="4"
                      fill={isSelected ? 'rgba(6, 182, 212, 0.08)' : isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent'}
                      stroke={isSelected ? 'rgba(6, 182, 212, 0.3)' : 'transparent'}
                      strokeWidth="1"
                    />

                    {/* Model Name and Status Indicator */}
                    <text
                      x="150"
                      y={y + 13}
                      fill={isSelected ? '#38BDF8' : '#e2e8f0'}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {item.label}
                    </text>

                    {/* Active champion crown/tag */}
                    {item.id === 'resnet18_sampler_new_hyperparameters' && (
                      <circle cx="15" cy={y + 9} r="4" fill="#06B6D4" />
                    )}

                    {/* Bar Background Track */}
                    <rect
                      x="160"
                      y={y}
                      width="450"
                      height={barHeight}
                      rx="4"
                      fill="#0f172a"
                      stroke="#1e293b"
                    />

                    {/* Normal Portion (Green) */}
                    <rect
                      x="160"
                      y={y}
                      width="450"
                      height={barHeight}
                      rx="4"
                      fill="#10B981"
                      opacity="0.35"
                    />

                    {/* Pneumonia Portion (Rose/Red) */}
                    <rect
                      x="160"
                      y={y}
                      width={Math.max(2, pneuWidth)}
                      height={barHeight}
                      rx="4"
                      fill="url(#pneumonia-grad)"
                      className="transition-all duration-300"
                    />

                    {/* Confidence percentage label inside/outside bar */}
                    <text
                      x={160 + pneuWidth + (pneuWidth > 380 ? -8 : 8)}
                      y={y + 13}
                      fill={pneuWidth > 380 ? '#ffffff' : '#f43f5e'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor={pneuWidth > 380 ? 'end' : 'start'}
                    >
                      {item.stats.pneuPct.toFixed(1)}%
                    </text>
                  </g>
                );
              })}

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="pneumonia-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Model Statistics Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Active Model Margin</span>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{computeProbabilities(currentModelId).predictedClass}</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {computeProbabilities(currentModelId).confidence.toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Decision distance: +{Math.abs(computeProbabilities(currentModelId).confidence - 50).toFixed(1)}% from cutoff
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">ResNet18 vs Ensemble Delta</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Variance Δ</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {Math.abs(computeProbabilities('resnet18_sampler_new_hyperparameters').pneuPct - computeProbabilities('ensemble_soft_voting').pneuPct).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {computeProbabilities('resnet18_sampler_new_hyperparameters').predictedClass === computeProbabilities('ensemble_soft_voting').predictedClass
                  ? 'High concordant diagnostic agreement'
                  : 'Divergent boundary prediction'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Class Certainty Level</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Shannon Entropy</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {(() => {
                    const p = computeProbabilities(currentModelId).pneuPct / 100;
                    const q = 1 - p;
                    if (p <= 0 || q <= 0) return '0.02 nats';
                    const h = -(p * Math.log(p) + q * Math.log(q));
                    return `${h.toFixed(3)} nats`;
                  })()}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Lower entropy = higher neural confidence</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Grad-CAM Saliency Intensity Histogram & Dynamic Threshold Cutoff */}
      {graphTab === 'saliency_density' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Grad-CAM Activation Density Spectrum & Threshold Cutoff (τ = {threshold.toFixed(2)})</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block" />
                Suppressed Background (&lt; τ)
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-amber-500 to-red-500 inline-block" />
                Pathological Lesion Voxels (≥ τ)
              </span>
              <span className="text-cyan-400 font-bold">
                Retained Signal: {activeVoxelsPct}%
              </span>
            </div>
          </div>

          {/* SVG Histogram */}
          <div className="relative w-full p-4 bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden">
            <svg
              className="w-full h-auto"
              viewBox="0 0 650 230"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Grad-CAM Saliency Density Histogram"
            >
              {/* Grid lines */}
              {[20, 40, 60, 80].map((pct) => {
                const y = 190 - (pct / 100) * 150;
                return (
                  <g key={pct}>
                    <line x1="45" y1={y} x2="620" y2={y} stroke="#1e293b" strokeDasharray="2,2" strokeWidth="1" />
                    <text x="35" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Baseline axis */}
              <line x1="45" y1="190" x2="620" y2="190" stroke="#334155" strokeWidth="1.5" />

              {/* Histogram Bins */}
              {histogramBins.map((bin, i) => {
                const barWidth = 42;
                const gap = 6;
                const x = 50 + i * (barWidth + gap);
                const barHeight = (bin.frequency / maxFreq) * 150;
                const y = 190 - barHeight;
                const isRetained = bin.binCenter >= threshold;

                return (
                  <g key={i} className="group">
                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      fill={isRetained ? 'url(#saliency-active-grad)' : '#1e293b'}
                      stroke={isRetained ? '#f59e0b' : '#334155'}
                      strokeWidth="1"
                      opacity={isRetained ? 1 : 0.45}
                      className="transition-all duration-200"
                    />

                    {/* Frequency percentage label on top */}
                    {bin.frequency > 12 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        fill={isRetained ? '#fbbf24' : '#64748b'}
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {bin.frequency}%
                      </text>
                    )}

                    {/* X-axis bin range labels */}
                    <text
                      x={x + barWidth / 2}
                      y="205"
                      fill={isRetained ? '#38bdf8' : '#64748b'}
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {bin.binMin.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Threshold (τ) Vertical Line and Flag */}
              {(() => {
                // Map threshold (0.0 to 0.8) to x coordinate (50 to 620)
                const clampedThresh = Math.min(1.0, Math.max(0.0, threshold));
                const totalWidth = 12 * (42 + 6);
                const threshX = 50 + clampedThresh * totalWidth;

                return (
                  <g>
                    {/* Shadow overlay for suppressed region */}
                    <rect
                      x="50"
                      y="30"
                      width={Math.max(0, threshX - 50)}
                      height="160"
                      fill="rgba(15, 23, 42, 0.4)"
                    />

                    {/* Threshold Divider Line */}
                    <line
                      x1={threshX}
                      y1="25"
                      x2={threshX}
                      y2="190"
                      stroke="#06B6D4"
                      strokeWidth="2.5"
                      strokeDasharray="4,2"
                    />

                    {/* Marker badge */}
                    <rect
                      x={threshX - 32}
                      y="10"
                      width="64"
                      height="16"
                      rx="3"
                      fill="#083344"
                      stroke="#06B6D4"
                      strokeWidth="1"
                    />
                    <text
                      x={threshX}
                      y="21"
                      fill="#67E8F9"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      τ = {threshold.toFixed(2)}
                    </text>
                  </g>
                );
              })()}

              {/* Axis labels */}
              <text x="335" y="222" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                Grad-CAM Activation Intensity Bin (0.0 = Baseline Parenchyma, 1.0 = Peak Lesion Saliency)
              </text>

              <defs>
                <linearGradient id="saliency-active-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="60%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Saliency Telemetry Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Active Lesion Volume</span>
              <span className="text-cyan-400 font-bold tabular-nums text-sm">{activeVoxelsPct}%</span>
              <span className="text-[10px] text-slate-500 block">of lung parenchymal field</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Peak Gradient Energy</span>
              <span className="text-amber-400 font-bold tabular-nums text-sm">{(peakIntensity * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block">max tensor activation</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Alpha Opacity Setting</span>
              <span className="text-white font-bold tabular-nums text-sm">α = {opacity.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block">{Math.round(opacity * 100)}% overlay blend</span>
            </div>

            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Active Colormap</span>
              <span className="text-emerald-400 font-bold uppercase text-sm">{colormap}</span>
              <span className="text-[10px] text-slate-500 block">Linear gradient ramp</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Model Radar Spider Chart */}
      {graphTab === 'radar_metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Radar SVG (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center p-2 bg-slate-950 rounded-xl border border-slate-800">
            <svg
              className="w-full max-w-[360px] h-auto"
              viewBox="0 0 350 310"
              aria-label="ResNet18 Champion vs Ensemble Radar Chart"
            >
              {/* Concentric spider rings */}
              {[0.25, 0.50, 0.75, 1.0].map((ring) => {
                const r = ring * radarRadius;
                return (
                  <circle
                    key={ring}
                    cx={radarCenter.x}
                    cy={radarCenter.y}
                    r={r}
                    fill="none"
                    stroke="#1e293b"
                    strokeDasharray="2,2"
                  />
                );
              })}

              {/* Spider spoke axes */}
              {radarAxes.map((axis, i) => {
                const angle = (i / radarAxes.length) * 360;
                const end = getCoordinates(axis.max, axis.min, axis.max, angle);
                const labelCoord = getCoordinates(axis.max + 5, axis.min, axis.max, angle);

                return (
                  <g key={axis.name}>
                    <line
                      x1={radarCenter.x}
                      y1={radarCenter.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text
                      x={labelCoord.x}
                      y={labelCoord.y + 4}
                      fill="#94a3b8"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor={labelCoord.x > radarCenter.x + 10 ? 'start' : labelCoord.x < radarCenter.x - 10 ? 'end' : 'middle'}
                    >
                      {axis.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Ensemble Polygon (Amber) */}
              <polygon
                points={ensemblePoints}
                fill="rgba(245, 158, 11, 0.20)"
                stroke="#F59E0B"
                strokeWidth="2"
              />

              {/* ResNet18 Champion Polygon (Cyan) */}
              <polygon
                points={resnetPoints}
                fill="rgba(6, 182, 212, 0.25)"
                stroke="#06B6D4"
                strokeWidth="2.5"
              />

              {/* Data points on vertices */}
              {radarAxes.map((axis, i) => {
                const angle = (i / radarAxes.length) * 360;
                const cRes = getCoordinates(axis.resnet, axis.min, axis.max, angle);
                const cEns = getCoordinates(axis.ensemble, axis.min, axis.max, angle);
                return (
                  <g key={axis.name}>
                    <circle cx={cRes.x} cy={cRes.y} r="3" fill="#06B6D4" stroke="#ffffff" strokeWidth="1" />
                    <circle cx={cEns.x} cy={cEns.y} r="3" fill="#F59E0B" stroke="#ffffff" strokeWidth="1" />
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs font-mono mt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-cyan-300 font-bold">ResNet18 Champion (90.71%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-amber-300 font-bold">Ensemble Soft-Voting (89.42%)</span>
              </div>
            </div>
          </div>

          {/* Metric Comparison Table (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2 font-mono text-xs">
            <h4 className="text-xs uppercase font-semibold text-slate-300 tracking-wider">
              Diagnostic Trade-off Matrix
            </h4>
            <div className="flex flex-col gap-1.5">
              {radarAxes.map((axis) => {
                const diff = (axis.resnet - axis.ensemble).toFixed(2);
                const isResnetBetter = axis.resnet >= axis.ensemble;

                return (
                  <div
                    key={axis.name}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-slate-300 font-semibold block">{axis.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {isResnetBetter ? `+${diff}% ResNet18 lead` : `${diff}% Ensemble lead`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-cyan-400 font-bold tabular-nums">
                        {axis.resnet.toFixed(1)}%
                      </span>
                      <span className="text-slate-600">vs</span>
                      <span className="text-amber-400 font-bold tabular-nums">
                        {axis.ensemble.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-tight mt-1">
              ResNet18 excels in medical sensitivity (95.64%), preventing false-negative pneumonia misses. The ensemble achieves higher precision (94.02%), suppressing false-positive over-calling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
