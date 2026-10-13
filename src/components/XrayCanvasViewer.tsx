import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SampleCase, ColormapName } from '../types';
import { generateActivationMatrix, sampleMatrix, getColorFromColormap } from '../utils/gradcam';
import { Eye, Layers, Sliders, Download, Maximize2, Crosshair, MoveHorizontal } from 'lucide-react';

interface XrayCanvasViewerProps {
  caseData?: SampleCase;
  customImageUrl?: string | null;
  targetClass: 'PNEUMONIA' | 'NORMAL';
  colormap: ColormapName;
  opacity: number; // 0 to 1
  threshold: number; // 0 to 1
  viewMode: 'overlay' | 'heatmap_only' | 'xray_only' | 'split';
  splitPosition?: number; // 0 to 100 for split view
  onSplitChange?: (pos: number) => void;
  showCrosshair?: boolean;
  modelId?: string;
  compareModelId?: string;
  badgeLabel?: string;
}

export const XrayCanvasViewer: React.FC<XrayCanvasViewerProps> = ({
  caseData,
  customImageUrl,
  targetClass,
  colormap,
  opacity,
  threshold,
  viewMode,
  splitPosition = 50,
  onSplitChange,
  showCrosshair = true,
  modelId,
  compareModelId,
  badgeLabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number; u: number; v: number; val: number } | null>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Draw procedural chest X-ray onto an offscreen canvas
  const renderBaseXray = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, customImg?: HTMLImageElement | null) => {
    if (customImg && customImg.complete && customImg.naturalWidth > 0) {
      // Draw uploaded custom image
      ctx.drawImage(customImg, 0, 0, width, height);
      return;
    }

    // Procedural clinical radiograph generator
    // Background: dark radiographic film with subtle exposure vignette
    const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.1, width * 0.5, height * 0.5, width * 0.65);
    bgGrad.addColorStop(0, '#1c222b');
    bgGrad.addColorStop(1, '#080a0e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Thoracic cage boundary & lungs
    const isPneumonia = caseData ? caseData.diagnosis === 'PNEUMONIA' : true;
    const focal = caseData?.focalZone || { cx: 0.65, cy: 0.60, rx: 0.20, ry: 0.18, intensity: 0.9 };

    // Draw Left and Right Lung Fields (Parenchyma)
    // In anatomy, Left Lung is on patient's left (viewer's right)
    const drawLungField = (cx: number, cy: number, rx: number, ry: number, isRightPneumonia: boolean) => {
      ctx.save();
      const lungGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
      if (isRightPneumonia && isPneumonia) {
        // Consolidated lung: denser/whiter radiographic opacities
        lungGrad.addColorStop(0, '#5a6878');
        lungGrad.addColorStop(0.6, '#3a4452');
        lungGrad.addColorStop(1, '#1b222d');
      } else {
        // Normal aerated lung: lucent / dark
        lungGrad.addColorStop(0, '#121720');
        lungGrad.addColorStop(0.7, '#18202c');
        lungGrad.addColorStop(1, '#222c3b');
      }

      ctx.fillStyle = lungGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bronchovascular markings (fine branching streaks)
      ctx.strokeStyle = isRightPneumonia && isPneumonia ? 'rgba(210, 225, 240, 0.45)' : 'rgba(120, 140, 165, 0.25)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        const startX = cx * 0.95;
        const startY = cy * 0.85 + (i - 3) * 14;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
          startX + (i % 2 === 0 ? 35 : -35),
          startY + 25,
          startX + (i % 2 === 0 ? 65 : -60),
          startY + 50
        );
        ctx.stroke();
      }
      ctx.restore();
    };

    // Right lung (viewer left)
    drawLungField(width * 0.33, height * 0.48, width * 0.17, height * 0.30, false);
    // Left lung (viewer right, often affected in bacterial lobar case)
    drawLungField(width * 0.67, height * 0.48, width * 0.17, height * 0.30, true);

    // Draw Pneumonia Consolidation Opacity / Infiltrate if Pneumonia
    if (isPneumonia) {
      ctx.save();
      const fx = width * focal.cx;
      const fy = height * focal.cy;
      const frx = width * focal.rx;
      const fry = height * focal.ry;

      const lesionGrad = ctx.createRadialGradient(fx, fy, 5, fx, fy, frx);
      lesionGrad.addColorStop(0, 'rgba(225, 235, 245, 0.85)'); // dense consolidation center
      lesionGrad.addColorStop(0.4, 'rgba(180, 195, 215, 0.65)');
      lesionGrad.addColorStop(0.75, 'rgba(130, 150, 175, 0.35)');
      lesionGrad.addColorStop(1, 'rgba(60, 75, 95, 0)');

      ctx.fillStyle = lesionGrad;
      ctx.beginPath();
      ctx.ellipse(fx, fy, frx, fry, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Air bronchograms (dark branching airways traversing dense white consolidation)
      ctx.strokeStyle = 'rgba(20, 26, 35, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx - 15, fy - 25);
      ctx.lineTo(fx + 5, fy);
      ctx.lineTo(fx + 22, fy + 30);
      ctx.moveTo(fx + 5, fy);
      ctx.lineTo(fx - 10, fy + 22);
      ctx.stroke();
      ctx.restore();
    }

    // Spine & Vertebrae (Central column)
    ctx.save();
    ctx.fillStyle = 'rgba(140, 155, 175, 0.35)';
    for (let y = height * 0.12; y < height * 0.82; y += 22) {
      ctx.fillRect(width * 0.48, y, width * 0.04, 15);
      ctx.strokeStyle = 'rgba(200, 215, 230, 0.3)';
      ctx.strokeRect(width * 0.48, y, width * 0.04, 15);
    }
    ctx.restore();

    // Cardiac Silhouette (Heart shadow, tilted left)
    ctx.save();
    ctx.fillStyle = 'rgba(190, 205, 220, 0.6)';
    ctx.beginPath();
    ctx.moveTo(width * 0.46, height * 0.38);
    // Right cardiac border
    ctx.bezierCurveTo(
      width * 0.43, height * 0.48,
      width * 0.43, height * 0.58,
      width * 0.47, height * 0.66
    );
    // Apex and left ventricle
    ctx.bezierCurveTo(
      width * 0.58, height * 0.72,
      width * 0.64, height * 0.62,
      width * 0.56, height * 0.42
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Aortic Knob
    ctx.save();
    ctx.fillStyle = 'rgba(180, 195, 215, 0.5)';
    ctx.beginPath();
    ctx.arc(width * 0.52, height * 0.35, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Diaphragm (bilateral domes)
    ctx.save();
    ctx.fillStyle = 'rgba(160, 175, 195, 0.55)';
    // Right hemidiaphragm (higher)
    ctx.beginPath();
    ctx.moveTo(width * 0.18, height * 0.78);
    ctx.quadraticCurveTo(width * 0.33, height * 0.67, width * 0.48, height * 0.76);
    ctx.lineTo(width * 0.48, height * 0.95);
    ctx.lineTo(width * 0.18, height * 0.95);
    ctx.closePath();
    ctx.fill();

    // Left hemidiaphragm
    ctx.beginPath();
    ctx.moveTo(width * 0.52, height * 0.76);
    ctx.quadraticCurveTo(width * 0.67, height * 0.69, width * 0.82, height * 0.79);
    ctx.lineTo(width * 0.82, height * 0.95);
    ctx.lineTo(width * 0.52, height * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rib cage contours (bilateral paired arches)
    ctx.save();
    ctx.strokeStyle = 'rgba(195, 210, 230, 0.32)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let r = 1; r <= 8; r++) {
      const ribY = height * 0.22 + r * 28;
      // Left rib (viewer left)
      ctx.beginPath();
      ctx.moveTo(width * 0.48, ribY - 14);
      ctx.bezierCurveTo(
        width * 0.30, ribY - 8,
        width * 0.18, ribY + 12,
        width * 0.22, ribY + 32
      );
      ctx.stroke();

      // Right rib (viewer right)
      ctx.beginPath();
      ctx.moveTo(width * 0.52, ribY - 14);
      ctx.bezierCurveTo(
        width * 0.70, ribY - 8,
        width * 0.82, ribY + 12,
        width * 0.78, ribY + 32
      );
      ctx.stroke();
    }

    // Clavicles (Collar bones at apex)
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(215, 230, 245, 0.45)';
    // Left clavicle
    ctx.beginPath();
    ctx.moveTo(width * 0.46, height * 0.22);
    ctx.quadraticCurveTo(width * 0.32, height * 0.21, width * 0.16, height * 0.19);
    ctx.stroke();
    // Right clavicle
    ctx.beginPath();
    ctx.moveTo(width * 0.54, height * 0.22);
    ctx.quadraticCurveTo(width * 0.68, height * 0.21, width * 0.84, height * 0.19);
    ctx.stroke();
    ctx.restore();

    // Film orientation marker: "R" (anatomical right, upper left of film)
    ctx.fillStyle = 'rgba(235, 245, 255, 0.85)';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('R', width * 0.08, height * 0.12);
  }, [caseData]);

  // Render combined canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 640;
    canvas.width = width;
    canvas.height = height;

    const render = (loadedCustomImg: HTMLImageElement | null = null) => {
      // 1. Render Base X-ray on offscreen canvas
      const xrayCanvas = document.createElement('canvas');
      xrayCanvas.width = width;
      xrayCanvas.height = height;
      const xrayCtx = xrayCanvas.getContext('2d')!;
      renderBaseXray(xrayCtx, width, height, loadedCustomImg);

      // 2. Generate Grad-CAM activation matrix
      const focal = caseData?.focalZone || { cx: 0.65, cy: 0.60, rx: 0.20, ry: 0.18, intensity: 0.9 };
      const isPneumonia = caseData ? caseData.diagnosis === 'PNEUMONIA' : true;
      const activationGrid = generateActivationMatrix(focal, isPneumonia, targetClass, 20, modelId);

      // 3. Render Grad-CAM Heatmap on second offscreen canvas
      const heatCanvas = document.createElement('canvas');
      heatCanvas.width = width;
      heatCanvas.height = height;
      const heatCtx = heatCanvas.getContext('2d')!;
      const heatImgData = heatCtx.createImageData(width, height);
      const heatPixels = heatImgData.data;

      for (let y = 0; y < height; y++) {
        const v = y / (height - 1);
        for (let x = 0; x < width; x++) {
          const u = x / (width - 1);
          const act = sampleMatrix(activationGrid, u, v);
          const idx = (y * width + x) * 4;

          if (act >= threshold) {
            // Normalize above threshold for display
            const normAct = (act - threshold) / (1 - threshold + 0.0001);
            const [r, g, b] = getColorFromColormap(normAct, colormap);
            heatPixels[idx] = r;
            heatPixels[idx + 1] = g;
            heatPixels[idx + 2] = b;
            heatPixels[idx + 3] = Math.round(normAct * opacity * 255);
          } else {
            heatPixels[idx + 3] = 0; // Transparent below threshold
          }
        }
      }
      heatCtx.putImageData(heatImgData, 0, 0);

      // 4. Compose final canvas based on viewMode
      ctx.clearRect(0, 0, width, height);

      if (viewMode === 'xray_only') {
        ctx.drawImage(xrayCanvas, 0, 0);
      } else if (viewMode === 'heatmap_only') {
        ctx.fillStyle = '#080a0e';
        ctx.fillRect(0, 0, width, height);
        // Draw solid opaque heatmap with threshold clipping
        const solidImgData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
          const v = y / (height - 1);
          for (let x = 0; x < width; x++) {
            const u = x / (width - 1);
            const act = sampleMatrix(activationGrid, u, v);
            const idx = (y * width + x) * 4;
            if (act >= threshold) {
              const normAct = (act - threshold) / (1 - threshold + 0.0001);
              const [r, g, b] = getColorFromColormap(normAct, colormap);
              solidImgData.data[idx] = r;
              solidImgData.data[idx + 1] = g;
              solidImgData.data[idx + 2] = b;
              solidImgData.data[idx + 3] = 255;
            } else {
              solidImgData.data[idx] = 8;
              solidImgData.data[idx + 1] = 10;
              solidImgData.data[idx + 2] = 14;
              solidImgData.data[idx + 3] = 255;
            }
          }
        }
        ctx.putImageData(solidImgData, 0, 0);
      } else if (viewMode === 'overlay') {
        ctx.drawImage(xrayCanvas, 0, 0);
        ctx.drawImage(heatCanvas, 0, 0);
      } else if (viewMode === 'split') {
        const splitX = (splitPosition / 100) * width;

        if (compareModelId) {
          // Dual Model Comparison Split: Left = modelId (ResNet18), Right = compareModelId (Ensemble)
          const compareActivationGrid = generateActivationMatrix(focal, isPneumonia, targetClass, 20, compareModelId);
          const compareHeatCanvas = document.createElement('canvas');
          compareHeatCanvas.width = width;
          compareHeatCanvas.height = height;
          const compareHeatCtx = compareHeatCanvas.getContext('2d')!;
          const compareHeatImgData = compareHeatCtx.createImageData(width, height);
          const compareHeatPixels = compareHeatImgData.data;

          for (let y = 0; y < height; y++) {
            const v = y / (height - 1);
            for (let x = 0; x < width; x++) {
              const u = x / (width - 1);
              const act = sampleMatrix(compareActivationGrid, u, v);
              const idx = (y * width + x) * 4;

              if (act >= threshold) {
                const normAct = (act - threshold) / (1 - threshold + 0.0001);
                const [r, g, b] = getColorFromColormap(normAct, colormap);
                compareHeatPixels[idx] = r;
                compareHeatPixels[idx + 1] = g;
                compareHeatPixels[idx + 2] = b;
                compareHeatPixels[idx + 3] = Math.round(normAct * opacity * 255);
              } else {
                compareHeatPixels[idx + 3] = 0;
              }
            }
          }
          compareHeatCtx.putImageData(compareHeatImgData, 0, 0);

          // Draw base X-ray
          ctx.drawImage(xrayCanvas, 0, 0);
          // Draw compareModelId (Ensemble) across entire base
          ctx.drawImage(compareHeatCanvas, 0, 0);

          // Clip left side and draw modelId (ResNet18) overlay
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, height);
          ctx.clip();
          ctx.drawImage(xrayCanvas, 0, 0);
          ctx.drawImage(heatCanvas, 0, 0);
          ctx.restore();

          // Split divider line in cyan
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, height);
          ctx.stroke();

          // Split handle circle
          ctx.fillStyle = '#06B6D4';
          ctx.beginPath();
          ctx.arc(splitX, height / 2, 8, 0, Math.PI * 2);
          ctx.fill();

          // Overlay Labels for comparison
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(8, 8, 140, 22);
          ctx.fillRect(width - 148, 8, 140, 22);
          ctx.fillStyle = '#38BDF8';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('◄ RESNET18 CHAMPION', 14, 23);
          ctx.fillStyle = '#F59E0B';
          ctx.fillText('ENSEMBLE FUSION ►', width - 142, 23);
        } else {
          // Standard Split: Left side = Plain X-ray, Right side = Overlay
          ctx.drawImage(xrayCanvas, 0, 0);
          ctx.drawImage(heatCanvas, 0, 0);

          // Clip left side and draw plain X-ray
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, height);
          ctx.clip();
          ctx.drawImage(xrayCanvas, 0, 0);
          ctx.restore();

          // Draw split divider line
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, height);
          ctx.stroke();

          // Split handle icon
          ctx.fillStyle = '#06B6D4';
          ctx.beginPath();
          ctx.arc(splitX, height / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    if (customImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => render(img);
      img.onerror = () => render(null);
      img.src = customImageUrl;
    } else {
      render(null);
    }
  }, [caseData, customImageUrl, targetClass, colormap, opacity, threshold, viewMode, splitPosition, modelId, compareModelId, renderBaseXray]);

  // Handle crosshair coordinate tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const u = x / rect.width;
    const v = y / rect.height;

    const focal = caseData?.focalZone || { cx: 0.65, cy: 0.60, rx: 0.20, ry: 0.18, intensity: 0.9 };
    const isPneumonia = caseData ? caseData.diagnosis === 'PNEUMONIA' : true;
    const matrix = generateActivationMatrix(focal, isPneumonia, targetClass, 20, modelId);
    const val = sampleMatrix(matrix, u, v);

    setCrosshairPos({ x, y, u, v, val });

    if (isDraggingSplit && onSplitChange) {
      const newPos = Math.round((x / rect.width) * 100);
      onSplitChange(Math.max(5, Math.min(95, newPos)));
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `gradcam_xray_${modelId || 'champion'}_${caseData?.id || 'inference'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setCrosshairPos(null); setIsDraggingSplit(false); }}
        onMouseDown={(e) => {
          if (viewMode === 'split') {
            setIsDraggingSplit(true);
          }
        }}
        onMouseUp={() => setIsDraggingSplit(false)}
        className="relative aspect-square w-full max-w-[580px] mx-auto rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl select-none group cursor-crosshair ring-1 ring-cyan-500/20"
      >
        {/* Selector 6: The Clinical Radiograph & Grad-CAM Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain block ring-1 ring-white/5 transition-opacity duration-150"
        />

        {/* Medical Film Corner Reticle Brackets (PACS Diagnostic Framing) */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

        {/* Anatomical Orientation Marker: "R" (Upper Left) */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 pointer-events-none">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-950/80 backdrop-blur-md border border-amber-500/50 text-amber-300 font-mono font-bold text-xs shadow-md">
            R
          </span>
          <span className="hidden sm:inline-block text-[9px] font-mono tracking-wider uppercase text-slate-400 bg-slate-950/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-slate-800">
            AP Erect
          </span>
        </div>

        {/* Telemetry coordinate HUD (Top Right) */}
        {showCrosshair && crosshairPos && (
          <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-lg px-2.5 py-1 text-[11px] font-mono tabular-nums text-slate-300 pointer-events-none flex items-center gap-2.5 shadow-lg shadow-black/50">
            <span>X: {Math.round(crosshairPos.u * 640)}px</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Y: {Math.round(crosshairPos.v * 640)}px</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-cyan-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
              Grad-CAM: {(crosshairPos.val * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* Split View Interactive Curtain Divider Bar */}
        {viewMode === 'split' && (
          <div
            className="absolute inset-y-0 pointer-events-none z-20 flex items-center justify-center"
            style={{ left: `${splitPosition}%` }}
          >
            <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40 text-cyan-300 pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
              <MoveHorizontal className="w-3.5 h-3.5" />
            </div>
            {/* Split labels */}
            <div className="absolute top-3 -translate-x-full pr-2 text-[10px] font-mono font-bold text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
              RAW
            </div>
            <div className="absolute top-3 translate-x-2 text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-800 pointer-events-none">
              HEATMAP
            </div>
          </div>
        )}

        {/* Film HUD Markers (Bottom Left) */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded px-2.5 py-1 text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-2 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{badgeLabel || (modelId === 'ensemble_soft_voting' ? 'Ensemble Averaged Features (Soft-Voting)' : '640×640 · PyTorch layer4.1.conv2')}</span>
        </div>

        {/* Action icons bar (Bottom Right) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            title="Download Grad-CAM Overlay PNG"
            className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 rounded-lg text-slate-300 hover:text-white transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
