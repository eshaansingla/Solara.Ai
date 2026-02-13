from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, mean_absolute_error, mean_squared_error

from .anomaly_model import AnomalyDetector
from .classifier_model import FailureRiskClassifier, efficiency_to_risk_label
from .data_loader import load_generation_and_weather
from .feature_engineering import FEATURE_COLUMNS, add_engineered_features
from .efficiency_model import EfficiencyRegressor
from .preprocessing import basic_cleaning, fit_scaler
from .utils import get_logger


logger = get_logger(__name__)

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
ANOMALY_MODEL_PATH = MODELS_DIR / "anomaly_model.pkl"
EFFICIENCY_MODEL_PATH = MODELS_DIR / "efficiency_model.pkl"
CLASSIFIER_MODEL_PATH = MODELS_DIR / "classifier_model.pkl"


def build_dataset(
    generation_csv: Path,
    weather_csv: Path,
) -> pd.DataFrame:
    df = load_generation_and_weather(generation_csv, weather_csv)
    df = basic_cleaning(df)
    df = add_engineered_features(df)
    return df


def train_models(
    df: pd.DataFrame,
) -> None:
    # Prepare regression target: future efficiency (shifted by 1 timestep)
    df = df.sort_values(["SOURCE_KEY", "DATE_TIME"]).reset_index(drop=True)
    df["efficiency_target"] = (
        df.groupby("SOURCE_KEY")["efficiency"].shift(-1)
    )
    df = df.dropna(subset=["efficiency_target"]).reset_index(drop=True)

    feature_cols = FEATURE_COLUMNS
    X = df[feature_cols].astype("float32")
    y_eff = df["efficiency_target"].astype("float32")

    # Train-test split by time (80/20)
    split_idx = int(0.8 * len(df))
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y_eff.iloc[:split_idx], y_eff.iloc[split_idx:]

    # Fit scaler on training data only
    scaler = fit_scaler(
        df=X_train,
        feature_columns=feature_cols,
        scaler_path=SCALER_PATH,
    )
    X_train_s = scaler.transform(X_train.values)
    X_test_s = scaler.transform(X_test.values)

    X_train_s_df = pd.DataFrame(X_train_s, columns=feature_cols)
    X_test_s_df = pd.DataFrame(X_test_s, columns=feature_cols)

    # Efficiency regression
    eff_model = EfficiencyRegressor()
    eff_model.fit(X_train_s_df, y_train)
    y_pred_eff = eff_model.predict(X_test_s_df)

    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_eff)))
    mae = float(mean_absolute_error(y_test, y_pred_eff))
    logger.info("Efficiency model RMSE=%.5f, MAE=%.5f", rmse, mae)

    # Failure risk classification
    y_risk = df["efficiency_target"].apply(efficiency_to_risk_label).astype(int)
    y_risk_train, y_risk_test = y_risk.iloc[:split_idx], y_risk.iloc[split_idx:]

    clf = FailureRiskClassifier()
    clf.fit(X_train_s_df, y_risk_train)
    y_risk_pred = clf.predict_label(X_test_s_df)

    f1 = float(f1_score(y_risk_test, y_risk_pred, average="weighted"))
    logger.info("Failure risk classifier F1-score=%.5f", f1)

    # Anomaly detection (using same scaled features, full dataset)
    X_all_scaled = scaler.transform(X.values)
    X_all_scaled_df = pd.DataFrame(X_all_scaled, columns=feature_cols)

    anomaly = AnomalyDetector()
    anomaly.fit(X_all_scaled_df)

    # Persist all models
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    eff_model.save(EFFICIENCY_MODEL_PATH)
    clf.save(CLASSIFIER_MODEL_PATH)
    anomaly.save(ANOMALY_MODEL_PATH)

    logger.info("Training complete. Models saved under %s", MODELS_DIR)
    logger.info("Metrics -> RMSE: %.5f | MAE: %.5f | F1: %.5f", rmse, mae, f1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train solar predictive maintenance models.",
    )
    parser.add_argument(
        "--generation-csv",
        type=Path,
        required=True,
        help="Path to solar generation CSV (Kaggle dataset).",
    )
    parser.add_argument(
        "--weather-csv",
        type=Path,
        required=True,
        help="Path to solar weather CSV (Kaggle dataset).",
    )

    args = parser.parse_args()

    df = build_dataset(args.generation_csv, args.weather_csv)
    train_models(df)


if __name__ == "__main__":
    main()

