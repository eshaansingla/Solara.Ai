import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Calendar, TrendingDown, AlertTriangle } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/AppLayout";
import { RealtimeSolarPanel } from "@/components/analytics/RealtimeSolarPanel";

// Generate mock historical data
const generateHistorical = () => {
  const data = [];
  const now = new Date();
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      efficiency: 90 - Math.random() * 15 - (i < 30 ? 5 : 0),
      temperature: 35 + Math.random() * 30,
      anomalies: Math.floor(Math.random() * (i < 20 ? 5 : 2)),
      irradiance: 600 + Math.random() * 400,
    });
  }
  return data;
};

const Analytics = () => {
  const [allData] = useState(generateHistorical);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const filtered = useMemo(
    () => allData.filter((d) => d.date >= startDate && d.date <= endDate),
    [allData, startDate, endDate]
  );

  const avgEfficiency = useMemo(
    () => (filtered.reduce((s, d) => s + d.efficiency, 0) / filtered.length).toFixed(1),
    [filtered]
  );
  const totalAnomalies = useMemo(
    () => filtered.reduce((s, d) => s + d.anomalies, 0),
    [filtered]
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Historical Analytics</h1>
            <p className="text-muted-foreground text-sm">Trend analysis & anomaly detection</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 text-center">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Avg Efficiency</p>
            <p className="text-2xl font-display font-bold">{avgEfficiency}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 text-center">
            <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Anomalies</p>
            <p className="text-2xl font-display font-bold text-warning">{totalAnomalies}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 text-center">
            <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Data Points</p>
            <p className="text-2xl font-display font-bold">{filtered.length}</p>
          </motion.div>
        </div>

        {/* Efficiency Degradation */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Efficiency Degradation Curve
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} domain={[60, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="efficiency" stroke="hsl(195, 100%, 50%)" fill="hsl(195, 100%, 50%)" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Temperature Trends */}
          <div className="glass-card p-4 lg:col-span-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Temperature Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly Frequency */}
          <div className="glass-card p-4 lg:col-span-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Anomaly Frequency</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
                <Tooltip />
                <Bar dataKey="anomalies" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Realtime AI Predictions */}
          <RealtimeSolarPanel />
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
