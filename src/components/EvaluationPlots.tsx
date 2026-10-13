import React, { useState } from 'react';
import { CONFUSION_MATRIX_CHAMPION, ROC_CURVE_POINTS, TRAINING_EPOCHS_DATA } from '../data/mockData';
import { BarChart2, TrendingUp, Sliders, CheckCircle, AlertTriangle } from 'lucide-react';

export const EvaluationPlots: React.FC = () => {
  const [operatingThreshold, setOperatingThreshold] = useState<number>(0.50);
  const [activeTab, setActiveTab] = useState<'confusion' | 'roc' | 'training_curves' | 'official_artifacts'>('confusion');

  // Compute operating point along ROC curve
  const currentRocPoint = ROC_CURVE_POINTS.reduce((prev, curr) => {
    return Math.abs(curr.threshold - operatingThreshold) < Math.abs(prev.threshold - operatingThreshold)
      ? curr
      : prev;
  });

  const cm = CONFUSION_MATRIX_CHAMPION;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Section Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
            03_Final_Model_Evaluation_and_Visualizations.ipynb
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Test Set Evaluation & ROC Discriminative Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated on official Mendeley Test Set (624 images: 234 NORMAL, 390 PNEUMONIA)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('confusion')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'confusion'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Confusion Matrix
          </button>
          <button
            onClick={() => setActiveTab('roc')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'roc'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ROC Curve (AUC 0.9634)
          </button>
          <button
            onClick={() => setActiveTab('training_curves')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'training_curves'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Loss & Accuracy Curves
          </button>
          <button
            onClick={() => setActiveTab('official_artifacts')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'official_artifacts'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Official GitHub Artifacts
          </button>
        </div>
      </div>

      {/* Tab 1: Confusion Matrix */}
      {activeTab === 'confusion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive 2x2 Matrix Grid (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Official Test Set Confusion Matrix</h3>
              <span className="text-xs font-mono text-slate-400">Total: 624 Radiographs</span>
            </div>

            {/* Matrix Container */}
            <div className="relative p-6 bg-slate-950 rounded-xl border border-slate-800 select-none">
              {/* Axis labels */}
              <div className="text-center text-xs font-mono text-cyan-400 mb-3 uppercase tracking-wider font-semibold">
                Predicted Diagnosis
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Left vertical label */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold [writing-mode:vertical-rl] rotate-180">
                    Ground Truth
                  </span>
                </div>

                <div className="col-span-11 grid grid-cols-2 gap-3">
                  {/* Top Column Headers */}
                  <div className="text-center font-mono text-xs text-slate-400 pb-1">
                    Pred: NORMAL
                  </div>
                  <div className="text-center font-mono text-xs text-slate-400 pb-1">
                    Pred: PNEUMONIA
                  </div>

                  {/* Row 1: Actual NORMAL */}
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-emerald-400/80 font-mono">True Negative (TN)</span>
                    <span className="text-3xl font-bold font-mono text-white tabular-nums my-1">
                      {cm.trueNegative}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Specificity: {cm.specificity}%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-rose-400/80 font-mono">False Positive (FP)</span>
                    <span className="text-3xl font-bold font-mono text-rose-200 tabular-nums my-1">
                      {cm.falsePositive}
                    </span>
                    <span className="text-[11px] text-rose-400 font-mono">Over-predicted</span>
                  </div>

                  {/* Row 2: Actual PNEUMONIA */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-rose-400/80 font-mono">False Negative (FN)</span>
                    <span className="text-3xl font-bold font-mono text-rose-300 tabular-nums my-1">
                      {cm.falseNegative}
                    </span>
                    <span className="text-[11px] text-rose-400 font-mono">Missed Cases</span>
                  </div>

                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 flex flex-col items-center justify-center text-center shadow-lg shadow-cyan-950/50">
                    <span className="text-xs text-cyan-300 font-mono">True Positive (TP)</span>
                    <span className="text-3xl font-bold font-mono text-white tabular-nums my-1">
                      {cm.truePositive}
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                      Sensitivity: {cm.recall}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Legend description */}
            <div className="text-xs text-slate-400 leading-relaxed">
              Out of 390 true pneumonia radiographs in the test set, the champion model successfully identified <strong className="text-white">373 (95.64% recall)</strong> while missing only 17. Out of 234 healthy radiographs, <strong className="text-white">193 (82.48% specificity)</strong> were correctly ruled out.
            </div>
          </div>

          {/* Clinical Diagnostic Metrics Breakdown (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                Derived Clinical Metrics
              </h4>

              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-semibold block">Overall Accuracy</span>
                    <span className="text-[10px] text-slate-500 font-sans">(TP + TN) / Total</span>
                  </div>
                  <span className="text-base font-bold text-white tabular-nums">90.71%</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-semibold block">Sensitivity / Recall</span>
                    <span className="text-[10px] text-slate-500 font-sans">TP / (TP + FN)</span>
                  </div>
                  <span className="text-base font-bold text-cyan-400 tabular-nums">95.64%</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-semibold block">Precision (PPV)</span>
                    <span className="text-[10px] text-slate-500 font-sans">TP / (TP + FP)</span>
                  </div>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">90.10%</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-semibold block">Harmonic Mean F1-Score</span>
                    <span className="text-[10px] text-slate-500 font-sans">2 × (P × R) / (P + R)</span>
                  </div>
                  <span className="text-base font-bold text-cyan-300 tabular-nums">92.79%</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-semibold block">Negative Predictive Value</span>
                    <span className="text-[10px] text-slate-500 font-sans">TN / (TN + FN)</span>
                  </div>
                  <span className="text-base font-bold text-slate-200 tabular-nums">91.90%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive ROC Curve */}
      {activeTab === 'roc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ROC SVG Chart */}
          <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Receiver Operating Characteristic (ROC)</h3>
                <p className="text-xs text-slate-400">ResNet18 Optimized Champion: Area Under Curve (AUC) = 0.9634</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-xs font-mono font-bold">
                AUC: 0.9634
              </span>
            </div>

            {/* SVG Plot */}
            <div className="relative aspect-square max-h-[420px] w-full p-4 bg-slate-950 rounded-xl border border-slate-800">
              <svg className="w-full h-full" viewBox="0 0 500 500">
                {/* Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map((step) => {
                  const pos = 450 - step * 400;
                  return (
                    <g key={step}>
                      <line x1="50" y1={pos} x2="450" y2={pos} stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1={50 + step * 400} y1="50" x2={50 + step * 400} y2="450" stroke="#1e293b" strokeDasharray="3,3" />
                      <text x="35" y={pos + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">{step}</text>
                      <text x={50 + step * 400} y="470" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">{step}</text>
                    </g>
                  );
                })}

                {/* Axes */}
                <line x1="50" y1="450" x2="450" y2="450" stroke="#475569" strokeWidth="1.5" />
                <line x1="50" y1="50" x2="50" y2="450" stroke="#475569" strokeWidth="1.5" />

                {/* Diagonal random chance baseline */}
                <line x1="50" y1="450" x2="450" y2="50" stroke="#475569" strokeDasharray="4,4" strokeWidth="1.2" />

                {/* ROC Curve Path */}
                {(() => {
                  const points = ROC_CURVE_POINTS.map(p => `${50 + p.fpr * 400},${450 - p.tpr * 400}`).join(' L ');
                  return (
                    <path
                      d={`M 50,450 L ${points}`}
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="3"
                    />
                  );
                })()}

                {/* Area under curve fill */}
                {(() => {
                  const points = ROC_CURVE_POINTS.map(p => `${50 + p.fpr * 400},${450 - p.tpr * 400}`).join(' L ');
                  return (
                    <path
                      d={`M 50,450 L ${points} L 450,450 Z`}
                      fill="rgba(6, 182, 212, 0.12)"
                    />
                  );
                })()}

                {/* Current Operating Point Marker */}
                {(() => {
                  const cx = 50 + currentRocPoint.fpr * 400;
                  const cy = 450 - currentRocPoint.tpr * 400;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r="6" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="2" />
                      <line x1={cx} y1={cy} x2={cx} y2="450" stroke="#F43F5E" strokeDasharray="2,2" strokeWidth="1" />
                      <line x1="50" y1={cy} x2={cx} y2={cy} stroke="#F43F5E" strokeDasharray="2,2" strokeWidth="1" />
                    </g>
                  );
                })()}

                {/* Axis Labels */}
                <text x="250" y="490" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                  False Positive Rate (1 - Specificity)
                </text>
                <text x="20" y="250" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold" transform="rotate(-90 20 250)">
                  True Positive Rate (Sensitivity / Recall)
                </text>
              </svg>
            </div>
          </div>

          {/* Threshold Scrubber & Operating Point Inspector */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                Decision Threshold Scrubber
              </h4>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Cutoff Probability:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {(operatingThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={operatingThreshold}
                  onChange={(e) => setOperatingThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Sensitivity (TPR):</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {(currentRocPoint.tpr * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">False Positive Rate:</span>
                  <span className="text-rose-400 font-bold tabular-nums">
                    {(currentRocPoint.fpr * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Specificity (1 - FPR):</span>
                  <span className="text-slate-200 font-bold tabular-nums">
                    {((1 - currentRocPoint.fpr) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                At the standard threshold of 0.50, the champion model strikes a 95.64% recall against an 82.48% specificity, maintaining high sensitivity without overwhelming clinicians with false alarms.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Loss & Accuracy Epoch Curves */}
      {activeTab === 'training_curves' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loss Curve */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Cross-Entropy Loss Progression</h3>
              <p className="text-xs text-slate-400">Training Loss vs Validation Loss over 12 Epochs</p>
            </div>

            <div className="relative aspect-video w-full p-4 bg-slate-950 rounded-xl border border-slate-800">
              <svg className="w-full h-full" viewBox="0 0 500 250">
                {/* Horizontal grid lines */}
                {[0.2, 0.4, 0.6].map((l) => {
                  const y = 220 - (l / 0.7) * 190;
                  return (
                    <g key={l}>
                      <line x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                      <text x="32" y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">{l}</text>
                    </g>
                  );
                })}

                {/* Train Loss Line (Cyan) */}
                {(() => {
                  const pts = TRAINING_EPOCHS_DATA.map((d, i) => {
                    const x = 40 + (i / 11) * 440;
                    const y = 220 - (d.trainLoss / 0.7) * 190;
                    return `${x},${y}`;
                  }).join(' L ');
                  return <path d={`M ${pts}`} fill="none" stroke="#06B6D4" strokeWidth="2.5" />;
                })()}

                {/* Val Loss Line (Amber) */}
                {(() => {
                  const pts = TRAINING_EPOCHS_DATA.map((d, i) => {
                    const x = 40 + (i / 11) * 440;
                    const y = 220 - (d.valLoss / 0.7) * 190;
                    return `${x},${y}`;
                  }).join(' L ');
                  return <path d={`M ${pts}`} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,2" />;
                })()}

                {/* Axis baseline */}
                <line x1="40" y1="220" x2="480" y2="220" stroke="#475569" strokeWidth="1" />
              </svg>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-cyan-400" />
                <span className="text-slate-300">Train Loss (0.179)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-400 border-dashed" />
                <span className="text-slate-300">Val Loss (0.236)</span>
              </div>
            </div>
          </div>

          {/* Accuracy Curve */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Accuracy Progression (%)</h3>
              <p className="text-xs text-slate-400">Training Accuracy vs Validation Accuracy</p>
            </div>

            <div className="relative aspect-video w-full p-4 bg-slate-950 rounded-xl border border-slate-800">
              <svg className="w-full h-full" viewBox="0 0 500 250">
                {/* Horizontal grid lines */}
                {[70, 80, 90, 100].map((acc) => {
                  const y = 220 - ((acc - 65) / 35) * 190;
                  return (
                    <g key={acc}>
                      <line x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                      <text x="32" y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">{acc}%</text>
                    </g>
                  );
                })}

                {/* Train Accuracy Line (Emerald) */}
                {(() => {
                  const pts = TRAINING_EPOCHS_DATA.map((d, i) => {
                    const x = 40 + (i / 11) * 440;
                    const y = 220 - ((d.trainAcc - 65) / 35) * 190;
                    return `${x},${y}`;
                  }).join(' L ');
                  return <path d={`M ${pts}`} fill="none" stroke="#10B981" strokeWidth="2.5" />;
                })()}

                {/* Val Accuracy Line (Cyan) */}
                {(() => {
                  const pts = TRAINING_EPOCHS_DATA.map((d, i) => {
                    const x = 40 + (i / 11) * 440;
                    const y = 220 - ((d.valAcc - 65) / 35) * 190;
                    return `${x},${y}`;
                  }).join(' L ');
                  return <path d={`M ${pts}`} fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="4,2" />;
                })()}

                {/* Axis baseline */}
                <line x1="40" y1="220" x2="480" y2="220" stroke="#475569" strokeWidth="1" />
              </svg>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-emerald-400" />
                <span className="text-slate-300">Train Acc (95.8%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-cyan-400 border-dashed" />
                <span className="text-slate-300">Val Acc (92.6%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Official GitHub Repository Plots & Reports */}
      {activeTab === 'official_artifacts' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Official PyTorch Training Plots & Classification Reports
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic matplotlib outputs directly from <code className="text-cyan-400">clouds440/pneumonia-detection-pytorch</code> results directory
              </p>
            </div>
            <a
              href="https://github.com/clouds440/pneumonia-detection-pytorch/tree/main/results"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              github.com/clouds440/results
            </a>
          </div>

          {/* Grid of Official Plots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plot 1: Final Confusion Matrix */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Champion ResNet18 Confusion Matrix</span>
                <span className="font-mono text-slate-400 text-[11px]">final_confusion_matrix.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <img
                  src="/repo_artifacts/plots/final_confusion_matrix.png"
                  alt="Official PyTorch Final Confusion Matrix"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Shows 373 True Positives, 193 True Negatives, 41 False Positives, and 17 False Negatives on official test set.
              </p>
            </div>

            {/* Plot 2: Final ROC Curve */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Champion ROC-AUC Curve (0.9634)</span>
                <span className="font-mono text-slate-400 text-[11px]">final_roc_curve.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <img
                  src="/repo_artifacts/plots/final_roc_curve.png"
                  alt="Official PyTorch Final ROC Curve"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Official ROC-AUC of 0.9634 demonstrating exceptional discriminative capability across all decision thresholds.
              </p>
            </div>

            {/* Plot 3: Training & Validation Loss */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Cross-Entropy Loss Progression</span>
                <span className="font-mono text-slate-400 text-[11px]">final_training_validation_loss.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <img
                  src="/repo_artifacts/plots/final_training_validation_loss.png"
                  alt="Official PyTorch Final Training Validation Loss"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Training and validation loss with label smoothing (0.05) stabilizing at ~0.236 validation loss.
              </p>
            </div>

            {/* Plot 4: Training & Validation Accuracy */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Validation Accuracy Progression</span>
                <span className="font-mono text-slate-400 text-[11px]">final_training_validation_accuracy.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <img
                  src="/repo_artifacts/plots/final_training_validation_accuracy.png"
                  alt="Official PyTorch Final Training Validation Accuracy"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Validation accuracy peaking at 92.6% across 12 training epochs.
              </p>
            </div>

            {/* Plot 5: Ensemble Confusion Matrix */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Soft-Voting Ensemble Confusion Matrix</span>
                <span className="font-mono text-slate-400 text-[11px]">ensemble_confusion_matrix.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <img
                  src="/repo_artifacts/plots/ensemble_confusion_matrix.png"
                  alt="Official PyTorch Ensemble Confusion Matrix"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Soft-voting ensemble across ResNet18, EfficientNet-B0, and MobileNetV3-Large.
              </p>
            </div>

            {/* Plot 6: Learning Rate Schedule */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Cosine Annealing Learning Rate Schedule</span>
                <span className="font-mono text-slate-400 text-[11px]">final_learning_rate_schedule.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <img
                  src="/repo_artifacts/plots/final_learning_rate_schedule.png"
                  alt="Official Learning Rate Schedule"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                PyTorch lr_scheduler decay profile across training iterations.
              </p>
            </div>
          </div>

          {/* Official Raw Text Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-white font-semibold">final_classification_report.txt</span>
                <span>scikit-learn output</span>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
{`Final Model: resnet18_sampler_new_hyperparameters

              precision    recall  f1-score   support

      NORMAL     0.9190    0.8248    0.8694       234
   PNEUMONIA     0.9010    0.9564    0.9279       390

    accuracy                         0.9071       624
   macro avg     0.9100    0.8906    0.8986       624
weighted avg     0.9077    0.9071    0.9059       624`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-white font-semibold">ensemble_metrics.json</span>
                <span>JSON output</span>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
{`{
    "model": "resnet18_efficientnet_b0_mobilenet_v3_large_ensemble",
    "accuracy": 0.8942307692307693,
    "precision": 0.9402173913043478,
    "recall": 0.8871794871794871,
    "f1_score": 0.9129287598944591,
    "roc_auc": 0.964266929651545
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
