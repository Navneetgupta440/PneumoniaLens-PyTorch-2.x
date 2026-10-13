import React, { useState, useRef, useMemo, useCallback } from 'react';
import { SampleCase, ModelId, ColormapName } from '../types';
import { SAMPLE_CASES, MODEL_EXPERIMENTS } from '../data/mockData';
import { XrayCanvasViewer } from './XrayCanvasViewer';
import {
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Eye,
  Layers,
  Search,
  Sparkles,
  Clock,
  Cpu,
  ShieldAlert,
  Trash2,
  FileText,
  X,
  Sliders,
  Check,
  AlertTriangle,
  FolderOpen,
  Maximize2
} from 'lucide-react';

export interface BatchItem {
  id: string;
  filename: string;
  accessionId: string;
  fileSize: string;
  previewUrl?: string;
  sampleCase?: SampleCase;
  status: 'ready' | 'processing' | 'completed' | 'error';
  predictedClass?: 'PNEUMONIA' | 'NORMAL';
  pneumoniaProb?: number; // 0 - 100
  normalProb?: number; // 0 - 100
  confidence?: number; // 0 - 100
  riskTier?: 'HIGH_URGENCY' | 'MODERATE' | 'LOW_RISK';
  riskLabel?: string;
  clinicalNote?: string;
  consensusAgreement?: boolean;
  resnetProb?: number;
  ensembleProb?: number;
  latencyMs?: number;
}

interface BatchInferenceLabProps {
  onInspectInSingleView: (caseData?: SampleCase, customImageUrl?: string | null) => void;
  defaultModelId?: ModelId;
}

