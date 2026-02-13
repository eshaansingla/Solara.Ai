from __future__ import annotations

from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

from .utils import get_logger


logger = get_logger(__name__)


RISK_LEVELS = {0: "Low", 1: "Medium", 2: "High"}


def efficiency_to_risk_label(efficiency: float) -> int:
    """Map efficiency value to discrete risk label."""
    if efficiency < 0.8:
        return 2  # High
    if efficiency < 0.9:
        return 1  # Medium
    return 0  # Low


class FailureRiskClassifier:
    """Classify failure risk based on engineered features."""

    def __init__(
        self,
        random_state: int = 42,
    ) -> None:
        self.model = XGBClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="mlogloss",
            random_state=random_state,
            n_jobs=-1,
        )

    def fit(self, X: pd.DataFrame, y: pd.Series) -> None:
        logger.info("Training FailureRiskClassifier on X=%s, y=%s", X.shape, y.shape)
        self.model.fit(X.values, y.values)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict_proba(X.values)

    def predict_label(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict(X.values)

    def predict_risk_level(self, X: pd.DataFrame) -> np.ndarray:
        labels = self.predict_label(X)
        vec_map = np.vectorize(lambda idx: RISK_LEVELS.get(int(idx), "Low"))
        return vec_map(labels)

    def save(self, path: Path) -> None:
        path = path.resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, path)
        logger.info("Saved classifier model to %s", path)

    @classmethod
    def load(cls, path: Path) -> "FailureRiskClassifier":
        path = path.resolve()
        if not path.exists():
            logger.error("Classifier model file not found at %s", path)
            raise FileNotFoundError(f"Classifier model not found: {path}")
        model = joblib.load(path)
        clf = cls()
        clf.model = model
        return clf

