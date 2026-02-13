import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const mockAlerts = Array.from({ length: 20 }, (_, i) => ({
  id: crypto.randomUUID(),
  severity: ["critical", "warning", "info"][Math.floor(Math.random() * 3)] as string,
  message: [
    "Panel temperature exceeding threshold at 72°C",
    "Efficiency drop detected in Array B - down to 68%",
    "Vibration anomaly detected on Panel #14",
    "Irradiance sensor calibration needed",
    "Inverter #3 output fluctuation detected",
    "Scheduled maintenance reminder for Section C",
    "Battery storage reaching capacity limit",
    "Weather alert: High wind conditions expected",
  ][Math.floor(Math.random() * 8)],
  sensorType: ["temperature", "efficiency", "vibration", "irradiance"][Math.floor(Math.random() * 4)],
  resolved: Math.random() > 0.6,
  timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
})).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

const severityIcon: Record<string, React.ReactNode> = {
  critical: <AlertOctagon className="w-4 h-4 text-destructive" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

const Alerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  const resolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Alerts</h1>
            <p className="text-muted-foreground text-sm">
              {alerts.filter((a) => !a.resolved).length} unresolved alerts
            </p>
          </div>
          <div className="flex gap-2">
            {["all", "critical", "warning", "info"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "glass-card p-4 flex items-start gap-3 transition-opacity",
                alert.resolved && "opacity-50"
              )}
            >
              {severityIcon[alert.severity]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{alert.timestamp.toLocaleString()}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{alert.sensorType}</span>
                </div>
              </div>
              {!alert.resolved && (
                <Button variant="ghost" size="sm" onClick={() => resolve(alert.id)}>
                  <Check className="w-4 h-4" />
                </Button>
              )}
              {alert.resolved && (
                <span className="text-xs text-success font-medium">Resolved</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Alerts;
