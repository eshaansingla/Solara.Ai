import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIConfidenceBadge } from "@/components/dashboard/MetricCards";
import { SHAPChart } from "@/components/dashboard/Charts";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AppLayout from "@/components/AppLayout";

interface PredictionResult {
  failureProbability: number;
  rul: number;
  confidence: number;
  features: Array<{ feature: string; importance: number }>;
  degradationCurve: Array<{ day: number; efficiency: number }>;
}

const simulatePrediction = (): Promise<PredictionResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        failureProbability: Math.random() * 40 + 10,
        rul: Math.round(Math.random() * 300 + 60),
        confidence: Math.random() * 0.25 + 0.72,
        features: [
          { feature: "Temperature", importance: 0.32 },
          { feature: "Irradiance", importance: 0.25 },
          { feature: "Vibration", importance: 0.18 },
          { feature: "Humidity", importance: 0.12 },
          { feature: "Voltage Drop", importance: 0.08 },
          { feature: "Current Leak", importance: 0.05 },
        ].sort((a, b) => b.importance - a.importance),
        degradationCurve: Array.from({ length: 30 }, (_, i) => ({
          day: i + 1,
          efficiency: 95 - i * 0.8 - Math.random() * 3,
        })),
      });
    }, 2500);
  });

const Analysis = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [heatmapGenerated, setHeatmapGenerated] = useState(false);

  const handleCSVUpload = async () => {
    if (!csvFile) return;
    setLoading(true);
    setResult(null);
    const prediction = await simulatePrediction();
    setResult(prediction);
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setHeatmapGenerated(false);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setHeatmapGenerated(true);
    setImageLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">AI Analysis</h1>
          <p className="text-muted-foreground text-sm">Upload sensor data or thermal images for AI-powered predictions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Upload */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Sensor Data (CSV)</h2>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {csvFile ? csvFile.name : "Drop CSV file or click to upload"}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </label>

            <Button onClick={handleCSVUpload} disabled={!csvFile || loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Inference...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Analyze Data
                </span>
              )}
            </Button>
          </div>

          {/* Image Upload */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Thermal Image</h2>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-40 object-contain rounded" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Drop thermal image or click to upload</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <Button onClick={handleImageAnalysis} disabled={!imageFile || imageLoading} className="w-full">
              {imageLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Grad-CAM...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Analyze Image
                </span>
              )}
            </Button>

            {heatmapGenerated && imagePreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original</p>
                  <img src={imagePreview} alt="Original" className="rounded-lg w-full" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Heatmap Overlay</p>
                  <div className="relative rounded-lg overflow-hidden w-full aspect-square bg-muted">
                    <img src={imagePreview} alt="Heatmap" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-br from-destructive/40 via-warning/30 to-success/20 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-radial from-destructive/50 via-transparent to-transparent" style={{ backgroundPosition: '60% 40%', backgroundSize: '60% 60%' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Prediction Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-display font-semibold">Prediction Results</h2>
              <AIConfidenceBadge confidence={result.confidence} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Failure Probability</p>
                <p className="text-3xl font-display font-bold text-destructive">
                  {result.failureProbability.toFixed(1)}%
                </p>
                {/* Confidence bar */}
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.failureProbability}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-destructive rounded-full"
                  />
                </div>
              </div>

              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Remaining Useful Life</p>
                <p className="text-3xl font-display font-bold text-success">{result.rul}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>

              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Confidence Interval</p>
                <p className="text-3xl font-display font-bold text-primary">
                  {(result.confidence * 100).toFixed(0)}%
                </p>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SHAPChart data={result.features} />

              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Degradation Curve</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={result.degradationCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsla(216, 30%, 18%, 0.5)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} label={{ value: "Days", position: "insideBottom", offset: -5, fill: "hsl(213, 15%, 55%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(213, 15%, 55%)" }} domain={[60, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="efficiency" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Analysis;
