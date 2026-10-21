import React, { useState } from 'react';
import {
  MapPin,
  Activity,
  Square,
  Box,
  Component,
  X,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Image as ImageIcon,
  Tag,
  ChevronRight,
  ChevronLeft,
  Sidebar,
  Layers,
  GripHorizontal,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  Landmark,
  Maximize2,
  BookOpen,
  Info,
  Calendar,
  Layers3,
  MessageSquare,
  ThumbsUp,
  Send,
  UserCheck,
  Bot,
  FlaskConical,
  Table,
  CheckCircle2
} from 'lucide-react';
import {
  SpatialAnnotation,
  AppViewMode,
  SpatialAttachmentPDF,
  SpatialAttachmentImage,
  UiTheme,
  SpatialGroup,
  AudienceUserCredentials
} from '../types';

interface SpatialRecordPopupProps {
  annotation: SpatialAnnotation;
  viewMode: AppViewMode;
  spatialGroups?: SpatialGroup[];
  activeThemeName?: string | null;
  onClose: () => void;
  onFocusAnnotation: (annotation: SpatialAnnotation) => void;
  onEditAnnotation: (annotation: SpatialAnnotation) => void;
  onStartEditShape?: (annotation: SpatialAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onOpenPdf: (pdf: SpatialAttachmentPDF) => void;
  onOpenImage: (img: SpatialAttachmentImage) => void;
  isGisPanelOpen: boolean;
  onOpenGisPanel: () => void;
  uiTheme?: UiTheme;
  onDragStart?: (e: React.PointerEvent) => void;
  isCommentsWingOpen?: boolean;
  onToggleCommentsWing?: () => void;
  audienceUser?: AudienceUserCredentials;
  onAddComment?: (annotationId: string, text: string, authorName: string, authorRole: string) => void;
}

export const SpatialRecordPopup: React.FC<SpatialRecordPopupProps> = ({
  annotation,
  viewMode,
  spatialGroups = [],
  activeThemeName,
  onClose,
  onFocusAnnotation,
  onEditAnnotation,
  onStartEditShape,
  onDeleteAnnotation,
  onOpenPdf,
  onOpenImage,
  isGisPanelOpen,
  onOpenGisPanel,
  uiTheme = 'dark',
  onDragStart,
  isCommentsWingOpen = false,
  onToggleCommentsWing,
  audienceUser,
  onAddComment
}) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [showResearcherComments, setShowResearcherComments] = useState(false);
  const [showOriginalData, setShowOriginalData] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quickCommentText, setQuickCommentText] = useState('');
  const [selectedNarrationId, setSelectedNarrationId] = useState<string | null>(null);

  const isResearcher = viewMode === 'researcher';
  const isLight = uiTheme === 'light';

  const groupInfo = spatialGroups.find((g) => g.id === annotation.groupId);
  const comments = annotation.comments || [];

  // Resolve active narration for audience exhibition display
  const narrations = annotation.narrations || [];
  const activeNarration = (() => {
    if (selectedNarrationId) {
      const found = narrations.find((n) => n.id === selectedNarrationId);
      if (found) return found;
    }

    if (activeThemeName) {
      const boundId = annotation.themeNarrationBindings?.[activeThemeName];
      if (boundId) {
        const found = narrations.find((n) => n.id === boundId);
        if (found) return found;
      }
      const matchTheme = narrations.find(
        (n) => n.targetTheme && n.targetTheme.toLowerCase() === activeThemeName.toLowerCase()
      );
      if (matchTheme) return matchTheme;
    }

    const defaultNarr = narrations.find((n) => n.isDefault);
    if (defaultNarr) return defaultNarr;

    if (narrations.length > 0) return narrations[0];

    return null;
  })();

  const activeNarrationText = activeNarration?.text || annotation.audienceNarration || annotation.description || '';

  const handleToggleNarration = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      let text = '';
      if (!isResearcher && !showOriginalData && activeNarrationText) {
        text = `${annotation.title}. ${activeNarrationText}`;
      } else {
        text = `${annotation.title}. ${annotation.description || ''}`;
        if (annotation.metadata && annotation.metadata.length > 0) {
          const factsText = annotation.metadata
            .filter((m) => m.key && m.value)
            .map((m) => `${m.key}: ${m.value}`)
            .join('. ');
          if (factsText) {
            text += ` Key facts: ${factsText}`;
          }
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleQuickCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCommentText.trim() || !onAddComment) return;
    const authorName = audienceUser?.name?.trim() || 'Visitor';
    const authorRole = audienceUser?.role?.trim() || 'Local Resident';
    onAddComment(annotation.id, quickCommentText.trim(), authorName, authorRole);
    setQuickCommentText('');
    if (onToggleCommentsWing && !isCommentsWingOpen) {
      onToggleCommentsWing();
    }
  };

  // AUDIENCE MODE: Presentational Exhibition Information Board Layout
  if (!isResearcher) {
    const images = annotation.images || [];
    const activeImage = images[activeImageIndex] || images[0];

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-88 sm:w-[420px] md:w-[460px] max-w-[calc(100vw-2rem)] max-h-[82vh] overflow-y-auto backdrop-blur-2xl border rounded-3xl shadow-2xl p-0 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-200 ${
          isLight
            ? 'bg-white/98 border-amber-300 text-slate-900 shadow-amber-900/15 ring-1 ring-amber-300/80'
            : 'bg-[#0B0B0E]/98 border-amber-500/40 text-zinc-100 shadow-black/90 ring-1 ring-amber-500/20'
        }`}
      >
        {/* Top Decorative Exhibition Header / Placard Ribbon */}
        <div
          onPointerDown={onDragStart}
          className={`px-4 py-2.5 flex items-center justify-between cursor-move select-none border-b ${
            isLight
              ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-200/80'
              : 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/15 border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
              <Landmark className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold tracking-wide uppercase font-mono text-amber-600 dark:text-amber-400">
              Exhibition Information Board
            </span>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Audio Curator Guide Button */}
            <button
              type="button"
              onClick={handleToggleNarration}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isSpeaking
                  ? 'bg-amber-500 text-zinc-950 font-black animate-pulse'
                  : isLight
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
              title="Listen to tour narration"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Pause Audio' : 'Audio Guide'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${
                isLight
                  ? 'hover:bg-slate-200/80 text-slate-500 hover:text-slate-900'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Close Information Board"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Information Board Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Featured Hero Photo & Interactive Gallery Strip */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div
                onClick={() => onOpenImage(activeImage)}
                className={`relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border cursor-zoom-in group shadow-md ${
                  isLight ? 'border-amber-200/80 bg-slate-100' : 'border-zinc-800 bg-zinc-950'
                }`}
              >
                <img
                  src={activeImage.url}
                  alt={activeImage.caption || annotation.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end justify-between p-3">
                  <span className="text-white text-xs font-medium drop-shadow-md truncate max-w-[80%]">
                    {activeImage.caption || `${annotation.title} (Photo ${activeImageIndex + 1} of ${images.length})`}
                  </span>
                  <span className="p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-md group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Multi-Photo Thumbnail Filmstrip */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-12 rounded-xl overflow-hidden border shrink-0 transition-all ${
                        activeImageIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-500/50 scale-105 shadow-sm'
                          : isLight
                          ? 'border-slate-200 opacity-70 hover:opacity-100'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.caption || `Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exhibition Title & Thematic Placard Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Color Beacon Indicator */}
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white/20"
                style={{ backgroundColor: annotation.color || '#F59E0B' }}
              />

              {/* Curated Theme Badge */}
              {annotation.interpretiveThemes && annotation.interpretiveThemes.length > 0 ? (
                annotation.interpretiveThemes.map((t, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border ${
                      isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Compass className="w-2.5 h-2.5" />
                    <span>{t}</span>
                  </span>
                ))
              ) : (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    isLight
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {annotation.category}
                </span>
              )}

              {/* Group / Discipline Tag */}
              {groupInfo && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white flex items-center gap-1 shadow-xs"
                  style={{ backgroundColor: groupInfo.color }}
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>{groupInfo.name}</span>
                </span>
              )}
            </div>

            <h2 className={`font-bold text-lg sm:text-xl tracking-tight leading-snug ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {annotation.title}
            </h2>
          </div>

          {/* Exhibition Narration vs Original Professional Data View Switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-zinc-900/90 border-zinc-800'
          }`}>
            <button
              id="audience-view-narration-tab"
              type="button"
              onClick={() => setShowOriginalData(false)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                !showOriginalData
                  ? isLight
                    ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-300'
                    : 'bg-amber-500 text-zinc-950 shadow-xs font-black'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visitor Exhibition Story</span>
              {annotation.audienceNarration && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>

            <button
              id="audience-view-original-data-tab"
              type="button"
              onClick={() => setShowOriginalData(true)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                showOriginalData
                  ? isLight
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-blue-300'
                    : 'bg-blue-600 text-white shadow-xs font-black'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Original Professional Data</span>
            </button>
          </div>

          {/* VIEW A: VISITOR EXHIBITION STORY (AI COMPILED & CURATOR MANAGED) */}
          {!showOriginalData ? (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Exhibition Curated Narrative Card */}
              {activeNarration ? (
                <div className={`p-4 rounded-2xl border leading-relaxed text-xs sm:text-sm space-y-2.5 transition-all ${
                  isLight
                    ? 'bg-amber-50/60 border-amber-200/90 text-slate-800 shadow-xs'
                    : 'bg-gradient-to-b from-amber-950/20 to-zinc-900/70 border-amber-500/30 text-zinc-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-200/50 dark:border-amber-500/20 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Tone & Knowledge Level Badges */}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                        isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {activeNarration.tone}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                        isLight ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {activeNarration.knowledgeLevel || 'General'}
                      </span>
                      {activeNarration.targetTheme && (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                          isLight ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          <Compass className="w-2.5 h-2.5" />
                          <span>{activeNarration.targetTheme}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Curated Exhibition Interpretation</span>
                    </div>
                  </div>

                  <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                    {activeNarration.text}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1 text-zinc-500 dark:text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3 text-amber-500" />
                      <span>AI Model Assisted • Specialist Approved</span>
                    </span>
                    <span>
                      {new Date(activeNarration.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : annotation.audienceNarration ? (
                <div className={`p-4 rounded-2xl border leading-relaxed text-xs sm:text-sm space-y-2.5 transition-all ${
                  isLight
                    ? 'bg-amber-50/60 border-amber-200/90 text-slate-800 shadow-xs'
                    : 'bg-gradient-to-b from-amber-950/20 to-zinc-900/70 border-amber-500/30 text-zinc-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-200/50 dark:border-amber-500/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Curated Exhibition Interpretation</span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                      annotation.audienceNarrationSource?.includes('gemini')
                        ? isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-900/40 text-purple-300 border border-purple-500/30'
                        : isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-900/40 text-amber-300 border border-amber-500/30'
                    }`}>
                      <Bot className="w-3 h-3" />
                      <span>Curated by Specialist</span>
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                    {annotation.audienceNarration}
                  </p>
                </div>
              ) : annotation.description ? (
                <div className={`p-3.5 rounded-2xl border leading-relaxed text-xs sm:text-sm ${
                  isLight
                    ? 'bg-amber-50/50 border-amber-200/80 text-slate-800'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="whitespace-pre-line">{annotation.description}</p>
                  </div>
                </div>
              ) : (
                <div className={`p-3.5 rounded-2xl border text-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                }`}>
                  <span>Exhibition details are recorded for this spatial feature.</span>
                </div>
              )}

              {/* Curated Exhibition Key Facts & Attributes (Museum Placard Grid) */}
              {annotation.metadata && annotation.metadata.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'text-amber-900' : 'text-amber-400'
                    }`}>
                      Curated Exhibit Facts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {annotation.metadata
                      .filter((m) => m.key && m.value)
                      .map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1 shadow-2xs ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-800'
                              : 'bg-[#121217] border-zinc-800/90 text-zinc-100'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-amber-600 dark:text-amber-400 truncate">
                            {m.key}
                          </span>
                          <span className="text-xs font-semibold break-words leading-tight">
                            {m.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW B: ORIGINAL PROFESSIONAL DATA (RAW SCIENTIFIC SURVEY MEASUREMENTS) */
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Professional Origin Header Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                isLight ? 'bg-blue-50/70 border-blue-200 text-blue-950' : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Raw Professional Survey Record</div>
                    <div className="text-[10px] opacity-80">Direct field notes, measurements, and engineering attributes</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold shrink-0">
                  {annotation.author || 'Surveyor'}
                </span>
              </div>

              {/* Raw Field Observation Notes */}
              {annotation.description ? (
                <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/70 border-zinc-800'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono block ${
                    isLight ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    Field Description & Observations:
                  </span>
                  <p className={`text-xs leading-relaxed font-mono whitespace-pre-line ${
                    isLight ? 'text-slate-800' : 'text-zinc-300'
                  }`}>
                    {annotation.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">No raw text description recorded.</p>
              )}

              {/* Complete Raw Attribute Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-blue-500" />
                    <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                      isLight ? 'text-blue-950' : 'text-blue-300'
                    }`}>
                      Technical Attributes & Schema
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {annotation.metadata?.length || 0} fields
                  </span>
                </div>

                {annotation.metadata && annotation.metadata.length > 0 ? (
                  <div className={`rounded-xl border overflow-hidden ${
                    isLight ? 'border-slate-200 bg-white' : 'border-zinc-800 bg-zinc-950'
                  }`}>
                    <table className="w-full text-xs text-left border-collapse font-mono">
                      <thead>
                        <tr className={isLight ? 'bg-slate-100/80 text-slate-600' : 'bg-zinc-900 text-zinc-400'}>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase">Attribute Key</th>
                          <th className="py-2 px-3 text-[10px] font-bold uppercase">Recorded Measurement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60">
                        {annotation.metadata.map((m, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? '' : isLight ? 'bg-slate-50/50' : 'bg-zinc-900/30'}>
                            <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">
                              {m.key || '—'}
                            </td>
                            <td className={`py-2 px-3 ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
                              {m.value || <span className="italic opacity-40">Empty</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl border text-center text-xs italic ${
                    isLight ? 'border-slate-200 text-slate-400' : 'border-zinc-800 text-zinc-500'
                  }`}>
                    No custom metadata attributes recorded.
                  </div>
                )}
              </div>

              {/* Spatial Geometry & Registration Details */}
              <div className={`p-3 rounded-xl border space-y-1.5 text-[11px] font-mono ${
                isLight ? 'bg-slate-50/80 border-slate-200 text-slate-600' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
              }`}>
                <div className="flex justify-between">
                  <span>Geometry Type:</span>
                  <strong className={isLight ? 'text-slate-900' : 'text-zinc-200'}>
                    {annotation.geometryType?.toUpperCase() || 'POINT'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>3D Anchor (X, Y, Z):</span>
                  <strong className={isLight ? 'text-slate-900' : 'text-zinc-200'}>
                    ({annotation.position.x.toFixed(3)}, {annotation.position.y.toFixed(3)}, {annotation.position.z.toFixed(3)})
                  </strong>
                </div>
                {annotation.nodeName && (
                  <div className="flex justify-between">
                    <span>Attached Mesh:</span>
                    <strong className={isLight ? 'text-slate-900' : 'text-zinc-200'}>
                      {annotation.nodeName}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Recorded Date:</span>
                  <strong className={isLight ? 'text-slate-900' : 'text-zinc-200'}>
                    {annotation.createdAt}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Exhibition Folio & Research Documents */}
          {annotation.pdfs && annotation.pdfs.length > 0 && (
            <div className="space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Exhibition Folio & Research Papers ({annotation.pdfs.length})</span>
              </span>

              <div className="space-y-1.5">
                {annotation.pdfs.map((pdf) => (
                  <button
                    key={pdf.id}
                    type="button"
                    onClick={() => onOpenPdf(pdf)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all group ${
                      isLight
                        ? 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 hover:border-amber-300 text-slate-800'
                        : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-amber-500/40 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">{pdf.name}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono shrink-0">
                      Read Document
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Community Feedback & Discussion Banner in Audience Mode */}
          <div className={`p-3 rounded-2xl border space-y-2.5 ${
            isLight
              ? 'bg-amber-50/70 border-amber-200/90 text-slate-800'
              : 'bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-purple-500/10 border-amber-500/30 text-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Audience Notes & Insights</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {comments.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {comments.length > 0
                      ? `${comments.length} community contribution${comments.length > 1 ? 's' : ''}`
                      : 'Leave a note or question on this feature'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Comment Input Field */}
            {onAddComment && (
              <form onSubmit={handleQuickCommentSubmit} className="relative pt-1">
                <input
                  type="text"
                  value={quickCommentText}
                  onChange={(e) => setQuickCommentText(e.target.value)}
                  placeholder={`Add a public comment as ${audienceUser?.name || 'Visitor'} (${audienceUser?.role || 'Local Resident'})...`}
                  className={`w-full text-xs px-3 py-2 pr-9 rounded-xl border outline-none font-medium transition-all ${
                    isLight
                      ? 'bg-white border-amber-300/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500'
                      : 'bg-zinc-950/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!quickCommentText.trim()}
                  className="absolute right-1.5 top-2.5 p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                  title="Send Comment"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

          {/* Presentation Footer Action Controls */}
          <div className={`pt-3 border-t flex items-center gap-2 ${
            isLight ? 'border-slate-200' : 'border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => onFocusAnnotation(annotation)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
              title="Center 3D Camera on this Exhibit Point"
            >
              <Eye className="w-4 h-4" />
              <span>Center 3D View</span>
            </button>

            {onToggleCommentsWing && (
              <button
                type="button"
                onClick={onToggleCommentsWing}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  isCommentsWingOpen
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                }`}
                title="Toggle Community Notes & Discussion Panel"
              >
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>Comments ({comments.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESEARCHER MODE: Engineering & GIS Inspector Window Layout
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-80 sm:w-88 max-h-[82vh] overflow-y-auto backdrop-blur-2xl border rounded-2xl shadow-2xl p-4 space-y-3 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
          : 'bg-[#0C0C0E]/95 border-zinc-700/80 text-zinc-100'
      }`}
    >
      {/* Drag Bar Top Handle */}
      <div
        onPointerDown={onDragStart}
        className={`flex items-center justify-between cursor-move select-none px-2 py-1 -mx-1 -mt-1 rounded-xl transition-colors ${
          isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-zinc-800/60 text-zinc-400'
        }`}
        title="Click and drag to move window"
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider font-mono">
            3D Spatial Record (Researcher)
          </span>
        </div>
        <span className="text-[9px] font-medium opacity-70">Drag Window</span>
      </div>

      {/* Header */}
      <div className={`flex items-start justify-between gap-2 pb-2.5 border-b ${
        isLight ? 'border-slate-200' : 'border-zinc-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-4 h-4 rounded-full shrink-0 shadow-md ring-2 ring-black/10"
            style={{ backgroundColor: annotation.color || '#3b82f6' }}
          />
          <div className="min-w-0">
            <h3 className={`font-bold text-sm truncate leading-snug ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {annotation.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {groupInfo && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold text-white flex items-center gap-1 shadow-xs"
                  style={{ backgroundColor: groupInfo.color }}
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>{groupInfo.name}</span>
                </span>
              )}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border ${
                isLight
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {annotation.category}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-xl transition-colors shrink-0 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white'
          }`}
          title="Close Popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Interpretive Themes (Researcher Mode) */}
      {annotation.interpretiveThemes && annotation.interpretiveThemes.length > 0 && (
        <div className="space-y-1">
          <span className={`text-[9px] font-mono uppercase tracking-wider block ${
            isLight ? 'text-amber-800 font-bold' : 'text-amber-400 font-bold'
          }`}>
            Themes:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {annotation.interpretiveThemes.map((theme, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
              >
                <Compass className="w-2.5 h-2.5 text-amber-400" />
                <span>{theme}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submesh / Mesh Component Tag */}
      {annotation.nodeName && (
        <div className={`text-[11px] px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
          isLight
            ? 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
        }`}>
          <Component className="w-3 h-3 text-purple-500 shrink-0" />
          <span className="truncate">Attached to: <strong className={isLight ? 'text-slate-900' : 'text-zinc-200'}>{annotation.nodeName}</strong></span>
        </div>
      )}

      {/* Description */}
      {annotation.description && (
        <p className={`text-xs leading-relaxed max-h-32 overflow-y-auto pr-1 ${
          isLight ? 'text-slate-700 font-normal' : 'text-zinc-300'
        }`}>
          {annotation.description}
        </p>
      )}

      {/* Audience Exhibition Narration Status Card (Researcher Mode) */}
      <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
        annotation.audienceNarration
          ? isLight
            ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
          : isLight
          ? 'bg-slate-50 border-slate-200 text-slate-600'
          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Audience Narration</span>
          </div>
          {annotation.audienceNarration ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Compiled</span>
            </span>
          ) : (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              Not compiled yet
            </span>
          )}
        </div>

        {annotation.audienceNarration ? (
          <p className="text-[11px] leading-relaxed line-clamp-2 italic opacity-90">
            "{annotation.audienceNarration}"
          </p>
        ) : (
          <p className="text-[10px] opacity-75">
            Use "Edit" to compile scientific data into an AI-narrated story for the audience signboard.
          </p>
        )}
      </div>

      {/* PDF Document Attachments */}
      {annotation.pdfs && annotation.pdfs.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
            isLight ? 'text-slate-500' : 'text-zinc-400'
          }`}>
            Attached Documents ({annotation.pdfs.length})
          </span>
          <div className="space-y-1">
            {annotation.pdfs.map((pdf) => (
              <button
                key={pdf.id}
                type="button"
                onClick={() => onOpenPdf(pdf)}
                className="w-full text-left p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-medium text-xs flex items-center justify-between gap-2 transition-all group"
              >
                <span className="flex items-center gap-1.5 truncate min-w-0">
                  <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{pdf.name}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-200 shrink-0 font-mono">
                  View PDF
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Gallery Attachments */}
      {annotation.images && annotation.images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
            isLight ? 'text-slate-500' : 'text-zinc-400'
          }`}>
            Photos & Images ({annotation.images.length})
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {annotation.images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onOpenImage(img)}
                className={`w-16 h-14 rounded-xl overflow-hidden border shrink-0 hover:border-emerald-500 transition-colors relative group ${
                  isLight ? 'border-slate-200' : 'border-zinc-800'
                }`}
              >
                <img src={img.url} alt={img.caption || 'Photo'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center transition-colors">
                  <ImageIcon className="w-3.5 h-3.5 text-white opacity-80" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Attributes Expandable */}
      {annotation.metadata && annotation.metadata.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className={`text-[11px] flex items-center justify-between w-full font-medium py-1 px-2 rounded-lg border transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 border-zinc-800/80'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-cyan-500" />
              <span>Attributes ({annotation.metadata.length})</span>
            </span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showMetadata ? 'rotate-90' : ''}`} />
          </button>

          {showMetadata && (
            <div className={`mt-1.5 space-y-1.5 p-2 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800/80'
            }`}>
              {annotation.metadata.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border ${
                    isLight
                      ? 'bg-white border-slate-200/80 text-slate-900'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                      isLight
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {m.key}
                  </span>
                  <span className="font-mono text-xs font-semibold text-right break-all">
                    {m.value || <span className="italic opacity-40">Not specified</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audience & Community Comments (Researcher Mode) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            if (onToggleCommentsWing) {
              onToggleCommentsWing();
            } else {
              setShowResearcherComments(!showResearcherComments);
            }
          }}
          className={`text-[11px] flex items-center justify-between w-full font-medium py-1 px-2 rounded-lg border transition-colors ${
            isLight
              ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-200'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-amber-500" />
            <span>Audience & Community Notes ({comments.length})</span>
          </span>
          <span className="text-[10px] font-bold underline">
            {isCommentsWingOpen ? 'Close Wing' : 'Open Wing'}
          </span>
        </button>
      </div>

      {/* 3D Coordinates & Date (Researcher only) */}
      <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
        isLight ? 'text-slate-500 border-slate-200' : 'text-zinc-500 border-zinc-800/80'
      }`}>
        <span>3D: ({annotation.position.x.toFixed(3)}, {annotation.position.y.toFixed(3)}, {annotation.position.z.toFixed(3)})</span>
        <span>{annotation.createdAt}</span>
      </div>

      {/* Footer Action Buttons */}
      <div className={`flex items-center gap-1.5 pt-2 border-t ${
        isLight ? 'border-slate-200' : 'border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => onFocusAnnotation(annotation)}
          className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-colors"
          title="Center Camera on 3D Record"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Focus Point</span>
        </button>

        {onStartEditShape && (
          <button
            type="button"
            onClick={() => onStartEditShape(annotation)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
            }`}
            title="Edit 3D Shape on Canvas"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Edit Shape</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onEditAnnotation(annotation)}
          className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
          }`}
          title="Edit Details & Metadata"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onDeleteAnnotation(annotation.id)}
          className={`p-1.5 rounded-xl transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 border border-slate-200'
              : 'bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white'
          }`}
          title="Delete Record"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
