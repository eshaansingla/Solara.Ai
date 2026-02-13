import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Activity, Zap } from "lucide-react";

import { predictSolar, type SolarPredictRequest, type SolarPredictResponse } from "@/integrations/api/solarPredict";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const defaultPayload: SolarPredictRequest = {
  dc_power: 1200,
  ac_power: 1100,
  ambient_temperature: 28,
  module_temperature: 40,
  irradiation: 900,
};

export function RealtimeSolarPanel() {
  const [form, setForm] = useState<SolarPredictRequest>(defaultPayload);

  const mutation = useMutation<SolarPredictResponse, Error, SolarPredictRequest>({
    mutationFn: predictSolar,
  });

  const handleChange =
    (field: keyof SolarPredictRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setForm((prev) => ({ ...prev, [field]: isNaN(value) ? 0 : value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const prediction = mutation.data;

  const riskColor =
    prediction?.risk_level === "High"
      ? "destructive"
      : prediction?.risk_level === "Medium"
      ? "warning"
      : "secondary";

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Realtime Predictive Maintenance
          </h3>
          <p className="text-xs text-muted-foreground">
            Send live inverter readings to the AI backend and get anomaly & risk insights.
          </p>
        </div>
        {prediction && (
          <Badge variant={riskColor} className="text-xs">
            {prediction.risk_level} risk
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">DC Power (W)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.dc_power}
            onChange={handleChange("dc_power")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">AC Power (W)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.ac_power}
            onChange={handleChange("ac_power")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Irradiation (W/m²)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.irradiation}
            onChange={handleChange("irradiation")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ambient Temp (°C)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.ambient_temperature}
            onChange={handleChange("ambient_temperature")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Module Temp (°C)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.module_temperature}
            onChange={handleChange("module_temperature")}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Predicting..." : "Run Prediction"}
          </Button>
        </div>
      </form>

      {mutation.isError && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="w-3 h-3" />
          <span>Prediction failed. Ensure the backend is running and models are trained.</span>
        </div>
      )}

      {prediction && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="glass-card p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">Predicted Efficiency</span>
            </div>
            <p className="mt-1 text-lg font-display font-bold">
              {(prediction.efficiency_prediction * 100).toFixed(1)}%
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-muted-foreground text-xs">Anomaly Score</p>
            <p className="mt-1 text-lg font-display font-bold">
              {prediction.anomaly_score.toFixed(3)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Label: {prediction.anomaly_label === 1 ? "Anomalous" : "Normal"}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-muted-foreground text-xs">Risk Level</p>
            <p className="mt-1 text-lg font-display font-bold">{prediction.risk_level}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Derived from predicted efficiency and model outputs.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

