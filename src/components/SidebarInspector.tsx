import React, { useState, useMemo } from 'react';
import {
  Layers,
  Palette,
  Sun,
  Play,
  Pause,
  Ruler,
  Eye,
  EyeOff,
  Target,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Box,
  CircleDot,
  Trash2,
  Sliders,
  SlidersHorizontal,
  X,
  Check,
  Upload,
  Image,
  Mountain,
  Grid,
  FileImage,
  RefreshCw,
  MapPin,
  Copy,
  Download,
  Zap,
  Cpu,
  RotateCw
} from 'lucide-react';
import * as THREE from 'three';
import { formatDistance } from '../utils/formatUnit';
import {
  MeshNodeInfo,
  RenderSettings,
  EnvironmentSettings,
  RenderMode,
  LightingPreset,
  BackgroundStyle,
  AnimationClipInfo,
  Measurement,
  MaterialOverride,
  UiTheme,
  AppViewMode
} from '../types';
import { extractSceneUvTextures, downloadDataUrlAsJpeg, ExportedUvTexture } from '../utils/textureExporter';

interface SidebarInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: MeshNodeInfo[];
  renderSettings: RenderSettings;
  onUpdateRenderSettings: (s: Partial<RenderSettings>) => void;
  envSettings: EnvironmentSettings;
  onUpdateEnvSettings: (e: Partial<EnvironmentSettings>) => void;
  isolatedNodeId: string | null;
  onIsolateNode: (id: string | null) => void;
  hiddenNodeIds: Set<string>;
  onToggleHideNode: (id: string) => void;
  highlightedNodeId: string | null;
  onHighlightNode: (id: string | null) => void;
  materialOverrides: Map<string, MaterialOverride>;
  onUpdateMaterialOverride: (nodeId: string, override: MaterialOverride) => void;
  animations: AnimationClipInfo[];
  activeAnimationIndex: number | null;
  onSelectAnimation: (index: number) => void;
  isPlayingAnimation: boolean;
  onTogglePlayAnimation: () => void;
  animationSpeed: number;
  onChangeAnimationSpeed: (speed: number) => void;
  measurements: Measurement[];
  onRemoveMeasurement: (id: string) => void;
  onClearMeasurements: () => void;
  onFocusMeasurement?: (m: Measurement) => void;
  onConvertMeasurementToAnnotation?: (m: Measurement) => void;
  uiTheme?: UiTheme;
  modelScene?: THREE.Object3D | null;
  onOpenGpuGuide?: () => void;
  viewMode?: AppViewMode;
}


