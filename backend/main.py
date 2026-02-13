from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

from ml.predict import SolarInput, prediction_service
from ml.utils import get_logger


logger = get_logger(__name__)

app = FastAPI(title="Solara AI Backend", version="1.0.0")

# Allow the existing React frontend (Vite dev + production) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SolarRequest(BaseModel):
    dc_power: float = Field(..., gt=0, description="DC power (W)")
    ac_power: float = Field(..., gt=0, description="AC power (W)")
    ambient_temperature: float = Field(..., description="Ambient temperature (°C)")
    module_temperature: float = Field(..., description="Module temperature (°C)")
    irradiation: float = Field(..., gt=0, description="Solar irradiation (W/m²)")

    @validator("module_temperature")
    def module_temp_not_extreme(cls, v: float) -> float:  # noqa: N805
        if v < -40 or v > 120:
            raise ValueError("module_temperature out of realistic bounds")
        return v

    @validator("ambient_temperature")
    def ambient_temp_not_extreme(cls, v: float) -> float:  # noqa: N805
        if v < -40 or v > 80:
            raise ValueError("ambient_temperature out of realistic bounds")
        return v


class SolarPredictionResponse(BaseModel):
    efficiency_prediction: float
    anomaly_score: float
    anomaly_label: int
    risk_level: str


@app.on_event("startup")
async def startup_event() -> None:
    """Eagerly load models once at startup for low-latency inference."""
    try:
        logger.info("Warm-up: loading prediction assets")
        _ = prediction_service.predict(
            SolarInput(
                dc_power=1.0,
                ac_power=1.0,
                ambient_temperature=25.0,
                module_temperature=35.0,
                irradiation=1.0,
            )
        )
        logger.info("Warm-up completed successfully")
    except Exception as exc:  # noqa: BLE001
        logger.error("Warm-up failed (models may not be trained yet): %s", exc)


@app.post("/predict/solar", response_model=SolarPredictionResponse)
async def predict_solar(payload: SolarRequest) -> Dict[str, Any]:
    """Predict solar panel efficiency, anomaly score, and failure risk level."""
    start_time = time.perf_counter()
    try:
        solar_input = SolarInput(
            dc_power=payload.dc_power,
            ac_power=payload.ac_power,
            ambient_temperature=payload.ambient_temperature,
            module_temperature=payload.module_temperature,
            irradiation=payload.irradiation,
        )
        result = prediction_service.predict(solar_input)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        logger.info("Prediction served in %.2f ms", elapsed_ms)
        return result
    except Exception as exc:  # noqa: BLE001
        logger.error("Prediction API failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal model error") from exc


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}

