import { ColormapName } from '../types';

/**
 * Colormap lookup functions mapping 0.0 - 1.0 intensity to [r, g, b]
 */
export function getColorFromColormap(val: number, cmap: ColormapName): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));

  if (cmap === 'jet') {
    // Classical Jet colormap (Blue -> Cyan -> Green -> Yellow -> Red)
    let r = Math.min(Math.max(1.5 - Math.abs(v * 4 - 3), 0), 1);
    let g = Math.min(Math.max(1.5 - Math.abs(v * 4 - 2), 0), 1);
    let b = Math.min(Math.max(1.5 - Math.abs(v * 4 - 1), 0), 1);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  if (cmap === 'turbo') {
    // Google Turbo colormap approximation
    const r = Math.sin(v * Math.PI * 0.8) * 0.6 + (v > 0.5 ? 0.4 : 0.1);
    const g = Math.sin(v * Math.PI) * 0.9;
    const b = Math.cos(v * Math.PI * 0.85) * 0.8 + 0.2;
    return [
      Math.min(255, Math.max(0, Math.round((v > 0.6 ? 1 : r) * 255))),
      Math.min(255, Math.max(0, Math.round(g * 255))),
      Math.min(255, Math.max(0, Math.round(b * 255))),
    ];
  }

  if (cmap === 'viridis') {
    // Viridis: Purple -> Teal -> Yellow
    const r = Math.sin(v * Math.PI * 0.5) * 0.8;
    const g = Math.sin(v * Math.PI * 0.75) * 0.9 + 0.1;
    const b = (1 - v * 0.8) * 0.9;
    return [
      Math.round(Math.min(255, Math.max(0, (v * 0.9 + 0.1) * 255 * (v > 0.5 ? 1 : 0.4)))),
      Math.round(Math.min(255, Math.max(0, g * 255))),
      Math.round(Math.min(255, Math.max(0, b * 255))),
    ];
  }

  if (cmap === 'inferno') {
    // Inferno: Black -> Purple -> Orange -> Yellow
    const r = Math.min(1, v * 1.5);
    const g = Math.min(1, Math.max(0, (v - 0.3) * 1.4));
    const b = Math.min(1, Math.max(0, (0.5 - v) * 1.2 + (v > 0.8 ? (v - 0.8) * 4 : 0)));
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // cyan_amber
  if (v < 0.5) {
    const t = v * 2;
    return [Math.round(t * 30), Math.round(180 * t), Math.round(230 * t)];
  } else {
    const t = (v - 0.5) * 2;
    return [Math.round(30 + t * 215), Math.round(180 - t * 40), Math.round(230 * (1 - t))];
  }
}

/**
 * Generates a synthetic or feature-driven Grad-CAM activation matrix (20x20)
 * simulating ResNet18 layer4.1.conv2 or Multi-Backbone Ensemble feature output for chest radiograph.
 */
export function generateActivationMatrix(
  focalPoint: { cx: number; cy: number; rx: number; ry: number; intensity: number },
  isPneumonia: boolean,
  targetClass: 'PNEUMONIA' | 'NORMAL',
  gridSize = 20,
  modelId?: string
): number[][] {
  const matrix: number[][] = [];
  const isEnsemble = modelId === 'ensemble_soft_voting';

  for (let y = 0; y < gridSize; y++) {
    const row: number[] = [];
    const ny = y / (gridSize - 1);

    for (let x = 0; x < gridSize; x++) {
      const nx = x / (gridSize - 1);

      if (targetClass === 'PNEUMONIA') {
        if (isPneumonia) {
          // Compute normalized Gaussian distance to focal lesion
          const dx = (nx - focalPoint.cx) / focalPoint.rx;
          const dy = (ny - focalPoint.cy) / focalPoint.ry;
          const distSq = dx * dx + dy * dy;
          let val = Math.exp(-distSq * 2.2) * focalPoint.intensity;

          // Add secondary subtle activation in perihilar region
          const dx2 = (nx - 0.48) / 0.15;
          const dy2 = (ny - 0.52) / 0.22;
          const val2 = Math.exp(-(dx2 * dx2 + dy2 * dy2) * 3) * 0.28;

          let combined = Math.min(1, Math.max(0, val + val2));

          if (isEnsemble) {
            // Ensemble soft-voting combines multiple backbones:
            // High precision means it tightens the core boundary while averaging multi-scale receptive fields
            const broadDx = (nx - focalPoint.cx) / (focalPoint.rx * 1.35);
            const broadDy = (ny - focalPoint.cy) / (focalPoint.ry * 1.35);
            const broadEffNet = Math.exp(-(broadDx * broadDx + broadDy * broadDy) * 1.8) * (focalPoint.intensity * 0.85);
            combined = combined * 0.55 + broadEffNet * 0.45;
          }

          row.push(Math.min(1, Math.max(0, combined)));
        } else {
          // Normal case looking for pneumonia -> low, diffuse baseline noise
          const dx = nx - 0.5;
          const dy = ny - 0.5;
          const diffuse = Math.exp(-(dx * dx + dy * dy) * 4) * (isEnsemble ? 0.08 : 0.12);
          row.push(Math.max(0, diffuse));
        }
      } else {
        // Target class is NORMAL
        if (!isPneumonia) {
          // Strong symmetrical attention on clear bilobar lung parenchyma
          const dxL = (nx - 0.32) / 0.18;
          const dyL = (ny - 0.5) / 0.25;
          const leftLung = Math.exp(-(dxL * dxL + dyL * dyL) * 2.5) * 0.88;

          const dxR = (nx - 0.68) / 0.18;
          const dyR = (ny - 0.5) / 0.25;
          const rightLung = Math.exp(-(dxR * dxR + dyR * dyR) * 2.5) * 0.88;

          row.push(Math.min(1, Math.max(leftLung, rightLung)));
        } else {
          // Pneumonia case looking for Normal evidence -> low activation
          const dx = nx - 0.5;
          const dy = ny - 0.5;
          row.push(Math.max(0, 0.15 - Math.sqrt(dx * dx + dy * dy) * 0.1));
        }
      }
    }
    matrix.push(row);
  }

  return matrix;
}

/**
 * Bilinear sampling from a 2D matrix
 */
export function sampleMatrix(matrix: number[][], u: number, v: number): number {
  const h = matrix.length;
  const w = matrix[0].length;
  const x = u * (w - 1);
  const y = v * (h - 1);

  const x0 = Math.floor(x);
  const x1 = Math.min(w - 1, x0 + 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(h - 1, y0 + 1);

  const tx = x - x0;
  const ty = y - y0;

  const v00 = matrix[y0][x0];
  const v10 = matrix[y0][x1];
  const v01 = matrix[y1][x0];
  const v11 = matrix[y1][x1];

  const top = v00 * (1 - tx) + v10 * tx;
  const bot = v01 * (1 - tx) + v11 * tx;

  return top * (1 - ty) + bot * ty;
}
