/**
 * SosService
 * Main orchestration service for autonomous distress detection in TourSafe.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vibration, Platform } from "react-native";
import { DistressDetector } from "./distressDetector";
import { SensorHandler } from "./sensorHandler";
import { GyroHandler } from "./gyroHandler";
import { SoundHandler } from "./soundHandler";
import { SosManager } from "./sosManager";
import {
  SensitivityLevel,
  SOSPreferences,
  SOSMetrics,
} from "./types";

const STORAGE_KEY = "@TourSafeSOSPrefs";

export type MetricsListener = (metrics: SOSMetrics) => void;
export type DistressListener = (source: string) => void;

class SosService {
  private detector: DistressDetector;
  private sensorHandler: SensorHandler;
  private gyroHandler: GyroHandler;
  private soundHandler: SoundHandler;

  private isArmed = false;
  private countdownRunning = false;
  private lastAccel = 0;
  private lastGyro = 0;
  private lastSound = 0;

  private preferences: SOSPreferences = {
    countdownSeconds: 10,
    sensitivity: "medium",
    emergencyPhone: "112",
    autoSmsEnabled: true,
    autoCallEnabled: false,
    soundDetectionEnabled: true,
  };

  private metricsListeners: Set<MetricsListener> = new Set();
  private distressListeners: Set<DistressListener> = new Set();
  private audioBeepCtx: any = null;

  constructor() {
    this.detector = new DistressDetector();

    this.sensorHandler = new SensorHandler((accel) => {
      this.lastAccel = accel;
      if (this.isArmed) {
        this.detector.updateAccelerometer(accel);
        this.checkDistressCondition("Kinematic Impact / Rapid Fall");
      }
      this.notifyMetrics();
    });

    this.gyroHandler = new GyroHandler((gyro) => {
      this.lastGyro = gyro;
      if (this.isArmed) {
        this.detector.updateGyroscope(gyro);
        this.checkDistressCondition("Tumble / Violent Angular Rotation");
      }
      this.notifyMetrics();
    });

    this.soundHandler = new SoundHandler((sound) => {
      this.lastSound = sound;
      if (this.isArmed && this.preferences.soundDetectionEnabled) {
        this.detector.updateAccelerometer(this.lastAccel + 0.5);
        this.detector.updateSoundLevel(sound);
        this.checkDistressCondition("Acoustic Shock / Distress Sound");
      }
      this.notifyMetrics();
    });

    this.loadPreferences();
  }

  // ── Preferences Persistence ──────────────────────────────────────────

  public async loadPreferences(): Promise<SOSPreferences> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.preferences = { ...this.preferences, ...parsed };
        this.detector.setSensitivity(this.preferences.sensitivity);
      }
    } catch (e) {
      console.warn("[SosService] Failed to load preferences:", e);
    }
    return this.preferences;
  }

  public async updatePreferences(
    updates: Partial<SOSPreferences>
  ): Promise<SOSPreferences> {
    this.preferences = { ...this.preferences, ...updates };
    if (updates.sensitivity) {
      this.detector.setSensitivity(updates.sensitivity);
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (e) {
      console.warn("[SosService] Failed to save preferences:", e);
    }
    this.notifyMetrics();
    return this.preferences;
  }

  public getPreferences(): SOSPreferences {
    return { ...this.preferences };
  }

  public getThresholds() {
    return this.detector.getThresholds();
  }

  // ── Arm / Disarm Protection ──────────────────────────────────────────

  public async arm(): Promise<void> {
    if (this.isArmed) return;
    this.isArmed = true;
    this.detector.reset();

    await this.sensorHandler.start();
    await this.gyroHandler.start();
    if (this.preferences.soundDetectionEnabled) {
      await this.soundHandler.start();
    }
    this.notifyMetrics();
  }

  public disarm(): void {
    if (!this.isArmed) return;
    this.isArmed = false;
    this.countdownRunning = false;
    this.detector.reset();

    this.sensorHandler.stop();
    this.gyroHandler.stop();
    this.soundHandler.stop();
    this.notifyMetrics();
  }

  public toggleArm(): boolean {
    if (this.isArmed) {
      this.disarm();
    } else {
      this.arm();
    }
    return this.isArmed;
  }

  public getIsArmed(): boolean {
    return this.isArmed;
  }

  // ── Distress Evaluation ──────────────────────────────────────────────

  private checkDistressCondition(triggerSource: string): void {
    if (!this.isArmed || this.countdownRunning) return;

    if (this.detector.isDistressConfirmed()) {
      this.onDistressConfirmed(triggerSource);
    }
  }

  private onDistressConfirmed(source: string): void {
    this.countdownRunning = true;
    this.playToneBeep();
    Vibration.vibrate([0, 400, 200, 400]);

    this.distressListeners.forEach((listener) => {
      try {
        listener(source);
      } catch (err) {
        console.error("[SosService] Distress listener error:", err);
      }
    });

    this.notifyMetrics();
  }

  public cancelCountdown(): void {
    this.countdownRunning = false;
    this.detector.reset();
    this.notifyMetrics();
  }

  public isCountdownRunning(): boolean {
    return this.countdownRunning;
  }

  // ── Beep Alert Tone ──────────────────────────────────────────────────

  public playToneBeep(): void {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!this.audioBeepCtx) {
            this.audioBeepCtx = new AudioCtx();
          }
          const osc = this.audioBeepCtx.createOscillator();
          const gain = this.audioBeepCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, this.audioBeepCtx.currentTime);
          gain.gain.setValueAtTime(0.15, this.audioBeepCtx.currentTime);
          osc.connect(gain);
          gain.connect(this.audioBeepCtx.destination);
          osc.start();
          osc.stop(this.audioBeepCtx.currentTime + 0.18);
        }
      } catch {
        // Ignore web audio restrictions
      }
    } else {
      Vibration.vibrate(150);
    }
  }

  // ── Dispatch Actions (SMS & Call) ────────────────────────────────────

  public async dispatchSosEmergencyActions(
    latitude: number,
    longitude: number
  ): Promise<{ smsSent: boolean; callStarted: boolean }> {
    let smsSent = false;
    let callStarted = false;

    const coordsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const sosMessage = `EMERGENCY SOS: TourSafe Autonomous Distress alert triggered! Live Location: ${coordsUrl}. Immediate assistance requested.`;

    if (this.preferences.autoSmsEnabled && this.preferences.emergencyPhone) {
      smsSent = await SosManager.sendSosSms(this.preferences.emergencyPhone, sosMessage);
    }

    if (this.preferences.autoCallEnabled && this.preferences.emergencyPhone) {
      callStarted = await SosManager.makeEmergencyCall(this.preferences.emergencyPhone);
    }

    return { smsSent, callStarted };
  }

  // ── Interactive Simulations for Demo / Testing ───────────────────────

  public simulateImpactAndRotation(): void {
    const thresholds = this.detector.getThresholds();
    this.sensorHandler.simulateMotion(thresholds.accel + 4.5);
    this.gyroHandler.simulateRotation(thresholds.gyro + 1.0);
    this.checkDistressCondition("Simulated Multi-Sensor Impact & Rotation");
  }

  public simulateAcousticDistress(): void {
    const thresholds = this.detector.getThresholds();
    this.sensorHandler.simulateMotion(thresholds.accel + 2.0);
    this.soundHandler.simulateSound(thresholds.sound + 1500);
    this.checkDistressCondition("Simulated Acoustic Scream / Fall Shock");
  }

  // ── Subscriptions ────────────────────────────────────────────────────

  public subscribeMetrics(listener: MetricsListener): () => void {
    this.metricsListeners.add(listener);
    listener(this.getMetrics());
    return () => {
      this.metricsListeners.delete(listener);
    };
  }

  public subscribeDistress(listener: DistressListener): () => void {
    this.distressListeners.add(listener);
    return () => {
      this.distressListeners.delete(listener);
    };
  }

  public getMetrics(): SOSMetrics {
    const triggerState = this.detector.getTriggerState();
    return {
      lastAccel: this.lastAccel,
      lastGyro: this.lastGyro,
      lastSound: this.lastSound,
      accelTriggered: triggerState.accelTriggered,
      gyroTriggered: triggerState.gyroTriggered,
      soundTriggered: triggerState.soundTriggered,
      distressConfirmed: this.countdownRunning,
      windowActive: triggerState.windowActive,
      timeRemainingMs: triggerState.timeRemainingMs,
    };
  }

  private notifyMetrics(): void {
    if (this.metricsListeners.size === 0) return;
    const metrics = this.getMetrics();
    this.metricsListeners.forEach((listener) => {
      try {
        listener(metrics);
      } catch (err) {
        console.error("[SosService] Metrics listener error:", err);
      }
    });
  }
}

export const sosService = new SosService();
