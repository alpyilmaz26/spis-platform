import React, { useState } from 'react';
import {
  FolderKanban,
  Download,
  Upload,
  Plus,
  Box,
  MapPin,
  Ruler,
  Check,
  X,
  FileJson,
  Sparkles,
  Edit3,
  Layers,
  Info,
  User,
  Loader2,
  Sliders,
  Eye
} from 'lucide-react';
import { UiTheme, UploadedModelItem, SpatialAnnotation, Measurement, ProjectMetadata, SampleModel, AppViewMode } from '../types';
import { SAMPLE_MODELS } from '../utils/proceduralModels';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectMeta: ProjectMetadata;
  viewMode?: AppViewMode;
  onUpdateProjectMeta: (name: string, description: string, author?: string) => void;
  onExportProject: () => void;
  onImportProjectFile: (file: File) => void;
  onNewProject: (name?: string, author?: string, description?: string) => void;
  userModels: UploadedModelItem[];
  activeModelId: string | null;
  onSelectUserModel: (id: string) => void;
  recordsByModel: Record<string, SpatialAnnotation[]>;
  measurementsByModel: Record<string, Measurement[]>;
  uiTheme: UiTheme;
  onOpenUpload?: () => void;
  onSelectSampleModel?: (sample: SampleModel) => void;
  isExporting?: boolean;
  isImporting?: boolean;
  onOpenProjectOptions?: () => void;
  onOpenRoleModal?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectMeta,
  viewMode = 'researcher',
  onUpdateProjectMeta,
  onExportProject,
  onImportProjectFile,
  onNewProject,
  userModels,
  activeModelId,
  onSelectUserModel,
  recordsByModel,
  measurementsByModel,
  uiTheme,
  onOpenUpload,
  onSelectSampleModel,
  isExporting = false,
  isImporting = false,
  onOpenProjectOptions,
  onOpenRoleModal
}) => {
  const isLight = uiTheme === 'light';

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [nameInput, setNameInput] = useState(projectMeta.name);
  const [descInput, setDescInput] = useState(projectMeta.description);
  const [authorInput, setAuthorInput] = useState(projectMeta.author || '');
  const [importError, setImportError] = useState<string | null>(null);

  React.useEffect(() => {
    setNameInput(projectMeta.name);
    setDescInput(projectMeta.description);
    setAuthorInput(projectMeta.author || '');
  }, [projectMeta.name, projectMeta.description, projectMeta.author]);

  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjName, setNewProjName] = useState('New 3D GIS Project');
  const [newProjAuthor, setNewProjAuthor] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  if (!isOpen) return null;

  const handleSaveMeta = () => {
    onUpdateProjectMeta(
      nameInput.trim() || 'Untitled 3D GIS Project',
      descInput.trim(),
      authorInput.trim() || 'Surveyor'
    );
    setIsEditingTitle(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.zip') && !lower.endsWith('.json') && !lower.endsWith('.3dproj')) {
      setImportError('Please select a valid .zip, .json, or .3dproj project export file.');
      return;
    }
    setImportError(null);
    onImportProjectFile(file);
    onClose();
  };

  // Calculate total spatial records across all models
  const totalRecords = Object.values(recordsByModel).reduce<number>((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  const totalMeasurements = Object.values(measurementsByModel).reduce<number>((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-500 flex items-center justify-center shadow-sm shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  3D Project Manager
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 font-mono font-semibold uppercase">
                  Workspace
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Link spatial records to models & bundle full project files for sharing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'bg-slate-200/60 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Welcome Greeting Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isLight ? 'bg-blue-50/80 border-blue-200 text-blue-950' : 'bg-blue-600/10 border-blue-500/25 text-blue-100'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>Welcome to 3D Spatial Survey & GIS Suite</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono uppercase font-bold">
                  v2.0
                </span>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-blue-900/80' : 'text-blue-200/80'}`}>
                Welcome to your 3D spatial documentation workspace. Upload a custom 3D model, load a preset model, or import an existing project bundle (.json) to get started with spatial pins, field records, and 3D measurements.
              </p>
            </div>
          </div>

          {/* Project Details Section */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-900/50 border-zinc-800'
            }`}
          >
            {!isEditingTitle ? (
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-blue-500 tracking-wider">Project Title</span>
                    {projectMeta.author && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        <User className="w-3 h-3 text-blue-500" />
                        <span>{projectMeta.author}</span>
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {projectMeta.name}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    {projectMeta.description || 'No description provided. Click edit to add project notes.'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {viewMode === 'audience' && (
                    <span className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>Audience (Read-Only)</span>
                    </span>
                  )}
                  {viewMode === 'researcher' && onOpenProjectOptions && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProjectOptions();
                      }}
                      className={`p-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 shadow-sm'
                          : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-500/30'
                      }`}
                      title="Configure disciplines, GIS categories, and attribute templates"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Project Options</span>
                    </button>
                  )}
                  {onOpenRoleModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRoleModal();
                      }}
                      className={`p-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 shadow-sm'
                          : 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border-blue-500/30'
                      }`}
                      title="Choose UI View Mode (Researcher vs Audience Tour)"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>UI Mode</span>
                    </button>
                  )}
                  {viewMode === 'researcher' && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Edit Details</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-blue-500 tracking-wider">
                  Edit Project Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                      placeholder="e.g., Archaeological Site Alpha"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                      Author / Surveyor
                    </label>
                    <input
                      type="text"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                      placeholder="e.g., Dr. Jane Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Project Description / Research Scope
                  </label>
                  <textarea
                    rows={2}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-zinc-950 border-zinc-700 text-white'
                    }`}
                    placeholder="Enter details about this 3D model project..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${
                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMeta}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/40">
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-zinc-950/80 border-zinc-800'
                }`}
              >
                <Box className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-semibold opacity-60">Models</div>
                  <div className="text-sm font-bold">{userModels.length}</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-zinc-950/80 border-zinc-800'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-semibold opacity-60">Spatial Records</div>
                  <div className="text-sm font-bold text-emerald-500">{totalRecords}</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-zinc-950/80 border-zinc-800'
                }`}
              >
                <Ruler className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-semibold opacity-60">Measurements</div>
                  <div className="text-sm font-bold text-purple-500">{totalMeasurements}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Transfer Actions (Export / Import / New) */}
          <div className="space-y-3">
            <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Project File Transfer
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{importError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Project Button */}
              <button
                onClick={onExportProject}
                disabled={isExporting}
                className="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-between transition-all shadow-md shadow-blue-600/25 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-bold leading-none mb-1">
                      {isExporting ? 'Exporting Project...' : 'Export Project Bundle'}
                    </div>
                    <div className="text-[10px] text-blue-100 font-normal">Save .zip with models & records</div>
                  </div>
                </div>
                <FileJson className="w-4 h-4 opacity-70" />
              </button>

              {/* Import Project File Picker */}
              <label
                className={`p-3.5 rounded-xl border font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  isImporting ? 'opacity-60 pointer-events-none' : ''
                } ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-emerald-200'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <input
                  type="file"
                  accept=".zip,.json,.3dproj"
                  onChange={handleFileChange}
                  disabled={isImporting}
                  className="hidden"
                />
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-bold leading-none mb-1">
                      {isImporting ? 'Importing Project...' : 'Import Project (.zip / .json)'}
                    </div>
                    <div className="text-[10px] opacity-80 font-normal">Open exported workspace file</div>
                  </div>
                </div>
                <FileJson className="w-4 h-4 opacity-70" />
              </label>
            </div>

            {viewMode === 'researcher' && (
              <div className="pt-2">
                {!showNewProjectForm ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowNewProjectForm(true)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      <span>Start New Project</span>
                    </button>
                  </div>
                ) : (
                  <div className={`w-full p-4 rounded-2xl border space-y-3.5 animate-fadeIn ${
                    isLight ? 'bg-blue-50/90 border-blue-200 text-slate-900' : 'bg-blue-600/10 border-blue-500/30 text-zinc-100'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-2 border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                          Create New 3D GIS Project
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNewProjectForm(false)}
                        className={`p-1 rounded-lg transition-colors ${
                          isLight ? 'hover:bg-slate-200/80 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                          Project Name *
                        </label>
                        <input
                          type="text"
                          value={newProjName}
                          onChange={(e) => setNewProjName(e.target.value)}
                          placeholder="e.g., Structural Scan Alpha"
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                          Author / Surveyor
                        </label>
                        <input
                          type="text"
                          value={newProjAuthor}
                          onChange={(e) => setNewProjAuthor(e.target.value)}
                          placeholder="e.g., Dr. Jane Smith, Lead GIS"
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Description / Research Scope
                      </label>
                      <textarea
                        rows={2}
                        value={newProjDesc}
                        onChange={(e) => setNewProjDesc(e.target.value)}
                        placeholder="e.g., 3D GIS documentation, spatial measurements & site observations..."
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                        Resets to blank 3D space & opens model upload.
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setShowNewProjectForm(false)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${
                            isLight ? 'bg-slate-200 text-slate-800' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() => {
                            setShowNewProjectForm(false);
                            onNewProject(newProjName, newProjAuthor, newProjDesc);
                            onClose();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Project & Upload Model</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Breakdown List & Linked Records */}
          <div className="space-y-2.5">
            <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              <span>Models in this Project ({userModels.length})</span>
              <span className="text-[10px] font-normal normal-case opacity-70">
                Click a model to switch active view
              </span>
            </div>

            <div className="space-y-2">
              {userModels.length === 0 ? (
                <div className={`p-5 rounded-2xl border text-center space-y-4 ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-900/40 border-zinc-800'
                }`}>
                  <div className="space-y-1">
                    <div className="text-sm font-bold flex items-center justify-center gap-1.5">
                      <Box className="w-4 h-4 text-blue-500" />
                      <span>No 3D Models in Current Workspace</span>
                    </div>
                    <p className={`text-xs max-w-md mx-auto leading-relaxed ${
                      isLight ? 'text-slate-500' : 'text-zinc-400'
                    }`}>
                      Get started by uploading your 3D mesh model file or selecting a sample preset below to begin attaching 3D GIS records.
                    </p>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    {onOpenUpload && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenUpload();
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload 3D Mesh (.OBJ, .GLB, .STL)</span>
                      </button>
                    )}
                  </div>

                  {/* Preset Quick Select Section */}
                  {onSelectSampleModel && (
                    <div className="pt-3 border-t border-zinc-800/40">
                      <div className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                        isLight ? 'text-slate-400' : 'text-zinc-400'
                      }`}>
                        Or Load a Preset Sample Model:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {SAMPLE_MODELS.map((sample) => (
                          <button
                            key={sample.id}
                            onClick={() => {
                              onSelectSampleModel(sample);
                            }}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                              isLight
                                ? 'bg-white hover:bg-blue-50/80 hover:border-blue-300 border-slate-200 text-slate-800'
                                : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-bold">{sample.name}</div>
                              <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                {sample.category || 'PROCEDURAL'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                userModels.map((m) => {
                  const recs = recordsByModel[m.id] || [];
                  const msrs = measurementsByModel[m.id] || [];
                  const isActive = activeModelId === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        onSelectUserModel(m.id);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 border-blue-500/50 text-blue-500 ring-1 ring-blue-500/30'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          : 'bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          <Box className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold text-xs truncate flex items-center gap-2 ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            <span>{m.name}</span>
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-mono font-bold uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] flex items-center gap-2 mt-0.5 ${
                            isLight ? 'text-slate-500' : 'text-zinc-400'
                          }`}>
                            <span>Category: <strong className="text-blue-500">{m.category}</strong></span>
                            {m.fileSize && <span>• {m.fileSize}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Linked Records Indicators */}
                      <div className="flex items-center gap-2 text-xs font-semibold shrink-0 pl-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                          recs.length > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                            : isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`} title="Spatial Records linked to this model">
                          <MapPin className="w-3 h-3" />
                          <span className="font-mono text-[11px]">{recs.length}</span>
                        </span>

                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                          msrs.length > 0
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
                            : isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`} title="Measurements on this model">
                          <Ruler className="w-3 h-3" />
                          <span className="font-mono text-[11px]">{msrs.length}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex justify-end ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
