export type ModelId = 
  | 'resnet18_baseline'
  | 'resnet18_finetuned'
  | 'resnet18_sampler'
  | 'resnet18_sampler_finetuned'
  | 'resnet18_sampler_continued'
  | 'resnet18_sampler_new_hyperparameters'
  | 'efficientnet_b0'
  | 'mobilenet_v3_large'
  | 'ensemble_soft_voting';

export interface ModelExperiment {
  id: ModelId;
  name: string;
  category: 'ResNet-18 Variants' | 'Alternative Backbones' | 'Ensemble';
  accuracy: number; // percentage e.g. 90.71
  precision: number;
  recall: number;
  f1: number;
  rocAuc?: number;
  isChampion?: boolean;
  notes: string;
  config: {
    resolution: string;
    cropMethod: string;
    sampler: string;
    labelSmoothing: number;
    flipProb: number;
    colorJitter: string;
    targetDistribution?: string;
  };
}

export interface SplitData {
  split: 'Train' | 'Validation' | 'Test';
  normal: number;
  pneumonia: number;
  total: number;
  normalPct: number;
  pneumoniaPct: number;
}

export interface SampleCase {
  id: string;
  title: string;
  diagnosis: 'NORMAL' | 'PNEUMONIA';
  subtype?: 'Bacterial Lobar' | 'Viral Interstitial' | 'Normal Paired Lung' | 'Right Lower Consolidation';
  description: string;
  groundTruthProbPneumonia: number;
  // Visual landmarks for X-ray rendering and Grad-CAM focus
  focalZone: {
    cx: number; // normalized center X (0-1)
    cy: number; // normalized center Y (0-1)
    rx: number; // radius X
    ry: number; // radius Y
    intensity: number; // saliency weight 0-1
  };
  clinicalFindings: string[];
}

export type ColormapName = 'jet' | 'turbo' | 'viridis' | 'inferno' | 'cyan_amber';

export interface GradCamOptions {
  colormap: ColormapName;
  opacity: number;
  threshold: number;
  viewMode: 'overlay' | 'heatmap_only' | 'xray_only' | 'split';
  targetClass: 'PNEUMONIA' | 'NORMAL';
  layerName: string;
}
