"""
TourSafe ML End-to-End Pipeline Orchestrator.
Orchestrates dataset generation, subject-wise splitting, robust scaling,
LSTM Autoencoder training, threshold calibration, comprehensive evaluation,
and versioned artifact export.
"""

from __future__ import annotations
import argparse
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Set, Tuple

import numpy as np
try:
    import torch
except Exception:
    torch = None

from .config import PipelineConfig, default_pipeline_config
from .dataset.benchmark_loaders import BenchmarkDatasetAdapter
from .dataset.dataset_builder import DatasetBuilder, DatasetBundle
from .dataset.synthetic_generator import SyntheticIMUGenerator
from .evaluation.evaluator import AnomalyEvaluationReport, ModelEvaluator
from .evaluation.threshold import AnomalyThresholdCalibrator, ThresholdCalibrationResult
from .models.lstm_autoencoder import TourSafeLSTMAutoencoder
from .preprocessing.scaler import TourSafeRobustScaler
from .training.trainer import AutoencoderTrainer, TrainingResult
from .artifacts.manager import ModelArtifactManager


class MLTrainingPipeline:
    """
    Coordinates the full ML training lifecycle for TourSafe's LSTM Autoencoder.
    """

    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or default_pipeline_config
        self.artifact_manager = ModelArtifactManager(self.config.artifact)
        self.dataset_builder = DatasetBuilder(self.config.window)
        self.calibrator = AnomalyThresholdCalibrator()
        self.evaluator = ModelEvaluator(device=self.config.training.device)

    def run(
        self,
        n_train_subjects: int = 14,
        n_val_subjects: int = 3,
        n_test_subjects: int = 4,
        verbose: bool = True,
    ) -> Tuple[TourSafeLSTMAutoencoder, TourSafeRobustScaler, ThresholdCalibrationResult, AnomalyEvaluationReport, Dict[str, Any]]:
        """
        Executes complete training and evaluation pipeline:
        1. Multi-subject IMU dataset generation with strict anti-leakage splitting
        2. Window extraction & uniform 50 Hz resampling (150 steps @ 8 channels)
        3. Robust scaler fitting strictly on training normal data
        4. LSTM Autoencoder training with early stopping
        5. Statistical threshold calibration on validation normal errors
        6. Comprehensive test set evaluation & baseline comparisons
        7. Model artifact export (PyTorch weights, ONNX, Scaler, Thresholds, Metadata)
        """
        if verbose:
            print("=" * 70)
            print(" TOURSAFE ML PIPELINE: LSTM AUTOENCODER TRAINING & EVALUATION")
            print("=" * 70)

        # ---------------------------------------------------------
        # Step 1: Ingest & Partition Multi-Subject Cohort
        # ---------------------------------------------------------
        if verbose:
            print("\n[1/6] Ingesting & partitioning multi-subject IMU cohorts...")

        mobiact_dir = Path(__file__).resolve().parent / "datasets" / "mobiact"
        if mobiact_dir.exists() and any(mobiact_dir.rglob("*_acc_*.txt")):
            if verbose:
                print(f"  • Loading real benchmark dataset from: {mobiact_dir}")
            all_trials = BenchmarkDatasetAdapter.load_all_mobiact_trials(mobiact_dir)
            train_subs = {"SUB_02", "SUB_03", "SUB_04", "SUB_05", "SUB_07"}
            val_subs = {"SUB_08", "SUB_09"}
            test_subs = {t["subject_id"] for t in all_trials} - train_subs - val_subs

            train_trials = [t for t in all_trials if t["subject_id"] in train_subs and not t["is_anomaly"]]
            val_trials = [t for t in all_trials if t["subject_id"] in val_subs and not t["is_anomaly"]]
            test_trials = [t for t in all_trials if t["subject_id"] in test_subs]
        else:
            if verbose:
                print("  • Generating synthetic IMU cohort fallback...")
            generator = SyntheticIMUGenerator(
                target_hz=self.config.window.nominal_frequency_hz,
                random_seed=self.config.training.random_seed,
            )
            train_trials, val_trials, test_trials = generator.generate_cohort(
                n_train_subjects=n_train_subjects,
                n_val_subjects=n_val_subjects,
                n_test_subjects=n_test_subjects,
            )

        dataset_bundle: DatasetBundle = self.dataset_builder.build_dataset_bundle(
            train_trials=train_trials,
            val_trials=val_trials,
            test_trials=test_trials,
        )

        # Collect training and test arrays from MobiAct base
        X_train_list = [dataset_bundle.X_train_normal]
        X_val_list = [dataset_bundle.X_val_normal]
        X_test_list = [dataset_bundle.X_test]
        y_test_list = [dataset_bundle.y_test]
        test_acts = list(dataset_bundle.test_activities)

        # --- Ingest UCI-HAR Benchmark Cohort ---
        uci_dir = Path(__file__).resolve().parent / "datasets" / "uci_har"
        uci_cohort = BenchmarkDatasetAdapter.load_uci_har_cohort(uci_dir)
        if uci_cohort:
            if "train" in uci_cohort:
                X_train_list.append(uci_cohort["train"]["features"])
                if verbose:
                    print(f"  • Integrated UCI-HAR Train:      {len(uci_cohort['train']['features'])} normal windows (30 subjects)")
            if "test" in uci_cohort:
                X_test_list.append(uci_cohort["test"]["features"])
                y_test_list.append(uci_cohort["test"]["labels"])
                test_acts.extend(uci_cohort["test"]["activities"])
                if verbose:
                    print(f"  • Integrated UCI-HAR Test:       {len(uci_cohort['test']['features'])} normal windows (unseen subjects)")

        # --- Ingest SisFall (Enhanced) Benchmark Cohort ---
        sisfall_dir = Path(__file__).resolve().parent / "datasets" / "sisfall"
        sisfall_cohort = BenchmarkDatasetAdapter.load_sisfall_enhanced_cohort(sisfall_dir)
        if sisfall_cohort:
            if "train" in sisfall_cohort:
                X_train_list.append(sisfall_cohort["train"]["features"])
                if verbose:
                    print(f"  • Integrated SisFall Train:      {len(sisfall_cohort['train']['features'])} normal windows (38 subjects)")
            if "test" in sisfall_cohort:
                X_test_list.append(sisfall_cohort["test"]["features"])
                y_test_list.append(sisfall_cohort["test"]["labels"])
                test_acts.extend(sisfall_cohort["test"]["activities"])
                if verbose:
                    print(f"  • Integrated SisFall Test:       {len(sisfall_cohort['test']['features'])} windows (ADL + severe falls)")

        X_train_combined = np.concatenate(X_train_list, axis=0)
        X_val_combined = np.concatenate(X_val_list, axis=0)
        X_test_combined = np.concatenate(X_test_list, axis=0)
        y_test_combined = np.concatenate(y_test_list, axis=0)

        n_norm_test = int(np.sum(y_test_combined == 0))
        n_anom_test = int(np.sum(y_test_combined == 1))

        if verbose:
            print("\n  --- Unified Multi-Cohort Dataset Summary ---")
            print(f"  • Total Normal Training Windows: {len(X_train_combined)} sequences")
            print(f"  • Total Normal Validation Windows:{len(X_val_combined)} sequences")
            print(f"  • Total Multi-Cohort Test Windows: {len(X_test_combined)} ({n_norm_test} norm, {n_anom_test} fall anomalies)")
            print(f"  • Unified Window Dimensions:     {X_train_combined.shape}")

        # ---------------------------------------------------------
        # Step 2: Fit Robust Scaler ONLY on Normal Training Data
        # ---------------------------------------------------------
        if verbose:
            print("\n[2/6] Fitting RobustScaler on normal training motion across 3 cohorts...")
        scaler = TourSafeRobustScaler(feature_names=self.config.features)
        X_train_scaled = scaler.fit_transform(X_train_combined)
        X_val_scaled = scaler.transform(X_val_combined)
        X_test_scaled = scaler.transform(X_test_combined)

        if verbose:
            print(f"  • Scaler fitted on {len(X_train_scaled)} normal sequences across {scaler.n_features_in_} channels.")

        # ---------------------------------------------------------
        # Step 3: Initialize & Train PyTorch LSTM Autoencoder
        # ---------------------------------------------------------
        if verbose:
            print("\n[3/6] Initializing & Training LSTM Autoencoder on GPU...")
        model = TourSafeLSTMAutoencoder(self.config.model)
        trainer = AutoencoderTrainer(model=model, config=self.config.training)

        training_result: TrainingResult = trainer.train(
            X_train_scaled=X_train_scaled,
            X_val_scaled=X_val_scaled,
            verbose=verbose,
        )

        best_model = training_result.best_model

        # ---------------------------------------------------------
        # Step 4: Calibrate Anomaly Threshold on Validation Errors
        # ---------------------------------------------------------
        if verbose:
            print("\n[4/6] Calibrating anomaly thresholds on validation normal errors...")
        val_errors = self.evaluator.compute_model_scores(best_model, X_val_scaled)
        threshold_result: ThresholdCalibrationResult = self.calibrator.calibrate(
            val_reconstruction_errors=val_errors,
            method="percentile_95",
            epoch=training_result.best_epoch,
        )

        if verbose:
            print(f"  • Primary Anomaly Threshold: {threshold_result.primary_threshold:.6f}")
            print(f"  • Warning Anomaly Threshold: {threshold_result.warning_threshold:.6f}")
            print(f"  • Critical Anomaly Threshold: {threshold_result.critical_threshold:.6f}")
            print(f"  • Val Error Mean: {threshold_result.val_score_mean:.6f}, Std: {threshold_result.val_score_std:.6f}")

        # ---------------------------------------------------------
        # Step 5: Evaluate on Held-Out Test Set & Compare Baselines
        # ---------------------------------------------------------
        if verbose:
            print("\n[5/6] Evaluating on held-out test cohort & comparing baselines...")
        eval_report: AnomalyEvaluationReport = self.evaluator.evaluate(
            model=best_model,
            X_test=X_test_scaled,
            y_test=y_test_combined,
            test_activities=test_acts,
            threshold_result=threshold_result,
            X_train=X_train_scaled,
            X_val=X_val_scaled,
        )

        if verbose:
            print(f"  • ROC-AUC Score:      {eval_report.roc_auc:.4f}")
            print(f"  • PR-AUC Score:       {eval_report.pr_auc:.4f}")
            print(f"  • Precision:          {eval_report.precision_at_calibrated_threshold:.4f}")
            print(f"  • Recall:             {eval_report.recall_at_calibrated_threshold:.4f}")
            print(f"  • F1-Score:           {eval_report.f1_at_calibrated_threshold:.4f}")
            print(f"  • Specificity:        {eval_report.specificity:.4f}")
            print(f"  • Confusion Matrix:   {eval_report.confusion_matrix}")
            print("\n  --- Baseline Comparison ---")
            for b_name, b_metrics in eval_report.baseline_comparisons.items():
                print(f"    - {b_name}: ROC-AUC={b_metrics.get('roc_auc', 'N/A')}, F1={b_metrics.get('f1_score', 'N/A')}")

        # ---------------------------------------------------------
        # Step 6: Export Versioned Artifact Bundle
        # ---------------------------------------------------------
        if verbose:
            print("\n[6/6] Exporting versioned artifact bundle...")

        combined_summary = {
            "dataset_name": "mobiact_uci_sisfall_unified_v1",
            "n_train_windows": len(X_train_combined),
            "n_val_windows": len(X_val_combined),
            "n_test_windows": len(X_test_combined),
            "n_test_normal_windows": n_norm_test,
            "n_test_anomaly_windows": n_anom_test,
            "sources": {
                "mobiact": dataset_bundle.summary,
                "uci_har_train_windows": len(uci_cohort.get("train", {}).get("features", [])) if uci_cohort else 0,
                "uci_har_test_windows": len(uci_cohort.get("test", {}).get("features", [])) if uci_cohort else 0,
                "sisfall_train_windows": len(sisfall_cohort.get("train", {}).get("features", [])) if sisfall_cohort else 0,
                "sisfall_test_windows": len(sisfall_cohort.get("test", {}).get("features", [])) if sisfall_cohort else 0,
            },
        }

        metadata = self.artifact_manager.save_artifact_bundle(
            model=best_model,
            scaler=scaler,
            threshold_result=threshold_result,
            eval_report=eval_report,
            training_result=training_result,
            dataset_summary=combined_summary,
            version=self.config.artifact.version,
        )

        if verbose:
            print(f"  • Artifacts successfully exported to: {self.config.artifact.version_dir}")
            print(f"  • ONNX Parity Status: {metadata['onnx_export']['parity_verified']} (Max diff: {metadata['onnx_export']['max_absolute_difference']})")
            print("=" * 70)
            print(" ML PIPELINE COMPLETE: ARTIFACT READY FOR INFERENCE")
            print("=" * 70)

        return best_model, scaler, threshold_result, eval_report, metadata


def main():
    default_dev = "cuda" if (torch is not None and torch.cuda.is_available()) else "cpu"
    parser = argparse.ArgumentParser(description="TourSafe ML LSTM Autoencoder Training Pipeline")
    parser.add_argument("--epochs", type=int, default=40, help="Maximum training epochs")
    parser.add_argument("--batch-size", type=int, default=64, help="Training batch size")
    parser.add_argument("--version", type=str, default="v1.0.0", help="Model artifact version")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--device", type=str, default=default_dev, help="Compute device (cuda or cpu)")
    args = parser.parse_args()

    cfg = PipelineConfig()
    cfg.training.epochs = args.epochs
    cfg.training.batch_size = args.batch_size
    cfg.training.random_seed = args.seed
    cfg.training.device = args.device
    cfg.artifact.version = args.version

    pipeline = MLTrainingPipeline(cfg)
    pipeline.run(verbose=True)


if __name__ == "__main__":
    main()
