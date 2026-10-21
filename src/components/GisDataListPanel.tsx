import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  FileText,
  Image as ImageIcon,
  Tag,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Download,
  Upload,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  Layers,
  Filter,
  X,
  Activity,
  Square,
  Box,
  Component,
  FolderPlus,
  Folder,
  FolderOpen,
  ArrowRightLeft,
  Compass,
  Play,
  PlayCircle,
  RefreshCw,
  Route,
  RotateCcw,
  GripVertical,
  Sliders
} from 'lucide-react';
import {
  SpatialAnnotation,
  AnnotationCategory,
  AppViewMode,
  SpatialAttachmentPDF,
  SpatialAttachmentImage,
  UiTheme,
  SpatialGroup,
  InterpretiveTheme,
  ProjectOptions,
  DEFAULT_PROJECT_DISCIPLINES,
  DEFAULT_PROJECT_CATEGORIES
} from '../types';
import { calculateThemeRoute } from '../data/interpretiveThemes';

interface GisDataListPanelProps {
  viewMode: AppViewMode;
  annotations: SpatialAnnotation[];
  spatialGroups?: SpatialGroup[];
  projectThemes?: InterpretiveTheme[];
  projectOptions?: ProjectOptions;
  onOpenProjectOptions?: (tab?: 'disciplines' | 'categories' | 'attributes') => void;
  onCreateTheme?: (theme: { name: string; color: string; description: string }) => void;
  onUpdateTheme?: (id: string, theme: { name: string; color: string; description: string }) => void;
  onDeleteTheme?: (id: string) => void;
  selectedAnnotationId: string | null;
  isAddingPinMode: boolean;
  onToggleAddPinMode: () => void;
  onSelectAnnotation: (id: string | null) => void;
  onFocusAnnotation: (annotation: SpatialAnnotation) => void;
  onEditAnnotation: (annotation: SpatialAnnotation) => void;
  onStartEditShape?: (annotation: SpatialAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onOpenPdf: (pdf: SpatialAttachmentPDF) => void;
  onOpenImage: (img: SpatialAttachmentImage) => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleGroupVisibility?: (groupId: string) => void;
  onCreateGroup?: (group: { name: string; discipline: string; description?: string; color: string }) => void;
  onDeleteGroup?: (groupId: string) => void;
  onExportGroupJson?: (groupId: string) => void;
  onAddRecordToGroup?: (groupId: string) => void;
  onReassignRecordGroup?: (annotationId: string, newGroupId: string) => void;
  onClosePanel?: () => void;
  uiTheme?: UiTheme;
  isSidebarOpen?: boolean;
  onStartThemeTour?: (themeName: string, themeColor?: string) => void;
  activeThemeName?: string | null;
  onRefreshRoutes?: () => void;
  activeTab?: 'layers' | 'themes';
  onChangeTab?: (tab: 'layers' | 'themes') => void;
  customThemeOrders?: Record<string, string[]>;
  onReorderThemeRecords?: (themeName: string, newOrderIds: string[]) => void;
  onResetThemeOrder?: (themeName: string) => void;
  onToggleRecordTheme?: (annotationId: string, themeName: string) => void;
  onSetThemeNarrationBinding?: (annotationId: string, themeName: string, narrationId: string) => void;
}

export const GisDataListPanel: React.FC<GisDataListPanelProps> = ({
  viewMode,
  annotations,
  spatialGroups = [],
  projectThemes = [],
  projectOptions,
  onOpenProjectOptions,
  onCreateTheme,
  onUpdateTheme,
  onDeleteTheme,
  selectedAnnotationId,
  isAddingPinMode,
  onToggleAddPinMode,
  onSelectAnnotation,
  onFocusAnnotation,
  onEditAnnotation,
  onStartEditShape,
  onDeleteAnnotation,
  onOpenPdf,
  onOpenImage,
  onExportJson,
  onImportJson,
  onToggleGroupVisibility,
  onCreateGroup,
  onDeleteGroup,
  onExportGroupJson,
  onAddRecordToGroup,
  onReassignRecordGroup,
  onClosePanel,
  uiTheme = 'dark',
  isSidebarOpen = false,
  onStartThemeTour,
  activeThemeName,
  onRefreshRoutes,
  activeTab: activeTabProp,
  onChangeTab,
  customThemeOrders = {},
  onReorderThemeRecords,
  onResetThemeOrder,
  onToggleRecordTheme,
  onSetThemeNarrationBinding
}) => {
  const availableDisciplines = useMemo(() => {
    return projectOptions?.disciplines && projectOptions.disciplines.length > 0
      ? projectOptions.disciplines
      : DEFAULT_PROJECT_DISCIPLINES;
  }, [projectOptions?.disciplines]);

  const dynamicCategoryFilters = useMemo(() => {
    const customCats = projectOptions?.categories && projectOptions.categories.length > 0
      ? projectOptions.categories
      : DEFAULT_PROJECT_CATEGORIES;
    return ['All', ...customCats];
  }, [projectOptions?.categories]);

  const [internalActiveTab, setInternalActiveTab] = useState<'layers' | 'themes'>(
    activeTabProp || (viewMode === 'audience' ? 'themes' : 'layers')
  );

  // Theme Creation / Editing Local Form State
  const [isCreatingThemeModalOpen, setIsCreatingThemeModalOpen] = useState<boolean>(false);
  const [editingThemeItem, setEditingThemeItem] = useState<InterpretiveTheme | null>(null);
  const [newThemeName, setNewThemeName] = useState<string>('');
  const [newThemeColor, setNewThemeColor] = useState<string>('#3B82F6');
  const [newThemeDescription, setNewThemeDescription] = useState<string>('');
  const [managingThemeRecordsName, setManagingThemeRecordsName] = useState<string | null>(null);

  const activeTab = activeTabProp !== undefined ? activeTabProp : internalActiveTab;

  const setActiveTab = (tab: 'layers' | 'themes') => {
    setInternalActiveTab(tab);
    if (onChangeTab) onChangeTab(tab);
  };

  useEffect(() => {
    if (activeTabProp !== undefined) {
      setInternalActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  // Expanded Theme Accordion Cards state
  const [expandedThemeIds, setExpandedThemeIds] = useState<Set<string>>(
    new Set(['arch-struct', 'hist-cult', 'mat-conserv', 'archaeo-feat', 'env-site'])
  );

  const toggleThemeExpanded = (themeId: string) => {
    setExpandedThemeIds((prev) => {
      const next = new Set(prev);
      if (next.has(themeId)) {
        next.delete(themeId);
      } else {
        next.add(themeId);
      }
      return next;
    });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AnnotationCategory | 'All'>('All');
  
  // Track which group folders are collapsed (by default, all open)
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});

  // Group Creation Modal / Form State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDiscipline, setNewGroupDiscipline] = useState('General');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#8b5cf6');

  // Track expanded card inside records
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Resizable Panel State
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const rightOffset = isSidebarOpen ? 412 : 16;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const panelRightEdge = window.innerWidth - rightOffset;
      const newWidth = Math.max(340, Math.min(850, panelRightEdge - moveEvent.clientX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isLight = uiTheme === 'light';
  const isResearcher = viewMode === 'researcher';

  const displayThemes = useMemo(() => {
    let list = projectThemes || [];
    if (viewMode === 'audience') {
      if (activeThemeName) {
        list = list.filter((t) => t.name.toLowerCase() === activeThemeName.toLowerCase());
        if (list.length === 0) {
          list = [{
            id: activeThemeName.toLowerCase().replace(/\s+/g, '-'),
            name: activeThemeName,
            color: '#F59E0B',
            description: 'Selected virtual tour interpretive theme.'
          }];
        }
      }
    }
    return list;
  }, [projectThemes, viewMode, activeThemeName]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const expandAllGroups = () => {
    setCollapsedGroupIds({});
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    spatialGroups.forEach((g) => {
      next[g.id] = true;
    });
    next['ungrouped'] = true;
    setCollapsedGroupIds(next);
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    if (onCreateGroup) {
      onCreateGroup({
        name: newGroupName.trim(),
        discipline: newGroupDiscipline.trim() || 'General',
        description: newGroupDesc.trim(),
        color: newGroupColor
      });
    }

    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreatingGroup(false);
  };

  // Helper to check if a record matches filters (memoized)
  const filteredAnnotations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return annotations.filter((anno) => {
      const matchesCategory = selectedCategory === 'All' || anno.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      const matchesTitle = anno.title.toLowerCase().includes(query);
      const matchesDesc = anno.description.toLowerCase().includes(query);
      const matchesMetadata = anno.metadata.some(
        (m) => m.key.toLowerCase().includes(query) || m.value.toLowerCase().includes(query)
      );
      const matchesPdfs = anno.pdfs.some((p) => p.name.toLowerCase().includes(query));

      return matchesTitle || matchesDesc || matchesMetadata || matchesPdfs;
    });
  }, [annotations, selectedCategory, searchQuery]);

  // Filtered total records count
  const totalFilteredRecords = filteredAnnotations.length;

  // Group records mapping computed in a single pass
  const { groupRecordsMap, ungroupedRecords } = useMemo(() => {
    const map: Record<string, SpatialAnnotation[]> = {};
    spatialGroups.forEach((g) => {
      map[g.id] = [];
    });
    const ungrouped: SpatialAnnotation[] = [];

    filteredAnnotations.forEach((a) => {
      if (a.groupId && map[a.groupId]) {
        map[a.groupId].push(a);
      } else {
        ungrouped.push(a);
      }
    });

    return { groupRecordsMap: map, ungroupedRecords: ungrouped };
  }, [filteredAnnotations, spatialGroups]);

  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className={`absolute top-16 bottom-20 z-30 backdrop-blur-2xl border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-[right,border-color,background-color] duration-200 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
          : 'bg-[#0C0C0E]/95 border-zinc-800 text-zinc-200 shadow-black/80'
      } ${
        isSidebarOpen ? 'right-4 sm:right-[25.5rem]' : 'right-4'
      }`}
    >
      {/* Left Drag Handle for Horizontal Panel Resizing */}
      <div
        onMouseDown={handleMouseDownResize}
        className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize z-50 transition-colors flex items-center justify-center group ${
          isResizing ? 'bg-purple-500/30' : 'hover:bg-purple-500/20'
        }`}
        title="Drag left/right to resize Records / GIS panel"
      >
        <div className={`w-1 h-10 rounded-full transition-colors ${
          isResizing ? 'bg-purple-400' : 'bg-zinc-500/40 group-hover:bg-purple-400'
        }`} />
      </div>

      {/* Top Header */}
      <div className={`p-3.5 border-b space-y-3 shrink-0 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#09090B]/60 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl border ${
              isLight ? 'bg-purple-100 border-purple-200 text-purple-600' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            }`}>
              {activeTab === 'themes' ? <Compass className="w-4 h-4 text-amber-500" /> : <MapPin className="w-4 h-4 text-blue-500" />}
            </div>
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {activeTab === 'themes' ? 'Themes & Virtual Tours' : 'Spatial Records'}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono">
                  {activeTab === 'themes' ? 'Curated Routes' : `${totalFilteredRecords} records`}
                </span>
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                {activeTab === 'themes' ? 'Curated Exhibition Walkthroughs & Stop Sequences' : 'Multi-Disciplinary Spatial Groupings & Layer Datasets'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Export/Import + Project Options + Close Panel */}
          <div className="flex items-center gap-1">
            {onOpenProjectOptions && (
              <button
                onClick={() => onOpenProjectOptions('disciplines')}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'text-purple-600 hover:bg-purple-100' : 'text-purple-400 hover:text-white hover:bg-purple-950/40'
                }`}
                title="Project Options (Disciplines, Categories & Attribute Templates)"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}

            {isResearcher && (
              <>
                <button
                  onClick={onExportJson}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title="Export All Spatial Records & Layers (JSON)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <label
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title="Import Spatial Records & Layer Datasets (JSON)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
                </label>
              </>
            )}

            {onClosePanel && (
              <button
                onClick={onClosePanel}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>



        {/* Action Toolbar: Add Spatial Data, Add Layer, Import Layer (Shown in Layers tab) */}
        {activeTab === 'layers' && isResearcher && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onToggleAddPinMode}
              className={`py-1.5 px-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1 border shadow-md ${
                isAddingPinMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : isLight
                  ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                  : 'bg-blue-600/90 text-white border-blue-500/50 hover:bg-blue-600'
              }`}
              title="Click point or draw polyline/polygon on 3D surface"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isAddingPinMode ? 'Click 3D...' : '+ Add Spatial Data'}</span>
            </button>

            <button
              onClick={() => setIsCreatingGroup(!isCreatingGroup)}
              className={`py-1.5 px-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1 border shadow-md ${
                isCreatingGroup
                  ? 'bg-purple-600 text-white border-purple-500'
                  : isLight
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:bg-purple-900/40'
              }`}
              title="Create new layer group folder"
            >
              <FolderPlus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">+ Add Layer</span>
            </button>

            <label
              className={`py-1.5 px-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1 border shadow-md cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-zinc-800/80 text-zinc-200 border-zinc-700/80 hover:bg-zinc-700'
              }`}
              title="Import Layer or Spatial Dataset (.json)"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Import Layer</span>
              <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
            </label>
          </div>
        )}

