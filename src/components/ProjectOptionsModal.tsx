import React, { useState } from 'react';
import {
  Sliders,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Tag,
  Layers,
  ListFilter,
  Sparkles,
  Info,
  FileCode,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import {
  UiTheme,
  ProjectOptions,
  ProjectAttributeTemplate,
  DEFAULT_PROJECT_DISCIPLINES,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_ATTRIBUTE_TEMPLATES
} from '../types';

interface ProjectOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectOptions?: ProjectOptions;
  options?: ProjectOptions;
  onUpdateProjectOptions?: (options: ProjectOptions) => void;
  onSave?: (options: ProjectOptions) => void;
  uiTheme?: UiTheme;
  initialTab?: 'disciplines' | 'categories' | 'attributes';
}

export const ProjectOptionsModal: React.FC<ProjectOptionsModalProps> = ({
  isOpen,
  onClose,
  projectOptions: propProjectOptions,
  options: propOptions,
  onUpdateProjectOptions,
  onSave,
  uiTheme = 'dark',
  initialTab = 'disciplines'
}) => {
  const effectiveProjectOptions = propProjectOptions || propOptions;
  const [activeTab, setActiveTab] = useState<'disciplines' | 'categories' | 'attributes'>(initialTab);
  const isLight = uiTheme === 'light';

  // Local state safely initialized from projectOptions
  const [disciplines, setDisciplines] = useState<string[]>(
    effectiveProjectOptions?.disciplines || DEFAULT_PROJECT_DISCIPLINES
  );
  const [categories, setCategories] = useState<string[]>(
    effectiveProjectOptions?.categories || DEFAULT_PROJECT_CATEGORIES
  );
  const [attributeTemplates, setAttributeTemplates] = useState<ProjectAttributeTemplate[]>(
    effectiveProjectOptions?.attributeTemplates || DEFAULT_ATTRIBUTE_TEMPLATES
  );

  // New item inputs
  const [newDisciplineInput, setNewDisciplineInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrDefault, setNewAttrDefault] = useState('');
  const [newAttrDesc, setNewAttrDesc] = useState('');

  // Inline editing state
  const [editingDisciplineIdx, setEditingDisciplineIdx] = useState<number | null>(null);
  const [editingDisciplineValue, setEditingDisciplineValue] = useState('');

  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  const [editingAttrIdx, setEditingAttrIdx] = useState<number | null>(null);
  const [editingAttrKey, setEditingAttrKey] = useState('');
  const [editingAttrDefault, setEditingAttrDefault] = useState('');
  const [editingAttrDesc, setEditingAttrDesc] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state if projectOptions change externally
  React.useEffect(() => {
    if (effectiveProjectOptions) {
      setDisciplines(effectiveProjectOptions.disciplines || DEFAULT_PROJECT_DISCIPLINES);
      setCategories(effectiveProjectOptions.categories || DEFAULT_PROJECT_CATEGORIES);
      setAttributeTemplates(effectiveProjectOptions.attributeTemplates || DEFAULT_ATTRIBUTE_TEMPLATES);
    }
  }, [effectiveProjectOptions]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: ProjectOptions = {
      disciplines: disciplines.filter((d) => d.trim().length > 0),
      categories: categories.filter((c) => c.trim().length > 0),
      attributeTemplates: attributeTemplates.filter((a) => a.key.trim().length > 0)
    };
    if (onSave) {
      onSave(updated);
    } else if (onUpdateProjectOptions) {
      onUpdateProjectOptions(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 400);
  };

  // --- Discipline Handlers ---
  const handleAddDiscipline = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    const trimmed = newDisciplineInput.trim();
    if (!trimmed) return;
    if (disciplines.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setFormError(`Discipline "${trimmed}" already exists.`);
      return;
    }
    setDisciplines((prev) => [...prev, trimmed]);
    setNewDisciplineInput('');
  };

  const handleStartEditDiscipline = (index: number) => {
    setFormError(null);
    setEditingDisciplineIdx(index);
    setEditingDisciplineValue(disciplines[index]);
  };

  const handleSaveEditDiscipline = (index: number) => {
    setFormError(null);
    const trimmed = editingDisciplineValue.trim();
    if (trimmed) {
      setDisciplines((prev) => prev.map((d, i) => (i === index ? trimmed : d)));
    }
    setEditingDisciplineIdx(null);
  };

  const handleDeleteDiscipline = (index: number) => {
    setFormError(null);
    setDisciplines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetDisciplines = () => {
    setFormError(null);
    setDisciplines(DEFAULT_PROJECT_DISCIPLINES);
  };

  // --- Category Handlers ---
  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setFormError(`Category "${trimmed}" already exists.`);
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategoryInput('');
  };

  const handleStartEditCategory = (index: number) => {
    setFormError(null);
    setEditingCategoryIdx(index);
    setEditingCategoryValue(categories[index]);
  };

  const handleSaveEditCategory = (index: number) => {
    setFormError(null);
    const trimmed = editingCategoryValue.trim();
    if (trimmed) {
      setCategories((prev) => prev.map((c, i) => (i === index ? trimmed : c)));
    }
    setEditingCategoryIdx(null);
  };

  const handleDeleteCategory = (index: number) => {
    setFormError(null);
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetCategories = () => {
    setFormError(null);
    setCategories(DEFAULT_PROJECT_CATEGORIES);
  };

  // --- Attribute Template Handlers ---
  const handleAddAttributeTemplate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    const keyTrimmed = newAttrKey.trim();
    if (!keyTrimmed) return;
    if (attributeTemplates.some((a) => a.key.toLowerCase() === keyTrimmed.toLowerCase())) {
      setFormError(`Attribute template "${keyTrimmed}" already exists.`);
      return;
    }
    setAttributeTemplates((prev) => [
      ...prev,
      {
        key: keyTrimmed,
        defaultValue: newAttrDefault.trim(),
        description: newAttrDesc.trim()
      }
    ]);
    setNewAttrKey('');
    setNewAttrDefault('');
    setNewAttrDesc('');
  };

  const handleStartEditAttr = (index: number) => {
    setFormError(null);
    setEditingAttrIdx(index);
    setEditingAttrKey(attributeTemplates[index].key);
    setEditingAttrDefault(attributeTemplates[index].defaultValue || '');
    setEditingAttrDesc(attributeTemplates[index].description || '');
  };

  const handleSaveEditAttr = (index: number) => {
    setFormError(null);
    const keyTrimmed = editingAttrKey.trim();
    if (keyTrimmed) {
      setAttributeTemplates((prev) =>
        prev.map((a, i) =>
          i === index
            ? {
                key: keyTrimmed,
                defaultValue: editingAttrDefault.trim(),
                description: editingAttrDesc.trim()
              }
            : a
        )
      );
    }
    setEditingAttrIdx(null);
  };

  const handleDeleteAttribute = (index: number) => {
    setFormError(null);
    setAttributeTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetAttributes = () => {
    setFormError(null);
    setAttributeTemplates(DEFAULT_ATTRIBUTE_TEMPLATES);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D0D10] border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-sm shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Project Options & Variables
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono font-semibold uppercase">
                  Project Schemas
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Configure pre-determined layer disciplines, GIS categories, and auto-populated record attributes
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

        {/* Tab Navigation */}
        <div className={`px-6 pt-3 flex items-center gap-2 border-b ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-zinc-900/40 border-zinc-800'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('disciplines')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'disciplines'
                ? isLight
                  ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
                  : 'border-purple-500 text-purple-400 bg-zinc-900/90'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Layer Disciplines ({disciplines.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'categories'
                ? isLight
                  ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                  : 'border-blue-500 text-blue-400 bg-zinc-900/90'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <ListFilter className="w-4 h-4 text-blue-500" />
            <span>GIS Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'attributes'
                ? isLight
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
                  : 'border-emerald-500 text-emerald-400 bg-zinc-900/90'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-500" />
            <span>Record Attribute Templates ({attributeTemplates.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-semibold flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-600 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: LAYER DISCIPLINES */}
          {activeTab === 'disciplines' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isLight ? 'bg-purple-50/80 border-purple-200 text-purple-950' : 'bg-purple-950/20 border-purple-500/30 text-purple-200'
              }`}>
                <Layers className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm text-purple-400">Pre-determined Layer Disciplines</div>
                  <p className="opacity-90 leading-relaxed">
                    When researchers create or edit a new Spatial Discipline Layer, these disciplines will appear in the dropdown menu. Exporting and importing layers or projects will automatically carry and sync these options.
                  </p>
                </div>
              </div>

              {/* Add New Discipline Input Form */}
              <form onSubmit={handleAddDiscipline} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDisciplineInput}
                  onChange={(e) => setNewDisciplineInput(e.target.value)}
                  placeholder="Add new discipline (e.g. Geophysics, Epigraphy, Bioarchaeology)..."
                  className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-zinc-900 border-zinc-800 text-white focus:bg-zinc-950'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newDisciplineInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Discipline</span>
                </button>
              </form>

              {/* List of Disciplines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <span className="opacity-60 uppercase text-[10px] tracking-wider">Configured Disciplines</span>
                  <button
                    type="button"
                    onClick={handleResetDisciplines}
                    className="text-[11px] text-zinc-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {disciplines.map((disp, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isLight
                          ? 'bg-slate-50 hover:bg-white border-slate-200'
                          : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80'
                      }`}
                    >
                      {editingDisciplineIdx === idx ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingDisciplineValue}
                            onChange={(e) => setEditingDisciplineValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditDiscipline(idx)}
                            autoFocus
                            className={`w-full px-2 py-1 rounded-lg text-xs border outline-none ${
                              isLight ? 'bg-white border-purple-400' : 'bg-zinc-950 border-purple-500 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditDiscipline(idx)}
                            className="p-1 rounded bg-purple-600 text-white hover:bg-purple-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          <span className="text-xs font-semibold truncate">{disp}</span>
                        </div>
                      )}

                      {editingDisciplineIdx !== idx && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditDiscipline(idx)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Rename Discipline"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDiscipline(idx)}
                            className={`p-1.5 rounded-lg transition-colors text-rose-400 hover:text-rose-300 ${
                              isLight ? 'hover:bg-rose-100' : 'hover:bg-rose-950/40'
                            }`}
                            title="Remove Discipline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GIS CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isLight ? 'bg-blue-50/80 border-blue-200 text-blue-950' : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
              }`}>
                <ListFilter className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm text-blue-400">Pre-determined GIS Categories</div>
                  <p className="opacity-90 leading-relaxed">
                    These categories categorize spatial records (pins, polylines, polygons, sub-meshes). When a user creates or filters records, these categories will be populated and exported with your project files.
                  </p>
                </div>
              </div>

              {/* Add New Category Input Form */}
              <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Add new GIS category (e.g. Mortar Sample, Audio Guide, Thermal Scan)..."
                  className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-zinc-900 border-zinc-800 text-white focus:bg-zinc-950'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newCategoryInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>

              {/* List of Categories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <span className="opacity-60 uppercase text-[10px] tracking-wider">Configured GIS Categories</span>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="text-[11px] text-zinc-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isLight
                          ? 'bg-slate-50 hover:bg-white border-slate-200'
                          : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80'
                      }`}
                    >
                      {editingCategoryIdx === idx ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCategory(idx)}
                            autoFocus
                            className={`w-full px-2 py-1 rounded-lg text-xs border outline-none ${
                              isLight ? 'bg-white border-blue-400' : 'bg-zinc-950 border-blue-500 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditCategory(idx)}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-semibold truncate">{cat}</span>
                        </div>
                      )}

                      {editingCategoryIdx !== idx && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(idx)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Rename Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(idx)}
                            className={`p-1.5 rounded-lg transition-colors text-rose-400 hover:text-rose-300 ${
                              isLight ? 'hover:bg-rose-100' : 'hover:bg-rose-950/40'
                            }`}
                            title="Remove Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTRIBUTE TEMPLATES */}
          {activeTab === 'attributes' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isLight ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <Tag className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm text-emerald-400">Pre-determined Spatial Record Attributes</div>
                  <p className="opacity-90 leading-relaxed">
                    Define standard project attribute fields (e.g. <em>Surveyor</em>, <em>Date Recorded</em>, <em>Stratigraphic Unit</em>, <em>Condition Rating</em>). When any surveyor creates a new spatial record, these fields will automatically be populated in the attribute form ready to be filled out.
                  </p>
                </div>
              </div>

              {/* Add New Attribute Form */}
              <form onSubmit={handleAddAttributeTemplate} className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/70 border-zinc-800'
              }`}>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Attribute Template
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase opacity-70 mb-1">Attribute Name / Key *</label>
                    <input
                      type="text"
                      value={newAttrKey}
                      onChange={(e) => setNewAttrKey(e.target.value)}
                      placeholder="e.g. Stratigraphic Unit"
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase opacity-70 mb-1">Default Value (Optional)</label>
                    <input
                      type="text"
                      value={newAttrDefault}
                      onChange={(e) => setNewAttrDefault(e.target.value)}
                      placeholder="e.g. SU-001 or Pending"
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase opacity-70 mb-1">Hint / Description (Optional)</label>
                    <input
                      type="text"
                      value={newAttrDesc}
                      onChange={(e) => setNewAttrDesc(e.target.value)}
                      placeholder="e.g. Trench context layer ID"
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!newAttrKey.trim()}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Attribute Field</span>
                  </button>
                </div>
              </form>

              {/* List of Attribute Templates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <span className="opacity-60 uppercase text-[10px] tracking-wider">Configured Attribute Templates</span>
                  <button
                    type="button"
                    onClick={handleResetAttributes}
                    className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Defaults
                  </button>
                </div>

                <div className="space-y-2">
                  {attributeTemplates.map((attr, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        isLight
                          ? 'bg-slate-50 hover:bg-white border-slate-200'
                          : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80'
                      }`}
                    >
                      {editingAttrIdx === idx ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold opacity-70">Key Name</label>
                              <input
                                type="text"
                                value={editingAttrKey}
                                onChange={(e) => setEditingAttrKey(e.target.value)}
                                className={`w-full px-2 py-1 rounded-lg text-xs border ${
                                  isLight ? 'bg-white border-emerald-400' : 'bg-zinc-950 border-emerald-500 text-white'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold opacity-70">Default Value</label>
                              <input
                                type="text"
                                value={editingAttrDefault}
                                onChange={(e) => setEditingAttrDefault(e.target.value)}
                                className={`w-full px-2 py-1 rounded-lg text-xs border ${
                                  isLight ? 'bg-white border-emerald-400' : 'bg-zinc-950 border-emerald-500 text-white'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold opacity-70">Description / Hint</label>
                              <input
                                type="text"
                                value={editingAttrDesc}
                                onChange={(e) => setEditingAttrDesc(e.target.value)}
                                className={`w-full px-2 py-1 rounded-lg text-xs border ${
                                  isLight ? 'bg-white border-emerald-400' : 'bg-zinc-950 border-emerald-500 text-white'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingAttrIdx(null)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-zinc-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditAttr(idx)}
                              className="px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-xs font-mono ${
                                isLight ? 'text-emerald-700' : 'text-emerald-400'
                              }`}>
                                {attr.key}
                              </span>
                              {attr.defaultValue && (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                  isLight ? 'bg-slate-200 text-slate-800' : 'bg-zinc-800 text-zinc-300'
                                }`}>
                                  Default: &quot;{attr.defaultValue}&quot;
                                </span>
                              )}
                            </div>
                            {attr.description && (
                              <p className={`text-[11px] leading-tight ${
                                isLight ? 'text-slate-600' : 'text-zinc-400'
                              }`}>
                                {attr.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditAttr(idx)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                              }`}
                              title="Edit Attribute Field"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttribute(idx)}
                              className={`p-1.5 rounded-lg transition-colors text-rose-400 hover:text-rose-300 ${
                                isLight ? 'hover:bg-rose-100' : 'hover:bg-rose-950/40'
                              }`}
                              title="Remove Attribute Field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
          }`}
        >
          <div className={`text-xs flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Options are automatically bundled when exporting layers or full project archives.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                isLight
                  ? 'bg-slate-200/60 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-zinc-950" />
                  <span>Save Project Options</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
