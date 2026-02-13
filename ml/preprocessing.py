from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Optional

import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

from .utils import get_logger


logger = get_logger(__name__)


def basic_cleaning(df: pd.DataFrame) -> pd.DataFrame:
    """Perform basic preprocessing on raw merged data.

    - Removes negative power values
    - Filters out nighttime values where irradiation == 0
    """
    required_cols = {"DC_POWER", "AC_POWER", "IRRADIATION"}
    missing = required_cols - set(df.columns)
    if missing:
        logger.error("Missing required columns for preprocessing: %s", missing)
        raise KeyError(f"Missing required columns for preprocessing: {missing}")

    df = df.copy()

    # Remove negative DC/AC power values
    mask_non_negative = (df["DC_POWER"] >= 0) & (df["AC_POWER"] >= 0)
    before = len(df)
    df = df[mask_non_negative]
    logger.info("Removed %d rows with negative power values", before - len(df))

    # Filter out nighttime values where irradiation == 0
    before = len(df)
    df = df[df["IRRADIATION"] > 0]
    logger.info("Removed %d nighttime rows where IRRADIATION == 0", before - len(df))

    df = df.reset_index(drop=True)
    return df


def fit_scaler(
    df: pd.DataFrame,
    feature_columns: Iterable[str],
    scaler_path: Path,
) -> StandardScaler:
    """Fit a StandardScaler on given feature columns and persist it."""
    scaler = StandardScaler()
    X = df[list(feature_columns)].astype("float32")

    logger.info("Fitting StandardScaler on %d samples, %d features", *X.shape)
    scaler.fit(X)

    scaler_path = scaler_path.resolve()
    scaler_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, scaler_path)
    logger.info("Saved scaler to %s", scaler_path)
    return scaler


def load_scaler(scaler_path: Path) -> StandardScaler:
    """Load a previously persisted StandardScaler."""
    scaler_path = scaler_path.resolve()
    if not scaler_path.exists():
        logger.error("Scaler file not found at %s", scaler_path)
        raise FileNotFoundError(f"Scaler file not found: {scaler_path}")
    scaler: StandardScaler = joblib.load(scaler_path)
    return scaler


def apply_scaler(
    df: pd.DataFrame,
    feature_columns: Iterable[str],
    scaler: StandardScaler,
    inplace: bool = False,
) -> pd.DataFrame:
    """Apply an existing StandardScaler to dataframe features."""
    target_df = df if inplace else df.copy()
    cols: List[str] = list(feature_columns)
    X = target_df[cols].astype("float32")
    X_scaled = scaler.transform(X)
    target_df[cols] = X_scaled
    return target_df

