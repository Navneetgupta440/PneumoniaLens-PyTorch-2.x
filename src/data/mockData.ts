import { ModelExperiment, SplitData, SampleCase } from '../types';

export const MODEL_EXPERIMENTS: ModelExperiment[] = [
  {
    id: 'resnet18_baseline',
    name: 'ResNet18 Baseline',
    category: 'ResNet-18 Variants',
    accuracy: 82.69,
    precision: 79.01,
    recall: 98.46,
    f1: 87.67,
    rocAuc: 0.892,
    notes: 'Standard transfer learning on frozen ImageNet backbone. High recall but suffered from false positives due to class imbalance.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'RandomResizedCrop',
      sampler: 'Standard Random',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
    },
  },
  {
    id: 'resnet18_finetuned',
    name: 'ResNet18 Fine-Tuned',
    category: 'ResNet-18 Variants',
    accuracy: 80.61,
    precision: 76.42,
    recall: 99.74,
    f1: 86.54,
    rocAuc: 0.884,
    notes: 'Unfreezing deeper residual blocks caused slight overfitting on training distribution, failing to improve official test accuracy.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'RandomResizedCrop',
      sampler: 'Standard Random',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
    },
  },
  {
    id: 'resnet18_sampler',
    name: 'ResNet18 + Sampler',
    category: 'ResNet-18 Variants',
    accuracy: 87.50,
    precision: 84.67,
    recall: 97.69,
    f1: 90.71,
    rocAuc: 0.938,
    notes: 'WeightedRandomSampler introduced to balance batch draws. Precision jumped from 79.01% to 84.67% immediately.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'RandomResizedCrop',
      sampler: 'WeightedRandomSampler (50/50)',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
      targetDistribution: '50% PNEUMONIA / 50% NORMAL',
    },
  },
  {
    id: 'resnet18_sampler_finetuned',
    name: 'ResNet18 Sampler + Fine-Tuning',
    category: 'ResNet-18 Variants',
    accuracy: 85.58,
    precision: 81.51,
    recall: 99.49,
    f1: 89.61,
    rocAuc: 0.925,
    notes: 'Fine-tuning with sampler yielded 99.49% recall, but sacrificed specificity compared to fixed representations.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'RandomResizedCrop',
      sampler: 'WeightedRandomSampler (50/50)',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
    },
  },
  {
    id: 'resnet18_sampler_continued',
    name: 'ResNet18 Sampler (Extended Epochs)',
    category: 'ResNet-18 Variants',
    accuracy: 83.33,
    precision: 79.07,
    recall: 99.74,
    f1: 88.21,
    rocAuc: 0.912,
    notes: 'Prolonged training (25+ epochs) without regularization led to overconfidence on majority Pneumonia patterns.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'RandomResizedCrop',
      sampler: 'WeightedRandomSampler (50/50)',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
    },
  },
  {
    id: 'resnet18_sampler_new_hyperparameters',
    name: 'ResNet18 Sampler + New Hyperparameters (Champion)',
    category: 'ResNet-18 Variants',
    accuracy: 90.71,
    precision: 90.10,
    recall: 95.64,
    f1: 92.79,
    rocAuc: 0.9634,
    isChampion: true,
    notes: 'The winning configuration: 640x640 full X-ray resize (no crop), 60/40 target sampler distribution, label smoothing 0.05, and disciplined jitter.',
    config: {
      resolution: '640 x 640',
      cropMethod: 'Full X-ray Resize (No Crop)',
      sampler: 'WeightedRandomSampler',
      labelSmoothing: 0.05,
      flipProb: 0.10,
      colorJitter: 'Brightness 0.08 / Contrast 0.08',
      targetDistribution: '60% PNEUMONIA / 40% NORMAL',
    },
  },
  {
    id: 'efficientnet_b0',
    name: 'EfficientNet-B0',
    category: 'Alternative Backbones',
    accuracy: 72.76,
    precision: 69.71,
    recall: 99.74,
    f1: 82.07,
    rocAuc: 0.887,
    notes: 'Inverted residual bottleneck architecture showed severe tendency to default to majority class in low-data regimes.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'CenterCrop',
      sampler: 'Standard Random',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
    },
  },
  {
    id: 'mobilenet_v3_large',
    name: 'MobileNetV3-Large',
    category: 'Alternative Backbones',
    accuracy: 70.35,
    precision: 67.83,
    recall: 100.00,
    f1: 80.83,
    rocAuc: 0.865,
    notes: 'Achieved 100% recall by predicting Pneumonia on nearly every test radiograph, resulting in poor 67.83% precision.',
    config: {
      resolution: '224 x 224',
      cropMethod: 'CenterCrop',
      sampler: 'Standard Random',
      labelSmoothing: 0.0,
      flipProb: 0.5,
      colorJitter: 'None',
    },
  },
  {
    id: 'ensemble_soft_voting',
    name: 'Soft-Voting Ensemble (ResNet18 + EffNet + MobileNet)',
    category: 'Ensemble',
    accuracy: 89.42,
    precision: 94.02,
    recall: 88.72,
    f1: 91.29,
    rocAuc: 0.9643,
    notes: 'Combines softmax probabilities across all 3 architectures. Yielded highest precision (94.02%) and ROC-AUC (0.9643), but champion ResNet18 won on F1 and accuracy.',
    config: {
      resolution: 'Multi-resolution (640x640 + 224x224)',
      cropMethod: 'Ensemble pipeline',
      sampler: 'Combined representations',
      labelSmoothing: 0.05,
      flipProb: 0.10,
      colorJitter: 'Calibrated',
    },
  },
];