// Preset Cohort 1: Standard Validation & Test Batch (8 Cases)
const PRESET_CLINICAL_COHORT: BatchItem[] = [
  {
    id: 'batch_preset_01',
    filename: 'person1940_bacteria_4859.jpeg',
    accessionId: 'ACC-2024-8831',
    fileSize: '1.4 MB',
    sampleCase: SAMPLE_CASES[1], // Bacterial Lobar
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 96.8,
    normalProb: 3.2,
    confidence: 96.8,
    riskTier: 'HIGH_URGENCY',
    riskLabel: 'Lobar Consolidation (RLL)',
    clinicalNote: 'Dense homogeneous opacity with distinct air bronchograms occupying the right lower lobe.',
    consensusAgreement: true,
    resnetProb: 96.8,
    ensembleProb: 97.4,
    latencyMs: 14.2,
  },
  {
    id: 'batch_preset_02',
    filename: 'person1942_viral_4861.jpeg',
    accessionId: 'ACC-2024-8832',
    fileSize: '1.2 MB',
    sampleCase: SAMPLE_CASES[2], // Viral Interstitial
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 91.2,
    normalProb: 8.8,
    confidence: 91.2,
    riskTier: 'MODERATE',
    riskLabel: 'Diffuse Interstitial Infiltrate',
    clinicalNote: 'Bilateral diffuse reticular-nodular peribronchial thickening consistent with viral infection.',
    consensusAgreement: true,
    resnetProb: 91.2,
    ensembleProb: 90.5,
    latencyMs: 13.8,
  },
  {
    id: 'batch_preset_03',
    filename: 'NORMAL2-IM-1427-0001.jpeg',
    accessionId: 'ACC-2024-8833',
    fileSize: '1.1 MB',
    sampleCase: SAMPLE_CASES[0], // Clear Bilateral Normal
    status: 'completed',
    predictedClass: 'NORMAL',
    pneumoniaProb: 4.2,
    normalProb: 95.8,
    confidence: 95.8,
    riskTier: 'LOW_RISK',
    riskLabel: 'Unremarkable Parenchyma',
    clinicalNote: 'Clear lung parenchymal expansion bilaterally without focal consolidation or effusion.',
    consensusAgreement: true,
    resnetProb: 4.2,
    ensembleProb: 3.8,
    latencyMs: 12.9,
  },
  {
    id: 'batch_preset_04',
    filename: 'person1944_bacteria_4865.jpeg',
    accessionId: 'ACC-2024-8834',
    fileSize: '1.6 MB',
    sampleCase: SAMPLE_CASES[3], // Retrocardiac subtle
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 87.5,
    normalProb: 12.5,
    confidence: 87.5,
    riskTier: 'HIGH_URGENCY',
    riskLabel: 'Retrocardiac Infiltrate (LLL)',
    clinicalNote: 'Subtle left lower lobe infiltrate partially obscured by the cardiac silhouette.',
    consensusAgreement: true,
    resnetProb: 87.5,
    ensembleProb: 88.2,
    latencyMs: 15.1,
  },
  {
    id: 'batch_preset_05',
    filename: 'NORMAL2-IM-1430-0001.jpeg',
    accessionId: 'ACC-2024-8835',
    fileSize: '1.3 MB',
    sampleCase: {
      ...SAMPLE_CASES[0],
      id: 'case_normal_02',
      title: 'Case #N-105: Clear Pediatric Paired Lung',
      clinicalFindings: [
        'Normal pediatric cardiothoracic index',
        'Sharp diaphragmatic contours bilaterally',
        'No peribronchial cuffing'
      ],
      groundTruthProbPneumonia: 0.026,
    },
    status: 'completed',
    predictedClass: 'NORMAL',
    pneumoniaProb: 2.6,
    normalProb: 97.4,
    confidence: 97.4,
    riskTier: 'LOW_RISK',
    riskLabel: 'Clear Aeration',
    clinicalNote: 'Sharply defined costophrenic angles with symmetric bronchovascular arborization.',
    consensusAgreement: true,
    resnetProb: 2.6,
    ensembleProb: 2.1,
    latencyMs: 13.4,
  },
  {
    id: 'batch_preset_06',
    filename: 'person1949_bacteria_4874.jpeg',
    accessionId: 'ACC-2024-8836',
    fileSize: '1.5 MB',
    sampleCase: {
      ...SAMPLE_CASES[1],
      id: 'case_bacterial_02',
      title: 'Case #P-392: Right Middle Lobe Pneumonia',
      focalZone: { cx: 0.62, cy: 0.52, rx: 0.18, ry: 0.15, intensity: 0.91 },
      groundTruthProbPneumonia: 0.941,
    },
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 94.1,
    normalProb: 5.9,
    confidence: 94.1,
    riskTier: 'HIGH_URGENCY',
    riskLabel: 'Right Middle Lobe Consolidation',
    clinicalNote: 'Silhouette sign with right cardiac border indicating right middle lobe alveolar consolidation.',
    consensusAgreement: true,
    resnetProb: 94.1,
    ensembleProb: 95.3,
    latencyMs: 14.5,
  },
  {
    id: 'batch_preset_07',
    filename: 'person1951_viral_4880.jpeg',
    accessionId: 'ACC-2024-8837',
    fileSize: '1.2 MB',
    sampleCase: {
      ...SAMPLE_CASES[2],
      id: 'case_viral_02',
      title: 'Case #P-418: Perihilar Bronchial Cuffing',
      focalZone: { cx: 0.48, cy: 0.46, rx: 0.28, ry: 0.22, intensity: 0.85 },
      groundTruthProbPneumonia: 0.896,
    },
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 89.6,
    normalProb: 10.4,
    confidence: 89.6,
    riskTier: 'MODERATE',
    riskLabel: 'Bronchial Cuffing / Viral Pattern',
    clinicalNote: 'Perihilar haziness and cuffing consistent with pediatric atypical or viral pneumonia.',
    consensusAgreement: true,
    resnetProb: 89.6,
    ensembleProb: 88.9,
    latencyMs: 13.9,
  },
  {
    id: 'batch_preset_08',
    filename: 'NORMAL2-IM-1436-0001.jpeg',
    accessionId: 'ACC-2024-8838',
    fileSize: '1.4 MB',
    sampleCase: {
      ...SAMPLE_CASES[0],
      id: 'case_normal_03',
      title: 'Case #N-106: Adolescent PA Radiograph',
      groundTruthProbPneumonia: 0.039,
    },
    status: 'completed',
    predictedClass: 'NORMAL',
    pneumoniaProb: 3.9,
    normalProb: 96.1,
    confidence: 96.1,
    riskTier: 'LOW_RISK',
    riskLabel: 'Normal Lung Aeration',
    clinicalNote: 'Normal pulmonary vascularity without focal or diffuse parenchymal airspace disease.',
    consensusAgreement: true,
    resnetProb: 3.9,
    ensembleProb: 3.4,
    latencyMs: 13.1,
  },
];

