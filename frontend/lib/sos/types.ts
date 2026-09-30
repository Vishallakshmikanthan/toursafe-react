/**
 * TourSafe Autonomous SOS Types & Config Interfaces
 */

export type SensitivityLevel = "low" | "medium" | "high";

export interface DistressThresholds {
  accel: number;  // in m/s^2 (e.g. 26.0 for low, 23.0 for medium, 19.0 for high)
  gyro: number;   // in rad/s (e.g. 2.8 for low, 2.2 for medium, 1.5 for high)
  sound: number;  // RMS amplitude scale (e.g. 10000 for low, 8000 for medium, 6000 for high)
}

export interface SOSPreferences {
  countdownSeconds: number;       // Defaults to 10s (configurable in Settings)
  sensitivity: SensitivityLevel;  // 0=low, 1=medium, 2=high
  emergencyPhone: string;         // E.g., "112" or specific contact
  autoSmsEnabled: boolean;
  autoCallEnabled: boolean;
  soundDetectionEnabled: boolean;
}

export interface SOSMetrics {
  lastAccel: number;
  lastGyro: number;
  lastSound: number;
  accelTriggered: boolean;
  gyroTriggered: boolean;
  soundTriggered: boolean;
  distressConfirmed: boolean;
  windowActive: boolean;
  timeRemainingMs: number;
}
