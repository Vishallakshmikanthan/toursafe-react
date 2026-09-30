/**
 * useSosDetector
 * React Hook for autonomous distress detection & sensor fusion
 */

import { useState, useEffect, useCallback } from "react";
import { sosService } from "./sosService";
import {
  SOSMetrics,
  SOSPreferences,
  SensitivityLevel,
} from "./types";

export function useSosDetector() {
  const [isArmed, setIsArmed] = useState(sosService.getIsArmed());
  const [preferences, setPreferences] = useState<SOSPreferences>(
    sosService.getPreferences()
  );
  const [metrics, setMetrics] = useState<SOSMetrics>(
    sosService.getMetrics()
  );

  useEffect(() => {
    sosService.loadPreferences().then(setPreferences);

    const unsubscribeMetrics = sosService.subscribeMetrics((newMetrics) => {
      setMetrics(newMetrics);
      setIsArmed(sosService.getIsArmed());
    });

    return () => {
      unsubscribeMetrics();
    };
  }, []);

  const toggleArm = useCallback(() => {
    const armed = sosService.toggleArm();
    setIsArmed(armed);
    return armed;
  }, []);

  const setSensitivity = useCallback(async (level: SensitivityLevel) => {
    const updated = await sosService.updatePreferences({ sensitivity: level });
    setPreferences(updated);
  }, []);

  const setCountdownSeconds = useCallback(async (seconds: number) => {
    const updated = await sosService.updatePreferences({ countdownSeconds: seconds });
    setPreferences(updated);
  }, []);

  const setEmergencyPhone = useCallback(async (phone: string) => {
    const updated = await sosService.updatePreferences({ emergencyPhone: phone });
    setPreferences(updated);
  }, []);

  const setSoundDetectionEnabled = useCallback(async (enabled: boolean) => {
    const updated = await sosService.updatePreferences({ soundDetectionEnabled: enabled });
    setPreferences(updated);
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<SOSPreferences>) => {
      const updated = await sosService.updatePreferences(updates);
      setPreferences(updated);
    },
    []
  );

  const simulateImpactAndRotation = useCallback(() => {
    sosService.simulateImpactAndRotation();
  }, []);

  const simulateAcousticDistress = useCallback(() => {
    sosService.simulateAcousticDistress();
  }, []);

  const cancelDistressCountdown = useCallback(() => {
    sosService.cancelCountdown();
  }, []);

  return {
    isArmed,
    toggleArm,
    preferences,
    updatePreferences,
    setSensitivity,
    setCountdownSeconds,
    setEmergencyPhone,
    setSoundDetectionEnabled,
    thresholds: sosService.getThresholds(),
    metrics,
    simulateImpactAndRotation,
    simulateAcousticDistress,
    cancelDistressCountdown,
    playToneBeep: () => sosService.playToneBeep(),
    dispatchSosEmergencyActions: (lat: number, lng: number) =>
      sosService.dispatchSosEmergencyActions(lat, lng),
  };
}