// Preset Cohort 2: Pediatric Acute Infiltration Cohort (5 Cases)
const PRESET_PEDIATRIC_COHORT: BatchItem[] = [
  {
    id: 'batch_ped_01',
    filename: 'pediatric_case_201_bacterial.jpeg',
    accessionId: 'ACC-2024-9101',
    fileSize: '1.3 MB',
    sampleCase: SAMPLE_CASES[1],
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 97.2,
    normalProb: 2.8,
    confidence: 97.2,
    riskTier: 'HIGH_URGENCY',
    riskLabel: 'Acute Pediatric Lobar Pneumonia',
    clinicalNote: 'Dense airspace consolidation in right lung field with tachypneic presentation.',
    consensusAgreement: true,
    resnetProb: 97.2,
    ensembleProb: 98.1,
    latencyMs: 14.0,
  },
  {
    id: 'batch_ped_02',
    filename: 'pediatric_case_202_viral.jpeg',
    accessionId: 'ACC-2024-9102',
    fileSize: '1.1 MB',
    sampleCase: SAMPLE_CASES[2],
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 92.4,
    normalProb: 7.6,
    confidence: 92.4,
    riskTier: 'MODERATE',
    riskLabel: 'RSV Viral Bronchiolitis Pattern',
    clinicalNote: 'Diffuse bilateral streaky perihilar infiltrates with hyperinflation.',
    consensusAgreement: true,
    resnetProb: 92.4,
    ensembleProb: 91.8,
    latencyMs: 13.5,
  },
  {
    id: 'batch_ped_03',
    filename: 'pediatric_case_203_normal.jpeg',
    accessionId: 'ACC-2024-9103',
    fileSize: '1.2 MB',
    sampleCase: SAMPLE_CASES[0],
    status: 'completed',
    predictedClass: 'NORMAL',
    pneumoniaProb: 4.8,
    normalProb: 95.2,
    confidence: 95.2,
    riskTier: 'LOW_RISK',
    riskLabel: 'Clear Pediatric Lungs',
    clinicalNote: 'Well-aerated pediatric thorax without active focal lesion.',
    consensusAgreement: true,
    resnetProb: 4.8,
    ensembleProb: 4.2,
    latencyMs: 12.8,
  },
  {
    id: 'batch_ped_04',
    filename: 'pediatric_case_204_bacterial_ll.jpeg',
    accessionId: 'ACC-2024-9104',
    fileSize: '1.5 MB',
    sampleCase: SAMPLE_CASES[3],
    status: 'completed',
    predictedClass: 'PNEUMONIA',
    pneumoniaProb: 88.9,
    normalProb: 11.1,
    confidence: 88.9,
    riskTier: 'HIGH_URGENCY',
    riskLabel: 'Left Retrocardiac Consolidation',
    clinicalNote: 'Increased left retrocardiac opacity with effacement of medial hemidiaphragm.',
    consensusAgreement: true,
    resnetProb: 88.9,
    ensembleProb: 89.7,
    latencyMs: 14.6,
  },
  {
    id: 'batch_ped_05',
    filename: 'pediatric_case_205_normal.jpeg',
    accessionId: 'ACC-2024-9105',
    fileSize: '1.4 MB',
    sampleCase: SAMPLE_CASES[0],
    status: 'completed',
    predictedClass: 'NORMAL',
    pneumoniaProb: 3.1,
    normalProb: 96.9,
    confidence: 96.9,
    riskTier: 'LOW_RISK',
    riskLabel: 'Normal Respiratory Anatomy',
    clinicalNote: 'Unremarkable pulmonary parenchyma, normal cardiovascular contour.',
    consensusAgreement: true,
    resnetProb: 3.1,
    ensembleProb: 2.8,
    latencyMs: 13.0,
  },
];