export const DATASET_SPLITS: SplitData[] = [
  {
    split: 'Train',
    normal: 1079,
    pneumonia: 3106,
    total: 4185,
    normalPct: 25.78,
    pneumoniaPct: 74.22,
  },
  {
    split: 'Validation',
    normal: 270,
    pneumonia: 777,
    total: 1047,
    normalPct: 25.79,
    pneumoniaPct: 74.21,
  },
  {
    split: 'Test',
    normal: 234,
    pneumonia: 390,
    total: 624,
    normalPct: 37.50,
    pneumoniaPct: 62.50,
  },
];

export const EDA_METADATA = {
  totalImages: 5856,
  grayscaleImages: 5573,
  rgbImages: 283,
  meanWidth: 1328,
  meanHeight: 971,
  datasetSource: 'Mendeley Data (ChestXray2017)',
  sourceUrl: 'https://data.mendeley.com/datasets/rscbjbr9sj/2',
  classRatioOverall: '73.4% Pneumonia / 26.6% Normal',
};

export const CONFUSION_MATRIX_CHAMPION = {
  truePositive: 373, // Pneumonia correctly identified
  falseNegative: 17,  // Pneumonia missed
  trueNegative: 193,  // Normal correctly identified
  falsePositive: 41,  // Normal falsely classified as Pneumonia
  total: 624,
  accuracy: 90.71,
  precision: 90.10,
  recall: 95.64,
  f1: 92.79,
  specificity: 82.48, // 193 / (193 + 41)
};

export const ROC_CURVE_POINTS = [
  { fpr: 0.00, tpr: 0.00, threshold: 1.00 },
  { fpr: 0.02, tpr: 0.42, threshold: 0.95 },
  { fpr: 0.05, tpr: 0.68, threshold: 0.90 },
  { fpr: 0.08, tpr: 0.81, threshold: 0.80 },
  { fpr: 0.12, tpr: 0.90, threshold: 0.65 },
  { fpr: 0.175, tpr: 0.956, threshold: 0.50 }, // Operating point (Recall 95.64%, Specificity 82.48% => FPR 17.5%)
  { fpr: 0.24, tpr: 0.978, threshold: 0.35 },
  { fpr: 0.35, tpr: 0.992, threshold: 0.20 },
  { fpr: 0.52, tpr: 0.998, threshold: 0.10 },
  { fpr: 1.00, tpr: 1.00, threshold: 0.00 },
];

