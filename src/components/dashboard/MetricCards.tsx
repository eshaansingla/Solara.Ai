import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: "normal" | "warning" | "critical";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = {
    normal: { label: "Normal", dotClass: "glow-dot-success" },
    warning: { label: "Warning", dotClass: "glow-dot-warning" },
    critical: { label: "Critical", dotClass: "glow-dot-danger" },
  };

  const { label, dotClass } = config[status];

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-sm font-medium",
        className
      )}
    >
      <span className={dotClass} />
      {label}
    </motion.div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  status?: "normal" | "warning" | "critical";
  delay?: number;
}

export const MetricCard = ({ title, value, unit, icon, status, delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-muted-foreground text-sm">{title}</span>
        <span className="text-primary/80">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-display font-bold">{value}</span>
        {unit && <span className="text-muted-foreground text-sm mb-1">{unit}</span>}
      </div>
      {status && (
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
      )}
    </motion.div>
  );
};

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  size?: number;
}

export const EfficiencyGauge = ({ value, max = 100, label, size = 160 }: GaugeProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color = percentage > 80 ? "hsl(142, 71%, 45%)" : percentage > 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(216, 30%, 15%)" strokeWidth="8" />
        <motion.circle
          cx="70"
          cy="70"
          r="60"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-display font-bold">{value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">%</span>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
};

interface AIConfidenceBadgeProps {
  confidence: number;
}

export const AIConfidenceBadge = ({ confidence }: AIConfidenceBadgeProps) => {
  const color = confidence > 0.85 ? "text-success" : confidence > 0.6 ? "text-warning" : "text-destructive";
  return (
    <div className={cn("flex items-center gap-2 text-sm font-medium", color)}>
      <div className="w-2 h-2 rounded-full bg-current animate-pulse-glow" />
      AI Confidence: {(confidence * 100).toFixed(0)}%
    </div>
  );
};