export const BatchInferenceLab: React.FC<BatchInferenceLabProps> = ({
  onInspectInSingleView,
  defaultModelId = 'resnet18_sampler_new_hyperparameters',
}) => {
  const [items, setItems] = useState<BatchItem[]>(PRESET_CLINICAL_COHORT);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(defaultModelId);
  const [threshold, setThreshold] = useState<number>(0.50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingIndex, setProcessingIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<'all' | 'PNEUMONIA' | 'NORMAL' | 'high_risk'>('all');
  const [sortField, setSortField] = useState<'filename' | 'confidence' | 'pneumoniaProb' | 'riskTier'>('confidence');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [inspectModalItem, setInspectModalItem] = useState<BatchItem | null>(null);
  const [inspectColormap, setInspectColormap] = useState<ColormapName>('jet');
  const [inspectOpacity, setInspectOpacity] = useState<number>(0.65);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compute probability based on model and ground truth or filename heuristics
  const evaluateItem = useCallback(
    (item: BatchItem, modelId: ModelId, cutoff: number): BatchItem => {
      let basePneuProb = item.pneumoniaProb !== undefined ? item.pneumoniaProb / 100 : 0.5;

      if (item.sampleCase) {
        basePneuProb = item.sampleCase.groundTruthProbPneumonia;
      } else {
        // Heuristic fallback for user uploaded custom images based on filename
        const fn = item.filename.toLowerCase();
        if (fn.includes('bacteri') || fn.includes('pneumo') || fn.includes('consol')) {
          basePneuProb = 0.94;
        } else if (fn.includes('viral') || fn.includes('infiltr') || fn.includes('covid')) {
          basePneuProb = 0.89;
        } else if (fn.includes('norm') || fn.includes('clear') || fn.includes('healthy')) {
          basePneuProb = 0.04;
        } else {
          // Generate realistic deterministic seed from filename
          let hash = 0;
          for (let i = 0; i < fn.length; i++) {
            hash = (hash << 5) - hash + fn.charCodeAt(i);
            hash |= 0;
          }
          basePneuProb = Math.abs(hash % 100) > 40 ? 0.88 : 0.06;
        }
      }

      // Model adjustments
      let resnetP = basePneuProb;
      let ensembleP = basePneuProb;

      if (basePneuProb > 0.5) {
        ensembleP = Math.min(0.985, basePneuProb * 0.98 + 0.015);
      } else {
        ensembleP = Math.max(0.015, basePneuProb * 0.85);
      }

      let activeP = basePneuProb;
      if (modelId === 'mobilenet_v3_large') {
        activeP = Math.min(0.999, basePneuProb * 1.15 + 0.10);
      } else if (modelId === 'efficientnet_b0') {
        activeP = Math.min(0.99, basePneuProb * 1.06 + 0.06);
      } else if (modelId === 'ensemble_soft_voting') {
        activeP = ensembleP;
      } else {
        activeP = resnetP;
      }

      const pneuPct = Math.round(activeP * 1000) / 10;
      const normPct = Math.round((100 - pneuPct) * 10) / 10;
      const predictedClass: 'PNEUMONIA' | 'NORMAL' = activeP >= cutoff ? 'PNEUMONIA' : 'NORMAL';
      const confidence = predictedClass === 'PNEUMONIA' ? pneuPct : normPct;

      const resnetClass = resnetP >= 0.5 ? 'PNEUMONIA' : 'NORMAL';
      const ensembleClass = ensembleP >= 0.5 ? 'PNEUMONIA' : 'NORMAL';
      const consensusAgreement = resnetClass === ensembleClass;

      let riskTier: 'HIGH_URGENCY' | 'MODERATE' | 'LOW_RISK' = 'LOW_RISK';
      let riskLabel = 'Unremarkable Parenchyma';

      if (predictedClass === 'PNEUMONIA') {
        if (pneuPct >= 92.0) {
          riskTier = 'HIGH_URGENCY';
          riskLabel = 'Dense Alveolar Consolidation';
        } else {
          riskTier = 'MODERATE';
          riskLabel = 'Patchy / Interstitial Infiltrate';
        }
      }

      return {
        ...item,
        status: 'completed',
        predictedClass,
        pneumoniaProb: pneuPct,
        normalProb: normPct,
        confidence,
        riskTier,
        riskLabel,
        consensusAgreement,
        resnetProb: Math.round(resnetP * 1000) / 10,
        ensembleProb: Math.round(ensembleP * 1000) / 10,
        latencyMs: Math.round((12.5 + Math.random() * 3.5) * 10) / 10,
      };
    },
    []
  );

  // Handle multi-file upload
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: BatchItem[] = [];
    const count = files.length;

    Array.from(files).forEach((file, idx) => {
      const id = `upload_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`;
      const accessionId = `ACC-2024-${Math.floor(1000 + Math.random() * 9000)}`;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const previewUrl = URL.createObjectURL(file);

      // Create synthetic sampleCase representation for the canvas renderer
      const isSuspectedPneu = !file.name.toLowerCase().includes('normal') && !file.name.toLowerCase().includes('clean');
      const syntheticCase: SampleCase = {
        id: `custom_case_${id}`,
        title: `Uploaded: ${file.name}`,
        diagnosis: isSuspectedPneu ? 'PNEUMONIA' : 'NORMAL',
        subtype: isSuspectedPneu ? 'Bacterial Lobar' : 'Normal Paired Lung',
        description: `User-uploaded radiograph (${file.name}). Evaluated with PyTorch 640x640 resize pipeline.`,
        groundTruthProbPneumonia: isSuspectedPneu ? 0.92 : 0.05,
        focalZone: {
          cx: 0.60 + (Math.random() * 0.15 - 0.07),
          cy: 0.58 + (Math.random() * 0.12 - 0.06),
          rx: 0.20,
          ry: 0.18,
          intensity: isSuspectedPneu ? 0.88 : 0.15,
        },
        clinicalFindings: [
          'Chest radiograph submitted for automated batch triage',
          'Analyzed through ResNet18 and Ensemble inference kernels',
        ],
      };

      const rawItem: BatchItem = {
        id,
        filename: file.name,
        accessionId,
        fileSize: sizeMb,
        previewUrl,
        sampleCase: syntheticCase,
        status: 'ready',
      };

      // Automatically evaluate immediately so user sees results
      const evaluated = evaluateItem(rawItem, selectedModelId, threshold);
      newItems.push(evaluated);
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  // Run or re-run batch inference across all current items with simulation animation
  const handleRunBatchInference = () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingIndex(0);

    const total = items.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx++;
      setProcessingIndex(currentIdx);
      setProcessingProgress(Math.round((currentIdx / total) * 100));

      if (currentIdx >= total) {
        clearInterval(interval);
        setTimeout(() => {
          // Update all items with newly evaluated values for current selectedModelId & threshold
          setItems((prev) => prev.map((item) => evaluateItem(item, selectedModelId, threshold)));
          setIsProcessing(false);
          setProcessingProgress(100);
        }, 150);
      }
    }, Math.max(80, Math.floor(1000 / total)));
  };

  // Preset loaders
  const handleLoadPreset = (preset: BatchItem[]) => {
    // Re-evaluate with current settings
    const evaluated = preset.map((item) => evaluateItem(item, selectedModelId, threshold));
    setItems(evaluated);
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // CSV Export feature
  const handleExportCsv = () => {
    if (items.length === 0) return;

    const headers = [
      'Accession_ID',
      'Filename',
      'Model_Used',
      'Threshold_Cutoff',
      'Predicted_Class',
      'Confidence_Pct',
      'Pneumonia_Prob_Pct',
      'Normal_Prob_Pct',
      'Risk_Tier',
      'Risk_Label',
      'Consensus_Agreement',
      'Latency_ms',
      'Timestamp_ISO',
    ];

    const rows = items.map((item) => [
      item.accessionId,
      `"${item.filename}"`,
      selectedModelId,
      threshold.toFixed(2),
      item.predictedClass || 'N/A',
      item.confidence?.toFixed(1) || '0.0',
      item.pneumoniaProb?.toFixed(1) || '0.0',
      item.normalProb?.toFixed(1) || '0.0',
      item.riskTier || 'N/A',
      `"${item.riskLabel || ''}"`,
      item.consensusAgreement ? 'TRUE' : 'FALSE',
      item.latencyMs?.toFixed(1) || '14.0',
      new Date().toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PneumoniaLens_Batch_Inference_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Export feature
  const handleExportJson = () => {
    if (items.length === 0) return;
    const reportData = {
      generator: 'PneumoniaLens PyTorch Gradio Batch Processor',
      generatedAt: new Date().toISOString(),
      modelId: selectedModelId,
      thresholdCutoff: threshold,
      batchSummary: {
        totalCases: items.length,
        pneumoniaCount: items.filter((i) => i.predictedClass === 'PNEUMONIA').length,
        normalCount: items.filter((i) => i.predictedClass === 'NORMAL').length,
        meanConfidence: (
          items.reduce((acc, i) => acc + (i.confidence || 0), 0) / (items.length || 1)
        ).toFixed(1),
      },
      items,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PneumoniaLens_Batch_Report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter & Sort
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search term
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchName = item.filename.toLowerCase().includes(s);
          const matchAcc = item.accessionId.toLowerCase().includes(s);
          const matchLabel = item.riskLabel?.toLowerCase().includes(s);
          if (!matchName && !matchAcc && !matchLabel) return false;
        }

        // Class filter
        if (classFilter === 'PNEUMONIA') return item.predictedClass === 'PNEUMONIA';
        if (classFilter === 'NORMAL') return item.predictedClass === 'NORMAL';
        if (classFilter === 'high_risk') return item.riskTier === 'HIGH_URGENCY';
        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'filename') {
          valA = a.filename;
          valB = b.filename;
        } else if (sortField === 'confidence') {
          valA = a.confidence ?? 0;
          valB = b.confidence ?? 0;
        } else if (sortField === 'pneumoniaProb') {
          valA = a.pneumoniaProb ?? 0;
          valB = b.pneumoniaProb ?? 0;
        } else if (sortField === 'riskTier') {
          const tierWeight = { HIGH_URGENCY: 3, MODERATE: 2, LOW_RISK: 1 };
          valA = a.riskTier ? tierWeight[a.riskTier] : 0;
          valB = b.riskTier ? tierWeight[b.riskTier] : 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [items, searchTerm, classFilter, sortField, sortAsc]);

  // Aggregate Batch Statistics
  const stats = useMemo(() => {
    const total = items.length;
    if (total === 0) {
      return {
        total: 0,
        pneumoniaCount: 0,
        pneumoniaPct: 0,
        normalCount: 0,
        normalPct: 0,
        meanConfidence: 0,
        highUrgencyCount: 0,
        agreementRate: 100,
        avgLatency: 0,
      };
    }

    const pneumoniaCount = items.filter((i) => i.predictedClass === 'PNEUMONIA').length;
    const normalCount = items.filter((i) => i.predictedClass === 'NORMAL').length;
    const highUrgencyCount = items.filter((i) => i.riskTier === 'HIGH_URGENCY').length;
    const agreements = items.filter((i) => i.consensusAgreement !== false).length;
    const sumConf = items.reduce((sum, i) => sum + (i.confidence || 0), 0);
    const sumLatency = items.reduce((sum, i) => sum + (i.latencyMs || 14), 0);

    return {
      total,
      pneumoniaCount,
      pneumoniaPct: Math.round((pneumoniaCount / total) * 1000) / 10,
      normalCount,
      normalPct: Math.round((normalCount / total) * 1000) / 10,
      meanConfidence: Math.round((sumConf / total) * 10) / 10,
      highUrgencyCount,
      agreementRate: Math.round((agreements / total) * 1000) / 10,
      avgLatency: Math.round((sumLatency / total) * 10) / 10,
    };
  }, [items]);

  const activeModelMeta = MODEL_EXPERIMENTS.find((m) => m.id === selectedModelId) || MODEL_EXPERIMENTS[5];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Batch Dropzone & Quick Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Upload Dropzone Tile */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200">
                Multi-File Radiograph Ingestion
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                {items.length} {items.length === 1 ? 'case staged' : 'cases staged'}
              </span>
            </div>
          </div>

          {/* Interactive Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200 scale-[1.01]'
                : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-950/80 text-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-white">
                Drag & drop multiple chest X-ray images here, or{' '}
                <span className="text-cyan-400 underline decoration-cyan-400/40 hover:decoration-cyan-400">
                  browse files
                </span>
              </p>
              <p className="text-xs text-slate-400 font-mono">
                Supports batch PNG, JPEG, WebP · Preserves PA/AP orientation · Auto-resized to 640×640
              </p>
            </div>
          </div>

          {/* Quick Preload Preset Cohorts */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Quick Clinical Cohorts:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadPreset(PRESET_CLINICAL_COHORT)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-mono text-[11px] transition-colors"
              >
                Standard Test (8 Cases)
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset(PRESET_PEDIATRIC_COHORT)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-mono text-[11px] transition-colors"
              >
                Pediatric Cohort (5 Cases)
              </button>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 font-mono text-[11px] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Batch Engine Controls Tile */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-900 border border-slate-800 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Batch Inference Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                PyTorch 2.x CUDA
              </span>
            </div>

            {/* Model Architecture Selector */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs text-slate-300 font-medium">Model Architecture</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value as ModelId)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="resnet18_sampler_new_hyperparameters">
                  ★ ResNet18 Champion (Weighted Sampler, Test Acc: 90.71%)
                </option>
                <option value="ensemble_soft_voting">
                  ★ Soft-Voting Ensemble (ResNet18 + EffNet + MobileNet, 91.35%)
                </option>
                <option value="efficientnet_b0">
                  EfficientNet-B0 (Compound Scaling, Acc: 89.10%)
                </option>
                <option value="mobilenet_v3_large">
                  MobileNetV3-Large (High Sensitivity, Acc: 77.24%)
                </option>
                <option value="resnet18_baseline">
                  ResNet18 Baseline (Standard Freeze, Acc: 82.69%)
                </option>
              </select>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Category: {activeModelMeta.category}</span>
                <span>·</span>
                <span>F1-Score: {activeModelMeta.f1}%</span>
              </div>
            </div>

            {/* Operating Decision Threshold */}
            <div className="flex flex-col gap-1.5 mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Decision Cutoff Threshold
                </span>
                <span className="font-mono text-cyan-400 font-bold">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.20 (High Sensitivity Triage)</span>
                <span>0.50 (Standard)</span>
                <span>0.80 (High Specificity)</span>
              </div>
            </div>
          </div>

          {/* Execution Button & Progress Bar */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            {isProcessing && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Inferencing case {processingIndex} of {items.length}...
                  </span>
                  <span className="text-slate-300">{processingProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-150"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing || items.length === 0}
              onClick={handleRunBatchInference}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-md ${
                isProcessing || items.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-[0.99] border border-cyan-400'
              }`}
            >
              <Play className={`w-4 h-4 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing
                  ? `Processing Batch (${processingIndex}/${items.length})...`
                  : `Run Batch Classification (${items.length} Cases)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. High-Level Batch Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Processed */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Staged</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">cases</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">640×640 tensor format</span>
        </div>

        {/* Pneumonia Detected */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-950/60 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Pneumonia
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-300">{stats.pneumoniaCount}</span>
            <span className="text-xs text-rose-400/80 font-mono">({stats.pneumoniaPct}%)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Positive classification</span>
        </div>

        {/* Normal Unremarkable */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-950/60 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Normal
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-300">{stats.normalCount}</span>
            <span className="text-xs text-emerald-400/80 font-mono">({stats.normalPct}%)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Unremarkable parenchyma</span>
        </div>

        {/* Mean Diagnostic Confidence */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avg Confidence</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-300">{stats.meanConfidence}%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Softmax certainty</span>
        </div>

        {/* High Urgency Cases */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-950/60 flex flex-col">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            High Urgency
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-300">{stats.highUrgencyCount}</span>
            <span className="text-xs text-slate-400">cases</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Prob &gt; 92% consolidation</span>
        </div>

        {/* GPU Latency & Throughput */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Throughput
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-white">{stats.avgLatency}</span>
            <span className="text-xs text-slate-400">ms/img</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1">~72 FPS batch rate</span>
        </div>
      </div>

      {/* 3. Classification Results Summary Table Container */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              Classification Results Summary Table
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              Showing {filteredAndSortedItems.length} of {items.length} records
            </span>
          </div>

          {/* Right Toolbar: Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 hover:text-cyan-200 border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download CSV table containing all prediction scores, probabilities, and flags"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>JSON Report</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
          {/* Class Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px] mr-1 hidden sm:inline">Filter:</span>
            <button
              type="button"
              onClick={() => setClassFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                classFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('PNEUMONIA')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                classFilter === 'PNEUMONIA'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-rose-300'
              }`}
            >
              Pneumonia ({items.filter((i) => i.predictedClass === 'PNEUMONIA').length})
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('NORMAL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                classFilter === 'NORMAL'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
              }`}
            >
              Normal ({items.filter((i) => i.predictedClass === 'NORMAL').length})
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('high_risk')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                classFilter === 'high_risk'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-amber-300'
              }`}
            >
              High Urgency ({items.filter((i) => i.riskTier === 'HIGH_URGENCY').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename, ID, risk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3 w-14">Preview</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    if (sortField === 'filename') setSortAsc(!sortAsc);
                    else {
                      setSortField('filename');
                      setSortAsc(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Radiograph / Accession</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Classification</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    if (sortField === 'confidence') setSortAsc(!sortAsc);
                    else {
                      setSortField('confidence');
                      setSortAsc(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    if (sortField === 'pneumoniaProb') setSortAsc(!sortAsc);
                    else {
                      setSortField('pneumoniaProb');
                      setSortAsc(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Softmax Probability</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    if (sortField === 'riskTier') setSortAsc(!sortAsc);
                    else {
                      setSortField('riskTier');
                      setSortAsc(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Triage Priority</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Consensus</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-500" />
                      <span>No radiographic cases found matching the criteria.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setClassFilter('all');
                        }}
                        className="text-xs text-cyan-400 underline mt-1"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item, index) => {
                  const isPneu = item.predictedClass === 'PNEUMONIA';
                  const pneuPct = item.pneumoniaProb ?? 50;
                  const normPct = item.normalProb ?? 50;
                  const conf = item.confidence ?? 50;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                      onClick={() => setInspectModalItem(item)}
                    >
                      {/* Index / Status dot */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isPneu ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-[11px]">{index + 1}</span>
                        </div>
                      </td>

                      {/* Thumbnail Preview */}
                      <td className="py-3 px-3">
                        <div
                          className="w-10 h-10 rounded-md bg-slate-900 border border-slate-700/80 overflow-hidden relative shrink-0 shadow flex items-center justify-center group-hover:border-cyan-400 transition-colors"
                          title="Click to inspect Grad-CAM saliency"
                        >
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center text-slate-500">
                              <Eye className="w-4 h-4 text-cyan-400/70" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-3 h-3 text-cyan-300" />
                          </div>
                        </div>
                      </td>

                      {/* Filename & Accession */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate max-w-[200px]">
                            {item.filename}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="text-cyan-400 font-bold">{item.accessionId}</span>
                            <span>·</span>
                            <span>{item.fileSize}</span>
                          </div>
                        </div>
                      </td>

                      {/* Prediction Badge */}
                      <td className="py-3 px-3">
                        {isPneu ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm shadow-rose-950/50">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            PNEUMONIA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm shadow-emerald-950/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            NORMAL
                          </span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">{conf.toFixed(1)}%</span>
                          <span
                            className={`text-[10px] ${
                              conf >= 90
                                ? 'text-emerald-400'
                                : conf >= 75
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {conf >= 90 ? 'High Certainty' : conf >= 75 ? 'Moderate' : 'Low Certainty'}
                          </span>
                        </div>
                      </td>

                      {/* Softmax Prob Dual Bar */}
                      <td className="py-3 px-3 font-mono w-48">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-rose-400 font-bold">Pneu: {pneuPct.toFixed(1)}%</span>
                            <span className="text-emerald-400">Norm: {normPct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                            <div className="bg-rose-500 h-full transition-all" style={{ width: `${pneuPct}%` }} />
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${normPct}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Triage Priority */}
                      <td className="py-3 px-3">
                        {item.riskTier === 'HIGH_URGENCY' && (
                          <div className="flex items-center gap-1.5 text-rose-300 font-medium text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{item.riskLabel || 'High Urgency'}</span>
                          </div>
                        )}
                        {item.riskTier === 'MODERATE' && (
                          <div className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{item.riskLabel || 'Moderate Risk'}</span>
                          </div>
                        )}
                        {item.riskTier === 'LOW_RISK' && (
                          <div className="flex items-center gap-1.5 text-emerald-300 font-medium text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{item.riskLabel || 'Low Risk'}</span>
                          </div>
                        )}
                      </td>

                      {/* Consensus */}
                      <td className="py-3 px-3 text-center font-mono">
                        {item.consensusAgreement ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400"
                            title="Both ResNet18 and Ensemble agree on this diagnosis"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>100%</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-amber-400"
                            title="ResNet18 and Ensemble produce differing predictions"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Audit</span>
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectModalItem(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition-colors"
                            title="Quick View Grad-CAM Saliency"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectInSingleView(item.sampleCase, item.previewUrl)}
                            className="px-2 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                            title="Load this case into single Grad-CAM studio"
                          >
                            <span>Studio</span>
                            <Sparkles className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Remove from batch"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Quick Grad-CAM Inspection Modal */}
      {inspectModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setInspectModalItem(null)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{inspectModalItem.filename}</span>
                    <span className="text-xs font-mono text-cyan-400">({inspectModalItem.accessionId})</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Batch Radiograph Saliency Inspection · Model: {selectedModelId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Saliency Viewer & Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Canvas Saliency Viewer */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <div className="aspect-square w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
                  <XrayCanvasViewer
                    caseData={inspectModalItem.sampleCase}
                    customImageUrl={inspectModalItem.previewUrl}
                    targetClass={inspectModalItem.predictedClass || 'PNEUMONIA'}
                    colormap={inspectColormap}
                    opacity={inspectOpacity}
                    threshold={0.15}
                    viewMode="overlay"
                    modelId={selectedModelId}
                    badgeLabel={`Batch Case: ${inspectModalItem.accessionId}`}
                  />
                </div>

                {/* Saliency Controls */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Colormap:</span>
                    <select
                      value={inspectColormap}
                      onChange={(e) => setInspectColormap(e.target.value as ColormapName)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-xs"
                    >
                      <option value="jet">Jet (Standard)</option>
                      <option value="turbo">Turbo (Clinical)</option>
                      <option value="viridis">Viridis</option>
                      <option value="inferno">Inferno</option>
                      <option value="cyan_amber">Cyan-Amber</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Heatmap Alpha:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={inspectOpacity}
                      onChange={(e) => setInspectOpacity(parseFloat(e.target.value))}
                      className="w-20 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-cyan-300 font-bold">{Math.round(inspectOpacity * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Readout Column */}
              <div className="md:col-span-5 flex flex-col gap-4">
                {/* Result Pill */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Model Classification
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-lg font-bold font-mono px-3 py-1 rounded-lg border ${
                        inspectModalItem.predictedClass === 'PNEUMONIA'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {inspectModalItem.predictedClass}
                    </span>
                    <span className="text-xl font-bold font-mono text-white">
                      {inspectModalItem.confidence?.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1">
                    {inspectModalItem.riskLabel}
                  </span>
                </div>

                {/* Softmax Probabilities */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Softmax Distribution
                  </span>
                  <div className="flex flex-col gap-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-rose-400">Pneumonia Prob:</span>
                      <span className="font-bold text-white">{inspectModalItem.pneumoniaProb?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${inspectModalItem.pneumoniaProb}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-emerald-400">Normal Prob:</span>
                      <span className="font-bold text-white">{inspectModalItem.normalProb?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${inspectModalItem.normalProb}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Findings / Note */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5 text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
                    Radiological Assessment
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {inspectModalItem.clinicalNote ||
                      inspectModalItem.sampleCase?.description ||
                      'Automated batch detection complete.'}
                  </p>
                </div>

                {/* Switch to Full Studio Button */}
                <button
                  type="button"
                  onClick={() => {
                    const c = inspectModalItem.sampleCase;
                    const u = inspectModalItem.previewUrl;
                    setInspectModalItem(null);
                    onInspectInSingleView(c, u);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open in Full Grad-CAM Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
