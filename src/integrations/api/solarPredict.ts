import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type SolarPredictRequest = {
  dc_power: number;
  ac_power: number;
  ambient_temperature: number;
  module_temperature: number;
  irradiation: number;
};

export type SolarPredictResponse = {
  efficiency_prediction: number;
  anomaly_score: number;
  anomaly_label: number;
  risk_level: "Low" | "Medium" | "High";
};

export async function predictSolar(
  payload: SolarPredictRequest
): Promise<SolarPredictResponse> {
  const response = await axios.post<SolarPredictResponse>(
    `${API_BASE_URL}/predict/solar`,
    payload,
    {
      timeout: 8000,
    }
  );
  return response.data;
}

