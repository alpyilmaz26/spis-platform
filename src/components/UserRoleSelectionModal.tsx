import React, { useState } from 'react';
import { Microscope, Compass, FolderUp, ArrowRight, ShieldCheck, PlayCircle, Sparkles, X, Eye, ArrowLeft, CheckCircle2, Route, User, Briefcase, Tag } from 'lucide-react';
import { AppViewMode, UiTheme, InterpretiveTheme, AudienceUserCredentials, PRESET_AUDIENCE_ROLES } from '../types';

interface UserRoleSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentMode?: AppViewMode;
  onSelectRole: (mode: AppViewMode, initialThemeName?: string) => void;
  onOpenProjectImport?: () => void;
  uiTheme?: UiTheme;
  availableThemeNames?: string[];
  projectThemes?: InterpretiveTheme[];
  audienceUser?: AudienceUserCredentials;
  onUpdateAudienceUser?: (creds: AudienceUserCredentials) => void;
}

export const UserRoleSelectionModal: React.FC<UserRoleSelectionModalProps> = ({
  isOpen,
  onClose,
  currentMode = 'researcher',
  onSelectRole,
  onOpenProjectImport,
  uiTheme = 'dark',
  availableThemeNames = [],
  projectThemes = [],
  audienceUser = { name: 'Visitor', role: 'Local Resident' },
  onUpdateAudienceUser = (_creds: AudienceUserCredentials) => {}
}) => {
  const [step, setStep] = useState<'select_role' | 'select_theme'>('select_role');

  const [localName, setLocalName] = useState(audienceUser.name || 'Visitor');
  const [localRole, setLocalRole] = useState(audienceUser.role || 'Local Resident');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(
    !PRESET_AUDIENCE_ROLES.includes(audienceUser.role as any)
  );

  const saveIdentity = () => {
    const finalRole = isCustomRole ? (customRoleInput.trim() || 'Contributor') : localRole;
    const finalName = localName.trim() || 'Visitor';
    onUpdateAudienceUser({ name: finalName, role: finalRole });
  };

  const userThemes: InterpretiveTheme[] = projectThemes || [];

  // Use only project themes or themes extracted from spatial records
  const allThemes: InterpretiveTheme[] = [
    ...userThemes,
    ...availableThemeNames
      .filter((cn) => !userThemes.some((p) => p.name.toLowerCase() === cn.toLowerCase()))
      .map((cn) => ({
        id: cn.toLowerCase().replace(/\s+/g, '-'),
        name: cn,
        color: '#8b5cf6',
        description: 'Project interpretive theme tagged on spatial records.'
      }))
  ];

  const [selectedThemeName, setSelectedThemeName] = useState<string>(
    allThemes[0]?.name || ''
  );

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const isLight = uiTheme === 'light';

  const handleStartAudienceTour = () => {
    saveIdentity();
    onSelectRole('audience', selectedThemeName || (allThemes[0]?.name ?? undefined));
    handleClose();
  };

  const handleAudienceCardClick = () => {
    saveIdentity();
    setStep('select_theme');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Top Header Banner */}
        <div className={`relative p-8 md:p-10 border-b ${
          isLight
            ? 'border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-purple-50'
            : 'border-zinc-800/50 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl shadow-inner ${
                isLight
                  ? 'bg-blue-100/80 text-blue-700 border border-blue-200'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                <Compass className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <span className={`text-xs font-mono font-bold tracking-widest uppercase ${
                  isLight ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  Spatial Platform
                </span>
                <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-zinc-100'
                }`}>
                  3D Spatial Information System <span className="text-blue-500 font-mono">(SPIS)</span>
                </h1>
              </div>
            </div>

            <button
              onClick={handleClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200/80 text-slate-500 hover:text-slate-900' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
              }`}
              title="Continue with current mode"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className={`mt-3 text-sm md:text-base max-w-2xl leading-relaxed ${
            isLight ? 'text-slate-700' : 'text-zinc-300'
          }`}>
            {step === 'select_role'
              ? 'Welcome to SPIS. Select your experience mode below to proceed into the 3D spatial environment.'
              : 'Select an Interpretive Theme to guide your 3D virtual tour through the project environment.'}
          </p>
        </div>

        {/* STEP 1: ROLE CHOICE */}
        {step === 'select_role' ? (
          <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RESEARCHER MODE CARD */}
            <div
              onClick={() => {
                onSelectRole('researcher');
                handleClose();
              }}
              className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all cursor-pointer ${
                currentMode === 'researcher'
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-slate-100/80'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <Microscope className="w-7 h-7" />
                  </div>
                  {currentMode === 'researcher' && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Active Mode
                    </span>
                  )}
                </div>

                <h3 className={`text-xl font-bold mb-2 group-hover:text-blue-500 transition-colors ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  Researcher Studio
                </h3>
                <p className={`text-xs leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Full analytical workspace for data collectors, archaeologists, engineers, and conservators.
                </p>

                <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Upload & inspect 3D photogrammetry (.OBJ / .GLTF) models</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Input spatial markers, geometries (Polyline, Polygon, 3D Box Volume)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Assign multi-disciplinary spatial layers & <strong>Interpretive Themes</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Attach field photos, PDF documents, and 3D precision measurements</span>
                  </li>
                </ul>
              </div>

              <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Launch Full Studio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>

            {/* AUDIENCE MODE CARD */}
            <div
              onClick={() => {
                setStep('select_theme');
              }}
              className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all cursor-pointer ${
                currentMode === 'audience'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-slate-100/80'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-zinc-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-7 h-7" />
                  </div>
                  {currentMode === 'audience' && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Active Mode
                    </span>
                  )}
                </div>

                <h3 className={`text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  Audience Virtual Tour
                </h3>
                <p className={`text-xs leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Clean, presentation-focused interface designed for public walkthroughs, virtual exhibits, and interactive guided tours.
                </p>

                <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Choose an <strong>Interpretive Theme</strong> before launching your tour</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Automated camera flights connecting themed waypoints in 3D</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Streamlined presentation cards with images, PDFs, and Voice Narration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Tailored UX options (lighting, auto-rotate, display styles)</span>
                  </li>
                </ul>
              </div>

              <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  Select Theme & Start Tour <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>

                {onOpenProjectImport && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRole('audience');
                      handleClose();
                      onOpenProjectImport();
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    <FolderUp className="w-3.5 h-3.5" /> Load Project
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: INTERPRETIVE THEME SELECTION FOR AUDIENCE */
          <div className="p-8 md:p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('select_role')}
                className={`text-xs flex items-center gap-1.5 transition-colors font-semibold ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Role Selection
              </button>

              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <Route className="w-3.5 h-3.5" /> Audience Setup & Virtual Tour Route
              </span>
            </div>

            {/* Audience User Identity & Role Configuration */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-emerald-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  Your Identity & Perspectives in Audience Mode
                </h4>
              </div>
              <p className={`text-xs mb-3 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Specify your name or nickname and community perspective so your comments and feedback can be recognized on spatial records.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Nickname / Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="e.g. Maria, Dr. Chen, Visitor"
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-sm'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Your Role / Perspective
                  </label>
                  <select
                    value={isCustomRole ? '__CUSTOM__' : localRole}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomRole(true);
                      } else {
                        setIsCustomRole(false);
                        setLocalRole(e.target.value);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-sm'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                    }`}
                  >
                    {PRESET_AUDIENCE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="__CUSTOM__">Other (Custom Role)...</option>
                  </select>
                </div>
              </div>

              {isCustomRole && (
                <div className="mt-3">
                  <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    Custom Role Specification
                  </label>
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="e.g. Geomorphologist, Local Merchant, Neighborhood Historian"
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-sm'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                    }`}
                  />
                </div>
              )}
            </div>

            {allThemes.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Route className="w-7 h-7" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                    No Interpretive Themes Defined Yet
                  </h3>
                  <p className={`text-xs max-w-md mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    This project currently has no interpretive tour themes. You can launch Audience Tour directly to explore all spatial points in the 3D model, or open Researcher Studio to create custom themes and tag records.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRole('researcher');
                      handleClose();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                  >
                    Open Researcher Studio
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAudienceTour}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <PlayCircle className="w-4 h-4 fill-current" />
                    <span>Launch Virtual Tour</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allThemes.map((theme) => {
                    const isSelected = selectedThemeName === theme.name;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => setSelectedThemeName(theme.name)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? isLight
                              ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400'
                              : 'border-amber-500 bg-amber-500/15 shadow-lg ring-1 ring-amber-500/50'
                            : isLight
                            ? 'border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-slate-100/90'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-4 h-4 rounded-full inline-block shadow-md"
                                style={{ backgroundColor: theme.color }}
                              />
                              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>{theme.name}</h3>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className={`w-5 h-5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                            {theme.description}
                          </p>
                        </div>

                        <div className={`pt-3 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
                          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                            Interpretive Focus
                          </span>
                          <span className={`font-bold ${isSelected ? (isLight ? 'text-amber-700' : 'text-amber-400') : (isLight ? 'text-slate-500' : 'text-zinc-400')}`}>
                            {isSelected ? 'Selected Theme' : 'Click to Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Launch Tour Action Bar */}
                <div className={`pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-zinc-800/80'}`}>
                  <div className={`text-xs ${isLight ? 'text-slate-700' : 'text-zinc-400'}`}>
                    Selected: <strong className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{selectedThemeName || allThemes[0]?.name}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartAudienceTour}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20"
                  >
                    <PlayCircle className="w-5 h-5 fill-current" />
                    <span>Launch 3D Virtual Tour</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className={`px-8 py-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>You can switch between Researcher and Audience modes anytime from the top navigation bar.</span>
          </div>
          <button
            onClick={handleClose}
            className={`text-xs underline underline-offset-4 transition-colors ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Enter SPIS Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

