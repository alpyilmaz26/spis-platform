import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
  Compass,
  RefreshCw,
  Sparkles,
  MapPin,
  Layers,
  FileText,
  Image as ImageIcon,
  FileCode,
  Tag,
  Maximize2
} from 'lucide-react';
import { SpatialAnnotation, ThemeTourRoute, UiTheme } from '../types';

interface ThemeTourOverlayProps {
  activeRoute: ThemeTourRoute | null;
  activeStopIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStop: () => void;
  onPrevStop: () => void;
  onSelectStopIndex: (index: number) => void;
  onRefreshRoutes: () => void;
  onCloseTour: () => void;
  activeAnnotation: SpatialAnnotation | null;
  uiTheme?: UiTheme;
  onOpenImageLightbox?: (img: any) => void;
  onOpenPdfViewer?: (pdf: any) => void;
}

export const ThemeTourOverlay: React.FC<ThemeTourOverlayProps> = ({
  activeRoute,
  activeStopIndex,
  isPlaying,
  onTogglePlay,
  onNextStop,
  onPrevStop,
  onSelectStopIndex,
  onRefreshRoutes,
  onCloseTour,
  activeAnnotation,
  uiTheme = 'dark',
  onOpenImageLightbox,
  onOpenPdfViewer
}) => {
  const isLight = uiTheme === 'light';

  // Speech Narration State
  const [isNarrating, setIsNarrating] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop narration when stop index changes or tour closes
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsNarrating(false);
  }, [activeStopIndex, activeRoute?.themeId]);

  if (!activeRoute || activeRoute.stops.length === 0) return null;

  const currentStop = activeRoute.stops[activeStopIndex] || activeRoute.stops[0];

  const toggleSpeechNarration = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    } else {
      try {
        window.speechSynthesis.cancel();
        const textToSpeak = `${currentStop.annotationTitle}. ${currentStop.description}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsNarrating(false);
        utterance.onerror = () => setIsNarrating(false);
        speechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsNarrating(true);
      } catch (err) {
        setIsNarrating(false);
      }
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-22 z-40 flex items-center justify-center px-4 pointer-events-none">
      {/* Floating Tour Navigation Control Dock */}
      <div className={`pointer-events-auto flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all ${
        isLight
          ? 'bg-white/95 border-amber-200 text-slate-800 shadow-slate-300/50'
          : 'bg-zinc-950/90 border-amber-500/30 text-zinc-100 shadow-black/80'
      }`}>
        <div className={`flex items-center gap-2 pr-3 border-r ${isLight ? 'border-slate-200' : 'border-zinc-700/50'}`}>
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: activeRoute.color }}
          />
          <div className="flex flex-col min-w-0">
            <span className={`text-xs font-bold truncate max-w-[130px] md:max-w-[180px] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {activeRoute.themeName}
            </span>
            <span className={`text-[10px] font-mono ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Stop {activeStopIndex + 1} of {activeRoute.stops.length}
            </span>
          </div>
        </div>

        {/* Previous Stop Button */}
        <button
          onClick={onPrevStop}
          className={`p-2 rounded-full border transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
          }`}
          title="Previous Tour Stop"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Play/Pause Auto Tour Walkthrough */}
        <button
          onClick={onTogglePlay}
          className={`p-2.5 rounded-full text-white font-bold transition-all shadow-lg flex items-center justify-center ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
          }`}
          title={isPlaying ? 'Pause Auto Walkthrough' : 'Play Auto Walkthrough'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Next Stop Button */}
        <button
          onClick={onNextStop}
          className={`p-2 rounded-full border transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
          }`}
          title="Next Tour Stop"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Text-To-Speech Voice Read Button */}
        <button
          type="button"
          onClick={toggleSpeechNarration}
          className={`p-2 rounded-full border transition-colors ${
            isNarrating
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
          }`}
          title="Listen to voice narration for current stop"
        >
          {isNarrating ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Refresh / Update Theme Routes Button */}
        <button
          onClick={onRefreshRoutes}
          className={`p-2 rounded-full transition-colors ${
            isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-zinc-900 text-zinc-400'
          }`}
          title="Recalculate 3D Tour Path"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Exit Tour Button */}
        <button
          onClick={onCloseTour}
          className={`p-2 rounded-full transition-colors ${
            isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-950/40 text-red-400'
          }`}
          title="Exit Virtual Tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
