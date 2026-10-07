"""
TourSafe Anomaly Scorer.
Calculates reconstruction error anomaly scores matching Prompt 8 evaluation standard:
Mean Squared Error (MSE) between original normalized sequence and LSTM autoencoder reconstruction.
"""

from typing import Dict, Tuple
import numpy as np

from ...ml.config import FEATURE_NAMES


class AnomalyScorer:
    """
    Computes numerical anomaly metrics from original and reconstructed IMU tensors.
    """

    @staticmethod
    def compute_mse_score(
        x_original: np.ndarray,
        x_reconstructed: np.ndarray,
    ) -> float:
        """
        Computes peak-aware reconstruction error across timesteps and channels:
        Combines global window MSE with localized peak transient step error.
        """
        diff = np.asarray(x_original, dtype=np.float32) - np.asarray(x_reconstructed, dtype=np.float32)
        if diff.ndim == 3:
            diff = diff[0]
        mean_mse = float(np.mean(np.square(diff)))
        step_mse = np.mean(np.square(diff), axis=-1)
        peak_mse = float(np.max(step_mse))
        return max(0.0, float(0.5 * mean_mse + 0.5 * peak_mse))

    @staticmethod
    def compute_channel_breakdown(
        x_original: np.ndarray,
        x_reconstructed: np.ndarray,
    ) -> Dict[str, float]:
        """
        Computes per-channel MSE for detailed ML observability and debugging.
        """
        diff = np.asarray(x_original, dtype=np.float32) - np.asarray(x_reconstructed, dtype=np.float32)
        # Squeeze batch dimension if present
        if diff.ndim == 3:
            diff = diff[0]

        channel_mse = np.mean(np.square(diff), axis=0)
        breakdown = {}
        for idx, feat in enumerate(FEATURE_NAMES):
            if idx < len(channel_mse):
                breakdown[feat] = round(float(channel_mse[idx]), 6)

        return breakdown


anomaly_scorer = AnomalyScorer()
