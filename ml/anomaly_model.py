from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from .utils import get_logger


logger = get_logger(__name__)


class AnomalyDetector:
    """Unsupervised anomaly detection using IsolationForest."""

    def __init__(
        self,
        contamination: float = 0.05,
        random_state: int = 42,
    ) -> None:
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1,
        )

    def fit(self, X: pd.DataFrame) -> None:
        logger.info("Fitting IsolationForest on shape %s", X.shape)
        self.model.fit(X.values)

    def predict(
        self, X: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Return anomaly_score and anomaly_label (0 normal, 1 anomaly)."""
        scores = -self.model.score_samples(X.values)  # higher = more anomalous
        labels = (self.model.predict(X.values) == -1).astype(int)
        return scores, labels

    def save(self, path: Path) -> None:
        path = path.resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, path)
        logger.info("Saved anomaly model to %s", path)

    @classmethod
    def load(cls, path: Path) -> "AnomalyDetector":
        path = path.resolve()
        if not path.exists():
            logger.error("Anomaly model file not found at %s", path)
            raise FileNotFoundError(f"Anomaly model not found: {path}")
        model = joblib.load(path)
        detector = cls()
        detector.model = model
        return detector

