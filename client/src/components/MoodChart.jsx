import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

// --- Theme ----------------------------------------------------------------
const ACCENT = '#34e8a4';
const BG = '#070b0a';
const CARD = '#0c1311';
const GRID = '#1a2421';
const MUTED = '#5b6b66';
const TEXT = '#eaf3ef';
const MONO = "'JetBrains Mono', 'SF Mono', Menlo, monospace";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: '#0f1916',
        border: `1px solid ${ACCENT}33`,
        borderRadius: 8,
        padding: '6px 10px',
        fontFamily: MONO,
        fontSize: 12,
        color: TEXT,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ color: MUTED, marginBottom: 2 }}>{label}</div>
      <div style={{ color: ACCENT, fontWeight: 600 }}>{payload[0].value.toFixed(1)} / 10</div>
    </div>
  );
}

export default function MoodChart({ data = [] }) {
  // Map API data (avgScore) to the 'mood' key used in the graph
  const moodData = data.map(d => ({ day: d.day, mood: d.avgScore || 0 }));
  
  // If no data, provide a fallback
  if (moodData.length === 0) {
    return <div style={{ color: MUTED, padding: 20 }}>Loading chart...</div>;
  }

  const average = (moodData.reduce((s, d) => s + d.mood, 0) / moodData.length).toFixed(1);
  const last = moodData[moodData.length - 1];
  
  // Calculate trend (comparing last 2 days vs first 2 days)
  const firstHalfAvg = (moodData[0].mood + moodData[1].mood) / 2;
  const lastHalfAvg = (moodData[moodData.length - 2].mood + moodData[moodData.length - 1].mood) / 2;
  const trendUp = lastHalfAvg >= firstHalfAvg;

  return (
    <div
      className="w-full flex-1"
      style={{
        background: `radial-gradient(120% 100% at 100% 0%, ${ACCENT}14, transparent 60%), ${CARD}`,
        border: `1px solid ${GRID}`,
        borderRadius: 20,
        padding: '24px 24px 20px',
        fontFamily: SANS,
        color: TEXT,
        height: '100%'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.18em',
              color: ACCENT,
              textTransform: 'uppercase',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: ACCENT,
                boxShadow: `0 0 8px ${ACCENT}`,
                display: 'inline-block',
              }}
            />
            Weekly reading
          </div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Mood This Week
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>Daily average score</p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 999,
            background: trendUp ? `${ACCENT}14` : '#ff6b6b14',
            border: `1px solid ${trendUp ? ACCENT : '#ff6b6b'}33`,
            color: trendUp ? ACCENT : '#ff6b6b',
            fontSize: 12,
            fontFamily: MONO,
            fontWeight: 600,
          }}
        >
          {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trendUp ? 'Improving' : 'Declining'}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          height: 180,
          marginTop: 20,
          backgroundImage: `linear-gradient(${ACCENT}0a 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}0a 1px, transparent 1px)`,
          backgroundSize: '100% 30px, 14.28% 100%',
          borderRadius: 12,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={moodData} margin={{ top: 18, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.32} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              dy={10}
              tick={{ fill: MUTED, fontSize: 11, fontFamily: MONO, letterSpacing: '0.05em' }}
            />
            <YAxis domain={[0, 10]} hide />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />

            {/* Glow layer — blurred duplicate of the line */}
            <Area
              type="linear"
              dataKey="mood"
              stroke={ACCENT}
              strokeWidth={6}
              fill="none"
              dot={false}
              activeDot={false}
              className="mood-glow"
              isAnimationActive
              animationDuration={1400}
            />

            {/* Main trace + gradient fill */}
            <Area
              type="linear"
              dataKey="mood"
              stroke={ACCENT}
              strokeWidth={2}
              fill="url(#moodFill)"
              dot={false}
              activeDot={{ r: 4, fill: ACCENT, stroke: BG, strokeWidth: 2 }}
              isAnimationActive
              animationDuration={1400}
            />

            {/* Pulsing "live" marker on the latest reading */}
            <ReferenceDot
              x={last.day}
              y={last.mood}
              r={9}
              fill={ACCENT}
              fillOpacity={0.18}
              stroke="none"
              className="mood-pulse"
              isFront
            />
            <ReferenceDot x={last.day} y={last.mood} r={3.5} fill={ACCENT} stroke={BG} strokeWidth={2} isFront />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${GRID}`,
          fontFamily: MONO,
          fontSize: 12,
          color: MUTED,
        }}
      >
        <span>7-day average</span>
        <span style={{ color: TEXT, fontWeight: 600 }}>{average} / 10</span>
      </div>

      <style>{`
        .mood-glow path {
          filter: blur(7px);
          opacity: 0.55;
        }
        .mood-pulse circle {
          transform-box: fill-box;
          transform-origin: center;
          animation: moodPulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes moodPulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
