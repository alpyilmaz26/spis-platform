import React from 'react';
import { Ruler, Trash2, X } from 'lucide-react';
import { Measurement, UiTheme } from '../types';
import { formatDistance, MeasurementUnit } from '../utils/formatUnit';

interface MeasurementOverlayProps {
  measureMode: boolean;
  measurements: Measurement[];
  unit?: MeasurementUnit;
  onToggleMeasureMode: () => void;
  onClearMeasurements: () => void;
  onRemoveMeasurement: (id: string) => void;
  uiTheme?: UiTheme;
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({
  measureMode,
  measurements,
  unit = 'm',
  onToggleMeasureMode,
  onClearMeasurements,
  onRemoveMeasurement,
  uiTheme = 'dark'
}) => {
  const activeUnit: MeasurementUnit = unit === 'cm' ? 'cm' : 'm';
  if (!measureMode && measurements.length === 0) return null;

  const isLight = uiTheme === 'light';

  return (
    <div className="absolute top-20 left-4 z-20 space-y-2 max-w-xs">
      {/* Active Mode Banner */}
      {measureMode && (
        <div className={`p-3 backdrop-blur-md border rounded-2xl shadow-xl text-xs transition-colors animate-fade-in ${
          isLight
            ? 'bg-white/95 border-blue-400/60 text-slate-800 shadow-slate-200'
            : 'bg-[#0C0C0E]/95 border-blue-500/40 text-zinc-200'
        }`}>
          <div className="flex items-center justify-between font-semibold text-blue-500 mb-1">
            <span className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-blue-500" />
              3D Distance Measurement Mode
            </span>
            <button
              onClick={onToggleMeasureMode}
              className={`p-1 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-800' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className={`text-[11px] leading-tight ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
            Click any <span className="text-amber-600 font-bold">Point A</span> and <span className="text-amber-600 font-bold">Point B</span> on the 3D surface to measure distance in <span className="text-blue-500 font-semibold">{unit === 'cm' ? 'centimeters (cm)' : 'meters (m)'}</span>.
          </p>
        </div>
      )}

      {/* Quick Measurement List Floating Pill */}
      {measurements.length > 0 && (
        <div className={`p-3 backdrop-blur-md border rounded-2xl shadow-xl text-xs transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200'
            : 'bg-[#0C0C0E]/95 border-zinc-800 text-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-semibold text-[11px] uppercase tracking-wider ${
              isLight ? 'text-slate-500' : 'text-zinc-300'
            }`}>
              Measurements ({measurements.length})
            </span>
            <button
              onClick={onClearMeasurements}
              className="text-[10px] text-rose-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {measurements.map((m, idx) => {
              const itemColor = m.color || '#38bdf8';
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-1.5 rounded-lg border font-mono text-[11px] ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#09090B]/80 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: itemColor }}
                    />
                    <span className={`font-bold truncate ${isLight ? 'text-slate-800' : 'text-zinc-100'}`}>
                      #{idx + 1}: {formatDistance(m.distance, activeUnit)}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveMeasurement(m.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors shrink-0"
                    title="Remove measurement"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
