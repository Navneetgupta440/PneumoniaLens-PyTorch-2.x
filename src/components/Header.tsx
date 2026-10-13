import React from 'react';
import { Activity, Play, GitBranch } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLaunchInference: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onLaunchInference }) => {
  const navItems = [
    { id: 'gradio', label: 'Gradio Inference' },
    { id: 'benchmarks', label: 'Model Benchmarks' },
    { id: 'evaluation', label: 'Evaluation & ROC' },
    { id: 'dataset', label: 'Dataset & EDA' },
    { id: 'notebooks', label: 'Notebook Flow' },
    { id: 'ablation', label: 'Ablation Study' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Wordmark & Medical AI Badge (Selector 4) */}
      <div 
        onClick={() => onSelectTab('gradio')}
        className="group flex items-center gap-3 cursor-pointer shrink-0 transition-transform active:scale-[0.99]"
        title="PneumoniaLens PyTorch - Return to Gradio Inference"
      >
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10 group-hover:border-cyan-400 group-hover:shadow-cyan-500/25 transition-all">
          <Activity className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border border-slate-950"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors whitespace-nowrap">
              PneumoniaLens
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
              PyTorch 2.x
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wide">
            ResNet18 Champion · 90.71% Acc
          </span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action + GitHub repo link (Selector 1 & 3) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Selector 1: GitHub Link */}
        <a
          href="https://github.com/clouds440/pneumonia-detection-pytorch"
          target="_blank"
          rel="noopener noreferrer"
          title="View GitHub Repository: clouds440/pneumonia-detection-pytorch"
          className="group/repo flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg shadow-sm hover:shadow-cyan-500/10 transition-all"
        >
          <GitBranch className="w-3.5 h-3.5 text-slate-400 group-hover/repo:text-cyan-400 transition-colors" />
          <div className="flex items-center gap-1">
            <span className="text-slate-400 hidden sm:inline">clouds440 /</span>
            <span className="font-semibold text-cyan-300 group-hover/repo:text-cyan-200">pneumonia-detection</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-sans hidden md:inline">
            ★ PyTorch
          </span>
        </a>

        {/* Selector 3: Launch Inference Button with Enhanced Span */}
        <button
          onClick={onLaunchInference}
          className="group/btn relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg transition-all whitespace-nowrap shrink-0 shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98] border border-cyan-300/40"
        >
          <Play className="w-3.5 h-3.5 fill-current text-slate-950 transition-transform group-hover/btn:scale-110" />
          <span className="tracking-wide uppercase text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700/80 animate-pulse" />
            Launch Inference
          </span>
        </button>
      </div>
    </header>
  );
};
