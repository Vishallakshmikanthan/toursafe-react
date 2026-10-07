"""
TourSafe Benchmark IMU Dataset Loaders & Adapters.
Provides parsers and standardizers for recognized IMU anomaly and HAR datasets:
- MobiAct (ADLs and Falls, smartphone IMU)
- SisFall (Fall and Movement activities across young & elderly subjects)
- UCI HAR (Smartphone Human Activity Recognition)
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd


class BenchmarkDatasetAdapter:
    """
    Standardizes third-party raw IMU datasets into TourSafe's canonical trial structure:
    trial: {
        "subject_id": str,
        "activity": str,
        "is_anomaly": bool,
        "timestamps_sec": np.ndarray (N,),
        "accel": np.ndarray (N, 3) [ax, ay, az] in g,
        "gyro": np.ndarray (N, 3) [gx, gy, gz] in rad/s,
    }
    """

    # Recognized standard labels
    FALL_KEYWORDS = {"fall", "drop", "collapse", "slip", "trip", "impact", "faint", "fold"}

    FALL_MAP = {
        "FOL": "forward_fall",
        "FKL": "front_knees_fall",
        "BSC": "backward_chair_fall",
        "SDL": "sideward_fall",
    }

    ADL_MAP = {
        "WAL": "walking",
        "JOG": "jogging",
        "STD": "standing",
        "STU": "stairs_ascent",
        "STN": "stairs_descent",
        "SCH": "sitting_chair",
        "CSI": "car_step_in",
        "CSO": "car_step_out",
        "JUM": "jumping",
    }

    @classmethod
    def is_activity_anomalous(cls, activity_name: str) -> bool:
        low = activity_name.lower()
        if any(k in low for k in cls.FALL_KEYWORDS):
            return True
        if activity_name.upper() in cls.FALL_MAP:
            return True
        return False

    @staticmethod
    def _parse_mobiact_txt_file(filepath: Path) -> Optional[np.ndarray]:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
            data_idx = -1
            for i, line in enumerate(lines):
                if line.strip() == "@DATA":
                    data_idx = i + 1
                    break
            if data_idx == -1:
                return None
            rows = []
            for line in lines[data_idx:]:
                s = line.strip()
                if s:
                    rows.append([float(x.strip()) for x in s.split(",")])
            if not rows:
                return None
            return np.array(rows, dtype=np.float64)
        except Exception:
            return None

    @classmethod
    def load_mobiact_pair_txt(
        cls,
        acc_path: Union[str, Path],
        gyro_path: Union[str, Path],
        subject_id: Optional[str] = None,
        activity_code: Optional[str] = None,
        trial_no: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Parses matched MobiAct v2 accelerometer and gyroscope TXT files.
        Resamples both streams onto a continuous 50 Hz temporal grid.
        """
        acc_p = Path(acc_path)
        gyro_p = Path(gyro_path)
        if not acc_p.exists() or not gyro_p.exists():
            return None

        acc_arr = cls._parse_mobiact_txt_file(acc_p)
        gyro_arr = cls._parse_mobiact_txt_file(gyro_p)
        if acc_arr is None or gyro_arr is None or len(acc_arr) < 50 or len(gyro_arr) < 50:
            return None

        t0 = max(acc_arr[0, 0], gyro_arr[0, 0])
        t1 = min(acc_arr[-1, 0], gyro_arr[-1, 0])
        span_sec = (t1 - t0) / 1e9
        if span_sec < 3.0:
            return None

        grid_ns = np.arange(t0, t1, 20_000_000.0, dtype=np.float64)
        if len(grid_ns) < 150:
            return None

        t_sec = (grid_ns - t0) / 1e9
        # Accelerometer: convert from m/s^2 to g
        ax = (np.interp(grid_ns, acc_arr[:, 0], acc_arr[:, 1]) / 9.80665).astype(np.float32)
        ay = (np.interp(grid_ns, acc_arr[:, 0], acc_arr[:, 2]) / 9.80665).astype(np.float32)
        az = (np.interp(grid_ns, acc_arr[:, 0], acc_arr[:, 3]) / 9.80665).astype(np.float32)

        # Gyroscope: rad/s
        gx = np.interp(grid_ns, gyro_arr[:, 0], gyro_arr[:, 1]).astype(np.float32)
        gy = np.interp(grid_ns, gyro_arr[:, 0], gyro_arr[:, 2]).astype(np.float32)
        gz = np.interp(grid_ns, gyro_arr[:, 0], gyro_arr[:, 3]).astype(np.float32)

        act_c = (activity_code or acc_p.stem.split("_")[0]).upper()
        sub_id = subject_id or (f"SUB_{acc_p.stem.split('_')[2]}" if len(acc_p.stem.split("_")) > 2 else "SUB_01")
        tr_id = trial_no or (acc_p.stem.split("_")[3] if len(acc_p.stem.split("_")) > 3 else "1")

        is_anomaly = act_c in cls.FALL_MAP
        act_name = cls.FALL_MAP.get(act_c, cls.ADL_MAP.get(act_c, act_c.lower()))

        return {
            "subject_id": sub_id,
            "activity": act_name,
            "is_anomaly": is_anomaly,
            "trial_id": f"{act_c}_{sub_id}_{tr_id}",
            "timestamps_sec": t_sec,
            "accel": np.stack([ax, ay, az], axis=1),
            "gyro": np.stack([gx, gy, gz], axis=1),
        }

    @classmethod
    def load_all_mobiact_trials(cls, mobiact_dir: Union[str, Path]) -> List[Dict[str, Any]]:
        """
        Discovers and pairs all MobiAct accelerometer and gyroscope recordings.
        """
        import re
        p = Path(mobiact_dir)
        acc_files = list(p.rglob("*_acc_*.txt"))
        trials = []
        for acc_f in sorted(acc_files):
            m = re.match(r"([A-Z]+)_acc_(\d+)_(\d+)", acc_f.name)
            if not m:
                continue
            act_code, sub_num, trial_num = m.groups()
            gyro_f = acc_f.parent / f"{act_code}_gyro_{sub_num}_{trial_num}.txt"
            if not gyro_f.exists():
                continue
            sub_id = f"SUB_{int(sub_num):02d}"
            t = cls.load_mobiact_pair_txt(
                acc_path=acc_f,
                gyro_path=gyro_f,
                subject_id=sub_id,
                activity_code=act_code,
                trial_no=trial_num,
            )
            if t is not None:
                trials.append(t)
        return trials

    @classmethod
    def load_mobiact_csv(
        cls,
        file_path: Union[str, Path],
        subject_id: Optional[str] = None,
        activity_label: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Parses a MobiAct CSV format recording file.
        Typical columns: timestamp/rel_time, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z
        Acceleration in MobiAct is in m/s^2 (converted here to g by / 9.80665).
        Gyroscope is in rad/s or deg/s.
        """
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"MobiAct file not found: {p}")

        df = pd.read_csv(p)
        cols_lower = {c: c.lower().strip() for c in df.columns}
        df.rename(columns=cols_lower, inplace=True)

        # Extract timestamps
        if "timestamp" in df.columns:
            ts = df["timestamp"].values.astype(np.float64)
            # If timestamp in ns or ms, normalize to seconds starting at 0
            if ts[0] > 1e12:  # ns
                ts = (ts - ts[0]) / 1e9
            elif ts[0] > 1e9: # ms
                ts = (ts - ts[0]) / 1e3
            else:
                ts = ts - ts[0]
        else:
            # Assume 200 Hz default for MobiAct if missing
            ts = np.arange(len(df), dtype=np.float64) / 200.0

        # Acceleration channels (m/s^2 -> g)
        ax_col = next((c for c in df.columns if "acc" in c and "x" in c), None)
        ay_col = next((c for c in df.columns if "acc" in c and "y" in c), None)
        az_col = next((c for c in df.columns if "acc" in c and "z" in c), None)

        if ax_col and ay_col and az_col:
            ax = df[ax_col].values.astype(np.float32) / 9.80665
            ay = df[ay_col].values.astype(np.float32) / 9.80665
            az = df[az_col].values.astype(np.float32) / 9.80665
        else:
            raise ValueError(f"Could not identify 3-axis accelerometer columns in {p}")

        # Gyroscope channels (rad/s)
        gx_col = next((c for c in df.columns if "gyr" in c and "x" in c), None)
        gy_col = next((c for c in df.columns if "gyr" in c and "y" in c), None)
        gz_col = next((c for c in df.columns if "gyr" in c and "z" in c), None)

        if gx_col and gy_col and gz_col:
            gx = df[gx_col].values.astype(np.float32)
            gy = df[gy_col].values.astype(np.float32)
            gz = df[gz_col].values.astype(np.float32)
        else:
            gx = np.zeros_like(ax)
            gy = np.zeros_like(ay)
            gz = np.zeros_like(az)

        act = activity_label or p.stem.split("_")[0]
        sub = subject_id or (p.stem.split("_")[1] if len(p.stem.split("_")) > 1 else "SUB_01")

        return {
            "subject_id": sub,
            "activity": act,
            "is_anomaly": cls.is_activity_anomalous(act),
            "trial_id": p.stem,
            "timestamps_sec": ts,
            "accel": np.stack([ax, ay, az], axis=1),
            "gyro": np.stack([gx, gy, gz], axis=1),
        }

    @classmethod
    def load_sisfall_txt(
        cls,
        file_path: Union[str, Path],
        subject_id: Optional[str] = None,
        activity_label: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Parses a SisFall TXT format recording file (sampled at 200 Hz).
        SisFall ADLs are coded as D01..D19 and Falls as F01..F15.
        Sensors: ADXL345 (accel in bits -> g via 2 * 16 / 8192 or similar scale), ITG3200 (gyro in bits -> rad/s).
        """
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"SisFall file not found: {p}")

        raw_data = np.loadtxt(p, delimiter=",", dtype=np.float32)
        # Columns: [acc1_x, acc1_y, acc1_z, gyro_x, gyro_y, gyro_z, acc2_x, acc2_y, acc2_z]
        # ADXL345 resolution ±16g with 13-bit: scale = (2 * 16.0) / 8192.0
        accel_scale = 32.0 / 8192.0
        # ITG3200 resolution ±2000 deg/s with 16-bit: scale = (2 * 2000.0) / 65536.0 * (pi / 180)
        gyro_scale = (4000.0 / 65536.0) * (np.pi / 180.0)

        ax = raw_data[:, 0] * accel_scale
        ay = raw_data[:, 1] * accel_scale
        az = raw_data[:, 2] * accel_scale

        gx = raw_data[:, 3] * gyro_scale
        gy = raw_data[:, 4] * gyro_scale
        gz = raw_data[:, 5] * gyro_scale

        ts = np.arange(len(raw_data), dtype=np.float64) / 200.0
        filename = p.stem
        is_fall = filename.upper().startswith("F") or "FALL" in filename.upper()
        act = activity_label or ("fall" if is_fall else "adl")

        return {
            "subject_id": subject_id or (filename.split("_")[1] if "_" in filename else "SUB_01"),
            "activity": act,
            "is_anomaly": is_fall,
            "trial_id": filename,
            "timestamps_sec": ts,
            "accel": np.stack([ax, ay, az], axis=1),
            "gyro": np.stack([gx, gy, gz], axis=1),
        }

    @classmethod
    def load_uci_har_cohort(
        cls,
        uci_har_dir: Union[str, Path],
    ) -> Dict[str, Any]:
        """
        Loads and standardizes UCI-HAR dataset into TourSafe's 8-channel format.
        Interpolates 128-sample windows to 150-sample windows @ 50 Hz.
        Computes accel_mag and gyro_mag.
        """
        root = Path(uci_har_dir)
        if not root.exists():
            return {}

        results: Dict[str, Any] = {}
        activity_names = {
            1: "walking",
            2: "stairs_ascent",
            3: "stairs_descent",
            4: "sitting",
            5: "standing",
            6: "laying",
        }

        for split in ["train", "test"]:
            split_dir = root / split
            if not split_dir.exists():
                split_dir = root / "UCI HAR Dataset" / split
            if not split_dir.exists():
                continue

            sig_dir = split_dir / "Inertial Signals"
            try:
                ax = np.loadtxt(sig_dir / f"total_acc_x_{split}.txt", dtype=np.float32)
                ay = np.loadtxt(sig_dir / f"total_acc_y_{split}.txt", dtype=np.float32)
                az = np.loadtxt(sig_dir / f"total_acc_z_{split}.txt", dtype=np.float32)
                gx = np.loadtxt(sig_dir / f"body_gyro_x_{split}.txt", dtype=np.float32)
                gy = np.loadtxt(sig_dir / f"body_gyro_y_{split}.txt", dtype=np.float32)
                gz = np.loadtxt(sig_dir / f"body_gyro_z_{split}.txt", dtype=np.float32)

                subs = np.loadtxt(split_dir / f"subject_{split}.txt", dtype=int)
                acts = np.loadtxt(split_dir / f"y_{split}.txt", dtype=int)

                raw_6ch = np.stack([ax, ay, az, gx, gy, gz], axis=1) # (N, 6, 128)
                N = len(raw_6ch)

                orig_t = np.linspace(0.0, 1.0, 128, dtype=np.float32)
                targ_t = np.linspace(0.0, 1.0, 150, dtype=np.float32)

                resampled = np.zeros((N, 150, 6), dtype=np.float32)
                for i in range(N):
                    for c in range(6):
                        resampled[i, :, c] = np.interp(targ_t, orig_t, raw_6ch[i, c])

                amag = np.linalg.norm(resampled[:, :, :3], axis=-1, keepdims=True)
                gmag = np.linalg.norm(resampled[:, :, 3:6], axis=-1, keepdims=True)
                features_8ch = np.concatenate([resampled, amag, gmag], axis=-1)

                subject_ids = [f"UCI_SUB_{int(s):02d}" for s in subs]
                act_labels = [activity_names.get(int(a), "adl") for a in acts]
                labels = np.zeros(N, dtype=np.int32)

                results[split] = {
                    "features": features_8ch,
                    "labels": labels,
                    "subject_ids": subject_ids,
                    "activities": act_labels,
                }
            except Exception as e:
                print(f"Warning: Failed to parse UCI-HAR {split} cohort: {e}")

        return results

    @classmethod
    def load_sisfall_enhanced_cohort(
        cls,
        sisfall_dir: Union[str, Path],
        max_train_samples: int = 4000,
        max_test_norm: int = 1000,
        max_test_fall: int = 600,
    ) -> Dict[str, Any]:
        """
        Loads and standardizes SisFall (Enhanced) Three Classes binary tensors into TourSafe 8-channel format.
        Class 0: Normal ADL
        Class 1: Pre-fall transition
        Class 2: Severe Physical Fall Impact
        Interpolates 256 timesteps to 150 timesteps.
        """
        root = Path(sisfall_dir)
        classes_dir = root / "Three Classes" if (root / "Three Classes").exists() else root
        x_tr_p = classes_dir / "x_train_3"
        y_tr_p = classes_dir / "y_train_3"
        x_te_p = classes_dir / "x_test_3"
        y_te_p = classes_dir / "y_test_3"

        if not (x_tr_p.exists() and y_tr_p.exists() and x_te_p.exists() and y_te_p.exists()):
            return {}

        orig_t = np.linspace(0.0, 1.0, 256, dtype=np.float32)
        targ_t = np.linspace(0.0, 1.0, 150, dtype=np.float32)

        def _process_array(x_arr: np.ndarray) -> np.ndarray:
            n = len(x_arr)
            res = np.zeros((n, 150, 6), dtype=np.float32)
            for i in range(n):
                for c in range(6):
                    res[i, :, c] = np.interp(targ_t, orig_t, x_arr[i, :, c])
            am = np.linalg.norm(res[:, :, :3], axis=-1, keepdims=True)
            gm = np.linalg.norm(res[:, :, 3:6], axis=-1, keepdims=True)
            return np.concatenate([res, am, gm], axis=-1)

        # 1. Train Cohort (Normal ADLs only)
        x_train_raw = np.fromfile(x_tr_p, dtype=np.float32).reshape(-1, 256, 6)
        y_train_raw = np.fromfile(y_tr_p, dtype=np.uint8).reshape(-1, 3)
        tr_classes = np.argmax(y_train_raw, axis=1)

        norm_tr_idx = np.where(tr_classes == 0)[0][:max_train_samples]
        x_tr_norm = x_train_raw[norm_tr_idx]
        feat_tr = _process_array(x_tr_norm)

        # 2. Test Cohort (Normal ADLs + Real Falls)
        x_test_raw = np.fromfile(x_te_p, dtype=np.float32).reshape(-1, 256, 6)
        y_test_raw = np.fromfile(y_te_p, dtype=np.uint8).reshape(-1, 3)
        te_classes = np.argmax(y_test_raw, axis=1)

        norm_te_idx = np.where(te_classes == 0)[0][:max_test_norm]
        fall_te_idx = np.where(te_classes == 2)[0][:max_test_fall]

        x_te_norm = x_test_raw[norm_te_idx]
        x_te_fall = x_test_raw[fall_te_idx]

        feat_te_norm = _process_array(x_te_norm)
        feat_te_fall = _process_array(x_te_fall)

        feat_test = np.concatenate([feat_te_norm, feat_te_fall], axis=0)
        labels_test = np.concatenate([
            np.zeros(len(feat_te_norm), dtype=np.int32),
            np.ones(len(feat_te_fall), dtype=np.int32),
        ], axis=0)

        activities_test = (
            ["sisfall_adl"] * len(feat_te_norm) +
            ["sisfall_fall"] * len(feat_te_fall)
        )
        subjects_test = [f"SIS_SUB_{(i % 38) + 1:02d}" for i in range(len(feat_test))]

        return {
            "train": {
                "features": feat_tr,
                "labels": np.zeros(len(feat_tr), dtype=np.int32),
                "subject_ids": [f"SIS_SUB_{(i % 38) + 1:02d}" for i in range(len(feat_tr))],
                "activities": ["sisfall_adl"] * len(feat_tr),
            },
            "test": {
                "features": feat_test,
                "labels": labels_test,
                "subject_ids": subjects_test,
                "activities": activities_test,
            },
        }

