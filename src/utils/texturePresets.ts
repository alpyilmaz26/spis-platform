export interface TexturePreset {
  id: string;
  name: string;
  icon: string;
}

export const TEXTURE_PRESETS: TexturePreset[] = [
  { id: 'grid', name: 'UV Calibration Grid', icon: '🏁' },
  { id: 'marble', name: 'Architectural Marble', icon: '🏛️' },
  { id: 'wood', name: 'Polished Wood Grain', icon: '🪵' },
  { id: 'carbon', name: 'Carbon Fiber Weave', icon: '🏎️' },
  { id: 'metal', name: 'Brushed Steel', icon: '⚙️' },
  { id: 'stone', name: 'Concrete & Stone', icon: '🪨' },
  { id: 'cyber', name: 'Cyber Neon Grid', icon: '⚡' },
];

export function generateTexturePresetDataUrl(presetId: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (presetId === 'grid') {
    // Photogrammetry / UV Checkerboard Grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);
    const size = 64;
    for (let i = 0; i < 512; i += size) {
      for (let j = 0; j < 512; j += size) {
        if ((i / size + j / size) % 2 === 0) {
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(i, j, size, size);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(i, j, size, size);
        }
      }
    }
    // Draw UV coordinate grid lines and axis tags
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('U:0.5 V:0.5', 190, 250);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('UV CHECKERBOARD GRID', 140, 280);
  } else if (presetId === 'wood') {
    // Polished Wood Grain
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 3) {
      const alpha = 0.2 + 0.15 * Math.sin(y / 12) + 0.1 * Math.cos(y / 25);
      ctx.fillStyle = `rgba(69, 26, 3, ${alpha})`;
      ctx.fillRect(0, y, 512, 2);
    }
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    for (let r = 30; r < 700; r += 32) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (presetId === 'marble') {
    // Architectural Marble
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(160, 140, 220, 40, 512, 240);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 0);
    ctx.bezierCurveTo(240, 320, 420, 220, 320, 512);
    ctx.stroke();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.bezierCurveTo(280, 220, 380, 480, 512, 380);
    ctx.stroke();
  } else if (presetId === 'carbon') {
    // Carbon Fiber Woven
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 512, 512);
    const size = 16;
    for (let i = 0; i < 512; i += size) {
      for (let j = 0; j < 512; j += size) {
        if ((i / size + j / size) % 2 === 0) {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(i, j, size, size);
        } else {
          ctx.fillStyle = '#18181b';
          ctx.fillRect(i, j, size, size);
        }
      }
    }
  } else if (presetId === 'metal') {
    // Industrial Brushed Metal
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, Math.random() * 512, 512, 1 + Math.random() * 2);
    }
  } else if (presetId === 'stone') {
    // Weathered Concrete & Stone
    ctx.fillStyle = '#52525b';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#27272a' : '#a1a1aa';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
  } else if (presetId === 'cyber') {
    // Cyberpunk Neon Grid
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(192, 192, 128, 128);
  }

  return canvas.toDataURL('image/png');
}
