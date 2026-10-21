import React from 'react';
import { Cpu, Zap, CheckCircle2, ShieldAlert, Monitor, Sparkles, X, Settings2 } from 'lucide-react';
import { UiTheme, RenderSettings } from '../types';

interface GpuHardwareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiTheme?: UiTheme;
  renderSettings: RenderSettings;
  onUpdateRenderSettings: (settings: Partial<RenderSettings>) => void;
}

export const GpuHardwareGuideModal: React.FC<GpuHardwareGuideModalProps> = ({
  isOpen,
  onClose,
  uiTheme = 'dark',
  renderSettings,
  onUpdateRenderSettings
}) => {
  if (!isOpen) return null;

  const isLight = uiTheme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className={`border rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden transition-colors max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0C0C0E] border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Top Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Photogrammetry & NVIDIA GPU Optimization</h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Maximize FPS & responsiveness when working with multi-million triangle scans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto my-4 space-y-5 pr-1 text-xs">
          {/* Quick Toggle Card */}
          <div className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-amber-50/80 border-amber-200 text-slate-800'
              : 'bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-transparent border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Heavy Mesh Performance Mode</span>
                </div>
                <p className={`text-xs leading-relaxed max-w-md ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                  Bypasses real-time shadow depth recalculation, optimizes fragment rasterization, and caps resolution scaling for high-density 3D models.
                </p>
              </div>
              <button
                onClick={() => onUpdateRenderSettings({ performanceMode: !renderSettings.performanceMode })}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 ${
                  renderSettings.performanceMode
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                    : isLight
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{renderSettings.performanceMode ? 'Enabled' : 'Enable Mode'}</span>
              </button>
            </div>
          </div>

          {/* Issue Explanation */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className={`flex items-center gap-2 font-semibold text-sm ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Why Discrete NVIDIA GPUs Get Bypassed on Windows</span>
            </div>
            <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
              By default, Windows and web browser runtimes (Chrome, Edge, or Electron desktop executables) assign WebGL canvas contexts to your integrated CPU graphics (Intel UHD/Iris or AMD Radeon) to conserve power. When loading large photogrammetry GLTF/OBJ meshes with 2M+ vertices, integrated graphics struggle, causing extreme frame drops.
            </p>
          </div>

          {/* Step 1: Windows Graphics Routing */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 font-bold text-sm ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">1</div>
              <Monitor className="w-4 h-4 text-blue-500" />
              <span>Force Discrete GPU in Windows Graphics Settings</span>
            </div>
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/40 border-zinc-800/80'
            }`}>
              <ol className={`list-decimal list-inside space-y-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                <li>Open Windows Start Menu and search for <strong className={`font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-200 text-slate-900' : 'text-white bg-zinc-800'}`}>Graphics Settings</strong>.</li>
                <li>Click <strong className="text-blue-600 dark:text-blue-400 font-semibold">Browse</strong> under "Custom options for apps".</li>
                <li>Select your browser (<code className="text-amber-700 dark:text-amber-300 font-bold">chrome.exe</code> or <code className="text-amber-700 dark:text-amber-300 font-bold">msedge.exe</code>) or your Windows desktop build (<code className="text-amber-700 dark:text-amber-300 font-bold">.exe</code>).</li>
                <li>Click <strong className="text-blue-600 dark:text-blue-400 font-semibold">Options</strong> -&gt; Choose <strong className="text-emerald-700 dark:text-emerald-400 font-bold">High performance (NVIDIA)</strong> -&gt; Click <strong className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Save</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Step 2: NVIDIA Control Panel Setup */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 font-bold text-sm ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">2</div>
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>Configure NVIDIA Control Panel 3D Settings</span>
            </div>
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/40 border-zinc-800/80'
            }`}>
              <ol className={`list-decimal list-inside space-y-1.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                <li>Right-click your Windows Desktop and launch <strong className="text-emerald-700 dark:text-emerald-400 font-bold">NVIDIA Control Panel</strong>.</li>
                <li>Navigate to <strong className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Manage 3D Settings</strong> -&gt; <strong className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Program Settings</strong>.</li>
                <li>Click <strong className="text-blue-600 dark:text-blue-400 font-semibold">Add</strong> and choose your application or browser.</li>
                <li>Change <i>Preferred graphics processor</i> to <strong className="text-emerald-700 dark:text-emerald-400 font-bold">High-performance NVIDIA processor</strong>.</li>
                <li>Change <i>Power management mode</i> to <strong className="text-amber-700 dark:text-amber-300 font-semibold">Prefer maximum performance</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Step 3: Resolution & In-App Adjustments */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 font-bold text-sm ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
              <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">3</div>
              <Settings2 className="w-4 h-4 text-amber-500" />
              <span>In-App Resolution & Rendering Tuning</span>
            </div>
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/40 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>Render Resolution Scale</div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Scale WebGL resolution down on 4K/High-DPI displays</div>
                </div>
                <select
                  value={renderSettings.resolutionScale || 1.0}
                  onChange={(e) => onUpdateRenderSettings({ resolutionScale: parseFloat(e.target.value) })}
                  className={`text-xs rounded-xl px-2.5 py-1.5 font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  }`}
                >
                  <option value={0.75}>0.75x (Maximum Performance)</option>
                  <option value={1.0}>1.0x (Balanced Standard)</option>
                  <option value={1.25}>1.25x (High Quality)</option>
                  <option value={1.5}>1.5x (Ultra Native)</option>
                </select>
              </div>

              <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
                <div>
                  <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>Real-Time Drop Shadows</div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>Disable shadows to eliminate depth-pass rendering passes</div>
                </div>
                <input
                  type="checkbox"
                  checked={renderSettings.showShadows}
                  onChange={(e) => onUpdateRenderSettings({ showShadows: e.target.checked })}
                  className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={`pt-3 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-zinc-800/60'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>WebGL Context: High-Performance GPU Requested</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
