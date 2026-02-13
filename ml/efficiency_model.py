from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Tuple

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor

from .utils import get_logger


logger = get_logger(__name__)


class EfficiencyRegressor:
    """XGBoost-based efficiency prediction model."""

    def __init__(
        self,
        n_estimators: int = 200,
        learning_rate: float = 0.05,
        max_depth: int = 6,
        random_state: int = 42,
    ) -> None:
        self.model = XGBRegressor(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=random_state,
            objective="reg:squarederror",
            n_jobs=-1,
        )

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series,
    ) -> None:
        logger.info("Training EfficiencyRegressor on X=%s, y=%s", X.shape, y.shape)
        self.model.fit(X.values, y.values)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict(X.values)

    def save(self, path: Path) -> None:
        path = path.resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, path)
        logger.info("Saved efficiency model to %s", path)

    @classmethod
    def load(cls, path: Path) -> "EfficiencyRegressor":
        path = path.resolve()
        if not path.exists():
            logger.error("Efficiency model file not found at %s", path)
            raise FileNotFoundError(f"Efficiency model not found: {path}")
        model = joblib.load(path)
        reg = cls()
        reg.model = model
        return reg

