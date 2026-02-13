import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Sun, Zap, Shield, BarChart3, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  const features = [
    { icon: Brain, title: "AI Predictions", desc: "Predict panel failures before they happen" },
    { icon: BarChart3, title: "Real-Time Monitoring", desc: "Live sensor data with 3-second updates" },
    { icon: Shield, title: "Anomaly Detection", desc: "Automated severity classification" },
    { icon: Zap, title: "Smart Maintenance", desc: "Optimized scheduling with ROI analysis" },
  ];

  return (
    <div className="min-h-screen page-gradient">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-2">
          <Sun className="w-8 h-8 text-primary" />
          <span className="text-2xl font-display font-bold glow-text">SOLARA.AI</span>
        </div>
        <Button onClick={() => navigate("/auth")}>
          Get Started <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-12 py-20 lg:py-32 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm text-primary mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Solar Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight">
            Predict. Protect.{" "}
            <span className="glow-text">Perform.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Advanced AI platform for solar panel failure prediction, efficiency monitoring, and intelligent maintenance scheduling.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Launch Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              View Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 lg:px-12 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card-hover p-6 text-center"
            >
              <f.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Carbon Badge */}
      <section className="relative z-10 px-6 lg:px-12 pb-20 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-8 gradient-border"
        >
          <p className="text-sm text-muted-foreground mb-2">Estimated Carbon Savings</p>
          <p className="text-4xl font-display font-bold glow-text">2,847 tons CO₂</p>
          <p className="text-sm text-muted-foreground mt-2">reduced through predictive maintenance optimization</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
