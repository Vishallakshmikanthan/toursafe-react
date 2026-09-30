/**
 * DistressDetector
 * Multi-sensor kinematic and acoustic distress fusion engine.
 *
 * Implements multi-sensor fusion for autonomous distress detection:
 * - Accelerometer threshold checking (impact/violent motion)
 * - Gyroscope threshold checking (rapid rotation/fall tumble)
 * - Acoustic sound level threshold with 50ms sustain time (loud shout/distress acoustic)
 * - 2000ms correlation window: Confirms distress if (accel && gyro) OR (accel && sound)
 */

import { SensitivityLevel, DistressThresholds } from "./types";

export class DistressDetector {
  // Runtime-adjustable thresholds
  public accelThreshold = 23.0; // m/s^2
  public gyroThreshold = 2.2;  // rad/s
  public soundThreshold = 8000; // clap / loud shout only

  private readonly TIME_WINDOW_MS = 2000;
  private readonly SOUND_SUSTAIN_MS = 50;

  // Sensor state
  private accelTriggered = false;
  private gyroTriggered = false;
  private soundTriggered = false;

  private firstTriggerTime = 0;
  private soundStartTime = 0;

  constructor() {
    this.setSensitivity("medium");
  }

  /**
   * Set sensitivity preset (low, medium, high)
   */
  public setSensitivity(level: SensitivityLevel): void {
    switch (level) {
      case "low":
        this.accelThreshold = 26.0;
        this.gyroThreshold = 2.8;
        this.soundThreshold = 10000;
        break;
      case "medium":
        this.accelThreshold = 23.0;
        this.gyroThreshold = 2.2;
        this.soundThreshold = 8000;
        break;
      case "high":
        this.accelThreshold = 19.0;
        this.gyroThreshold = 1.5;
        this.soundThreshold = 6000;
        break;
    }
  }

  public getThresholds(): DistressThresholds {
    return {
      accel: this.accelThreshold,
      gyro: this.gyroThreshold,
      sound: this.soundThreshold,
    };
  }

  // --------- SENSOR INPUTS ----------

  public updateAccelerometer(accel: number): void {
    if (accel >= this.accelThreshold) {
      this.registerTrigger(() => {
        this.accelTriggered = true;
      });
    }
  }

  public updateGyroscope(gyro: number): void {
    if (gyro >= this.gyroThreshold) {
      this.registerTrigger(() => {
        this.gyroTriggered = true;
      });
    }
  }

  public updateSoundLevel(sound: number): void {
    const now = Date.now();

    if (sound >= this.soundThreshold) {
      if (this.soundStartTime === 0) {
        this.soundStartTime = now;
      }
      if (now - this.soundStartTime >= this.SOUND_SUSTAIN_MS) {
        this.registerTrigger(() => {
          this.soundTriggered = true;
        });
      }
    } else {
      this.soundStartTime = 0;
    }
  }

  // --------- CORE LOGIC ----------

  private registerTrigger(action: () => void): void {
    const now = Date.now();

    if (this.firstTriggerTime === 0) {
      this.firstTriggerTime = now;
    }

    if (now - this.firstTriggerTime <= this.TIME_WINDOW_MS) {
      action();
    } else {
      this.reset();
      // Start a new window with this trigger
      this.firstTriggerTime = now;
      action();
    }
  }

  /**
   * Confirms distress if (accel && gyro) OR (accel && sound) within 2000ms.
   * If confirmed, automatically resets internal state and returns true.
   */
  public isDistressConfirmed(): boolean {
    const now = Date.now();

    // Check if the current trigger window expired
    if (this.firstTriggerTime > 0 && now - this.firstTriggerTime > this.TIME_WINDOW_MS) {
      this.reset();
      return false;
    }

    const confirmed =
      (this.accelTriggered && this.gyroTriggered) ||
      (this.accelTriggered && this.soundTriggered);

    if (confirmed) {
      this.reset();
      return true;
    }
    return false;
  }

  public getTriggerState(): {
    accelTriggered: boolean;
    gyroTriggered: boolean;
    soundTriggered: boolean;
    windowActive: boolean;
    timeRemainingMs: number;
  } {
    const now = Date.now();
    const isWindowActive =
      this.firstTriggerTime > 0 && now - this.firstTriggerTime <= this.TIME_WINDOW_MS;

    const timeRemainingMs = isWindowActive
      ? Math.max(0, this.TIME_WINDOW_MS - (now - this.firstTriggerTime))
      : 0;

    return {
      accelTriggered: isWindowActive && this.accelTriggered,
      gyroTriggered: isWindowActive && this.gyroTriggered,
      soundTriggered: isWindowActive && this.soundTriggered,
      windowActive: isWindowActive,
      timeRemainingMs,
    };
  }

  public reset(): void {
    this.accelTriggered = false;
    this.gyroTriggered = false;
    this.soundTriggered = false;
    this.firstTriggerTime = 0;
    this.soundStartTime = 0;
  }
}
