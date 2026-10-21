import React, { useEffect } from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';
import { SpatialAttachmentPDF, UiTheme } from '../types';

interface PdfViewerModalProps {
  pdf: SpatialAttachmentPDF | null;
  onClose: () => void;
  uiTheme?: UiTheme;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ pdf, onClose, uiTheme = 'dark' }) => {
  const isLight = uiTheme === 'light';

  useEffect(() => {
    if (!pdf) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdf, onClose]);

  if (!pdf) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isLight ? 'bg-slate-900/60' : 'bg-black/80'
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-3xl p-6 max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col relative overflow-hidden border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
          isLight ? 'border-slate-200' : 'border-zinc-800'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {pdf.name}
              </h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                {pdf.description || '3D GIS Spatial Document Attachment'} {pdf.fileSize && `• ${pdf.fileSize}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Tab</span>
            </a>
            <a
              href={pdf.url}
              download={pdf.name}
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                  : 'text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Viewer */}
        <div className={`flex-1 mt-4 rounded-2xl border overflow-hidden relative ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border-zinc-800'
        }`}>
          <iframe
            src={pdf.url}
            title={pdf.name}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