export const TRAINING_EPOCHS_DATA = [
  { epoch: 1, trainLoss: 0.612, valLoss: 0.495, trainAcc: 74.2, valAcc: 78.4 },
  { epoch: 2, trainLoss: 0.485, valLoss: 0.412, trainAcc: 81.3, valAcc: 84.1 },
  { epoch: 3, trainLoss: 0.398, valLoss: 0.352, trainAcc: 85.6, valAcc: 87.5 },
  { epoch: 4, trainLoss: 0.334, valLoss: 0.301, trainAcc: 88.2, valAcc: 89.2 },
  { epoch: 5, trainLoss: 0.291, valLoss: 0.274, trainAcc: 90.4, valAcc: 90.8 },
  { epoch: 6, trainLoss: 0.264, valLoss: 0.258, trainAcc: 91.9, valAcc: 91.3 },
  { epoch: 7, trainLoss: 0.241, valLoss: 0.249, trainAcc: 92.8, valAcc: 91.6 },
  { epoch: 8, trainLoss: 0.225, valLoss: 0.243, trainAcc: 93.6, valAcc: 92.1 },
  { epoch: 9, trainLoss: 0.210, valLoss: 0.239, trainAcc: 94.3, valAcc: 92.4 },
  { epoch: 10, trainLoss: 0.198, valLoss: 0.236, trainAcc: 94.9, valAcc: 92.6 },
  { epoch: 11, trainLoss: 0.188, valLoss: 0.238, trainAcc: 95.4, valAcc: 92.5 },
  { epoch: 12, trainLoss: 0.179, valLoss: 0.240, trainAcc: 95.8, valAcc: 92.4 },
];

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'case_normal_01',
    title: 'Case #N-104: Clear Bilateral Lung Fields',
    diagnosis: 'NORMAL',
    subtype: 'Normal Paired Lung',
    description: 'Posteroanterior (PA) view radiograph of a healthy pediatric patient. Clear lung parenchymal expansion without consolidation, effusion, or pneumothorax.',
    groundTruthProbPneumonia: 0.042,
    focalZone: {
      cx: 0.50,
      cy: 0.48,
      rx: 0.35,
      ry: 0.30,
      intensity: 0.15,
    },
    clinicalFindings: [
      'Normal lung volume and aeration bilaterally',
      'Sharp, well-demarcated costophrenic and cardiophrenic angles',
      'Normal cardiothoracic ratio (< 0.50)',
      'Hilar structures within normal limits with no adenopathy',
    ],
  },
  {
    id: 'case_bacterial_01',
    title: 'Case #P-388: Right Lower Lobe Bacterial Consolidation',
    diagnosis: 'PNEUMONIA',
    subtype: 'Bacterial Lobar',
    description: 'Classic acute lobar pneumonia showing dense alveolar opacity occupying the right lower and middle lung lobe with distinct air bronchograms.',
    groundTruthProbPneumonia: 0.968,
    focalZone: {
      cx: 0.68,
      cy: 0.62,
      rx: 0.20,
      ry: 0.18,
      intensity: 0.94,
    },
    clinicalFindings: [
      'Dense homogeneous consolidation in the right lower zone',
      'Air bronchograms observed traversing the consolidated parenchyma',
      'Obscuration of the right hemidiaphragmatic margin (positive silhouette sign)',
      'Clear left lung field with compensatory hyperaeration',
    ],
  },
  {
    id: 'case_viral_01',
    title: 'Case #P-412: Bilateral Interstitial Viral Infiltrates',
    diagnosis: 'PNEUMONIA',
    subtype: 'Viral Interstitial',
    description: 'Bilateral diffuse reticular-nodular peribronchial thickening typical of viral respiratory infection (e.g., RSV or influenza).',
    groundTruthProbPneumonia: 0.912,
    focalZone: {
      cx: 0.45,
      cy: 0.50,
      rx: 0.32,
      ry: 0.24,
      intensity: 0.88,
    },
    clinicalFindings: [
      'Diffuse bilateral perihilar cuffing and interstitial prominence',
      'No discrete focal lobar consolidation or cavitation',
      'Preserved costophrenic recesses bilaterally',
      'Mild bilateral hyperinflation consistent with small airway disease',
    ],
  },
  {
    id: 'case_subtle_01',
    title: 'Case #P-209: Retrocardiac Left Lower Lobe Infiltrate',
    diagnosis: 'PNEUMONIA',
    subtype: 'Right Lower Consolidation',
    description: 'Subtle left lower lobe infiltrate partially obscured by the cardiac silhouette, requiring high-resolution full-image context to detect.',
    groundTruthProbPneumonia: 0.875,
    focalZone: {
      cx: 0.36,
      cy: 0.66,
      rx: 0.18,
      ry: 0.16,
      intensity: 0.82,
    },
    clinicalFindings: [
      'Increased retrocardiac density with loss of the descending aortic interface',
      'Subtle silhouette sign of the left medial hemidiaphragm',
      'Right lung parenchyma clear and aerated',
      'Benefited directly from 640x640 full-resize without peripheral cropping',
    ],
  },
];

