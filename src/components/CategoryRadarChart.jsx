import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{point.category}</strong>
      <span>Level {point.level}</span>
      <span>{Math.round(point.progress)}% toward next level</span>
    </div>
  );
}

export function CategoryRadarChart({ categories }) {
  const data = categories.map((category) => ({
    category: category.name,
    level: category.levelInfo.level,
    progress: Math.max(category.levelInfo.progressPercent, 8),
    fullMark: 100,
    color: category.color,
  }));

  return (
    <div className="radar-chart-wrap radar-chart-wrap--polished">
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={data} outerRadius="68%">
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.65} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(148, 163, 184, 0.16)" radialLines={false} />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
          <PolarRadiusAxis
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: 'rgba(159, 176, 195, 0.72)', fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Category Progress"
            dataKey="progress"
            stroke="#f8b84e"
            fill="url(#radarGradient)"
            fillOpacity={1}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, fill: '#0f1722', stroke: '#f8b84e' }}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
