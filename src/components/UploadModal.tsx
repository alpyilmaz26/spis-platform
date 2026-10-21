import React, { useState, useRef } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, Sparkles, X, Box } from 'lucide-react';
import { SampleModel, UiTheme } from '../types';
import { SAMPLE_MODELS } from '../utils/proceduralModels';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onSelectSampleModel: (sample: SampleModel) => void;
  isLoading: boolean;
  uploadProgress: number;
  errorMessage: string | null;
  uiTheme?: UiTheme;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onSelectSampleModel,
  isLoading,
  uploadProgress,
  errorMessage,
  uiTheme = 'dark'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isLight = uiTheme === 'light';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`border rounded-3xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1 rounded-full transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className={`text-xl font-bold mb-1 flex items-center gap-2 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          <Upload className="w-5 h-5 text-blue-500" />
          Upload 3D Model
        </h2>
        <p className={`text-xs mb-6 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
          Drag & drop your 3D geometry file or select one of the built-in 3D model presets below.
        </p>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10'
              : isLight
              ? 'border-slate-300 hover:border-slate-400 bg-slate-50/80'
              : 'border-zinc-800 hover:border-zinc-700 bg-[#09090B]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.obj,.stl,.ply,.fbx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>

          <p className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Click to upload or drag & drop 3D file
          </p>
          <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
            Supports <span className="text-blue-500 font-mono font-medium">.GLB, .GLTF, .OBJ, .STL, .PLY, .FBX</span>
          </p>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium ${
            isLight ? 'bg-slate-200 text-slate-800' : 'bg-zinc-800 text-zinc-300'
          }`}>
            <FileCode className="w-3.5 h-3.5 text-amber-500" />
            Automatic DRACO Mesh & Texture Unpacking
          </div>
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className={`mt-4 p-4 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#09090B] border-zinc-800'
          }`}>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-blue-500 animate-pulse">Parsing 3D Mesh & Materials...</span>
              <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{uploadProgress}%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isLight ? 'bg-slate-200' : 'bg-zinc-800'
            }`}>
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preset Models Quick Picker */}
        <div className={`mt-6 pt-5 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-zinc-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Or Load Sample 3D Model Presets
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SAMPLE_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onSelectSampleModel(m);
                  onClose();
                }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all group ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-blue-400'
                    : 'bg-[#09090B] hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-blue-500/40'
                }`}
              >
                <span className="text-2xl">{m.thumbnail}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold group-hover:text-blue-500 truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {m.name}
                  </div>
                  <div className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    {m.category}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
