import { useEffect, useRef } from 'react';

const COLOR_MAP = {
  "SEHR GUT": { base: "#16a34a", grad: ["#16a34a","#22c55e"] },
  "GUT": { base: "#22c55e", grad: ["#22c55e","#4ade80"] },
  "MAESSIG": { base: "#eab308", grad: ["#eab308","#facc15"] },
  "SCHLECHT": { base: "#f97316", grad: ["#f97316","#fb923c"] },
  "SEHR SCHLECHT": { base: "#dc2626", grad: ["#dc2626","#ef4444"] }
};

function drawSpark(canvas, points, color) {
  if (!canvas || !points.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0,0,w,h);

  // Normalisieren
  const vals = points.map(p => p.v).filter(v => typeof v === 'number');
  if (!vals.length) return;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;

  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  points.forEach((p,i) => {
    const x = (i / (points.length - 1)) * (canvas.clientWidth - 2) + 1;
    const yNorm = (p.v - min) / span;
    const y = (1 - yNorm) * (canvas.clientHeight - 4) + 2;
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();

  // Fill (light)
  const grd = ctx.createLinearGradient(0,0,0,canvas.clientHeight);
  grd.addColorStop(0, color + "55");
  grd.addColorStop(1, color + "00");
  ctx.fillStyle = grd;
  ctx.lineTo(canvas.clientWidth, canvas.clientHeight);
  ctx.lineTo(0, canvas.clientHeight);
  ctx.closePath();
  ctx.fill();
}

export default function AirQualitySummary({ overall, history = [] }) {
  const canvasRef = useRef(null);

  // Sparkline basiert z.B. auf CO2eq (oder PM2.5 fallback)
  useEffect(() => {
    if (!history.length) return;
    const baseColor = COLOR_MAP[overall]?.base || "#64748b";
    const points = history.slice(-40).map(r => ({
      v: r.CO2eq ?? r["PM2.5"] ?? null
    })).filter(p => p.v != null);
    drawSpark(canvasRef.current, points, baseColor);
  }, [history, overall]);

  const cfg = COLOR_MAP[overall] || { base: "#64748b", grad: ["#64748b","#94a3b8"] };

  return (
    <div className="aq-card flex flex-col gap-3 relative overflow-hidden">
      {/* Verlauf-Hintergrund (diagonaler Gradient) */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${cfg.grad[0]} 0%, ${cfg.grad[1]} 70%)`
        }}
      />
      <span className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase relative">
        Gesamtlufqualität
      </span>

      {!overall ? (
        <div className="h-10 flex items-center text-slate-500 text-sm relative">Lade…</div>
      ) : (
        <div
          className="h-10 rounded flex items-center px-3 text-sm font-semibold tracking-wide text-white relative shadow-sm"
          style={{
            background: `linear-gradient(90deg, ${cfg.grad[0]}, ${cfg.grad[1]})`
          }}
        >
          {overall}
        </div>
      )}

      {/* Sparkline + Legende */}
      <div className="relative">
        <div className="text-[10px] text-slate-500 mb-1">
          Mini-Verlauf (CO₂eq* oder PM2.5) – visuelle Tendenz
        </div>
        <div className="h-12">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
      <div className="text-[9px] text-slate-400 leading-snug relative">
        * Auswahl fallback: CO2eq → PM2.5 → (leer)<br />
        Bewertung basiert auf Kernparametern.
      </div>
    </div>
  );
}
