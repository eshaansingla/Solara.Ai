import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wrench, Calendar, DollarSign, TrendingUp, Download, FileText, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import AppLayout from "@/components/AppLayout";

const mockPlans = [
  { id: 1, title: "Panel Array A - Cleaning", date: "2026-02-20", cost: 450, savings: 1200, priority: "high", status: "scheduled" },
  { id: 2, title: "Inverter #3 - Replacement", date: "2026-03-05", cost: 2800, savings: 8500, priority: "critical", status: "pending" },
  { id: 3, title: "Wiring Check - Section B", date: "2026-03-15", cost: 200, savings: 600, priority: "medium", status: "scheduled" },
  { id: 4, title: "Panel Array C - Realignment", date: "2026-04-01", cost: 1500, savings: 4200, priority: "low", status: "pending" },
];

const costComparison = [
  { category: "Panel Cleaning", reactive: 1800, proactive: 450 },
  { category: "Inverter Repair", reactive: 12000, proactive: 2800 },
  { category: "Wiring", reactive: 900, proactive: 200 },
  { category: "Realignment", reactive: 6000, proactive: 1500 },
];

const Maintenance = () => {
  const [plans] = useState(mockPlans);

  const totalSavings = useMemo(() => plans.reduce((s, p) => s + p.savings, 0), [plans]);
  const totalCost = useMemo(() => plans.reduce((s, p) => s + p.cost, 0), [plans]);
  const roi = useMemo(() => ((totalSavings - totalCost) / totalCost * 100).toFixed(0), [totalSavings, totalCost]);

  const handleExport = (type: "pdf" | "excel") => {
    // Simulate download
    const blob = new Blob(
      [type === "pdf" ? "SOLARA.AI Maintenance Report\n\n" + plans.map(p => `${p.title} - ${p.date} - $${p.cost}`).join("\n") : "Title,Date,Cost,Savings\n" + plans.map(p => `${p.title},${p.date},${p.cost},${p.savings}`).join("\n")],
      { type: type === "pdf" ? "text/plain" : "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solara-maintenance-report.${type === "pdf" ? "txt" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const priorityColor: Record<string, string> = {
    critical: "text-destructive",
    high: "text-warning",
    medium: "text-primary",
    low: "text-muted-foreground",
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Maintenance Planner</h1>
            <p className="text-muted-foreground text-sm">AI-optimized maintenance scheduling</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="w-4 h-4 mr-1" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <Sheet className="w-4 h-4 mr-1" /> Export Excel
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 text-center">
            <DollarSign className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Savings</p>
            <p className="text-2xl font-display font-bold text-success">${totalSavings.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">ROI</p>
            <p className="text-2xl font-display font-bold text-primary">{roi}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 text-center">
            <Calendar className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Planned Tasks</p>
            <p className="text-2xl font-display font-bold">{plans.length}</p>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" /> Maintenance Timeline
          </h2>
          <div className="space-y-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-1 h-12 rounded-full bg-primary/50" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{plan.title}</p>
                    <span className={`text-xs font-medium uppercase ${priorityColor[plan.priority]}`}>
                      {plan.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${plan.cost.toLocaleString()}</p>
                  <p className="text-xs text-success">saves ${plan.savings.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cost Comparison Chart */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Reactive vs Proactive Cost</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: "hsl(213, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="reactive" name="Reactive" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="proactive" name="Proactive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
};

export default Maintenance;
