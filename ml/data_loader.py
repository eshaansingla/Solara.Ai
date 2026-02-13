from __future__ import annotations

from pathlib import Path
from typing import Union

import pandas as pd

from .utils import get_logger


logger = get_logger(__name__)

PathLike = Union[str, Path]


def _validate_path(path: PathLike) -> Path:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        logger.error("Data file not found at %s", p)
        raise FileNotFoundError(f"Data file not found: {p}")
    if not p.is_file():
        logger.error("Expected a file but found directory at %s", p)
        raise IsADirectoryError(f"Expected file but found directory: {p}")
    return p


def load_generation_and_weather(
    generation_csv: PathLike,
    weather_csv: PathLike,
) -> pd.DataFrame:
    """Load and merge generation + weather CSVs.

    - Parses `DATE_TIME` as datetime
    - Ensures `SOURCE_KEY` is string
    - Merges on [`DATE_TIME`, `SOURCE_KEY`]
    - Sorts chronologically within each `SOURCE_KEY`
    - Handles missing values with forward/backward fill and final dropna
    """
    gen_path = _validate_path(generation_csv)
    weather_path = _validate_path(weather_csv)

    logger.info("Loading generation data from %s", gen_path)
    gen_df = pd.read_csv(gen_path, parse_dates=["DATE_TIME"])
    logger.info("Loading weather data from %s", weather_path)
    weather_df = pd.read_csv(weather_path, parse_dates=["DATE_TIME"])

    if "SOURCE_KEY" not in gen_df.columns or "SOURCE_KEY" not in weather_df.columns:
        logger.error("SOURCE_KEY column missing from one of the CSVs")
        raise KeyError("Both CSVs must contain SOURCE_KEY column")

    gen_df["SOURCE_KEY"] = gen_df["SOURCE_KEY"].astype(str)
    weather_df["SOURCE_KEY"] = weather_df["SOURCE_KEY"].astype(str)

    logger.info("Merging generation and weather data")
    df = pd.merge(
        gen_df,
        weather_df,
        on=["DATE_TIME", "SOURCE_KEY"],
        how="inner",
        suffixes=("_gen", "_weather"),
    )

    if df.empty:
        logger.error("Merged dataframe is empty after join on DATE_TIME and SOURCE_KEY")
        raise ValueError("Merged dataframe is empty. Check DATE_TIME and SOURCE_KEY alignment.")

    # Ensure chronological ordering
    df = df.sort_values(["SOURCE_KEY", "DATE_TIME"]).reset_index(drop=True)

    # Handle missing values conservatively
    logger.info("Handling missing values with group-wise forward/backward fill")
    df = (
        df.groupby("SOURCE_KEY")
        .apply(lambda g: g.ffill().bfill())
        .reset_index(drop=True)
    )
    df = df.dropna().reset_index(drop=True)

    logger.info("Data loading completed with %d rows and %d columns", df.shape[0], df.shape[1])
    return df

