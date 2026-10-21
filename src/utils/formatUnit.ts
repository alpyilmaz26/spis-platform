export type MeasurementUnit = 'm' | 'cm';

/**
 * Format a distance in meters into the selected unit string ('m' or 'cm')
 * @param distInMeters Distance in meters
 * @param unit Active unit ('m' | 'cm')
 * @returns Formatted distance string with precise fractional decimals and calculated millimeter sub-increments
 */
export function formatDistance(distInMeters: number, unit: MeasurementUnit = 'm'): string {
  if (unit === 'cm') {
    const cmVal = distInMeters * 100;
    const mmVal = distInMeters * 1000;
    
    if (cmVal < 1) {
      return `${cmVal.toFixed(2)} cm (${mmVal.toFixed(1)} mm)`;
    }
    
    const wholeCm = Math.floor(cmVal);
    const subMm = (cmVal - wholeCm) * 10;
    
    if (subMm >= 0.05) {
      return `${cmVal.toFixed(2)} cm (${wholeCm} cm ${subMm.toFixed(1)} mm)`;
    }
    
    return `${cmVal.toFixed(2)} cm (${mmVal.toFixed(1)} mm)`;
  }
  
  if (distInMeters < 1) {
    const cmVal = distInMeters * 100;
    const mmVal = distInMeters * 1000;
    return `${distInMeters.toFixed(3)} m (${cmVal.toFixed(1)} cm / ${mmVal.toFixed(0)} mm)`;
  } else if (distInMeters < 10) {
    return `${distInMeters.toFixed(3)} m`;
  }
  return `${distInMeters.toFixed(2)} m`;
}

