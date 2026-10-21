import React, { useRef, useEffect, useState } from 'react';
import {
  RotateCcw,
  Compass,
  Eye,
  Ruler,
  Scissors,
  RotateCw,
  Orbit,
  Mountain,
  Zap,
  Cpu,
  ChevronUp,
  MoreHorizontal,
  Gauge,
  Maximize2
} from 'lucide-react';
import { CameraPreset, ProjectionMode, RenderSettings, EnvironmentSettings, NavigationMode, UiTheme } from '../types';

interface ControlBarProps {
  onResetCamera: () => void;
  onSetCameraPreset: (preset: CameraPreset) => void;
  projectionMode: ProjectionMode;
  onToggleProjectionMode: () => void;
  navigationMode: NavigationMode;
  onToggleNavigationMode: () => void;
  measureMode: boolean;
  onToggleMeasureMode: () => void;
  renderSettings: RenderSettings;
  onUpdateRenderSettings: (settings: Partial<RenderSettings>) => void;
  envSettings: EnvironmentSettings;
  onUpdateEnvSettings: (settings: Partial<EnvironmentSettings>) => void;
  uiTheme?: UiTheme;
  onOpenGpuGuide?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onResetCamera,
  onSetCameraPreset,
  projectionMode,
  onToggleProjectionMode,
  navigationMode,
  onToggleNavigationMode,
  measureMode,
  onToggleMeasureMode,
  renderSettings,
  onUpdateRenderSettings,
  envSettings,
  onUpdateEnvSettings,
  uiTheme = 'dark',
  onOpenGpuGuide
}) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showFovMenu, setShowFovMenu] = useState(false);
  const [showClippingOptions, setShowClippingOptions] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const presetMenuRef = useRef<HTMLDivElement>(null);
  const fovMenuRef = useRef<HTMLDivElement>(null);
  const clippingMenuRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const presets: { id: CameraPreset; label: string }[] = [
    { id: 'isometric', label: 'Isometric' },
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'top', label: 'Top' },
    { id: 'bottom', label: 'Bottom' },
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' }
  ];

  const speedOptions = [0.1, 0.25, 0.5, 1.0, 1.5, 2.0];

  const isLight = uiTheme === 'light';

  // Click outside listener for popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target as Node)) {
        setShowPresetMenu(false);
      }
      if (fovMenuRef.current && !fovMenuRef.current.contains(event.target as Node)) {
        setShowFovMenu(false);
      }
      if (clippingMenuRef.current && !clippingMenuRef.current.contains(event.target as Node)) {
        setShowClippingOptions(false);
      }
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme-aware button classes for crisp contrast
  const btnBase = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 hover:border-slate-300'
    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:border-zinc-700';

  const btnActivePrimary = isLight
    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
    : 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20 font-semibold';

  const btnActiveEmerald = isLight
    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold'
    : 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/20 font-semibold';

  const btnActiveRose = isLight
    ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-semibold'
    : 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-500/20 font-semibold';

  const btnActiveAmber = isLight
    ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-semibold'
    : 'bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20 font-semibold';

  const dividerClass = isLight ? 'bg-slate-200' : 'bg-zinc-800/80';

  const currentSpeed = renderSettings.terrainSpeedMultiplier || 1.0;

  return (
    <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-1 p-1.5 sm:p-2 backdrop-blur-xl border rounded-2xl shadow-2xl transition-all max-w-[calc(100%-1.5rem)] shrink-0 ${
      isLight ? 'bg-white/95 text-slate-900 border-slate-200/90 shadow-slate-200/60' : 'bg-[#09090b]/90 text-zinc-200 border-zinc-800/90 shadow-black/80'
    }`}>
      {/* SECTION 1: Camera Positioning & Presets */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onResetCamera}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${btnBase}`}
          title="Reset Camera & Center Model"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="hidden lg:inline">Recenter</span>
        </button>

        <div className="relative" ref={presetMenuRef}>
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
              showPresetMenu ? btnActivePrimary : btnBase
            }`}
            title="Camera View Angle Presets"
          >
            <Compass className={`w-3.5 h-3.5 shrink-0 ${showPresetMenu ? 'text-white' : 'text-amber-500'}`} />
            <span className="hidden lg:inline">Views</span>
            <ChevronUp className={`w-3 h-3 transition-transform shrink-0 ${showPresetMenu ? 'rotate-180 text-white' : isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
          </button>

          {showPresetMenu && (
            <div
              className={`absolute bottom-full mb-3 left-0 border rounded-2xl shadow-2xl p-1.5 min-w-[130px] space-y-0.5 z-50 text-xs animate-in fade-in duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
              }`}
            >
              <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                Camera Angle
              </div>
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSetCameraPreset(p.id);
                    setShowPresetMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                    isLight ? 'hover:bg-slate-100 text-slate-700 hover:text-blue-600' : 'hover:bg-zinc-800 text-zinc-300 hover:text-blue-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onToggleProjectionMode}
          className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
            projectionMode === 'orthographic' ? btnActivePrimary : btnBase
          }`}
          title="Toggle Camera Projection (Perspective vs Orthographic)"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="capitalize hidden lg:inline">{projectionMode}</span>
          <span className="lg:hidden text-[10px] font-bold uppercase">{projectionMode === 'perspective' ? 'Persp' : 'Ortho'}</span>
        </button>

        {/* FOV Control Popover */}
        <div className="relative" ref={fovMenuRef}>
          <button
            onClick={() => setShowFovMenu(!showFovMenu)}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-2 sm:py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
              showFovMenu ? btnActivePrimary : btnBase
            }`}
            title="Camera Field of View (FOV)"
          >
            <Maximize2 className={`w-3.5 h-3.5 shrink-0 ${showFovMenu ? 'text-white' : 'text-cyan-500'}`} />
            <span className="font-mono text-[11px] font-bold hidden sm:inline">{renderSettings.fov || 45}°</span>
            <span className="hidden xl:inline text-[10px] text-slate-400 dark:text-zinc-500">FOV</span>
          </button>

          {showFovMenu && (
            <div
              className={`absolute bottom-full mb-3 left-0 border rounded-2xl shadow-2xl p-3 min-w-[210px] space-y-2 z-50 text-xs animate-in fade-in duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Field of View</span>
                </span>
                <span className="font-mono text-cyan-500 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {renderSettings.fov || 45}°
                </span>
              </div>

              <input
                type="range"
                min={20}
                max={110}
                step={1}
                value={renderSettings.fov || 45}
                onChange={(e) => onUpdateRenderSettings({ fov: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 pt-0.5">
                <span>20° Tele</span>
                <button
                  type="button"
                  onClick={() => onUpdateRenderSettings({ fov: 45 })}
                  className="text-cyan-500 hover:underline font-bold"
                  title="Reset to 45 degrees"
                >
                  45° Reset
                </button>
                <span>110° Wide</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`w-px h-5 shrink-0 ${dividerClass}`} />

      {/* SECTION 2: Navigation Modes & Flight Speed Popover */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleNavigationMode}
          className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
            navigationMode === 'terrain' ? btnActiveEmerald : btnBase
          }`}
          title="Toggle Navigation Mode (Orbit vs Terrain Flight Ground Inspection)"
        >
          {navigationMode === 'terrain' ? (
            <>
              <Mountain className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="font-semibold text-xs">Terrain</span>
            </>
          ) : (
            <>
              <Orbit className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="hidden sm:inline font-semibold text-xs">Orbit</span>
            </>
          )}
        </button>

        {/* Speed Selector Popover in Terrain Flight Mode */}
        {navigationMode === 'terrain' && (
          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className={`flex items-center gap-1 px-2 py-1.5 sm:px-2 sm:py-1.5 rounded-xl border text-xs font-mono font-bold transition-all whitespace-nowrap ${
                showSpeedMenu ? btnActiveEmerald : isLight ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80'
              }`}
              title="Camera Movement Flight Speed"
            >
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              <span>{currentSpeed}x</span>
              <ChevronUp className={`w-3 h-3 transition-transform shrink-0 ${showSpeedMenu ? 'rotate-180' : ''}`} />
            </button>

            {showSpeedMenu && (
              <div
                className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 border rounded-2xl shadow-2xl p-1.5 min-w-[120px] space-y-0.5 z-50 text-xs animate-in fade-in duration-150 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
                }`}
              >
                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Flight Speed
                </div>
                {speedOptions.map((s) => {
                  const isAct = Math.abs(currentSpeed - s) < 0.05;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateRenderSettings({ terrainSpeedMultiplier: s });
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-colors whitespace-nowrap ${
                        isAct
                          ? 'bg-emerald-600 text-white'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700 hover:text-emerald-700'
                          : 'hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400'
                      }`}
                    >
                      <span>{s}x</span>
                      {isAct && <span className="text-[10px] font-sans font-semibold opacity-90">Active</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`w-px h-5 shrink-0 ${dividerClass}`} />

      {/* SECTION 3: Inspection & Measuring Tools */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleMeasureMode}
          className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
            measureMode ? btnActivePrimary : btnBase
          }`}
          title="Measure Point-to-Point Distance"
        >
          <Ruler className={`w-3.5 h-3.5 shrink-0 ${measureMode ? 'text-white' : 'text-blue-500'}`} />
          <span className="hidden sm:inline">{measureMode ? 'Measuring...' : 'Measure'}</span>
        </button>

        {/* Section Cut / Clipping Plane Toggle & Popover */}
        <div className="relative" ref={clippingMenuRef}>
          <button
            onClick={() => {
              const nextVal = !renderSettings.clippingEnabled;
              onUpdateRenderSettings({ clippingEnabled: nextVal });
              setShowClippingOptions(nextVal);
            }}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
              renderSettings.clippingEnabled ? btnActiveRose : btnBase
            }`}
            title="Interactive Section Cut Plane"
          >
            <Scissors className={`w-3.5 h-3.5 shrink-0 ${renderSettings.clippingEnabled ? 'text-white' : 'text-rose-500'}`} />
            <span className="hidden xl:inline">Section Cut</span>
          </button>

          {showClippingOptions && renderSettings.clippingEnabled && (
            <div
              className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 border rounded-2xl shadow-2xl p-3.5 min-w-[220px] z-50 text-xs space-y-3 animate-in fade-in duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>Section Cut Axis</span>
                <button
                  onClick={() => onUpdateRenderSettings({ clippingInvert: !renderSettings.clippingInvert })}
                  className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    isLight ? 'bg-slate-100 text-blue-600 hover:bg-slate-200' : 'bg-zinc-800 text-blue-400 hover:bg-zinc-700'
                  }`}
                >
                  Invert
                </button>
              </div>

              <div className={`flex gap-1 p-1 rounded-xl ${isLight ? 'bg-slate-100' : 'bg-zinc-800/80'}`}>
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <button
                    key={axis}
                    onClick={() => onUpdateRenderSettings({ clippingAxis: axis })}
                    className={`flex-1 py-1 text-center font-bold uppercase rounded-lg transition-all ${
                      renderSettings.clippingAxis === axis
                        ? 'bg-rose-600 text-white shadow-sm'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {axis}
                  </button>
                ))}
              </div>

              <div>
                <div className={`flex justify-between text-[11px] mb-1 font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  <span>Slice Depth</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                    {Math.round(renderSettings.clippingValue * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={renderSettings.clippingValue}
                  onChange={(e) => onUpdateRenderSettings({ clippingValue: parseFloat(e.target.value) })}
                  className={`w-full accent-rose-500 rounded-lg cursor-pointer h-1.5 ${
                    isLight ? 'bg-slate-200' : 'bg-zinc-800'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`w-px h-5 shrink-0 ${dividerClass}`} />

      {/* SECTION 4: Display & Performance Helpers (XL Inline, Collapsed under More Menu on smaller screens) */}
      <div className="hidden xl:flex items-center gap-1 shrink-0">
        <button
          onClick={() => onUpdateEnvSettings({ autoRotate: !envSettings.autoRotate })}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
            envSettings.autoRotate ? btnActivePrimary : btnBase
          }`}
          title="Toggle Continuous Auto Rotate"
        >
          <RotateCw className={`w-3.5 h-3.5 shrink-0 ${envSettings.autoRotate ? 'animate-spin text-white' : 'text-blue-500'}`} />
          <span>Auto-Rotate</span>
        </button>

        <button
          onClick={() => onUpdateRenderSettings({ performanceMode: !renderSettings.performanceMode })}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
            renderSettings.performanceMode ? btnActiveAmber : btnBase
          }`}
          title="Toggle Photogrammetry & Heavy Mesh Performance Mode (Disables shadow maps & throttles raycasting)"
        >
          <Zap className={`w-3.5 h-3.5 shrink-0 ${renderSettings.performanceMode ? 'text-white animate-pulse' : isLight ? 'text-amber-600' : 'text-amber-500'}`} />
          <span>{renderSettings.performanceMode ? 'Fast Mode' : 'Perf Mode'}</span>
        </button>

        {onOpenGpuGuide && (
          <button
            onClick={onOpenGpuGuide}
            className={`p-1.5 rounded-xl border transition-all ${btnBase}`}
            title="NVIDIA & Discrete GPU Optimization Guide"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300 shrink-0" />
          </button>
        )}
      </div>

      {/* Compact "More Tools" Popover for non-XL screens */}
      <div className="xl:hidden relative shrink-0" ref={moreMenuRef}>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`p-1.5 rounded-xl border text-xs transition-all ${
            showMoreMenu ? btnActivePrimary : btnBase
          }`}
          title="More Display & Performance Options"
        >
          <MoreHorizontal className="w-4 h-4 shrink-0" />
        </button>

        {showMoreMenu && (
          <div
            className={`absolute bottom-full mb-3 right-0 border rounded-2xl shadow-2xl p-2 min-w-[180px] space-y-1 z-50 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-200'
            }`}
          >
            <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
              Display & Performance
            </div>

            <button
              onClick={() => {
                onUpdateEnvSettings({ autoRotate: !envSettings.autoRotate });
                setShowMoreMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                envSettings.autoRotate
                  ? 'bg-blue-600 text-white'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 shrink-0 ${envSettings.autoRotate ? 'animate-spin text-white' : 'text-blue-500'}`} />
              <span>Auto-Rotate {envSettings.autoRotate ? '(On)' : '(Off)'}</span>
            </button>

            <button
              onClick={() => {
                onUpdateRenderSettings({ performanceMode: !renderSettings.performanceMode });
                setShowMoreMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                renderSettings.performanceMode
                  ? 'bg-amber-600 text-white'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 shrink-0 ${renderSettings.performanceMode ? 'text-white' : 'text-amber-500'}`} />
              <span>Perf Mode {renderSettings.performanceMode ? '(Fast)' : '(Full)'}</span>
            </button>

            {onOpenGpuGuide && (
              <button
                onClick={() => {
                  onOpenGpuGuide();
                  setShowMoreMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>NVIDIA GPU Guide</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


