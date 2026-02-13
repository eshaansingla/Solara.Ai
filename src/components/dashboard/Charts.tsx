import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SensorReading } from "@/hooks/useLiveData";

interface LiveChartProps {
  data: SensorReading[];
  dataKey: keyof SensorReading;
  label: string;
  color?: string;
  type?: "line" | "area";
}

const formatTime = (timestamp: Date) => {
  if (!(timestamp instanceof Date)) timestamp = new Date(timestamp);
  return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
};

export const LiveChart = ({ data, dataKey, label, color = "hsl(195, 100%, 50%)", type = "area" }: LiveChartProps) => {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: formatTime(d.timestamp),
        [dataKey]: d[dataKey],
      })),
    [data, dataKey]
  );

  const ChartComponent = type === "area" ? AreaChart : LineChart;
  const DataComponent = type === "area" ? Area : Line;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
          <Tooltip content={<CustomTooltip />} />
          {type === "area" ? (
            <Area
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              fill={color}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface MultiLineChartProps {
  data: SensorReading[];
}

export const SensorOverviewChart = ({ data }: MultiLineChartProps) => {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: formatTime(d.timestamp),
        Temperature: d.temperature,
        Efficiency: d.outputEfficiency,
        Irradiance: d.irradiance / 10,
      })),
    [data]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Sensor Overview</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="Temperature" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Efficiency" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Irradiance" stroke="hsl(195, 100%, 50%)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface SHAPChartProps {
  data: Array<{ feature: string; importance: number }>;
}

export const SHAPChart = ({ data }: SHAPChartProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Feature Importance (SHAP)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
          <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: "hsl(213, 15%, 55%)" }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="importance" fill="hsl(195, 100%, 50%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
