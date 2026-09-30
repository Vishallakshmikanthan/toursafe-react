/**
 * TourSafe Autonomous SOS Test Suite
 * Validates the DistressDetector logic, multi-sensor fusion, and sensitivity rules.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DistressDetector } from "../lib/sos/distressDetector";

describe("Autonomous SOS DistressDetector Engine", () => {
  let detector: DistressDetector;

  beforeEach(() => {
    detector = new DistressDetector();
  });

  it("should initialize with default Medium sensitivity thresholds", () => {
    const thresholds = detector.getThresholds();
    assert.equal(thresholds.accel, 23.0);
    assert.equal(thresholds.gyro, 2.2);
    assert.equal(thresholds.sound, 8000);
  });

  it("should update thresholds correctly on Low sensitivity", () => {
    detector.setSensitivity("low");
    const thresholds = detector.getThresholds();
    assert.equal(thresholds.accel, 26.0);
    assert.equal(thresholds.gyro, 2.8);
    assert.equal(thresholds.sound, 10000);
  });

  it("should update thresholds correctly on High sensitivity", () => {
    detector.setSensitivity("high");
    const thresholds = detector.getThresholds();
    assert.equal(thresholds.accel, 19.0);
    assert.equal(thresholds.gyro, 1.5);
    assert.equal(thresholds.sound, 6000);
  });

  it("should not confirm distress if only accelerometer is triggered", () => {
    detector.updateAccelerometer(25.0);
    const confirmed = detector.isDistressConfirmed();
    assert.equal(confirmed, false);
  });

  it("should not confirm distress if only gyroscope is triggered", () => {
    detector.updateGyroscope(3.0);
    const confirmed = detector.isDistressConfirmed();
    assert.equal(confirmed, false);
  });

  it("should confirm distress when both Accelerometer and Gyroscope exceed thresholds", () => {
    detector.updateAccelerometer(24.0);
    detector.updateGyroscope(2.5);
    const confirmed = detector.isDistressConfirmed();
    assert.equal(confirmed, true);

    // After confirmation, detector automatically resets
    assert.equal(detector.isDistressConfirmed(), false);
  });

  it("should confirm distress when Accelerometer and sustained Sound exceed thresholds", async () => {
    detector.updateAccelerometer(24.0);
    // Sound requires 50ms sustain time
    detector.updateSoundLevel(8500);
    // Wait > 50ms for sound sustain requirement
    await new Promise((res) => setTimeout(res, 60));
    detector.updateSoundLevel(8500);

    const confirmed = detector.isDistressConfirmed();
    assert.equal(confirmed, true);
  });

  it("should not confirm distress if sensor values are below thresholds", () => {
    detector.updateAccelerometer(10.0);
    detector.updateGyroscope(1.0);
    detector.updateSoundLevel(2000);
    assert.equal(detector.isDistressConfirmed(), false);
  });

  it("should reset state cleanly upon calling reset()", () => {
    detector.updateAccelerometer(25.0);
    let state = detector.getTriggerState();
    assert.equal(state.accelTriggered, true);

    detector.reset();
    state = detector.getTriggerState();
    assert.equal(state.accelTriggered, false);
    assert.equal(state.gyroTriggered, false);
    assert.equal(state.soundTriggered, false);
    assert.equal(state.windowActive, false);
  });
});
