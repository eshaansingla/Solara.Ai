from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd

from .anomaly_model import AnomalyDetector
from .classifier_model import FailureRiskClassifier, RISK_LEVELS
from .efficiency_model import EfficiencyRegressor
from .feature_engineering import FEATURE_COLUMNS, add_engineered_features
from .preprocessing import basic_cleaning, load_scaler, apply_scaler
from .utils import get_logger


logger = get_logger(__name__)

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
ANOMALY_MODEL_PATH = MODELS_DIR / "anomaly_model.pkl"
EFFICIENCY_MODEL_PATH = MODELS_DIR / "efficiency_model.pkl"
CLASSIFIER_MODEL_PATH = MODELS_DIR / "classifier_model.pkl"


@dataclass
class SolarInput:
    dc_power: float
    ac_power: float
    ambient_temperature: float
    module_temperature: float
    irradiation: float

    def to_dataframe(self) -> pd.DataFrame:
        """Convert to a single-row DataFrame with required columns.

        For online prediction we synthesize minimal fields required by
        preprocessing and feature engineering.
        """
        df = pd.DataFrame(
            [
                {
                    "DC_POWER": self.dc_power,
                    "AC_POWER": self.ac_power,
                    "AMBIENT_TEMPERATURE": self.ambient_temperature,
                    "MODULE_TEMPERATURE": self.module_temperature,
                    "IRRADIATION": self.irradiation,
                    "SOURCE_KEY": "online_inverter",
                    "DATE_TIME": pd.Timestamp.utcnow(),
                }
            ]
        )
        return df


class PredictionService:
    """Thread-safe, lazily loaded prediction service."""

    def __init__(self) -> None:
        self._scaler = None
        self._eff_model = None
        self._clf_model = None
        self._anomaly_model = None

    def _load_assets(self) -> None:
        if self._scaler is None:
            logger.info("Loading scaler from %s", SCALER_PATH)
            self._scaler = load_scaler(SCALER_PATH)
        if self._eff_model is None:
            logger.info("Loading efficiency model from %s", EFFICIENCY_MODEL_PATH)
            self._eff_model = EfficiencyRegressor.load(EFFICIENCY_MODEL_PATH)
        if self._clf_model is None:
            logger.info("Loading classifier model from %s", CLASSIFIER_MODEL_PATH)
            self._clf_model = FailureRiskClassifier.load(CLASSIFIER_MODEL_PATH)
        if self._anomaly_model is None:
            logger.info("Loading anomaly model from %s", ANOMALY_MODEL_PATH)
            self._anomaly_model = AnomalyDetector.load(ANOMALY_MODEL_PATH)

    def predict(self, solar_input: SolarInput) -> Dict[str, Any]:
        """Run full prediction pipeline on single input."""
        try:
            self._load_assets()

            df_raw = solar_input.to_dataframe()
            df_clean = basic_cleaning(df_raw)
            if df_clean.empty:
                raise ValueError("Input filtered out during preprocessing (e.g., irradiation == 0).")

            df_feat = add_engineered_features(df_clean)

            X = df_feat[FEATURE_COLUMNS].astype("float32")
            X_scaled_df = apply_scaler(
                df_feat, FEATURE_COLUMNS, self._scaler, inplace=False
            )[FEATURE_COLUMNS]

            # Efficiency prediction (use scaled features)
            eff_pred = float(self._eff_model.predict(X_scaled_df)[0])

            # Anomaly score/label (use scaled features)
            anomaly_score_arr, anomaly_label_arr = self._anomaly_model.predict(
                X_scaled_df
            )
            anomaly_score = float(anomaly_score_arr[0])
            anomaly_label = int(anomaly_label_arr[0])

            # Risk level (use scaled features)
            risk_label = int(self._clf_model.predict_label(X_scaled_df)[0])
            risk_level = RISK_LEVELS.get(risk_label, "Low")

            return {
                "efficiency_prediction": eff_pred,
                "anomaly_score": anomaly_score,
                "anomaly_label": anomaly_label,
                "risk_level": risk_level,
            }
        except Exception as exc:  # noqa: BLE001
            logger.error("Prediction failed: %s", exc, exc_info=True)
            raise


prediction_service = PredictionService()

