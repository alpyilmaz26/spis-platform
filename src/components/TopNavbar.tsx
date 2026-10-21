import React, { useRef } from 'react';
import {
  Upload,
  Box,
  Camera,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  ChevronDown,
  UserCheck,
  Eye,
  MapPin,
  Sun,
  Moon,
  Trash2,
  Plus,
  FolderKanban,
  Download,
  FolderInput,
  Loader2,
  User,
  Compass
} from 'lucide-react';
import { ModelStats, SampleModel, AppViewMode, UiTheme, UploadedModelItem, ProjectMetadata } from '../types';

interface TopNavbarProps {
  stats: ModelStats | null;
  viewMode: AppViewMode;
  onToggleViewMode: () => void;
  uiTheme: UiTheme;
  onToggleUiTheme: () => void;
  onOpenUpload: () => void;
  onSelectSampleModel: (sample: SampleModel) => void;
  userModels?: UploadedModelItem[];
  activeModelId?: string | null;
  onSelectUserModel?: (id: string) => void;
  onDeleteUserModel?: (id: string) => void;
  onTakeScreenshot: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeSampleId?: string;
  isGisPanelOpen: boolean;
  gisPanelTab?: 'layers' | 'themes';
  onToggleGisPanel: (targetTab?: 'layers' | 'themes') => void;
  spatialRecordCount?: number;
  projectMeta: ProjectMetadata;
  onOpenProjectModal?: () => void;
  onOpenRoleModal?: () => void;
  onExportProject?: () => void;
  onImportProjectFile?: (file: File) => void;
  isExporting?: boolean;
  isImporting?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  stats,
  viewMode,
  onToggleViewMode,
  uiTheme,
  onToggleUiTheme,
  onOpenUpload,
  userModels = [],
  activeModelId,
  onSelectUserModel,
  onDeleteUserModel,
  onTakeScreenshot,
  onToggleSidebar,
  isSidebarOpen,
  isGisPanelOpen,
  gisPanelTab = 'layers',
  onToggleGisPanel,
  spatialRecordCount = 0,
  projectMeta,
  onOpenProjectModal,
  onOpenRoleModal,
  onExportProject,
  onImportProjectFile,
  isExporting = false,
  isImporting = false
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showSampleDropdown, setShowSampleDropdown] = React.useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportProjectFile) {
      onImportProjectFile(file);
      e.target.value = '';
    }
  };

  const activeModel = userModels.find((m) => m.id === activeModelId);
  const isLight = uiTheme === 'light';

  return (
    <header className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 backdrop-blur-xl transition-colors border-b ${
      isLight
        ? 'bg-white/95 text-slate-900 border-slate-200 shadow-sm'
        : 'bg-[#0C0C0E]/95 text-zinc-100 border-zinc-800/80 shadow-2xl'
    }`}>
      {/* Hidden File Input for Direct Project Bundle Import */}
      <input
        type="file"
        ref={importInputRef}
        accept=".json,.3dproj"
        onChange={handleImportChange}
        className="hidden"
      />

      {/* Left Group: Brand & Active Project Selector & Quick Bundle Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Brand Logo */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isLight ? 'bg-blue-100 border border-blue-200 text-blue-600' : 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
        }`}>
          <Box className="w-4 h-4" />
        </div>

        {/* Project Badge & Dropdown */}
        <div className="flex items-center gap-1.5">
          {onOpenProjectModal && (
            <button
              onClick={onOpenProjectModal}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                isLight
                  ? 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border-blue-200/80'
                  : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 border-blue-500/30'
              }`}
              title="Click to manage project settings, title, author & export/import"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex flex-col text-left leading-none max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                <span className="truncate font-bold text-xs">{projectMeta.name || '3D GIS Project'}</span>
                {projectMeta.author && (
                  <span className={`text-[9px] font-medium truncate mt-0.5 flex items-center gap-1 ${
                    isLight ? 'text-blue-700/80' : 'text-blue-300/80'
                  }`}>
                    <User className="w-2.5 h-2.5 opacity-70" />
                    <span>{projectMeta.author}</span>
                  </span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
            </button>
          )}

          {/* Quick Transfer Actions (Export & Import) */}
          <div className="hidden lg:flex items-center gap-1 pl-1 border-l border-zinc-800/40">
            {onExportProject && (
              <button
                onClick={onExportProject}
                disabled={isExporting}
                className={`p-1.5 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
                title="Export entire project bundle (.3dproj.json)"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span className="hidden xl:inline">Export</span>
              </button>
            )}

            {onImportProjectFile && (
              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className={`p-1.5 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
                title="Import existing project bundle (.3dproj.json)"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                ) : (
                  <FolderInput className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="hidden xl:inline">Import</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center Group: Mode Switcher & Active 3D Model Quick Selector */}
      <div className="flex items-center gap-2">
        {/* Role Badge Indicator - Opens UI Mode Selection Window */}
        <div className={`hidden md:flex items-center p-0.5 border rounded-2xl text-xs font-semibold ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border-zinc-800/80'
        }`}>
          {viewMode === 'researcher' ? (
            <button
              onClick={onOpenRoleModal}
              className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold hover:bg-blue-500"
              title="Researcher Studio: Click to switch UI Mode & Tour Themes"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Researcher Studio</span>
            </button>
          ) : (
            <button
              onClick={onOpenRoleModal}
              className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30 font-bold hover:bg-amber-400"
              title="Audience Virtual Tour: Click to switch UI Mode & Tour Themes"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Audience Tour View</span>
            </button>
          )}
        </div>

        {/* Active 3D Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSampleDropdown(!showSampleDropdown)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              activeModel
                ? isLight
                  ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
            title="Switch or Upload 3D Mesh Models"
          >
            <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[150px]">
              {activeModel ? activeModel.name : 'Select 3D Model'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
          </button>

          {showSampleDropdown && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 mt-2 w-80 border rounded-2xl p-2.5 z-50 text-xs shadow-2xl ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
              }`}
              onMouseLeave={() => setShowSampleDropdown(false)}
            >
              <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-zinc-800/50 pb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-400' : 'text-zinc-400'
                }`}>
                  3D Mesh Models ({userModels.length})
                </span>
                <button
                  onClick={() => {
                    setShowSampleDropdown(false);
                    onOpenUpload();
                  }}
                  className="text-blue-500 hover:text-blue-400 font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload Model</span>
                </button>
              </div>

              {userModels.length === 0 ? (
                <div className={`p-4 border border-dashed rounded-xl text-center space-y-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
                }`}>
                  <Box className="w-7 h-7 text-blue-500/80 mx-auto" />
                  <div className="text-xs font-bold">No Active Models</div>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Upload an .OBJ, .GLB, or .STL file to attach spatial records.
                  </p>
                  <button
                    onClick={() => {
                      setShowSampleDropdown(false);
                      onOpenUpload();
                    }}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload 3D Mesh</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {userModels.map((model) => (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                        activeModelId === model.id
                          ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30 font-bold'
                          : isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-zinc-800/80 text-zinc-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (onSelectUserModel) onSelectUserModel(model.id);
                          setShowSampleDropdown(false);
                        }}
                        className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                          <Box className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {model.name}
                          </div>
                          <div className={`text-[10px] flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            <span className="font-mono uppercase font-bold text-blue-500">{model.category}</span>
                            {model.fileSize && <span>• {model.fileSize}</span>}
                          </div>
                        </div>
                      </button>

                      {viewMode === 'researcher' && onDeleteUserModel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUserModel(model.id);
                          }}
                          className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity ${
                            isLight ? 'hover:bg-slate-200 text-rose-600' : 'hover:bg-zinc-800 text-rose-400'
                          }`}
                          title="Remove model from project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="pt-2 border-t border-zinc-800/50">
                    <button
                      onClick={() => {
                        setShowSampleDropdown(false);
                        onOpenUpload();
                      }}
                      className={`w-full py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      <span>Upload Another Model</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Group: Workspace Panels, Theme & Screen Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Spatial Records Drawer Toggle (Researcher mode only) */}
        {viewMode === 'researcher' && (
          <button
            onClick={() => onToggleGisPanel('layers')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isGisPanelOpen && gisPanelTab === 'layers'
                ? 'bg-blue-600/20 text-blue-600 border-blue-500/40 shadow-sm'
                : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
            title={isGisPanelOpen && gisPanelTab === 'layers' ? 'Close Spatial Records Panel' : 'Open Spatial Records Panel'}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="hidden xl:inline">Spatial Records</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-blue-500/20 text-blue-500">
              {spatialRecordCount}
            </span>
          </button>
        )}

        {/* Standalone Themes & Tours Drawer Toggle */}
        <button
          onClick={() => onToggleGisPanel('themes')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isGisPanelOpen && gisPanelTab === 'themes'
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm'
              : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
          }`}
          title={isGisPanelOpen && gisPanelTab === 'themes' ? 'Close Themes & Virtual Tours Panel' : 'Open Themes & Virtual Tours Panel'}
        >
          <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden xl:inline">Themes & Tours</span>
        </button>

        {/* UX Options Panel Toggle (Available for both Researcher and Audience) */}
        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isSidebarOpen
              ? 'bg-purple-500/20 text-purple-600 border-purple-500/40 shadow-sm font-semibold'
              : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
          }`}
          title="Toggle Display & Lighting Options Panel"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="hidden xl:inline">UX Options</span>
        </button>

        {/* Dark / Light UI Theme Toggle */}
        <button
          onClick={onToggleUiTheme}
          className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
            isLight
              ? 'bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border-amber-300/80'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
          }`}
          title={isLight ? 'Switch to Dark Mode UI' : 'Switch to Light Mode UI'}
        >
          {isLight ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Screenshot Button */}
        <button
          onClick={onTakeScreenshot}
          className={`p-2 rounded-xl border transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
          }`}
          title="Take Screenshot PNG"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className={`p-2 rounded-xl border transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
