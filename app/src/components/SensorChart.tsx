'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { SensorReading } from '@/lib/types';

interface SensorChartProps {
  readings: SensorReading[];
  title: string;
  color: string;
  unit: string;
}

export default function SensorChart({ readings, title, color, unit }: SensorChartProps) {
  if (readings.length === 0) {
    return null;
  }

  const chartData = readings.map((reading) => ({
    time: new Date(reading.recorded_at).getTime(),
    value: reading.value,
    formattedTime: format(new Date(reading.recorded_at), 'MMM d, h:mm a'),
  }));

  const minValue = Math.min(...readings.map((r) => r.value));
  const maxValue = Math.max(...readings.map((r) => r.value));
  const padding = (maxValue - minValue) * 0.1 || 5;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-text-dark mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
              stroke="#718096"
              fontSize={12}
            />
            <YAxis
              domain={[minValue - padding, maxValue + padding]}
              tickFormatter={(value) => `${value.toFixed(1)}`}
              stroke="#718096"
              fontSize={12}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              labelFormatter={(value) => format(new Date(value as number), 'MMM d, yyyy h:mm a')}
              formatter={(value) => [`${(value as number).toFixed(2)} ${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
