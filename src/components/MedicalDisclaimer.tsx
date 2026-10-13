import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 text-xs text-amber-200/90 flex items-start sm:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed text-amber-200/90 text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            Investigational Use Only
          </span>
          <strong className="font-semibold text-amber-100">
            Non-Diagnostic Research:
          </strong>
          <span>
            This deep-learning pneumonia classification and Grad-CAM explainability system is strictly for educational benchmark replication and AI transparency analysis. Not FDA/CE cleared for medical diagnosis, clinical triage, or patient treatment.
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-300/80 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
            Cohorts: Mendeley ChestXray2017 (5,856 Pediatric AP Radiographs)
          </span>
        </p>
      </div>
      <div className="hidden md:flex items-center gap-1.5 text-amber-400/80 font-mono text-[11px] shrink-0 border-l border-amber-800/40 pl-3">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Non-Clinical Use</span>
      </div>
    </div>
  );
};
