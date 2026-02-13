import { useEffect, useRef } from "react";
import { useLiveData, useAlerts } from "@/hooks/useLiveData";
import { motion } from "framer-motion";
import { Thermometer, Sun, Zap, Activity, AlertTriangle, Brain } from "lucide-react";
import { MetricCard, StatusBadge, EfficiencyGauge } from "@/components/dashboard/MetricCards";
import { LiveChart, SensorOverviewChart } from "@/components/dashboard/Charts";
import AppLayout from "@/components/AppLayout";

const Dashboard = () => {
  const { current, history } = useLiveData(3000);
  const { alerts, addAlert } = useAlerts();
  const prevStatus = useRef(current.status);

  useEffect(() => {
    addAlert(current);
    prevStatus.current = current.status;
  }, [current, addAlert]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Live Monitoring</h1>
            <p className="text-muted-foreground text-sm">Real-time solar panel diagnostics</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={current.status} />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Brain className="w-3.5 h-3.5 text-primary animate-pulse-glow" />
              AI Active
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Temperature"
            value={current.temperature}
            unit="°C"
            icon={<Thermometer className="w-5 h-5" />}
            status={current.temperature > 70 ? "critical" : current.temperature > 55 ? "warning" : "normal"}
            delay={0}
          />
          <MetricCard
            title="Irradiance"
            value={current.irradiance}
            unit="W/m²"
            icon={<Sun className="w-5 h-5" />}
            delay={0.1}
          />
          <MetricCard
            title="Output Efficiency"
            value={current.outputEfficiency}
            unit="%"
            icon={<Zap className="w-5 h-5" />}
            status={current.outputEfficiency < 70 ? "critical" : current.outputEfficiency < 80 ? "warning" : "normal"}
            delay={0.2}
          />
          <MetricCard
            title="Vibration"
            value={current.vibration}
            unit="g"
            icon={<Activity className="w-5 h-5" />}
            status={current.vibration > 3.5 ? "critical" : current.vibration > 2.5 ? "warning" : "normal"}
            delay={0.3}
          />
        </div>

        {/* Gauge + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <div className="relative">
              <EfficiencyGauge value={current.outputEfficiency} label="System Efficiency" />
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-medium">Live Alerts</h3>
              <span className="ml-auto text-xs text-muted-foreground">{alerts.length} alerts</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span
                      className={alert.severity === "critical" ? "glow-dot-danger mt-1" : "glow-dot-warning mt-1"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LiveChart data={history} dataKey="temperature" label="Temperature (°C)" color="hsl(0, 72%, 51%)" />
          <LiveChart data={history} dataKey="outputEfficiency" label="Efficiency (%)" color="hsl(142, 71%, 45%)" />
        </div>

        <SensorOverviewChart data={history} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
