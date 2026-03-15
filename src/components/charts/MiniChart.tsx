/**
 * Composants de charts SVG natifs — zéro dépendance
 */
import React from 'react';

// ── Bar Chart ────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  isAr?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 160, showValues = true, isAr }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(100 / data.length);

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 40} ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * (height - 30), 2);
          const x = i * 40 + 4;
          const y = height - barH - 20;
          const color = d.color || '#1e40af';
          return (
            <g key={i}>
              <rect x={x} y={y} width={32} height={barH} rx={3} fill={color} opacity={0.85} />
              {showValues && d.value > 0 && (
                <text x={x + 16} y={y - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">
                  {d.value.toLocaleString()}
                </text>
              )}
              <text x={x + 16} y={height - 4} textAnchor="middle" fontSize={8} fill="#64748b">
                {d.label.length > 5 ? d.label.substring(0, 5) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Line Chart ───────────────────────────────────────────────
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fill?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 120, color = '#1e40af', fill = true }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const w = 300;
  const padT = 10, padB = 20, padL = 8, padR = 8;
  const chartH = height - padT - padB;
  const chartW = w - padL - padR;
  const step = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + chartH - ((d.value - min) / range) * chartH,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${points[0].x},${padT + chartH} ${polyline} ${points[points.length - 1].x},${padT + chartH}`;

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        {fill && <polygon points={area} fill={color} opacity={0.12} />}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
            <text x={p.x} y={height - 4} textAnchor="middle" fontSize={8} fill="#64748b">
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── Donut Chart ──────────────────────────────────────────────
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 120 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.22;
  let angle = -Math.PI / 2;

  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const ix1 = cx + inner * Math.cos(angle - sweep);
    const iy1 = cy + inner * Math.sin(angle - sweep);
    const ix2 = cx + inner * Math.cos(angle);
    const iy2 = cy + inner * Math.sin(angle);
    return { ...d, path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${large},0 ${ix1},${iy1} Z` };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.9} />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#94a3b8">
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-slate-400">{d.label}</span>
            <span className="font-bold text-slate-300 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Sparkline (mini trend) ───────────────────────────────────
interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ values, color = '#22c55e', height = 32, width = 80 }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
};
