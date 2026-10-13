import React, { useState } from 'react';
import { MODEL_EXPERIMENTS } from '../data/mockData';
import { ModelExperiment } from '../types';
import { Trophy, ArrowUpDown, Check, Filter, Cpu, BarChart3, HelpCircle } from 'lucide-react';

export const ModelBenchmarks: React.FC = () => {
  const [sortField, setSortField] = useState<'accuracy' | 'precision' | 'recall' | 'f1' | 'rocAuc'>('f1');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'both' | 'graph' | 'table'>('both');
  const [chartMetric, setChartMetric] = useState<'accuracy' | 'f1' | 'precision' | 'recall'>('accuracy');
  const [inspectedModel, setInspectedModel] = useState<ModelExperiment>(
    MODEL_EXPERIMENTS.find(m => m.isChampion) || MODEL_EXPERIMENTS[5]
  );

  const categories = ['All', 'ResNet-18 Variants', 'Alternative Backbones', 'Ensemble'];

  const filteredModels = MODEL_EXPERIMENTS.filter(m => 
    selectedCategory === 'All' ? true : m.category === selectedCategory
  );

  const sortedModels = [...filteredModels].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: 'accuracy' | 'precision' | 'recall' | 'f1' | 'rocAuc') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Overview & Key Champion Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Champion Model</div>
          <div className="mt-2">
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>ResNet18 Optimized</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">WeightedRandomSampler + 640×640</div>
          </div>
          <div className="mt-3 text-xs text-cyan-400 font-mono">Official Test Benchmark</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Test Accuracy</div>
          <div className="mt-1 text-3xl font-mono font-bold text-white tabular-nums">90.71%</div>
          <div className="text-xs text-emerald-400 font-mono mt-1">+8.02% vs ResNet18 baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Test F1-Score</div>
          <div className="mt-1 text-3xl font-mono font-bold text-white tabular-nums">92.79%</div>
          <div className="text-xs text-cyan-400 font-mono mt-1">Balanced Precision & Recall</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400">ROC-AUC Score</div>
          <div className="mt-1 text-3xl font-mono font-bold text-white tabular-nums">0.9634</div>
          <div className="text-xs text-slate-400 font-mono mt-1">Ensemble ROC-AUC: 0.9643</div>
        </div>
      </div>

      {/* Main Benchmark Table Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        {/* Table & Graph Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Model Experiment Matrix & Performance Graph</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative analysis across 8 training iterations and multi-model soft-voting ensemble
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switch */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setViewMode('both')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'both' ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                Both Views
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'graph' ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                Graph Only
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table Only
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Benchmark Performance Graph (shown when viewMode !== 'table') */}
        {viewMode !== 'table' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200 uppercase font-mono tracking-wider">
                  Official Test Benchmark Comparison Graph
                </span>
              </div>

              {/* Metric filter buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs">
                {(['accuracy', 'f1', 'precision', 'recall'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setChartMetric(m)}
                    className={`px-2.5 py-0.5 rounded capitalize transition-all ${
                      chartMetric === m
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m === 'f1' ? 'F1-Score' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal Bar Chart SVG */}
            <div className="relative w-full overflow-hidden">
              <svg
                className="w-full h-auto"
                viewBox="0 0 700 270"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Model Benchmark Comparison Chart"
              >
                {/* Horizontal grid lines and percentage markers */}
                {[60, 70, 80, 90, 100].map((pct) => {
                  const x = 220 + ((pct - 60) / 40) * 440;
                  return (
                    <g key={pct}>
                      <line x1={x} y1="15" x2={x} y2="235" stroke="#1e293b" strokeDasharray="3,3" />
                      <text x={x} y="250" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Champion highlight baseline line (90.71%) */}
                <line
                  x1={220 + ((90.71 - 60) / 40) * 440}
                  y1="10"
                  x2={220 + ((90.71 - 60) / 40) * 440}
                  y2="235"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4,2"
                />
                <text
                  x={220 + ((90.71 - 60) / 40) * 440}
                  y="10"
                  fill="#06b6d4"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Champion: 90.71%
                </text>

                {/* Bars for filtered models */}
                {filteredModels.map((model, idx) => {
                  const y = 22 + idx * 26;
                  const val = model[chartMetric] ?? 0;
                  const barWidth = Math.max(4, Math.min(440, ((val - 60) / 40) * 440));
                  const isChampion = model.isChampion;
                  const isEnsemble = model.id === 'ensemble_soft_voting';

                  return (
                    <g
                      key={model.id}
                      className="cursor-pointer group"
                      onClick={() => setInspectedModel(model)}
                    >
                      {/* Label */}
                      <text
                        x="210"
                        y={y + 13}
                        fill={isChampion ? '#38bdf8' : isEnsemble ? '#fbbf24' : '#cbd5e1'}
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                        fontWeight={isChampion ? 'bold' : 'normal'}
                      >
                        {model.name.length > 28 ? model.name.slice(0, 26) + '...' : model.name}
                      </text>

                      {/* Track */}
                      <rect
                        x="220"
                        y={y}
                        width="440"
                        height="17"
                        rx="3"
                        fill="#0f172a"
                        stroke="#1e293b"
                      />

                      {/* Bar fill */}
                      <rect
                        x="220"
                        y={y}
                        width={barWidth}
                        height="17"
                        rx="3"
                        fill={isChampion ? '#06b6d4' : isEnsemble ? '#f59e0b' : '#3b82f6'}
                        opacity={isChampion ? 1 : 0.85}
                        className="transition-all duration-300"
                      />

                      {/* Value label */}
                      <text
                        x={220 + barWidth + 8}
                        y={y + 12}
                        fill={isChampion ? '#38bdf8' : isEnsemble ? '#fbbf24' : '#e2e8f0'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {val.toFixed(2)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              <span>Cyan = ResNet18 Champion (90.71%)</span>
              <span>Amber = Soft-Voting Ensemble</span>
              <span>Blue = Intermediate Iterations</span>
            </div>
          </div>
        )}

        {/* Responsive Table (shown when viewMode !== 'graph') */}
        {viewMode !== 'graph' && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Model / Experiment</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th 
                  onClick={() => handleSort('accuracy')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>Accuracy</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('precision')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>Precision</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('recall')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>Recall</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('f1')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>F1-Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('rocAuc')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>ROC-AUC</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {sortedModels.map((model) => {
                const isChampion = model.isChampion;
                const isSelected = inspectedModel.id === model.id;
                return (
                  <tr
                    key={model.id}
                    onClick={() => setInspectedModel(model)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/30 text-white'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        {isChampion && (
                          <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Trophy className="w-3 h-3" />
                          </span>
                        )}
                        <span className={isChampion ? 'font-bold text-white' : ''}>
                          {model.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                      {model.category}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {model.accuracy.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {model.precision.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {model.recall.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 font-semibold text-cyan-400">
                      {model.f1.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {model.rocAuc ? model.rocAuc.toFixed(4) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-[11px] text-slate-400 hover:text-cyan-400 font-sans underline underline-offset-2">
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Selected Model Deep Dive Drawer */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-cyan-400">
                Configuration & Diagnostic Notes
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">{inspectedModel.name}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Accuracy: {inspectedModel.accuracy}%</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">F1: {inspectedModel.f1}%</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {inspectedModel.notes}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Input Resolution</span>
              <span className="text-slate-200 font-semibold">{inspectedModel.config.resolution}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Crop Strategy</span>
              <span className="text-slate-200 font-semibold">{inspectedModel.config.cropMethod}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Sampling Scheme</span>
              <span className="text-slate-200 font-semibold">{inspectedModel.config.sampler}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Label Smoothing</span>
              <span className="text-slate-200 font-semibold">{inspectedModel.config.labelSmoothing}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Architectural Findings: Why ResNet18 won */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Standalone Champion vs. Ensemble Trade-Off</span>
          </div>
          <h4 className="text-base font-bold text-white">
            Why Standalone ResNet18 Was Chosen Over the Soft-Voting Ensemble
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            The soft-voting ensemble averaged softmax probability outputs across ResNet18, EfficientNet-B0, and MobileNetV3-Large. While the ensemble achieved higher precision (<strong className="text-white">94.02%</strong> vs 90.10%) and slightly higher ROC-AUC (<strong className="text-white">0.9643</strong> vs 0.9634), the standalone ResNet18 achieved superior overall accuracy (<strong className="text-white">90.71%</strong> vs 89.42%), recall (<strong className="text-white">95.64%</strong> vs 88.72%), and F1-score (<strong className="text-white">92.79%</strong> vs 91.29%). In medical screening, missing positive pneumonia cases (false negatives) carries significant clinical liability.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
            <BarChart3 className="w-4 h-4" />
            <span>Class Imbalance & MobileNet Overprediction</span>
          </div>
          <h4 className="text-base font-bold text-white">
            Why EfficientNet & MobileNet Failed the Official Test Set
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            MobileNetV3-Large exhibited 100.00% recall and EfficientNet-B0 exhibited 99.74% recall, but both suffered catastrophic precision drops (67.83% and 69.71%). With 74% pneumonia in the training distribution, lightweight depthwise separable convolutions converged towards predicting the majority class indiscriminately. ResNet18 with standard residual blocks paired with <strong className="text-white">WeightedRandomSampler</strong> successfully preserved representational balance across minority normal samples.
          </p>
        </div>
      </div>
    </div>
  );
};
