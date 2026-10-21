import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { SpatialAttachmentImage, UiTheme } from '../types';

interface ImageLightboxModalProps {
  image: SpatialAttachmentImage | null;
  onClose: () => void;
  uiTheme?: UiTheme;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ image, onClose, uiTheme = 'dark' }) => {
  const isLight = uiTheme === 'light';

  useEffect(() => {
    if (!image) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isLight ? 'bg-slate-900/75' : 'bg-black/90'
      }`}
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className={`absolute -top-12 right-0 p-2 rounded-full transition-colors ${
            isLight
              ? 'text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white shadow-md'
              : 'text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700'
          }`}
        >
          <X className="w-6 h-6" />
        </button>

        <img
          src={image.url}
          alt={image.caption || 'Spatial Photo'}
          referrerPolicy="no-referrer"
          className={`max-w-full max-h-[80vh] rounded-2xl object-contain border shadow-2xl ${
            isLight ? 'border-slate-300 bg-white' : 'border-zinc-800 bg-zinc-950'
          }`}
        />

        {image.caption && (
          <div className={`mt-3 text-center px-4 py-2 border rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800'
              : 'bg-[#0C0C0E]/90 border-zinc-800 text-zinc-200'
          }`}>
            <span>{image.caption}</span>
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center gap-0.5"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
