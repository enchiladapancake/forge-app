import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

export function CategoryRadarChart({ categories }) {
  const data = categories.map((category) => ({
    category: category.name,
    level: category.levelInfo.level,
    progress: Math.max(category.levelInfo.progressPercent, 6),
    fullMark: 100,
    color: category.color,
  }));

  return (
    <div className="radar-chart-wrap">
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <PolarRadiusAxis
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: 'rgba(159, 176, 195, 0.7)', fontSize: 11 }}
            axisLine={false}
          />
          <Radar
            name="Category Progress"
            dataKey="progress"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.28}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