export const NOTEBOOK_DESCRIPTIONS = [
  {
    id: 'nb01',
    number: '01',
    title: 'Dataset Preparation & Exploratory Data Analysis (EDA)',
    summary: 'Prepares the Mendeley ChestXray2017 dataset, discovers format discrepancies (5,573 grayscale vs 283 RGB), documents class imbalance (74% Pneumonia in train), and constructs patient-level train/validation/test splits.',
    scriptCode: `# Notebook 01: Dataset Preparation and EDA
import os
import glob
import pandas as pd
from PIL import Image

def analyze_dataset(root_dir="dataset/ChestXray2017"):
    records = []
    for split in ["train", "test"]:
        for label in ["NORMAL", "PNEUMONIA"]:
            folder = os.path.join(root_dir, split, label)
            for path in glob.glob(os.path.join(folder, "*.jpeg")):
                with Image.open(path) as img:
                    w, h = img.size
                    mode = img.mode
                records.append({
                    "split": split,
                    "label": label,
                    "width": w,
                    "height": h,
                    "mode": mode,
                    "path": path
                })
    df = pd.DataFrame(records)
    print(f"Total images: {len(df)}")
    print(f"Class counts:\n{df['label'].value_counts()}")
    return df`,
  },
  {
    id: 'nb02',
    number: '02',
    title: 'Preprocessing & DataLoaders',
    summary: 'Defines the winning 640x640 resize pipeline, RGB conversion, ImageNet normalization, data augmentation (flip prob 0.10, jitter 0.08), and computes sample weights for the WeightedRandomSampler to achieve 60/40 batch balance.',
    scriptCode: `# Notebook 02: Preprocessing and WeightedRandomSampler
import torch
from torchvision import transforms
from torch.utils.data import DataLoader, WeightedRandomSampler

# Winning preprocessing configuration (640x640, no crop)
train_transform = transforms.Compose([
    transforms.Resize((640, 640)), # Full X-ray resize preserves peripheral margins
    transforms.RandomHorizontalFlip(p=0.10),
    transforms.ColorJitter(brightness=0.08, contrast=0.08),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def create_balanced_sampler(dataset_targets):
    # Class counts: Normal=1079, Pneumonia=3106
    # Target distribution: 40% Normal, 60% Pneumonia
    class_counts = [1079, 3106]
    target_weights = [0.40 / class_counts[0], 0.60 / class_counts[1]]
    sample_weights = [target_weights[target] for target in dataset_targets]
    sampler = WeightedRandomSampler(
        weights=torch.DoubleTensor(sample_weights),
        num_samples=len(sample_weights),
        replacement=True
    )
    return sampler`,
  },
  {
    id: 'nb03',
    number: '03',
    title: 'Final Model Evaluation & Visualizations',
    summary: 'Loads champion ResNet18 weights, computes official test set metrics (Accuracy 90.71%, Recall 95.64%, Precision 90.10%), generates the confusion matrix, and plots the ROC-AUC curve (0.9634).',
    scriptCode: `# Notebook 03: Final Model Evaluation
import torch
import torchvision.models as models
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.resnet18(weights=None)
model.fc = torch.nn.Linear(model.fc.in_features, 2)
model.load_state_dict(torch.load("models/resnet18_sampler_new_hyperparameters/best.pt"))
model.to(device)
model.eval()

# Evaluated on official test set (624 images: 234 Normal, 390 Pneumonia)
# Output: Accuracy 90.71% | Precision 90.10% | Recall 95.64% | F1 92.79% | ROC-AUC 0.9634`,
  },
  {
    id: 'nb04',
    number: '04',
    title: 'Inference, Grad-CAM & Gradio UI',
    summary: 'Hooks into ResNet18 layer4.1.conv2 to compute Grad-CAM activation maps, applies colormap blending, and launches the Gradio inference web application for interactive radiograph diagnosis.',
    scriptCode: `# Notebook 04: Grad-CAM Explainability Hook & Gradio Launch
import gradio as gr
import torch.nn.functional as F

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        target_layer.register_forward_hook(self.save_activation)
        target_layer.register_full_backward_hook(self.save_gradient)
        
    def save_activation(self, module, input, output):
        self.activations = output
        
    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

# Gradio Demo Launch
# demo.launch(share=True, debug=True, quiet=True)`,
  },
];
