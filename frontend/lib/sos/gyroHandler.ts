/**
 * GyroHandler
 * Listens to device gyroscope sensor, computes 3D angular rotation sum
 * (abs(x) + abs(y) + abs(z) in rad/s) and triggers callback.
 */

import { Platform } from "react-native";

export type RotationCallback = (rotationMagnitude: number) => void;

interface SensorSubscription {
  remove: () => void;
}

export class GyroHandler {
  private subscription: SensorSubscription | null = null;
  private onRotationDetected: RotationCallback;
  private isRunning = false;
  private deviceOrientationListener: any = null;

  constructor(onRotationDetected: RotationCallback) {
    this.onRotationDetected = onRotationDetected;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      if (Platform.OS === "web") {
        this.startWebGyro();
        return;
      }

      // Native mobile: use expo-sensors Gyroscope
      const { Gyroscope } = require("expo-sensors");
      if (Gyroscope && typeof Gyroscope.isAvailableAsync === "function") {
        const available = await Gyroscope.isAvailableAsync();
        if (available) {
          Gyroscope.setUpdateInterval(100);
          this.subscription = Gyroscope.addListener(
            (data: { x: number; y: number; z: number }) => {
              const x = Math.abs(data.x || 0);
              const y = Math.abs(data.y || 0);
              const z = Math.abs(data.z || 0);

              const rotationMagnitude = x + y + z;
              this.onRotationDetected(rotationMagnitude);
            }
          );
          return;
        }
      }
    } catch (err) {
      console.warn("[GyroHandler] Could not start hardware gyroscope:", err);
    }
  }

  private startWebGyro(): void {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      this.deviceOrientationListener = (event: DeviceMotionEvent) => {
        const rot = event.rotationRate;
        if (rot) {
          const degToRad = Math.PI / 180;
          const alpha = Math.abs((rot.alpha || 0) * degToRad);
          const beta = Math.abs((rot.beta || 0) * degToRad);
          const gamma = Math.abs((rot.gamma || 0) * degToRad);
          this.onRotationDetected(alpha + beta + gamma);
        }
      };
      try {
        window.addEventListener("devicemotion", this.deviceOrientationListener);
      } catch (e) {
        console.warn("[GyroHandler] Web DeviceMotionEvent error:", e);
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch (err) {
        console.warn("[GyroHandler] Error removing gyroscope subscription:", err);
      }
      this.subscription = null;
    }

    if (this.deviceOrientationListener && typeof window !== "undefined") {
      try {
        window.removeEventListener("devicemotion", this.deviceOrientationListener);
      } catch (e) {
        // Ignore
      }
      this.deviceOrientationListener = null;
    }
  }

  public simulateRotation(rotationMagnitude: number): void {
    this.onRotationDetected(rotationMagnitude);
  }
}
