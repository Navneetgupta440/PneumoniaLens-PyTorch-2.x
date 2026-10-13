import React, { useState } from 'react';
import { NOTEBOOK_DESCRIPTIONS } from '../data/mockData';
import { FolderTree, FileCode, Copy, Check, Terminal, BookOpen, Layers } from 'lucide-react';

export const NotebookPipelineViewer: React.FC = () => {
  const [selectedNotebook, setSelectedNotebook] = useState(NOTEBOOK_DESCRIPTIONS[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'notebooks' | 'file_tree'>('notebooks');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const projectTree = [
    { name: 'dataset_metadata.csv', type: 'file' },
    { name: 'eda_summary.json', type: 'file' },
    { 
      name: 'dataset/', 
      type: 'dir', 
      children: ['ChestXray2017/ (train, test, val)'] 
    },
    { 
      name: 'models/', 
      type: 'dir', 
      children: [
        'resnet18_sampler_new_hyperparameters/ (best.pt)',
        'resnet18/ (baseline.pt)',
        'efficientnet_b0/ (baseline.pt)',
        'mobilenet_v3_large/ (baseline.pt)'
      ] 
    },
    { 
      name: 'notebooks/', 
      type: 'dir', 
      children: [
        '01_Dataset_Preparation_and_EDA.ipynb',
        '02_Preprocessing_and_DataLoaders.ipynb',
        '03_Final_Model_Evaluation_and_Visualizations.ipynb',
        '04_Inference_GradCAM_and_GUI.ipynb'
      ] 
    },
    { 
      name: 'results/', 
      type: 'dir', 
      children: [
        'plots/ (confusion_matrix.png, roc_curve.png, loss_curve.png)',
        'gradcam/ (saliency_heatmaps.png)',
        'gradio/ (demo_recordings.png)',
        'ensemble_metrics.json',
        'final_classification_report.txt',
        'final_test_predictions.csv'
      ] 
    },
    { 
      name: 'splits/', 
      type: 'dir', 
      children: ['train_split.csv', 'validation_split.csv', 'test_split.csv'] 
    },
    { 
      name: 'scripts/', 
      type: 'dir', 
      children: ['requirements.txt'] 
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
            Repository Architecture & Execution Flow
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            PyTorch Pipeline (01 → 02 → 03 → 04)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential Jupyter notebook pipeline with modular weights and artifact outputs
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('notebooks')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeView === 'notebooks'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Notebook Walkthrough
          </button>
          <button
            onClick={() => setActiveView('file_tree')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeView === 'file_tree'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Project Directory Tree
          </button>
        </div>
      </div>

      {activeView === 'notebooks' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Step Selector Ribbon (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            {NOTEBOOK_DESCRIPTIONS.map((nb) => {
              const isSelected = selectedNotebook.id === nb.id;
              return (
                <button
                  key={nb.id}
                  onClick={() => setSelectedNotebook(nb)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      Step {nb.number}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">.ipynb</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug">
                    {nb.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {nb.summary}
                  </p>
                </button>
              );
            })}

            {/* Quick start instructions box */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 mt-2 flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-cyan-400 text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Quick Start Execution</span>
              </span>
              <pre className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`pip install -r scripts/requirements.txt
# Extract ChestXray2017.zip into dataset/
# Run notebooks sequentially: 01 -> 02 -> 03 -> 04`}
              </pre>
            </div>
          </div>

          {/* Code & Detailed Breakdown (8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Notebook {selectedNotebook.number}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedNotebook.title}</h3>
              </div>
              <button
                onClick={() => handleCopy(selectedNotebook.scriptCode)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedNotebook.summary}
            </p>

            {/* Syntax Box */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-200/90 overflow-x-auto leading-relaxed max-h-[380px]">
                <code>{selectedNotebook.scriptCode}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* File Tree View */
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Project Directory Structure</h3>
            <span className="text-xs font-mono text-slate-400">pneumonia-detection-pytorch/</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
            <div className="flex flex-col gap-2">
              {projectTree.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    {item.type === 'dir' ? <FolderTree className="w-4 h-4 text-cyan-400" /> : <FileCode className="w-4 h-4 text-slate-400" />}
                    <span>{item.name}</span>
                  </div>
                  {item.children && (
                    <div className="pl-6 flex flex-col gap-1 border-l border-slate-800 ml-2">
                      {item.children.map((child, cIdx) => (
                        <div key={cIdx} className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <span className="text-slate-600">└──</span>
                          <span>{child}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