        {/* Search Bar & Collapse Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
              <input
                type="text"
                placeholder="Filter notes, features, layers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-7 pr-6 py-1.5 text-[11px] focus:outline-none focus:border-purple-500 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                    : 'bg-[#09090B] border-zinc-800 text-white placeholder:text-zinc-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2 top-2 ${isLight ? 'text-slate-400 hover:text-slate-800' : 'text-zinc-500 hover:text-white'}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[10px]">
              <button
                type="button"
                onClick={expandAllGroups}
                className={`px-2 py-1.5 rounded-lg border font-medium ${
                  isLight ? 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
                title="Expand All Layer Folders"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={collapseAllGroups}
                className={`px-2 py-1.5 rounded-lg border font-medium ${
                  isLight ? 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
                title="Collapse All Layer Folders"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Category Filter Pills Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
            {dynamicCategoryFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-2 py-0.5 rounded-lg shrink-0 font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white font-semibold'
                    : isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* INTERPRETIVE THEMES & TOURS TAB */}
        {activeTab === 'themes' ? (
          <div className="space-y-4 animate-fade-in">
            <div className={`p-3 rounded-2xl border text-xs ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-1 font-bold">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Project Interpretive Themes</span>
                </div>
                {viewMode === 'researcher' && onCreateTheme && displayThemes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewThemeName('');
                      setNewThemeColor('#3B82F6');
                      setNewThemeDescription('');
                      setIsCreatingThemeModalOpen(true);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                      isLight
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Theme</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {viewMode === 'audience'
                  ? 'Active virtual tour theme for spatial walkthrough.'
                  : 'Themes are linked to this project. Create and tag themes to generate 3D virtual tour camera paths.'}
              </p>
            </div>

            {/* Modal for Creating Theme */}
            {isCreatingThemeModalOpen && (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-amber-300 shadow-md' : 'bg-zinc-900 border-amber-500/40'
              }`}>
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Create New Project Theme
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Theme Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Architectural Joinery"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-800 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newThemeColor}
                        onChange={(e) => setNewThemeColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={newThemeColor}
                        onChange={(e) => setNewThemeColor(e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs border w-28 ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-800 border-zinc-700 text-white'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Description</label>
                    <textarea
                      placeholder="Describe the research scope of this theme..."
                      value={newThemeDescription}
                      onChange={(e) => setNewThemeDescription(e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-zinc-800 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingThemeModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newThemeName.trim()) return;
                      onCreateTheme?.({
                        name: newThemeName.trim(),
                        color: newThemeColor,
                        description: newThemeDescription.trim()
                      });
                      setIsCreatingThemeModalOpen(false);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400"
                  >
                    Save Theme
                  </button>
                </div>
              </div>
            )}

            {/* List Themes */}
            {(() => {
              if (displayThemes.length === 0) {
                return (
                  <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
                  }`}>
                    <Route className="w-8 h-8 mx-auto text-amber-500/70" />
                    <div>
                      <h4 className={`font-bold text-xs mb-1 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                        No Interpretive Themes Yet
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                        Create custom thematic routes to organize spatial records into guided 3D virtual tours.
                      </p>
                    </div>
                    {viewMode === 'researcher' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewThemeName('');
                          setNewThemeColor('#3B82F6');
                          setNewThemeDescription('');
                          setIsCreatingThemeModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md"
                      >
                        + Create First Theme
                      </button>
                    )}
                  </div>
                );
              }

              return displayThemes.map((theme) => {
                const customOrder = customThemeOrders?.[theme.name];
                const route = calculateThemeRoute(theme.name, annotations, theme.color, customOrder);
                const isCurrentActive = activeThemeName === theme.name;
                const isExpanded = expandedThemeIds.has(theme.id);
                const hasCustomSequence = customOrder && customOrder.length > 0;

                return (
                  <div
                    key={theme.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isCurrentActive
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-amber-300'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Theme Header & Actions */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => toggleThemeExpanded(theme.id)}
                          className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shadow-sm shrink-0"
                            style={{ backgroundColor: theme.color }}
                          />
                          <h3 className={`font-bold text-sm transition-colors truncate ${
                            isLight ? 'text-slate-900 group-hover:text-amber-600' : 'text-white group-hover:text-amber-400'
                          }`}>
                            {theme.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                            isLight ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {route.stops.length} {route.stops.length === 1 ? 'Record' : 'Records'}
                          </span>
                          {hasCustomSequence && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono shrink-0 ${
                              isLight ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              Reordered
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {viewMode === 'researcher' && onDeleteTheme && (
                            <button
                              type="button"
                              onClick={() => onDeleteTheme(theme.id)}
                              title="Delete Project Theme"
                              className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={route.stops.length === 0}
                            onClick={() => onStartThemeTour && onStartThemeTour(theme.name, theme.color)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                              route.stops.length === 0
                                ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
                                : isCurrentActive
                                ? 'bg-amber-500 text-zinc-950 font-extrabold animate-pulse'
                                : isLight
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isCurrentActive ? 'Active Tour' : 'Start Tour'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleThemeExpanded(theme.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                            title={isExpanded ? 'Collapse Theme Records List' : 'Expand Theme Records List'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                        {theme.description}
                      </p>

                      <div className={`flex items-center justify-between text-[11px] font-mono pt-1 ${
                        isLight ? 'text-slate-500' : 'text-zinc-500'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Route className="w-3.5 h-3.5 text-blue-500" />
                          {route.totalDistance > 0 ? `${route.totalDistance}m Virtual Tour Route` : 'No spatial points'}
                        </span>
                        <span>Click headers or arrows to adjust stop sequence</span>
                      </div>
                    </div>

                    {/* Expanded Records List and Reordering Controls */}
                    {isExpanded && (
                      <div className={`p-3 border-t space-y-2.5 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950/60 border-zinc-800/80'
                      }`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            Theme Spatial Records ({route.stops.length})
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isResearcher && onToggleRecordTheme && (
                              <button
                                type="button"
                                onClick={() => setManagingThemeRecordsName(managingThemeRecordsName === theme.name ? null : theme.name)}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-colors flex items-center gap-1 ${
                                  managingThemeRecordsName === theme.name
                                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-xs'
                                    : isLight
                                    ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                                }`}
                                title="Manage which spatial records belong to this theme"
                              >
                                <Plus className="w-3 h-3" />
                                {managingThemeRecordsName === theme.name ? 'Done Managing' : 'Assign Records'}
                              </button>
                            )}

                            {hasCustomSequence && onResetThemeOrder && (
                              <button
                                type="button"
                                onClick={() => onResetThemeOrder(theme.name)}
                                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30 transition-colors"
                                title="Reset tour stop sequence to default nearest-neighbor route"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Assign / Manage Records Drawer */}
                        {managingThemeRecordsName === theme.name && isResearcher && (
                          <div className={`p-2.5 rounded-xl border space-y-2 ${
                            isLight ? 'bg-amber-50/70 border-amber-200 text-slate-800' : 'bg-zinc-900 border-amber-500/30 text-zinc-200'
                          }`}>
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="flex items-center gap-1 text-amber-500">
                                <Tag className="w-3.5 h-3.5" />
                                Select Records for "{theme.name}":
                              </span>
                              <span className="text-[10px] opacity-70 font-normal">
                                {annotations.filter((a) => (a.interpretiveThemes || []).includes(theme.name)).length} selected
                              </span>
                            </div>

                            {annotations.length === 0 ? (
                              <p className="text-[10px] italic text-zinc-500 text-center py-2">
                                No spatial records recorded in this model yet. Add records first.
                              </p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                                {annotations.map((anno) => {
                                  const isAssigned = (anno.interpretiveThemes || []).some(
                                    (t) => t.toLowerCase() === theme.name.toLowerCase()
                                  );

                                  return (
                                    <label
                                      key={anno.id}
                                      className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                        isAssigned
                                          ? isLight
                                            ? 'bg-amber-100/80 border-amber-300 font-semibold'
                                            : 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-medium'
                                          : isLight
                                          ? 'bg-white border-slate-200 hover:bg-slate-100/80'
                                          : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800/60 text-zinc-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isAssigned}
                                          onChange={() => onToggleRecordTheme?.(anno.id, theme.name)}
                                          className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                                        />
                                        <span className="truncate">{anno.title}</span>
                                      </div>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                        {anno.category}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {route.stops.length === 0 ? (
                          <div className={`p-3 rounded-xl border border-dashed text-center text-xs ${
                            isLight ? 'border-slate-300 text-slate-500 bg-white/50' : 'border-zinc-800 text-zinc-500 bg-zinc-950/40'
                          }`}>
                            No spatial records assigned to "{theme.name}" yet.
                            {isResearcher && onToggleRecordTheme && (
                              <div className="mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => setManagingThemeRecordsName(theme.name)}
                                  className="text-amber-500 hover:underline font-semibold text-[11px] inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Click here to assign records to this theme
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {route.stops.map((stop, idx) => {
                              const matchedAnno = annotations.find((a) => a.id === stop.annotationId);
                              const isFirst = idx === 0;
                              const isLast = idx === route.stops.length - 1;

                              const handleMoveUp = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isFirst || !onReorderThemeRecords) return;
                                const nextStops = [...route.stops];
                                const temp = nextStops[idx];
                                nextStops[idx] = nextStops[idx - 1];
                                nextStops[idx - 1] = temp;
                                onReorderThemeRecords(theme.name, nextStops.map((s) => s.annotationId));
                              };

                              const handleMoveDown = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isLast || !onReorderThemeRecords) return;
                                const nextStops = [...route.stops];
                                const temp = nextStops[idx];
                                nextStops[idx] = nextStops[idx + 1];
                                nextStops[idx + 1] = temp;
                                onReorderThemeRecords(theme.name, nextStops.map((s) => s.annotationId));
                              };

                              const matchedNarrations = matchedAnno?.narrations || [];
                              const boundNarrationId = matchedAnno?.themeNarrationBindings?.[theme.name] || '';
                              const activeNarration = 
                                matchedNarrations.find((n) => n.id === boundNarrationId) ||
                                matchedNarrations.find((n) => n.targetTheme?.toLowerCase() === theme.name.toLowerCase()) ||
                                matchedNarrations.find((n) => n.isDefault) ||
                                (matchedNarrations.length > 0 ? matchedNarrations[0] : null);

                              return (
                                <div
                                  key={stop.annotationId || idx}
                                  className={`p-2.5 rounded-xl border text-xs space-y-2 transition-all ${
                                    selectedAnnotationId === stop.annotationId
                                      ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                                      : isLight
                                      ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div
                                      onClick={() => matchedAnno && onFocusAnnotation(matchedAnno)}
                                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                                    >
                                      <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-500/30">
                                        #{stop.stopNumber}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold truncate group-hover:text-amber-400 transition-colors">
                                            {stop.annotationTitle}
                                          </span>
                                          {matchedAnno?.category && (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                              {matchedAnno.category}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* List Item Reorder & View Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        disabled={isFirst}
                                        onClick={handleMoveUp}
                                        className={`p-1 rounded-lg border transition-colors ${
                                          isFirst
                                            ? 'opacity-20 cursor-not-allowed border-transparent text-zinc-600'
                                            : isLight
                                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                            : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                                        }`}
                                        title="Move record up in tour order"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        disabled={isLast}
                                        onClick={handleMoveDown}
                                        className={`p-1 rounded-lg border transition-colors ${
                                          isLast
                                            ? 'opacity-20 cursor-not-allowed border-transparent text-zinc-600'
                                            : isLight
                                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                            : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                                        }`}
                                        title="Move record down in tour order"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => matchedAnno && onFocusAnnotation(matchedAnno)}
                                        className={`p-1 rounded-lg border transition-colors ${
                                          isLight
                                            ? 'bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-700'
                                            : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-400'
                                        }`}
                                        title="Focus 3D Viewport on Record"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>

                                      {isResearcher && onToggleRecordTheme && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleRecordTheme(stop.annotationId, theme.name);
                                          }}
                                          className="p-1 rounded-lg border border-transparent hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                          title="Remove record from this theme"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Exhibition Narration Lens Selector for this Theme Stop */}
                                  <div className={`p-2 rounded-lg border text-[11px] space-y-1.5 ${
                                    isLight ? 'bg-amber-50/50 border-amber-200/80' : 'bg-zinc-950/60 border-zinc-800/80'
                                  }`}>
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                      <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                        <Sparkles className="w-3 h-3" />
                                        <span>Exhibition Lens:</span>
                                      </div>

                                      {matchedAnno && (
                                        <button
                                          type="button"
                                          onClick={() => onEditAnnotation(matchedAnno)}
                                          className="text-[10px] text-amber-500 hover:underline flex items-center gap-0.5 font-medium"
                                          title="Open AI Narration Studio for this record"
                                        >
                                          <Bot className="w-3 h-3" />
                                          <span>Studio ({matchedNarrations.length})</span>
                                        </button>
                                      )}
                                    </div>

                                    {isResearcher ? (
                                      matchedNarrations.length > 0 ? (
                                        <div className="space-y-1">
                                          <select
                                            value={boundNarrationId}
                                            onChange={(e) => {
                                              if (onSetThemeNarrationBinding) {
                                                onSetThemeNarrationBinding(stop.annotationId, theme.name, e.target.value);
                                              }
                                            }}
                                            className={`w-full px-2 py-1 rounded-lg text-xs border focus:outline-none focus:border-amber-400 ${
                                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-700 text-white'
                                            }`}
                                          >
                                            <option value="">Auto / Default Lens ({matchedNarrations[0]?.title || matchedNarrations[0]?.tone})</option>
                                            {matchedNarrations.map((n) => (
                                              <option key={n.id} value={n.id}>
                                                {n.title || `${n.tone} (${n.knowledgeLevel})`}{n.isDefault ? ' ★' : ''}
                                              </option>
                                            ))}
                                          </select>

                                          {activeNarration && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold capitalize ${
                                                isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                                              }`}>
                                                {activeNarration.tone}
                                              </span>
                                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold capitalize ${
                                                isLight ? 'bg-blue-100 text-blue-900' : 'bg-blue-500/20 text-blue-300'
                                              }`}>
                                                {activeNarration.knowledgeLevel}
                                              </span>
                                              <p className="text-[10px] text-zinc-400 truncate w-full italic">
                                                "{activeNarration.text.slice(0, 80)}..."
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400">
                                          <span>No compiled narratives yet.</span>
                                          {matchedAnno && (
                                            <button
                                              type="button"
                                              onClick={() => onEditAnnotation(matchedAnno)}
                                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors"
                                            >
                                              + Compile in Studio
                                            </button>
                                          )}
                                        </div>
                                      )
                                    ) : (
                                      activeNarration ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5 font-bold">
                                            <span>{activeNarration.title || `${activeNarration.tone} Story`}</span>
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                              {activeNarration.tone}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-zinc-400 line-clamp-2">
                                            {activeNarration.text}
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-zinc-400 italic">
                                          {stop.description || 'Standard exhibition stop information'}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          /* GIS LAYERS & RECORDS TREE TAB */
          <>
        {/* New Group Creation Form */}
        {isCreatingGroup && (
          <form onSubmit={handleGroupSubmit} className={`p-3.5 rounded-2xl border space-y-3 ${
            isLight ? 'bg-purple-50/80 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-purple-900' : 'text-purple-200'}`}>
                <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                New Spatial Discipline Layer
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase mb-1 opacity-70">Group Layer Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Art History & Pigment Stratigraphy"
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-purple-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-white'
                }`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold uppercase opacity-70">Discipline</label>
                  {onOpenProjectOptions && (
                    <button
                      type="button"
                      onClick={() => onOpenProjectOptions('disciplines')}
                      className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 font-medium"
                      title="Edit pre-determined disciplines in Project Options"
                    >
                      <Sliders className="w-2.5 h-2.5" /> Edit
                    </button>
                  )}
                </div>
                <select
                  value={newGroupDiscipline}
                  onChange={(e) => setNewGroupDiscipline(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-xl text-xs border focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-white'
                  }`}
                >
                  {availableDisciplines.map((disc) => (
                    <option key={disc} value={disc}>
                      {disc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase mb-1 opacity-70">Layer Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[11px] font-mono">{newGroupColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase mb-1 opacity-70">Description / Scope</label>
              <input
                type="text"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="Brief description of research layer scope..."
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-purple-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-white'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-700 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md"
              >
                Save Layer Group
              </button>
            </div>
          </form>
        )}

        {/* RENDER DISCIPLINE LAYER GROUPS & THEIR NESTED RECORDS */}
        {spatialGroups.map((grp) => {
          const isCollapsed = !!collapsedGroupIds[grp.id];
          const isVisible = grp.visible !== false;
          
          // Pre-computed records belonging to this group
          const groupRecords = groupRecordsMap[grp.id] || [];

          return (
            <div
              key={grp.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isLight
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-[#09090B]/80 border-zinc-800/80'
              }`}
            >
              {/* Group Folder Header */}
              <div
                className={`p-3 flex items-center justify-between gap-2 border-b cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-100/90 border-slate-200/80 hover:bg-slate-200/70'
                    : 'bg-zinc-900/90 border-zinc-800/80 hover:bg-zinc-800/60'
                }`}
                onClick={() => toggleGroupCollapse(grp.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Expand/Collapse Chevron */}
                  <div className={`p-0.5 rounded transition-transform ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>

                  {/* Group Visibility Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleGroupVisibility) onToggleGroupVisibility(grp.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                      isVisible
                        ? isLight
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : isLight
                        ? 'bg-slate-200 text-slate-400 border-slate-300'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                    title={isVisible ? 'Hide Layer in 3D Scene' : 'Show Layer in 3D Scene'}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Group Color Swatch */}
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: grp.color }}
                  />

                  {/* Folder Title & Discipline Badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {grp.name}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold text-white shrink-0 shadow-xs" style={{ backgroundColor: grp.color }}>
                        {grp.discipline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Record Count Badge */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isLight ? 'bg-slate-200 text-slate-700' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {groupRecords.length}
                  </span>

                  {/* Export Group Button */}
                  {onExportGroupJson && (
                    <button
                      type="button"
                      onClick={() => onExportGroupJson(grp.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-zinc-800 text-zinc-300'
                      }`}
                      title={`Export "${grp.name}" Layer Dataset (JSON)`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Group Button */}
                  {isResearcher && onDeleteGroup && (
                    <button
                      type="button"
                      onClick={() => onDeleteGroup(grp.id)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Discipline Layer Group"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Group Inner Content (Nested Spatial Records) */}
              {!isCollapsed && (
                <div className="p-2 space-y-2">
                  {groupRecords.length === 0 ? (
                    <div className="text-center py-4 px-2 text-[11px] text-zinc-500 border border-dashed rounded-xl border-zinc-800/60">
                      No spatial records in this layer yet.
                      {isResearcher && onAddRecordToGroup && (
                        <button
                          onClick={() => onAddRecordToGroup(grp.id)}
                          className="mt-1.5 block mx-auto text-purple-400 hover:underline font-semibold text-[11px]"
                        >
                          + Add Record to {grp.name}
                        </button>
                      )}
                    </div>
                  ) : (
                    groupRecords.map((anno) => (
                      <RecordCardItem
                        key={anno.id}
                        anno={anno}
                        spatialGroups={spatialGroups}
                        isSelected={selectedAnnotationId === anno.id}
                        isExpanded={expandedCardId === anno.id}
                        isResearcher={isResearcher}
                        isLight={isLight}
                        onToggleExpand={() => setExpandedCardId(expandedCardId === anno.id ? null : anno.id)}
                        onSelect={() => onSelectAnnotation(anno.id)}
                        onFocus={() => onFocusAnnotation(anno)}
                        onEdit={() => onEditAnnotation(anno)}
                        onStartEditShape={onStartEditShape ? () => onStartEditShape(anno) : undefined}
                        onDelete={() => onDeleteAnnotation(anno.id)}
                        onOpenPdf={onOpenPdf}
                        onOpenImage={onOpenImage}
                        onReassignGroup={onReassignRecordGroup}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* UNGROUPED / GENERAL RECORDS FOLDER */}
        {ungroupedRecords.length > 0 && (
          <div className={`rounded-2xl border transition-all overflow-hidden ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#09090B]/80 border-zinc-800/80'
          }`}>
            <div
              className={`p-3 flex items-center justify-between gap-2 border-b cursor-pointer transition-colors ${
                isLight ? 'bg-slate-100/90 border-slate-200/80' : 'bg-zinc-900/90 border-zinc-800/80'
              }`}
              onClick={() => toggleGroupCollapse('ungrouped')}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-0.5 rounded transition-transform ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  {collapsedGroupIds['ungrouped'] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>

                <FolderOpen className="w-4 h-4 text-zinc-400 shrink-0" />
                <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  General / Ungrouped Records
                </h4>
              </div>

              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                isLight ? 'bg-slate-200 text-slate-700' : 'bg-zinc-800 text-zinc-300'
              }`}>
                {ungroupedRecords.length}
              </span>
            </div>

            {!collapsedGroupIds['ungrouped'] && (
              <div className="p-2 space-y-2">
                {ungroupedRecords.map((anno) => (
                  <RecordCardItem
                    key={anno.id}
                    anno={anno}
                    spatialGroups={spatialGroups}
                    isSelected={selectedAnnotationId === anno.id}
                    isExpanded={expandedCardId === anno.id}
                    isResearcher={isResearcher}
                    isLight={isLight}
                    onToggleExpand={() => setExpandedCardId(expandedCardId === anno.id ? null : anno.id)}
                    onSelect={() => onSelectAnnotation(anno.id)}
                    onFocus={() => onFocusAnnotation(anno)}
                    onEdit={() => onEditAnnotation(anno)}
                    onStartEditShape={onStartEditShape ? () => onStartEditShape(anno) : undefined}
                    onDelete={() => onDeleteAnnotation(anno.id)}
                    onOpenPdf={onOpenPdf}
                    onOpenImage={onOpenImage}
                    onReassignGroup={onReassignRecordGroup}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Empty State */}
        {spatialGroups.length === 0 && ungroupedRecords.length === 0 && (
          <div className="text-center py-12 px-4 space-y-3">
            <Layers className={`w-10 h-10 mx-auto opacity-40 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
            <p className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              No GIS spatial layer groups or records found.
            </p>
            {isResearcher && (
              <button
                onClick={() => setIsCreatingGroup(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
              >
                + Create First Discipline Layer
              </button>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </aside>
  );
};

/* INDIVIDUAL SPATIAL RECORD ITEM COMPONENT INSIDE HIERARCHICAL TREE */
interface RecordCardItemProps {
  anno: SpatialAnnotation;
  spatialGroups: SpatialGroup[];
  isSelected: boolean;
  isExpanded: boolean;
  isResearcher: boolean;
  isLight: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onFocus: () => void;
  onEdit: () => void;
  onStartEditShape?: () => void;
  onDelete: () => void;
  onOpenPdf: (pdf: SpatialAttachmentPDF) => void;
  onOpenImage: (img: SpatialAttachmentImage) => void;
  onReassignGroup?: (annotationId: string, newGroupId: string) => void;
}

const RecordCardItem: React.FC<RecordCardItemProps> = ({
  anno,
  spatialGroups,
  isSelected,
  isExpanded,
  isResearcher,
  isLight,
  onToggleExpand,
  onSelect,
  onFocus,
  onEdit,
  onStartEditShape,
  onDelete,
  onOpenPdf,
  onOpenImage,
  onReassignGroup
}) => {
  const geomType = anno.geometryType || 'point';

  return (
    <div
      className={`rounded-xl border transition-all ${
        isSelected
          ? isLight
            ? 'bg-blue-50/90 border-blue-400 shadow-md ring-1 ring-blue-400'
            : 'bg-blue-950/40 border-blue-500/70 shadow-lg ring-1 ring-blue-500/50'
          : isLight
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'bg-[#09090B] border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Card Header Row */}
      <div
        className="p-2.5 flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => {
          onSelect();
          onFocus();
        }}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {/* Geometry Icon Badge */}
          <div
            className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-white text-[10px] shadow-xs mt-0.5"
            style={{ backgroundColor: anno.color || '#3b82f6' }}
            title={`3D Geometry: ${geomType}`}
          >
            {geomType === 'polyline' && <Activity className="w-3 h-3" />}
            {geomType === 'polygon' && <Square className="w-3 h-3" />}
            {geomType === 'box' && <Box className="w-3 h-3" />}
            {geomType === 'submesh' && <Component className="w-3 h-3" />}
            {geomType === 'point' && <MapPin className="w-3 h-3" />}
          </div>

          <div className="min-w-0 flex-1">
            <h5 className={`text-xs font-bold leading-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {anno.title}
            </h5>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-zinc-800/80 text-zinc-300'
              }`}>
                {anno.category}
              </span>

              {anno.pdfs.length > 0 && (
                <span className="text-[9px] text-red-400 flex items-center gap-0.5 font-mono">
                  <FileText className="w-2.5 h-2.5" />
                  {anno.pdfs.length}
                </span>
              )}

              {anno.images.length > 0 && (
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-mono">
                  <ImageIcon className="w-2.5 h-2.5" />
                  {anno.images.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Focus & Expand Action Buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onFocus}
            className="p-1 rounded-md bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-semibold transition-colors"
            title="Fly 3D Camera to Record"
          >
            Focus
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className={`p-1 rounded-md transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className={`p-2.5 pt-1 border-t space-y-2 text-[11px] ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-zinc-800/80 bg-zinc-950/30'
        }`}>
          {/* Description */}
          {anno.description && (
            <p className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
              {anno.description}
            </p>
          )}

          {/* Quick Group Layer Re-assignment Selector */}
          {isResearcher && onReassignGroup && (
            <div className="flex items-center gap-1.5 pt-1">
              <ArrowRightLeft className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-[10px] opacity-70 shrink-0 font-medium">Layer Group:</span>
              <select
                value={anno.groupId || ''}
                onChange={(e) => onReassignGroup(anno.id, e.target.value)}
                className={`w-full px-1.5 py-0.5 rounded-lg text-[10px] font-semibold border focus:outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-purple-300'
                }`}
              >
                <option value="">(Ungrouped / General)</option>
                {spatialGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.discipline})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metadata Tags */}
          {anno.metadata.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {anno.metadata.map((m, idx) => (
                <div
                  key={idx}
                  className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded-lg border ${
                    isLight
                      ? 'bg-white border-purple-200 shadow-2xs'
                      : 'bg-zinc-900/90 border-zinc-800'
                  }`}
                >
                  <span
                    className={`font-semibold uppercase tracking-wider text-[8px] px-1 py-0.2 rounded border ${
                      isLight
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {m.key}
                  </span>
                  <span className={`font-mono ${isLight ? 'text-slate-900 font-medium' : 'text-zinc-200 font-medium'}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Attachments (PDFs & Images) */}
          {(anno.pdfs.length > 0 || anno.images.length > 0) && (
            <div className="space-y-1 pt-1">
              {anno.pdfs.map((pdf) => (
                <button
                  key={pdf.id}
                  onClick={() => onOpenPdf(pdf)}
                  className="w-full px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-medium flex items-center gap-1.5 text-left truncate transition-colors"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{pdf.name}</span>
                </button>
              ))}

              {anno.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => onOpenImage(img)}
                  className="w-full px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1.5 text-left truncate transition-colors"
                >
                  <ImageIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{img.caption || 'Attached Spatial Photo'}</span>
                </button>
              ))}
            </div>
          )}

          {/* Card Actions Footer */}
          {isResearcher && (
            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-800/60">
              {(geomType === 'polyline' || geomType === 'polygon') && onStartEditShape && (
                <button
                  onClick={onStartEditShape}
                  className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[10px] font-semibold flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" />
                  <span>Edit 3D Shape</span>
                </button>
              )}

              <button
                onClick={onEdit}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Record</span>
              </button>

              <button
                onClick={onDelete}
                className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
