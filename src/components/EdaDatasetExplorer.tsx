import React, { useState } from 'react';
import { DATASET_SPLITS, EDA_METADATA } from '../data/mockData';
import { Database, PieChart, FileSpreadsheet, Layers, Sliders, ExternalLink, ShieldCheck } from 'lucide-react';

export const EdaDatasetExplorer: React.FC = () => {
  const [targetPneuPct, setTargetPneuPct] = useState<number>(60); // 60% Pneumonia / 40% Normal in winning config

  // Compute weights based on user slider
  const targetNormPct = 100 - targetPneuPct;
  const trainNormal = 1079;
  const trainPneumonia = 3106;

  const normalWeight = (targetNormPct / 100) / trainNormal;
  const pneumoniaWeight = (targetPneuPct / 100) / trainPneumonia;
  const relativeRatio = (normalWeight / pneumoniaWeight).toFixed(2);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
            01_Dataset_Preparation_and_EDA.ipynb
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Mendeley ChestXray2017 Dataset & Stratification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            5,856 pediatric chest radiographs across NORMAL and PNEUMONIA cohorts
          </p>
        </div>

        <a
          href={EDA_METADATA.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/40 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Mendeley Data v2</span>
        </a>
      </div>

      {/* Dataset Core Statistics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">Total Volume</span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">5,856</span>
          <span className="text-[11px] text-slate-400 font-mono">100% JPEG Radiographs</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">Color Mode Distribution</span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">5,573</span>
          <span className="text-[11px] text-cyan-400 font-mono">Grayscale (95.2%) · 283 RGB (4.8%)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">Mean Spatial Resolution</span>
          <span className="text-2xl font-mono font-bold text-white tabular-nums mt-1 block">1328 × 971</span>
          <span className="text-[11px] text-slate-400 font-mono">Aspect Ratio ≈ 1.37:1</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block">Severe Class Imbalance</span>
          <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums mt-1 block">74.2%</span>
          <span className="text-[11px] text-slate-400 font-mono">Pneumonia dominant in train/val</span>
        </div>
      </div>

      {/* Dataset Splits Breakdown Table & Visual Bar */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Project Stratified Partitioning</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            The official test set remained untouched (624 images). Validation split was sampled from original training data to prevent data leakage.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold font-sans">Split Partition</th>
                <th className="py-3 px-4 font-semibold text-emerald-400">NORMAL</th>
                <th className="py-3 px-4 font-semibold text-rose-400">PNEUMONIA</th>
                <th className="py-3 px-4 font-semibold text-white">Total Count</th>
                <th className="py-3 px-4 font-semibold">Class Ratio (% Normal / % Pneumonia)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {DATASET_SPLITS.map((s) => (
                <tr key={s.split} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{s.split}</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold">{s.normal.toLocaleString()}</td>
                  <td className="py-3 px-4 text-rose-300 font-semibold">{s.pneumonia.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-white">{s.total.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-36 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div style={{ width: `${s.normalPct}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${s.pneumoniaPct}%` }} className="bg-rose-500 h-full" />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {s.normalPct.toFixed(1)}% / {s.pneumoniaPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WeightedRandomSampler Mathematical Breakdown */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              <Sliders className="w-4 h-4" />
              <span>PyTorch WeightedRandomSampler Dynamics</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Class Imbalance Solution: Target Distribution Tuning
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Target: {targetNormPct}% NORMAL / {targetPneuPct}% PNEUMONIA
          </span>
        </div>

        {/* Interactive Target Distribution Slider */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-emerald-400">Target NORMAL Batch Ratio: {targetNormPct}%</span>
            <span className="text-rose-400">Target PNEUMONIA Batch Ratio: {targetPneuPct}%</span>
          </div>

          <input
            type="range"
            min="30"
            max="70"
            step="5"
            value={targetPneuPct}
            onChange={(e) => setTargetPneuPct(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">NORMAL Sample Weight (w_norm)</span>
              <span className="text-emerald-300 font-bold tabular-nums text-sm">
                {(normalWeight * 10000).toFixed(4)} × 10⁻⁴
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">({targetNormPct}% / 1,079 images)</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">PNEUMONIA Sample Weight (w_pneu)</span>
              <span className="text-rose-300 font-bold tabular-nums text-sm">
                {(pneumoniaWeight * 10000).toFixed(4)} × 10⁻⁴
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">({targetPneuPct}% / 3,106 images)</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Effective Sampling Multiplier</span>
              <span className="text-cyan-400 font-bold tabular-nums text-sm">
                {relativeRatio}×
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Normal oversampled relative to Pneumonia</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In early experiments, models defaulted to predicting Pneumonia because unweighted mini-batches contained ~74% positive cases, yielding high recall (98–100%) but unacceptable precision (67–79%). By calibrating the target distribution to <strong className="text-white">60% Pneumonia / 40% Normal</strong> with replacement sampling, each minority Normal case received ~{relativeRatio}× higher probability of being drawn per batch. This single intervention lifted precision to <strong className="text-cyan-400">90.10%</strong> without cratering recall.
        </p>
      </div>

      {/* Official EDA Plots Gallery */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Official EDA Visualizations</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Class distributions and image resolutions generated in notebook 01
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">repo: results/plots/</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-white">Class Distribution Across All Splits</span>
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center min-h-[200px]">
              <img
                src="/repo_artifacts/plots/class_distribution_all_splits.png"
                alt="Class Distribution All Splits"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain block"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">class_distribution_all_splits.png</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-white">Image Resolution Distribution</span>
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center min-h-[200px]">
              <img
                src="/repo_artifacts/plots/image_resolution_distribution.png"
                alt="Image Resolution Distribution"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain block"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">image_resolution_distribution.png</span>
          </div>
        </div>
      </div>
    </div>
  );
};
