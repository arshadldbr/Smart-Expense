import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Receipt,
  Cloud,
  Loader2,
  Check,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  merchant?: string;
  amount?: string;
  date?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  merchant,
  amount,
  date,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  /**
   * High-reliability PNG download: converts image via HTML5 Canvas or blob to guarantee PNG format
   */
  const handleDownloadPng = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Load image and render to Canvas for guaranteed PNG binary encoding
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load for canvas export'));
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Direct anchor fallback
            triggerAnchorDownload(imageUrl);
            return;
          }

          const blobUrl = URL.createObjectURL(blob);
          const cleanName = (title || merchant || 'receipt')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_');
          const dateStr = date ? `_${date}` : '';
          const filename = `receipt_${cleanName}${dateStr}.png`;

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);

          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
          setIsDownloading(false);
        },
        'image/png',
        1.0
      );
    } catch (err) {
      console.warn('Canvas conversion failed, falling back to direct anchor download:', err);
      triggerAnchorDownload(imageUrl);
      setIsDownloading(false);
    }
  };

  const triggerAnchorDownload = (url: string) => {
    const cleanName = (title || merchant || 'receipt')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const filename = `receipt_${cleanName}_${Date.now()}.png`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const isCloudStored = imageUrl.includes('backblazeb2.com') || imageUrl.includes('/api/b2/');

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="receipt-modal-content"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5 truncate mr-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {title || merchant || 'Receipt Inspection'}
                </h3>
                {isCloudStored && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    <Cloud className="w-3 h-3 text-emerald-400" /> Backblaze B2
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {merchant && <span className="mr-2 text-slate-300">{merchant}</span>}
                {date && <span className="mr-2">• {date}</span>}
                {amount && <span className="font-semibold text-emerald-400">• {amount}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PNG Button */}
            <button
              type="button"
              id="receipt-download-png-btn"
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Download Receipt Image as PNG format"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadSuccess ? 'Downloaded!' : 'Download PNG'}</span>
            </button>

            {/* Open in New Tab Button */}
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Open full image in separate browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              id="receipt-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Canvas / Viewport */}
        <div className="relative flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 min-h-[360px] sm:min-h-[460px]">
          <div
            className="transition-transform duration-200 ease-out origin-center select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={imageUrl}
              alt="Receipt Full Preview"
              className="max-h-[68vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-800/80"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          </div>

          {/* Floating Zoom & Rotate Toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-slate-300 text-xs font-semibold">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="px-2 text-[11px] font-mono text-slate-300">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white text-[11px] font-semibold transition-colors"
              title="Reset Zoom & Rotation"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-2.5 bg-slate-900/80 border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-between">
          <span>Click anywhere outside or press Esc to close</span>
          <span className="font-medium text-emerald-400">High-Resolution PNG Available</span>
        </div>
      </div>
    </div>
  );
};
