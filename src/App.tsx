import React, { useState } from 'react';
import { Header } from './components/Header';
import { MedicalDisclaimer } from './components/MedicalDisclaimer';
import { GradioInferenceDemo } from './components/GradioInferenceDemo';
import { ModelBenchmarks } from './components/ModelBenchmarks';
import { EvaluationPlots } from './components/EvaluationPlots';
import { EdaDatasetExplorer } from './components/EdaDatasetExplorer';
import { NotebookPipelineViewer } from './components/NotebookPipelineViewer';
import { AblationLab } from './components/AblationLab';
import { Activity, GitBranch, Shield, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('gradio');

  const handleLaunchInference = () => {
    setActiveTab('gradio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-medical-grid selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Bar Header following Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLaunchInference={handleLaunchInference}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Prominent Clinical Disclaimer */}
        <MedicalDisclaimer />

        {/* Tab Content Display */}
        {activeTab === 'gradio' && <GradioInferenceDemo />}
        {activeTab === 'benchmarks' && <ModelBenchmarks />}
        {activeTab === 'evaluation' && <EvaluationPlots />}
        {activeTab === 'dataset' && <EdaDatasetExplorer />}
        {activeTab === 'notebooks' && <NotebookPipelineViewer />}
        {activeTab === 'ablation' && <AblationLab />}
      </main>

      {/* Clean Scientific Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">PneumoniaLens PyTorch</span>
            <span aria-hidden="true">·</span>
            <span>ResNet18 Champion Model (Official Test Accuracy 90.71%)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <a
              href="https://data.mendeley.com/datasets/rscbjbr9sj/2"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>Mendeley ChestXray2017</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <span>PyTorch 2.x & Grad-CAM</span>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <span>Educational Research Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
