/**
 * SoundHandler
 * Captures microphone audio, calculates smoothed RMS amplitude (0 - 32767),
 * and triggers callback with sound level at 250ms intervals.
 * Safe across Web and Native (iOS/Android via expo-av).
 */

import { Platform } from "react-native";

export type SoundLevelCallback = (soundLevel: number) => void;

export class SoundHandler {
  private onSoundLevelDetected: SoundLevelCallback;
  private running = false;
  private smoothRms = 0;
  private readonly alpha = 0.25;

  // Web Audio handles
  private webAudioContext: any = null;
  private webMediaStream: any = null;
  private webAnalyser: any = null;
  private webInterval: any = null;

  // Mobile expo-av handles
  private nativeRecording: any = null;
  private nativeInterval: any = null;

  constructor(onSoundLevelDetected: SoundLevelCallback) {
    this.onSoundLevelDetected = onSoundLevelDetected;
  }

  public async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.smoothRms = 0;

    try {
      if (Platform.OS === "web") {
        await this.startWebAudio();
      } else {
        await this.startNativeAudio();
      }
    } catch (err) {
      console.warn("[SoundHandler] Audio recording init note:", err);
      this.running = false;
    }
  }

  private async startWebAudio(): Promise<void> {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.webMediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.webAudioContext = new AudioCtx();
      const source = this.webAudioContext.createMediaStreamSource(stream);
      this.webAnalyser = this.webAudioContext.createAnalyser();
      this.webAnalyser.fftSize = 512;
      source.connect(this.webAnalyser);

      const buffer = new Float32Array(this.webAnalyser.fftSize);

      this.webInterval = setInterval(() => {
        if (!this.running || !this.webAnalyser) return;

        this.webAnalyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);

        const scaledRms = Math.min(32767, rms * 32767 * 2.5);
        this.smoothRms =
          this.smoothRms === 0
            ? scaledRms
            : this.alpha * scaledRms + (1 - this.alpha) * this.smoothRms;

        this.onSoundLevelDetected(Math.round(this.smoothRms));
      }, 250);
    } catch (e) {
      console.warn("[SoundHandler] Web audio permission / stream note:", e);
      this.stop();
    }
  }

  private async startNativeAudio(): Promise<void> {
    try {
      const { Audio } = require("expo-av");
      if (!Audio) return;

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        console.warn("[SoundHandler] Microphone permission not granted.");
        this.stop();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.nativeRecording = new Audio.Recording();
      await this.nativeRecording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });

      await this.nativeRecording.startAsync();

      this.nativeInterval = setInterval(async () => {
        if (!this.running || !this.nativeRecording) return;

        try {
          const status = await this.nativeRecording.getStatusAsync();
          if (status.isRecording && typeof status.metering === "number") {
            const db = Math.max(-80, status.metering);
            const linearRatio = Math.pow(10, (db + 20) / 20);
            const currentAmp = Math.min(32767, Math.max(0, linearRatio * 15000));

            this.smoothRms =
              this.smoothRms === 0
                ? currentAmp
                : this.alpha * currentAmp + (1 - this.alpha) * this.smoothRms;

            this.onSoundLevelDetected(Math.round(this.smoothRms));
          }
        } catch {
          // Ignore transient status read errors
        }
      }, 250);
    } catch (err) {
      console.warn("[SoundHandler] Native audio recording error:", err);
      this.stop();
    }
  }

  public stop(): void {
    this.running = false;

    if (this.webInterval) {
      clearInterval(this.webInterval);
      this.webInterval = null;
    }
    if (this.webMediaStream) {
      try {
        this.webMediaStream.getTracks().forEach((t: any) => t.stop());
      } catch {}
      this.webMediaStream = null;
    }
    if (this.webAudioContext) {
      try {
        this.webAudioContext.close();
      } catch {}
      this.webAudioContext = null;
    }
    this.webAnalyser = null;

    if (this.nativeInterval) {
      clearInterval(this.nativeInterval);
      this.nativeInterval = null;
    }
    if (this.nativeRecording) {
      try {
        this.nativeRecording.stopAndUnloadAsync();
      } catch {}
      this.nativeRecording = null;
    }

    this.smoothRms = 0;
  }

  public simulateSound(level: number): void {
    this.smoothRms =
      this.smoothRms === 0 ? level : this.alpha * level + (1 - this.alpha) * this.smoothRms;
    this.onSoundLevelDetected(Math.round(this.smoothRms));
  }
}