export const SidebarInspector: React.FC<SidebarInspectorProps> = ({
  isOpen,
  onClose,
  hierarchy,
  renderSettings,
  onUpdateRenderSettings,
  envSettings,
  onUpdateEnvSettings,
  isolatedNodeId,
  onIsolateNode,
  hiddenNodeIds,
  onToggleHideNode,
  highlightedNodeId,
  onHighlightNode,
  materialOverrides,
  onUpdateMaterialOverride,
  animations,
  activeAnimationIndex,
  onSelectAnimation,
  isPlayingAnimation,
  onTogglePlayAnimation,
  animationSpeed,
  onChangeAnimationSpeed,
  measurements,
  onRemoveMeasurement,
  onClearMeasurements,
  onFocusMeasurement,
  onConvertMeasurementToAnnotation,
  uiTheme = 'dark',
  modelScene,
  onOpenGpuGuide,
  viewMode = 'researcher'
}) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'display' | 'materials' | 'environment' | 'animations' | 'measurements'>(
    viewMode === 'audience' ? 'display' : 'hierarchy'
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [targetScope, setTargetScope] = useState<'global' | 'selected'>('global');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const extractedUvTextures = useMemo(() => {
    return extractSceneUvTextures(modelScene);
  }, [modelScene]);

  if (!isOpen) return null;

  const isLight = uiTheme === 'light';

  const measUnit = renderSettings.measurementUnit || 'm';
  const measTotalMeters = measurements.reduce((acc, m) => acc + m.distance, 0);
  const measAvgMeters = measurements.length > 0 ? measTotalMeters / measurements.length : 0;
  const measMaxMeters = measurements.length > 0 ? Math.max(...measurements.map(m => m.distance)) : 0;

  return (
    <aside
      className={`absolute top-16 right-4 bottom-20 z-30 w-full max-w-[calc(100vw-2rem)] sm:w-[380px] backdrop-blur-2xl border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
          : 'bg-[#0C0C0E]/95 border-zinc-800 text-zinc-200 shadow-black/80'
      }`}
    >
      {/* Top Header */}
      <div className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#09090B]/60 border-zinc-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl border ${
            isLight ? 'bg-purple-100 border-purple-200 text-purple-600' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
          }`}>
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Scene & Model Options
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-500 font-mono font-semibold">
                {hierarchy.length} Nodes
              </span>
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Hierarchy, display, materials, lighting & scene controls
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${
            isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Close Options Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Tabs 2-Row Grid Navigation Bar */}
      <div className={`p-2.5 border-b grid grid-cols-3 gap-1.5 text-xs shrink-0 ${
        isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#09090B]/60 border-zinc-800'
      }`}>
        {[
          { id: 'hierarchy', label: 'Hierarchy', icon: Layers, color: 'text-blue-500', title: '3D Mesh Hierarchy Tree' },
          { id: 'display', label: 'Display', icon: Eye, color: 'text-cyan-500', title: 'Display Styles, Speed & Performance' },
          { id: 'materials', label: 'Materials', icon: Palette, color: 'text-pink-500', title: 'PBR Material & UV Texture Customizer' },
          { id: 'environment', label: 'Lighting', icon: Sun, color: 'text-amber-500', title: 'Lighting Presets, Environment & Helpers' },
          { id: 'measurements', label: 'Measure', icon: Ruler, color: 'text-purple-400', title: 'Measured Distances Log' },
          ...(animations.length > 0 ? [{ id: 'animations', label: 'Animations', icon: Play, color: 'text-emerald-500', title: 'Animation Clips & Speeds' }] : [])
        ]
          .filter((tab) => {
            if (viewMode === 'audience') {
              return tab.id !== 'hierarchy' && tab.id !== 'materials';
            }
            return true;
          })
          .map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              title={tab.title}
              className={`px-2 py-1.5 flex items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                isActive
                  ? isLight
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80 font-bold'
                    : 'bg-blue-600/90 text-white shadow-md shadow-blue-600/25 font-bold border border-blue-500/50'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive && !isLight ? 'text-white' : tab.color}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
        {/* Tab 1: Hierarchy Tree */}
        {activeTab === 'hierarchy' && (
          <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
            isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800/80">
              <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Model Structure ({hierarchy.length} Nodes)</span>
              </span>
              {isolatedNodeId && (
                <button
                  onClick={() => onIsolateNode(null)}
                  className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Target className="w-3 h-3" />
                  <span>Show All</span>
                </button>
              )}
            </div>

            {hierarchy.length === 0 ? (
              <p className={`italic py-4 text-center ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                No mesh hierarchy nodes detected.
              </p>
            ) : (
              <div className="space-y-1">
                {hierarchy.map((node) => (
                  <HierarchyTreeNode
                    key={node.id}
                    node={node}
                    isolatedNodeId={isolatedNodeId}
                    onIsolateNode={onIsolateNode}
                    hiddenNodeIds={hiddenNodeIds}
                    onToggleHideNode={onToggleHideNode}
                    highlightedNodeId={highlightedNodeId}
                    onHighlightNode={onHighlightNode}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                    isLight={isLight}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Display & Camera Options */}
        {activeTab === 'display' && (
          <div className="space-y-3.5">
            {/* Render Modes Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Box className="w-4 h-4 text-cyan-500" />
                  <span>Render Style</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-500 font-semibold uppercase">
                  {renderSettings.mode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'shaded', label: 'Shaded', desc: 'PBR Shading & Textures', icon: Box },
                  { id: 'wireframe', label: 'Wireframe', desc: 'Polygon Mesh Edges', icon: Grid },
                  { id: 'vertice', label: 'Vertices', desc: 'Point Cloud Vertices', icon: CircleDot },
                  { id: 'xray', label: 'X-Ray', desc: 'Translucent Internal View', icon: Layers }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = renderSettings.mode === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => onUpdateRenderSettings({ mode: item.id as RenderMode })}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          : 'bg-zinc-900/90 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-cyan-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-none mb-1">{item.label}</div>
                        <div className={`text-[10px] leading-tight truncate ${isSelected ? 'text-blue-100' : isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Point Size slider for Vertices mode */}
              {renderSettings.mode === 'vertice' && (
                <div className={`mt-2 p-2.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-zinc-900/90 border-zinc-800'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      <CircleDot className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Vertex Point Size</span>
                    </span>
                    <span className="font-mono text-blue-500 font-bold">{(renderSettings.pointSize || 2.5).toFixed(1)}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    value={renderSettings.pointSize || 2.5}
                    onChange={(e) => onUpdateRenderSettings({ pointSize: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1.5 rounded-lg cursor-pointer bg-zinc-800"
                  />
                </div>
              )}
            </div>

            {/* Metric-Based Marker Scale Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Ruler className="w-4 h-4 text-blue-500" />
                  <span>3D Marker Metric Scaling</span>
                </span>
                <span className="text-blue-500 font-mono text-xs font-bold">
                  {(renderSettings.markerScale || 1.0).toFixed(2)}x
                </span>
              </div>

              {/* Metric Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Micro', val: 0.1, desc: '0.05%' },
                  { label: 'Compact', val: 0.4, desc: '0.2%' },
                  { label: 'Auto', val: 1.0, desc: '0.5%' },
                  { label: 'Large', val: 2.5, desc: '1.25%' }
                ].map((p) => {
                  const isAct = Math.abs((renderSettings.markerScale || 1.0) - p.val) < 0.1;
                  return (
                    <button
                      key={p.label}
                      onClick={() => onUpdateRenderSettings({ markerScale: p.val })}
                      className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                        isAct
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <div className="text-[10px] leading-tight font-bold">{p.label}</div>
                      <div className={`text-[9px] ${isAct ? 'text-blue-100' : isLight ? 'text-slate-400' : 'text-zinc-500'}`}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>

              <input
                type="range"
                min="0.05"
                max="3.0"
                step="0.05"
                value={renderSettings.markerScale || 1.0}
                onChange={(e) => onUpdateRenderSettings({ markerScale: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 rounded-lg cursor-pointer h-1.5 bg-zinc-800"
              />

              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                Dynamically scales 3D GIS pins, vertices, and measurement spheres proportionally to model dimensions.
              </p>
            </div>

            {/* Through-Mesh Occlusion / X-Ray Visibility Card */}
            <div className={`p-3.5 border rounded-2xl space-y-2.5 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Subsurface / Through-Mesh Ghosting</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  renderSettings.markerOcclusionGhost !== false
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {renderSettings.markerOcclusionGhost !== false ? 'ENABLED' : 'OFF'}
                </span>
              </div>

              <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                renderSettings.markerOcclusionGhost !== false
                  ? isLight
                    ? 'bg-cyan-50/80 border-cyan-200 text-slate-900 font-semibold'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 font-medium'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                <div className="pr-2">
                  <div className="text-xs font-bold">X-Ray See-Through Behind Mesh</div>
                  <div className={`text-[10px] mt-0.5 leading-snug ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Renders faded ghost outlines when polylines, polygons, or markers dip behind uneven scan surfaces.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={renderSettings.markerOcclusionGhost !== false}
                  onChange={(e) => onUpdateRenderSettings({ markerOcclusionGhost: e.target.checked })}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer shrink-0"
                />
              </label>
            </div>

            {/* Terrain Flight Speed Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Mountain className="w-4 h-4 text-emerald-500" />
                  <span>Terrain Camera Flight Speed</span>
                </span>
                <span className="text-emerald-500 font-mono text-xs font-bold">
                  {(renderSettings.terrainSpeedMultiplier || 1.0).toFixed(1)}x
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: '0.1x', val: 0.1, desc: 'Ultra' },
                  { label: '0.25x', val: 0.25, desc: 'Creep' },
                  { label: '0.5x', val: 0.5, desc: 'Slow' },
                  { label: '1.0x', val: 1.0, desc: 'Norm' },
                  { label: '2.0x', val: 2.0, desc: 'Fast' }
                ].map((sp) => {
                  const isAct = Math.abs((renderSettings.terrainSpeedMultiplier || 1.0) - sp.val) < 0.05;
                  return (
                    <button
                      key={sp.label}
                      type="button"
                      onClick={() => onUpdateRenderSettings({ terrainSpeedMultiplier: sp.val })}
                      className={`py-1.5 px-0.5 rounded-xl text-center transition-all ${
                        isAct
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <div className="text-[10px] font-bold leading-tight">{sp.label}</div>
                      <div className={`text-[8px] truncate ${isAct ? 'text-emerald-100' : isLight ? 'text-slate-500' : 'text-zinc-400'}`}>{sp.desc}</div>
                    </button>
                  );
                })}
              </div>

              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={renderSettings.terrainSpeedMultiplier || 1.0}
                onChange={(e) => onUpdateRenderSettings({ terrainSpeedMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 rounded-lg cursor-pointer h-1.5 bg-zinc-800"
              />
            </div>

            {/* Performance Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-amber-50/80 border-amber-200/80' : 'bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-zinc-950 border-amber-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-2 text-amber-500">
                  <Zap className="w-4 h-4" />
                  <span>Heavy Mesh Performance</span>
                </span>
                {onOpenGpuGuide && (
                  <button
                    onClick={onOpenGpuGuide}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    title="View NVIDIA & Discrete GPU Routing Instructions"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>GPU Guide</span>
                  </button>
                )}
              </div>

              <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                renderSettings.performanceMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
              }`}>
                <div>
                  <div className="font-bold text-xs">Fast Photogrammetry Mode</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>Disables shadow maps & throttles raycaster</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!renderSettings.performanceMode}
                  onChange={(e) => onUpdateRenderSettings({ performanceMode: e.target.checked })}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <div className="space-y-1">
                <div className={`flex justify-between text-[11px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  <span className="font-semibold">Render Scale</span>
                  <span className="font-mono font-bold text-amber-500">{renderSettings.resolutionScale || 1.0}x</span>
                </div>
                <select
                  value={renderSettings.resolutionScale || 1.0}
                  onChange={(e) => onUpdateRenderSettings({ resolutionScale: parseFloat(e.target.value) })}
                  className={`w-full text-xs rounded-xl p-2 border font-mono ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <option value={0.75}>0.75x (Performance / Heavy Scans)</option>
                  <option value={1.0}>1.0x (Balanced Standard)</option>
                  <option value={1.25}>1.25x (High Quality)</option>
                  <option value={1.5}>1.5x (Ultra Native)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Materials & Textures */}
        {activeTab === 'materials' && (
          <div className="space-y-3.5">
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Palette className="w-4 h-4 text-pink-500" />
                  <span>Material & Texture Editor</span>
                </span>
                <span className="text-[10px] text-pink-500 font-mono font-bold uppercase">
                  {targetScope === 'global' || !selectedNodeId ? 'Global' : `Node #${selectedNodeId.slice(-4)}`}
                </span>
              </div>

              {/* Target Scope Switcher */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setTargetScope('global')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                    targetScope === 'global' || !selectedNodeId
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Model Meshes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedNodeId) setTargetScope('selected');
                  }}
                  disabled={!selectedNodeId}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                    targetScope === 'selected' && selectedNodeId
                      ? 'bg-purple-600 text-white shadow-xs font-bold'
                      : selectedNodeId
                      ? isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'
                      : 'opacity-40 cursor-not-allowed text-zinc-500'
                  }`}
                >
                  {selectedNodeId ? `Node #${selectedNodeId.slice(-4)}` : 'Select Node in Tree'}
                </button>
              </div>

              {/* Active Scope Material Customizer */}
              <MaterialTweaker
                nodeId={targetScope === 'selected' && selectedNodeId ? selectedNodeId : '__GLOBAL__'}
                isGlobal={!(targetScope === 'selected' && selectedNodeId)}
                override={materialOverrides.get(targetScope === 'selected' && selectedNodeId ? selectedNodeId : '__GLOBAL__')}
                onUpdate={(ov) => onUpdateMaterialOverride(targetScope === 'selected' && selectedNodeId ? selectedNodeId : '__GLOBAL__', ov)}
                isLight={isLight}
              />
            </div>

            {/* Extracted / Preloaded Model UV Textures Gallery */}
            {extractedUvTextures.length > 0 && (
              <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
                isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`font-bold text-xs flex items-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-zinc-100'
                  }`}>
                    <Image className="w-4 h-4 text-blue-500" />
                    <span>Preloaded UV Textures ({extractedUvTextures.length})</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-mono font-semibold">
                    Auto-Embedded
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {extractedUvTextures.map((tex, idx) => (
                    <div
                      key={`${tex.meshUuid || ''}_${tex.meshName}_${tex.textureType}_${idx}`}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                        isLight ? 'bg-white border-slate-200' : 'bg-zinc-900/90 border-zinc-800'
                      }`}
                    >
                      <img
                        src={tex.dataUrl}
                        alt={tex.meshName || 'Texture'}
                        className="w-10 h-10 object-cover rounded-lg border border-blue-500/30 shrink-0 bg-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-[11px] truncate ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                          {tex.meshName || 'Mesh'}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <span className="uppercase text-[9px] px-1 rounded bg-blue-500/10 text-blue-400 font-mono">
                            {tex.textureType}
                          </span>
                          <span className="truncate">{tex.materialName || 'Material'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadDataUrlAsJpeg(tex.dataUrl, `${(tex.meshName || 'mesh').replace(/\s+/g, '_')}_${tex.textureType}.jpg`)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                        title="Download UV Texture as JPG File"
                      >
                        <Download className="w-3 h-3" />
                        <span>JPG</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Environment & Lighting Settings */}
        {activeTab === 'environment' && (
          <div className="space-y-3.5">
            {/* Preset Lighting Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Lighting Preset</span>
                </span>
                <span className="text-amber-500 font-mono text-xs font-bold capitalize">
                  {envSettings.lighting}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['studio', 'daylight', 'sunset', 'cyberpunk', 'dramatic'] as LightingPreset[]).map((lp) => (
                  <button
                    key={lp}
                    onClick={() => onUpdateEnvSettings({ lighting: lp })}
                    className={`p-2.5 rounded-xl border font-semibold capitalize text-left flex items-center justify-between transition-all ${
                      envSettings.lighting === lp
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{lp}</span>
                    {envSettings.lighting === lp && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>

              {/* Light Brightness Slider */}
              <div className={`pt-2.5 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
                <div className={`flex justify-between font-bold text-xs ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                  <span>Light Brightness</span>
                  <span className="text-blue-500 font-mono">{Math.round(envSettings.lightIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={envSettings.lightIntensity}
                  onChange={(e) => onUpdateEnvSettings({ lightIntensity: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 rounded-lg cursor-pointer h-1.5 bg-zinc-800"
                />
              </div>
            </div>

            {/* Backdrop Atmosphere Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>Backdrop Atmosphere</span>
                </span>
                <span className="text-purple-400 font-mono text-xs font-bold capitalize">
                  {envSettings.background}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['dark', 'studio', 'light', 'grid', 'gradient'] as BackgroundStyle[]).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => onUpdateEnvSettings({ background: bg })}
                    className={`p-2.5 rounded-xl border font-semibold capitalize text-left flex items-center justify-between transition-all ${
                      envSettings.background === bg
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{bg}</span>
                    {envSettings.background === bg && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Rotate Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  <RotateCw className="w-4 h-4 text-blue-500" />
                  <span>Continuous Auto-Rotate</span>
                </span>
                <input
                  type="checkbox"
                  checked={envSettings.autoRotate}
                  onChange={(e) => onUpdateEnvSettings({ autoRotate: e.target.checked })}
                  className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {envSettings.autoRotate && (
                <div className="space-y-1.5 pt-1">
                  <div className={`flex justify-between text-xs font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    <span>Rotation Speed</span>
                    <span className="text-blue-500 font-mono">{envSettings.autoRotateSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.2"
                    value={envSettings.autoRotateSpeed}
                    onChange={(e) => onUpdateEnvSettings({ autoRotateSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 rounded-lg cursor-pointer h-1.5 bg-zinc-800"
                  />
                </div>
              )}
            </div>

            {/* Canvas Helpers Card */}
            <div className={`p-3.5 border rounded-2xl space-y-2.5 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <span className={`font-bold text-xs flex items-center gap-2 mb-1 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Canvas Helpers & Overlays</span>
              </span>

              {[
                { label: 'Ground Grid Floor', val: renderSettings.showGrid, key: 'showGrid' },
                { label: 'Drop Shadows', val: renderSettings.showShadows, key: 'showShadows' },
                { label: 'Bounding Box Frame', val: renderSettings.showBoundingBox, key: 'showBoundingBox' },
                { label: 'XYZ Axes Indicator', val: renderSettings.showAxes, key: 'showAxes' }
              ].map((h) => (
                <label key={h.key} className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-900/90 border-zinc-800/80 text-zinc-300'
                }`}>
                  <span className="font-semibold text-xs">{h.label}</span>
                  <input
                    type="checkbox"
                    checked={h.val}
                    onChange={(e) => onUpdateRenderSettings({ [h.key]: e.target.checked })}
                    className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Animations */}
        {activeTab === 'animations' && animations.length > 0 && (
          <div className="space-y-3.5">
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <span className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                <Play className="w-4 h-4 text-emerald-500" />
                <span>Animation Track</span>
              </span>

              <select
                value={activeAnimationIndex ?? 0}
                onChange={(e) => onSelectAnimation(parseInt(e.target.value, 10))}
                className={`w-full border rounded-xl px-3 py-2 font-bold text-xs focus:outline-none focus:border-blue-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-white'
                }`}
              >
                {animations.map((clip) => (
                  <option key={clip.index} value={clip.index}>
                    {clip.name} ({clip.duration}s)
                  </option>
                ))}
              </select>

              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
              }`}>
                <button
                  onClick={onTogglePlayAnimation}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md shadow-blue-600/30"
                >
                  {isPlayingAnimation ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isPlayingAnimation ? 'Playing Animation' : 'Paused'}
                  </div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Speed: {animationSpeed}x
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className={`block font-bold text-xs ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>Playback Speed</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.25, 0.5, 1.0, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChangeAnimationSpeed(s)}
                      className={`py-2 rounded-xl font-bold text-center transition-colors ${
                        animationSpeed === s
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight
                          ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Measurements */}
        {activeTab === 'measurements' && (
          <div className="space-y-3.5">
            {/* Unit Selection Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-zinc-100'
                }`}>
                  <Ruler className="w-4 h-4 text-purple-400" />
                  <span>Measurement Unit</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  (renderSettings.measurementUnit || 'm') === 'cm'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                }`}>
                  {(renderSettings.measurementUnit || 'm') === 'cm' ? 'Centimeters (cm)' : 'Meters (m)'}
                </span>
              </div>

              {/* Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateRenderSettings({ measurementUnit: 'm' })}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    (renderSettings.measurementUnit || 'm') === 'm'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <span>Meters (m)</span>
                </button>
                <button
                  onClick={() => onUpdateRenderSettings({ measurementUnit: 'cm' })}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    renderSettings.measurementUnit === 'cm'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <span>Centimeters (cm)</span>
                </button>
              </div>
              <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                {(renderSettings.measurementUnit || 'm') === 'cm'
                  ? 'Displays distance values in centimeters (1 m = 100 cm).'
                  : 'Displays distance values in standard meters (1 unit = 1 m).'}
              </p>
            </div>

            {/* Recorded Segments List Card */}
            <div className={`p-3.5 border rounded-2xl space-y-3 shadow-xs ${
              isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-[#09090B]/80 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800/80">
                <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                  Recorded Segments ({measurements.length})
                </span>
                {viewMode === 'researcher' && measurements.length > 0 && (
                  <button
                    onClick={onClearMeasurements}
                    className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-[11px] font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {measurements.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Ruler className={`w-8 h-8 mx-auto opacity-50 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <p className={`font-bold text-xs ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>No active measurements.</p>
                  <p className={`text-[11px] max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    Use the Ruler tool in the toolbar to click two points on the 3D surface to measure distance!
                  </p>
                </div>
              ) : (
              <div className="space-y-3">
                {/* Calculated Totals Banner */}
                <div className={`p-3 border rounded-xl space-y-2 ${
                  isLight ? 'bg-blue-50/50 border-blue-200/60' : 'bg-blue-950/20 border-blue-800/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-semibold ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
                      Measurement Analytics
                    </span>
                    <button
                      onClick={() => {
                        const reportLines = [
                          `=== 3D MEASUREMENT REPORT ===`,
                          `Total Segments: ${measurements.length}`,
                          `Unit System: ${measUnit === 'cm' ? 'Centimeters' : 'Meters'}`,
                          `Total Length: ${formatDistance(measTotalMeters, measUnit)}`,
                          `Average Length: ${formatDistance(measAvgMeters, measUnit)}`,
                          `Max Segment: ${formatDistance(measMaxMeters, measUnit)}`,
                          ``,
                          `Segments Breakdown:`,
                          ...measurements.map((m, idx) =>
                            `#${idx + 1}: ${formatDistance(m.distance, measUnit)} | P1(${m.p1.x.toFixed(2)}, ${m.p1.y.toFixed(2)}, ${m.p1.z.toFixed(2)}) -> P2(${m.p2.x.toFixed(2)}, ${m.p2.y.toFixed(2)}, ${m.p2.z.toFixed(2)})`
                          )
                        ].join('\n');
                        navigator.clipboard.writeText(reportLines);
                        setCopiedReport(true);
                        setTimeout(() => setCopiedReport(false), 2000);
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedReport ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedReport ? 'Report Copied!' : 'Copy Report'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-white border-blue-100' : 'bg-[#09090B] border-zinc-800'}`}>
                      <div className={`text-[9px] uppercase font-bold ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Total</div>
                      <div className="font-bold text-xs text-blue-500">{formatDistance(measTotalMeters, measUnit)}</div>
                    </div>
                    <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-white border-blue-100' : 'bg-[#09090B] border-zinc-800'}`}>
                      <div className={`text-[9px] uppercase font-bold ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Average</div>
                      <div className="font-bold text-xs text-blue-500">{formatDistance(measAvgMeters, measUnit)}</div>
                    </div>
                    <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-white border-blue-100' : 'bg-[#09090B] border-zinc-800'}`}>
                      <div className={`text-[9px] uppercase font-bold ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Max</div>
                      <div className="font-bold text-xs text-blue-500">{formatDistance(measMaxMeters, measUnit)}</div>
                    </div>
                  </div>
                </div>

                {/* Individual Measurement Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {measurements.map((m, idx) => {
                    const unit = renderSettings.measurementUnit || 'm';
                    const itemColor = m.color || '#38bdf8';
                    const formattedVal = formatDistance(m.distance, unit);

                    return (
                      <div
                        key={m.id}
                        className={`p-3 border rounded-xl space-y-2 transition-all ${
                          isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-[#09090B]/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: itemColor }}
                            />
                            <div>
                              <div className="font-bold text-xs text-blue-500 font-mono">
                                #{idx + 1}: {formattedVal}
                              </div>
                              <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                                P1: ({m.p1.x.toFixed(2)}, {m.p1.y.toFixed(2)}, {m.p1.z.toFixed(2)}) → P2: ({m.p2.x.toFixed(2)}, {m.p2.y.toFixed(2)}, {m.p2.z.toFixed(2)})
                              </div>
                            </div>
                          </div>
                          {viewMode === 'researcher' && (
                            <button
                              onClick={() => onRemoveMeasurement(m.id)}
                              className="p-1 text-zinc-400 hover:text-rose-500 rounded transition-colors"
                              title="Delete measurement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Actions for Measurement */}
                        <div className={`grid ${viewMode === 'researcher' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 pt-1 border-t border-zinc-800/40`}>
                          {onFocusMeasurement && (
                            <button
                              onClick={() => onFocusMeasurement(m)}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center justify-center gap-1 transition-colors ${
                                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-[#141418] hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                              }`}
                              title="Focus 3D camera on measurement line"
                            >
                              <Target className="w-3 h-3 text-blue-400" />
                              Focus
                            </button>
                          )}

                          {viewMode === 'researcher' && onConvertMeasurementToAnnotation && (
                            <button
                              onClick={() => onConvertMeasurementToAnnotation(m)}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center justify-center gap-1 transition-colors ${
                                isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/60'
                              }`}
                              title="Convert to Spatial GIS Pin Annotation"
                            >
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              Save Pin
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const detail = `Distance: ${formattedVal} | P1: (${m.p1.x.toFixed(2)}, ${m.p1.y.toFixed(2)}, ${m.p1.z.toFixed(2)}) -> P2: (${m.p2.x.toFixed(2)}, ${m.p2.y.toFixed(2)}, ${m.p2.z.toFixed(2)})`;
                              navigator.clipboard.writeText(detail);
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center justify-center gap-1 transition-colors ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-[#141418] hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                            }`}
                            title="Copy details to clipboard"
                          >
                            <Copy className="w-3 h-3 text-amber-400" />
                            Copy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// Subcomponent: Hierarchy Tree Node
interface HierarchyTreeNodeProps {
  node: MeshNodeInfo;
  isolatedNodeId: string | null;
  onIsolateNode: (id: string | null) => void;
  hiddenNodeIds: Set<string>;
  onToggleHideNode: (id: string) => void;
  highlightedNodeId: string | null;
  onHighlightNode: (id: string | null) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  isLight?: boolean;
}

const HierarchyTreeNode: React.FC<HierarchyTreeNodeProps> = ({
  node,
  isolatedNodeId,
  onIsolateNode,
  hiddenNodeIds,
  onToggleHideNode,
  highlightedNodeId,
  onHighlightNode,
  selectedNodeId,
  onSelectNode,
  isLight = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isHidden = hiddenNodeIds.has(node.id);
  const isIsolated = isolatedNodeId === node.id;
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="text-xs">
      <div
        className={`flex items-center justify-between p-1.5 rounded-lg transition-colors group cursor-pointer ${
          isSelected
            ? isLight ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold' : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
            : isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-zinc-800/80 text-zinc-300'
        }`}
        onMouseEnter={() => onHighlightNode(node.id)}
        onMouseLeave={() => onHighlightNode(null)}
        onClick={() => onSelectNode(node.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-500 hover:text-zinc-200'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />

          <span className="font-medium truncate max-w-[130px]" title={node.name}>
            {node.name}
          </span>

          {node.triangleCount > 0 && (
            <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              ({node.triangleCount.toLocaleString()} tris)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          {/* Hide/Show toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleHideNode(node.id);
            }}
            className={`p-1 rounded transition-colors ${
              isLight
                ? isHidden ? 'text-slate-300' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : isHidden ? 'text-zinc-600' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title={isHidden ? 'Show Node' : 'Hide Node'}
          >
            {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>

          {/* Isolate Node button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIsolateNode(isIsolated ? null : node.id);
            }}
            className={`p-1 rounded transition-colors ${
              isIsolated
                ? 'text-amber-500 font-bold'
                : isLight
                ? 'text-slate-400 hover:text-amber-600 hover:bg-slate-200'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title="Isolate Mesh"
          >
            <Target className="w-3 h-3" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className={`ml-3 pl-2 border-l space-y-1 mt-1 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
          {node.children!.map((child) => (
            <HierarchyTreeNode
              key={child.id}
              node={child}
              isolatedNodeId={isolatedNodeId}
              onIsolateNode={onIsolateNode}
              hiddenNodeIds={hiddenNodeIds}
              onToggleHideNode={onToggleHideNode}
              highlightedNodeId={highlightedNodeId}
              onHighlightNode={onHighlightNode}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              isLight={isLight}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Subcomponent: Material & UV Texture Tweaker Form
interface MaterialTweakerProps {
  nodeId: string;
  isGlobal?: boolean;
  override?: MaterialOverride;
  onUpdate: (ov: MaterialOverride) => void;
  isLight?: boolean;
}

const MaterialTweaker: React.FC<MaterialTweakerProps> = ({
  nodeId,
  isGlobal = false,
  override,
  onUpdate,
  isLight = false
}) => {
  const color = override?.color || '#ffffff';
  const roughness = override?.roughness ?? 0.5;
  const metalness = override?.metalness ?? 0.2;
  const opacity = override?.opacity ?? 1.0;
  const textureUrl = override?.textureUrl;
  const textureName = override?.textureName;
  const repeatU = override?.repeatU ?? 1.0;
  const repeatV = override?.repeatV ?? 1.0;
  const flipY = override?.flipY ?? true;
  const normalMapUrl = override?.normalMapUrl;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'texture' | 'normal') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (field === 'texture') {
        onUpdate({
          ...override,
          textureUrl: dataUrl,
          textureName: file.name
        });
      } else {
        onUpdate({
          ...override,
          normalMapUrl: dataUrl,
          normalMapName: file.name
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Scope Banner */}
      <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-[11px] ${
        isGlobal
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 font-semibold'
          : 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-semibold'
      }`}>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGlobal ? 'Global Target: All Model Meshes' : `Mesh Target: #${nodeId.slice(-6)}`}</span>
        </span>
        {isGlobal && <span className="text-[10px] opacity-80">(Ideal for .OBJ)</span>}
      </div>

      {/* UV Texture Map Section */}
      <div className={`p-3 rounded-xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#09090B] border-zinc-800'
      }`}>
        <div className="flex items-center justify-between">
          <label className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
            <Image className="w-3.5 h-3.5 text-blue-500" />
            <span>UV Texture Map (Albedo / Diffuse)</span>
          </label>
          {textureUrl && (
            <button
              type="button"
              onClick={() => onUpdate({ ...override, textureUrl: undefined, textureName: undefined })}
              className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
              title="Remove Texture Map"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Upload Custom Texture File */}
        <div className="flex items-center gap-2">
          <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed cursor-pointer transition-all ${
            isLight
              ? 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
              : 'bg-zinc-900/80 border-zinc-700 hover:border-blue-500/60 hover:bg-zinc-800 text-zinc-300'
          }`}>
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-[11px]">Upload Image (.png, .jpg, .webp)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'texture')}
            />
          </label>
        </div>

        {/* Active Texture Preview Thumbnail */}
        {textureUrl && (
          <div className={`p-2 rounded-xl border flex items-center gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <img
              src={textureUrl}
              alt="UV Texture Preview"
              className="w-12 h-12 object-cover rounded-lg border border-blue-500/40 shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className={`font-semibold truncate text-[11px] ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                {textureName || 'Custom UV Texture Map'}
              </div>
              <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3" /> UV Map Active
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadDataUrlAsJpeg(textureUrl, textureName || 'uv_texture_map.jpg')}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors shrink-0"
              title="Download Texture as JPG File"
            >
              <Download className="w-3 h-3" />
              <span>JPG</span>
            </button>
          </div>
        )}

        {/* UV Tiling & Mapping Controls */}
        {textureUrl && (
          <div className={`pt-2 border-t space-y-2.5 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
            <div className="font-semibold text-[11px] flex items-center justify-between">
              <span>UV Tiling (Repeat U/V)</span>
              <span className="text-blue-500 font-mono text-[10px]">{repeatU.toFixed(1)}x / {repeatV.toFixed(1)}x</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[10px] mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Tile Width (U)</label>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={repeatU}
                  onChange={(e) => onUpdate({ ...override, repeatU: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className={`block text-[10px] mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Tile Height (V)</label>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={repeatV}
                  onChange={(e) => onUpdate({ ...override, repeatV: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer text-[11px]">
              <span className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Invert Vertical (Flip Y)</span>
              <input
                type="checkbox"
                checked={flipY}
                onChange={(e) => onUpdate({ ...override, flipY: e.target.checked })}
                className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Surface Shading & Base Color */}
      <div className={`p-3 rounded-xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#09090B] border-zinc-800'
      }`}>
        <label className={`font-bold block ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
          Base Tint & PBR Material
        </label>

        {/* Color Tint */}
        <div className="flex items-center justify-between">
          <label className={`font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Color Tint</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => onUpdate({ ...override, color: e.target.value })}
              className="w-7 h-7 rounded-lg bg-transparent border border-slate-300 dark:border-zinc-800 cursor-pointer p-0"
            />
            <span className={`font-mono uppercase font-semibold text-[11px] ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>{color}</span>
            {color !== '#ffffff' && (
              <button
                type="button"
                onClick={() => onUpdate({ ...override, color: '#ffffff' })}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Roughness */}
        <div>
          <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span>Roughness</span>
            <span className="font-mono text-blue-500 font-bold">{Math.round(roughness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={roughness}
            onChange={(e) => onUpdate({ ...override, roughness: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 rounded-lg cursor-pointer h-1.5"
          />
        </div>

        {/* Metalness */}
        <div>
          <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span>Metalness</span>
            <span className="font-mono text-blue-500 font-bold">{Math.round(metalness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={metalness}
            onChange={(e) => onUpdate({ ...override, metalness: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 rounded-lg cursor-pointer h-1.5"
          />
        </div>

        {/* Opacity */}
        <div>
          <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span>Opacity</span>
            <span className="font-mono text-blue-500 font-bold">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => onUpdate({ ...override, opacity: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 rounded-lg cursor-pointer h-1.5"
          />
        </div>
      </div>

      {/* Surface Normal Map (Optional) */}
      <div className={`p-3 rounded-xl border space-y-2 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#09090B] border-zinc-800'
      }`}>
        <div className="flex items-center justify-between">
          <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Normal Bump Map (Optional)</span>
          </label>
          {normalMapUrl && (
            <button
              type="button"
              onClick={() => onUpdate({ ...override, normalMapUrl: undefined, normalMapName: undefined })}
              className="text-[10px] text-rose-400 hover:text-rose-300"
            >
              Clear Normal
            </button>
          )}
        </div>
        <label className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg border border-dashed cursor-pointer text-[11px] ${
          isLight ? 'bg-slate-50 border-slate-300 text-slate-600' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
        }`}>
          <Upload className="w-3 h-3 text-purple-400" />
          <span>{override?.normalMapName || 'Upload Normal Map Image'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'normal')}
          />
        </label>
      </div>
    </div>
  );
};
