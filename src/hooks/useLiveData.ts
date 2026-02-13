import { useEffect, useState, useCallback } from "react";

export interface SensorReading {
  temperature: number;
  irradiance: number;
  outputEfficiency: number;
  vibration: number;
  timestamp: Date;
  status: "normal" | "warning" | "critical";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateReading(): SensorReading {
  const temp = randomBetween(25, 85);
  const irradiance = randomBetween(200, 1100);
  const efficiency = randomBetween(60, 98);
  const vibration = randomBetween(0.1, 5.0);

  let status: SensorReading["status"] = "normal";
  if (temp > 70 || efficiency < 70 || vibration > 3.5) status = "critical";
  else if (temp > 55 || efficiency < 80 || vibration > 2.5) status = "warning";

  return {
    temperature: Math.round(temp * 10) / 10,
    irradiance: Math.round(irradiance),
    outputEfficiency: Math.round(efficiency * 10) / 10,
    vibration: Math.round(vibration * 100) / 100,
    timestamp: new Date(),
    status,
  };
}

export function useLiveData(intervalMs = 3000) {
  const [current, setCurrent] = useState<SensorReading>(generateReading());
  const [history, setHistory] = useState<SensorReading[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const reading = generateReading();
      setCurrent(reading);
      setHistory((prev) => [...prev.slice(-59), reading]);
    }, intervalMs);

    // Initial batch
    const initial = Array.from({ length: 20 }, () => {
      const r = generateReading();
      r.timestamp = new Date(Date.now() - Math.random() * 60000);
      return r;
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setHistory(initial);

    return () => clearInterval(id);
  }, [intervalMs]);

  return { current, history };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    severity: string;
    message: string;
    sensorType: string;
    value: number;
    timestamp: Date;
  }>>([]);

  const addAlert = useCallback((reading: SensorReading) => {
    if (reading.status === "critical") {
      const alert = {
        id: crypto.randomUUID(),
        severity: "critical",
        message: reading.temperature > 70
          ? `High temperature detected: ${reading.temperature}°C`
          : reading.outputEfficiency < 70
          ? `Low efficiency detected: ${reading.outputEfficiency}%`
          : `High vibration detected: ${reading.vibration}g`,
        sensorType: reading.temperature > 70 ? "temperature" : reading.outputEfficiency < 70 ? "efficiency" : "vibration",
        value: reading.temperature > 70 ? reading.temperature : reading.outputEfficiency < 70 ? reading.outputEfficiency : reading.vibration,
        timestamp: new Date(),
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    } else if (reading.status === "warning" && Math.random() > 0.7) {
      const alert = {
        id: crypto.randomUUID(),
        severity: "warning",
        message: `Sensor anomaly detected - efficiency at ${reading.outputEfficiency}%`,
        sensorType: "efficiency",
        value: reading.outputEfficiency,
        timestamp: new Date(),
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    }
  }, []);

  return { alerts, addAlert };
}
