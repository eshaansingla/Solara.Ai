from __future__ import annotations

from typing import List

import numpy as np
import pandas as pd

from .utils import get_logger


logger = get_logger(__name__)


FEATURE_COLUMNS: List[str] = [
    "DC_POWER",
    "AC_POWER",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
    "IRRADIATION",
    "efficiency",
    "thermal_stress",
    "dc_ac_ratio",
    "rolling_mean_power",
    "rolling_std_power",
    "rolling_temp_mean",
]


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add domain-specific and rolling features.

    Assumes:
    - Columns: DC_POWER, AC_POWER, AMBIENT_TEMPERATURE,
      MODULE_TEMPERATURE, IRRADIATION, SOURCE_KEY, DATE_TIME
    """
    required_cols = {
        "DC_POWER",
        "AC_POWER",
        "AMBIENT_TEMPERATURE",
        "MODULE_TEMPERATURE",
        "IRRADIATION",
        "SOURCE_KEY",
        "DATE_TIME",
    }
    missing = required_cols - set(df.columns)
    if missing:
        logger.error("Missing required columns for feature engineering: %s", missing)
        raise KeyError(f"Missing required columns for feature engineering: {missing}")

    df = df.copy()
    df = df.sort_values(["SOURCE_KEY", "DATE_TIME"]).reset_index(drop=True)

    # Basic engineered features
    eps = 1e-6
    # Efficiency: AC output per unit irradiation (avoid division by zero)
    df["efficiency"] = df["AC_POWER"] / np.clip(df["IRRADIATION"], eps, None)

    # Thermal stress: module hotter than ambient
    df["thermal_stress"] = df["MODULE_TEMPERATURE"] - df["AMBIENT_TEMPERATURE"]

    # DC/AC ratio: DC input relative to AC output
    df["dc_ac_ratio"] = df["DC_POWER"] / np.clip(df["AC_POWER"], eps, None)

    # Rolling statistics per inverter (SOURCE_KEY)
    logger.info("Computing rolling features with window=4, min_periods=1")
    group = df.groupby("SOURCE_KEY", group_keys=False)

    df["rolling_mean_power"] = group["AC_POWER"].apply(
        lambda s: s.rolling(window=4, min_periods=1).mean()
    )
    df["rolling_std_power"] = group["AC_POWER"].apply(
        lambda s: s.rolling(window=4, min_periods=1).std().fillna(0.0)
    )
    df["rolling_temp_mean"] = group["MODULE_TEMPERATURE"].apply(
        lambda s: s.rolling(window=4, min_periods=1).mean()
    )

    # Ensure no NaN remains
    df = df.ffill().bfill()
    df = df.dropna().reset_index(drop=True)

    logger.info(
        "Feature engineering completed. Final shape: %d rows, %d columns",
        df.shape[0],
        df.shape[1],
    )
    return df

