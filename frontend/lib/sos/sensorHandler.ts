/**
 * SensorHandler
 * Listens to device accelerometer sensor, computes 3D magnitude (in m/s^2),
 * and triggers callback with acceleration vector magnitude.
 */

import { Platform } from "react-native";

export type MotionCallback = (magnitude: number) => void;

interface SensorSubscription {
  remove: () => void;
}

export class SensorHandler {
  private subscription: SensorSubscription | null = null;
  private onMotionDetected: MotionCallback;
  private isRunning = false;
  private devicemotionListener: any = null;

  constructor(onMotionDetected: MotionCallback) {
    this.onMotionDetected = onMotionDetected;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      if (Platform.OS === "web") {
        this.startWebMotion();
        return;
      }

      // Native mobile: use expo-sensors Accelerometer
      const { Accelerometer } = require("expo-sensors");
      if (Accelerometer && typeof Accelerometer.isAvailableAsync === "function") {
        const available = await Accelerometer.isAvailableAsync();
        if (available) {
          Accelerometer.setUpdateInterval(100);
          this.subscription = Accelerometer.addListener(
            (data: { x: number; y: number; z: number }) => {
              // Convert G-force to m/s^2
              const x = (data.x || 0) * 9.80665;
              const y = (data.y || 0) * 9.80665;
              const z = (data.z || 0) * 9.80665;

              const magnitude = Math.sqrt(x * x + y * y + z * z);
              this.onMotionDetected(magnitude);
            }
          );
          return;
        }
      }
    } catch (err) {
      console.warn("[SensorHandler] Could not start hardware accelerometer:", err);
    }
  }

  private startWebMotion(): void {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      this.devicemotionListener = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity || event.acceleration;
        if (acc) {
          const x = acc.x || 0;
          const y = acc.y || 0;
          const z = acc.z || 0;
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          this.onMotionDetected(magnitude);
        }
      };
      try {
        window.addEventListener("devicemotion", this.devicemotionListener);
      } catch (e) {
        console.warn("[SensorHandler] Web DeviceMotionEvent error:", e);
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch (err) {
        console.warn("[SensorHandler] Error removing subscription:", err);
      }
      this.subscription = null;
    }

    if (this.devicemotionListener && typeof window !== "undefined") {
      try {
        window.removeEventListener("devicemotion", this.devicemotionListener);
      } catch (e) {
        // Ignore
      }
      this.devicemotionListener = null;
    }
  }

  public simulateMotion(magnitude: number): void {
    this.onMotionDetected(magnitude);
  }
}
