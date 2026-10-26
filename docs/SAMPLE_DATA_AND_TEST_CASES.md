# TourSafe Sample Data & Test Cases Specification

> **Document Version**: 1.0.0  
> **Target Release**: TourSafe Enterprise GA  
> **Compliance Alignment**: DPDP Act 2023, ISO 27001, SOC 2 Type II  
> **Data Repository**: [`sample_data/toursafe_sample_data.json`](../sample_data/toursafe_sample_data.json)

---

## Table of Contents

1. [Overview & Seeding Guide](#1-overview--seeding-guide)
2. [Sample Data Dictionary](#2-sample-data-dictionary)
   - [Geofence Zones](#geofence-zones)
   - [Tourist Profiles & W3C Verifiable Credentials](#tourist-profiles--w3c-verifiable-credentials)
   - [Field Responder Units](#field-responder-units)
   - [IMU Kinematics 50 Hz Telemetry Windows](#imu-kinematics-50-hz-telemetry-windows)
   - [Active Incidents & Multi-Agency Dispatch](#active-incidents--multi-agency-dispatch)
3. [End-to-End Test Case Catalog](#3-end-to-end-test-case-catalog)
   - [TC-01: Tourist Registration, KYC Verification & Credential Issuance](#tc-01-tourist-registration-kyc-verification--credential-issuance)
   - [TC-02: 50 Hz IMU Telemetry Streaming & Window Aggregation](#tc-02-50-hz-imu-telemetry-streaming--window-aggregation)
   - [TC-03: PyTorch LSTM Autoencoder Fall Anomaly Detection](#tc-03-pytorch-lstm-autoencoder-fall-anomaly-detection)
   - [TC-04: Geospatial Boundary Traversal & Multilingual Hazard Warning](#tc-04-geospatial-boundary-traversal--multilingual-hazard-warning)
   - [TC-05: Multi-Signal Risk Fusion & 6-State FSM Transition](#tc-05-multi-signal-risk-fusion--6-state-fsm-transition)
   - [TC-06: Emergency SOS Trigger, Deduplication & Priority Dispatch](#tc-06-emergency-sos-trigger-deduplication--priority-dispatch)
   - [TC-07: Automated Haversine / ETA Responder Allocation](#tc-07-automated-haversine--eta-responder-allocation)
   - [TC-08: Field Responder Mission Acceptance & Tactical Telemetry Sync](#tc-08-field-responder-mission-acceptance--tactical-telemetry-sync)
   - [TC-09: DPDP Act 2023 Consent Revocation & DSR Export](#tc-09-dpdp-act-2023-consent-revocation--dsr-export)
   - [TC-10: Authority AI Copilot Grounded Tool Call & Human-in-the-Loop Action](#tc-10-authority-ai-copilot-grounded-tool-call--human-in-the-loop-action)
4. [Security, Chaos & Negative Test Scenarios](#4-security-chaos--negative-test-scenarios)
   - [TC-11: Refresh Token Family Hijacking Detection](#tc-11-refresh-token-family-hijacking-detection)
   - [TC-12: Anti-SSRF Webhook Boundary Validation](#tc-12-anti-ssrf-webhook-boundary-validation)
   - [TC-13: NoSQL Injection Payload Sanitization](#tc-13-nosql-injection-payload-sanitization)
   - [TC-14: High-Frequency Telemetry DoS / Rate Limiter Defense](#tc-14-high-frequency-telemetry-dos--rate-limiter-defense)
5. [Automated Test Execution Guide](#5-automated-test-execution-guide)

---

## 1. Overview & Seeding Guide

TourSafe provides structured, deterministic sample datasets to test all layers of the platform:
- Ingestion of 50 Hz kinematics streams
- Spatial queries against MongoDB `2dsphere` indexes
- Incident lifecycle transitions across the 6-state finite state machine
- Grounded Copilot tool executions

### How to Seed Test Data

#### Quick Ingestion via QA Script
To populate the test database (`toursafe_test`) without touching production data:

```bash
# Set environment to test database
export MONGODB_DATABASE=toursafe_test
export MONGODB_URI=mongodb://localhost:27017

# Execute seeding helper
python -c "
import asyncio
from backend.tests.fixtures.seed_test_data import seed_test_data
asyncio.run(seed_test_data())
"
```

#### Bootstrapping Initial Authority Admin
```bash
python scripts/bootstrap_admin.py \
  --email "commander@police.tn.gov.in" \
  --full-name "District Incident Commander" \
  --jurisdiction "DISTRICT_DINDIGUL"
```

#### Synthetic End-to-End Smoke Test
Run operational verification across all subsystems:
```bash
python scripts/synthetic_smoke_test.py
```

---

## 2. Sample Data Dictionary

The authoritative sample data file is stored in [`sample_data/toursafe_sample_data.json`](../sample_data/toursafe_sample_data.json).

### Geofence Zones

| Zone ID | Name | Type | Risk Level | Center Coordinates | Key Rule |
|:---|:---|:---|:---|:---|:---|
| `zone_safe_kodaikanal_lake` | Kodaikanal Lake Safe Perimeter | Safe | Safe | 10.2381° N, 77.4892° E | Active police patrol; nominal check-ins |
| `zone_warning_coakers_walk` | Coaker's Walk Cliff Edge | Warning | Warning | 10.2291° N, 77.4947° E | Fog alert; reduced anomaly thresholds |
| `zone_danger_guna_caves` | Guna Caves (Devil's Kitchen) | Danger | Danger | 10.2167° N, 77.4833° E | Deep crevice hazard; proactive watch escalation |
| `zone_restricted_berijam_forest`| Berijam Core Tiger Sanctuary | Restricted | Critical | 10.1833° N, 77.4167° E | Strict permit zone; immediate incident candidate |

### Tourist Profiles & W3C Verifiable Credentials

1. **Domestic Tourist**:
   - **ID**: `tourist_001_arun`
   - **Name**: Arunachalam Ramanathan
   - **KYC Mode**: Aadhaar e-KYC (Masked UIDAI token)
   - **Status**: `NORMAL` (Safety score: 96.5)
   - **Verifiable Credential**: `vc_ts_ind_2026_09482`

2. **International Tourist**:
   - **ID**: `tourist_002_elena`
   - **Name**: Elena Rostova
   - **KYC Mode**: Passport / e-Visa OCR verification
   - **Status**: `ELEVATED` (Safety score: 64.2)
   - **Verifiable Credential**: `vc_ts_intl_2026_11048`

### Field Responder Units

- `resp_police_unit_1`: Inspector K. Vijay — Tamil Nadu Tourist Police (Callsign: DELTA-9, 4x4 Quick Response)
- `resp_medical_emt_1`: Dr. Priya Sundaram — Advanced Life Support Ambulance (Callsign: MEDIC-108)
- `resp_forest_rescue_1`: Ranger Murugan Selvam — Mountain Search & Rescue (Callsign: FOREST-ALPHA, Thermal Drone equipped)

---

## 3. End-to-End Test Case Catalog

### TC-01: Tourist Registration, KYC Verification & Credential Issuance
- **Objective**: Verify cryptographic issuance of W3C Verifiable Tourist Credential upon successful document validation.
- **Preconditions**: Backend API online; MongoDB connected.
- **Endpoint**: `POST /api/v1/auth/register` & `POST /api/v1/identity/kyc/verify`
- **Request Payload**:
  ```json
  {
    "full_name": "Arunachalam Ramanathan",
    "email": "arun.ramanathan@example.com",
    "password": "SecurePassword@2026!",
    "phone": "+919876543210",
    "nationality": "Indian",
    "emergency_contact": {
      "name": "Meenakshi Ramanathan",
      "phone": "+919876543211",
      "relationship": "Spouse"
    }
  }
  ```
- **Expected Status**: `201 Created`
- **Verification**:
  - Response contains `access_token`, `refresh_token`, and `credential_id`.
  - Database contains record in `users` collection with Argon2id hashed password (`$argon2id$...`).
  - SHA-256 hash chaining entry created in `audit_ledger`.

---

### TC-02: 50 Hz IMU Telemetry Streaming & Window Aggregation
- **Objective**: Stream 150 consecutive accelerometer and gyroscope frames at 50 Hz; verify sliding window assembly (3.0s duration, 1.0s stride).
- **Preconditions**: WebSocket connection established at `/ws/telemetry`.
- **Sample Frame**:
  ```json
  {
    "tourist_id": "tourist_001_arun",
    "ax": 0.042, "ay": 0.981, "az": 0.120,
    "gx": 0.021, "gy": 0.054, "gz": -0.012,
    "timestamp_ms": 1792998400000
  }
  ```
- **Expected Behavior**:
  - Redis buffer receives frames with sub-millisecond write latency.
  - Telemetry aggregator outputs an 8-channel window vector `[150, 8]` upon reaching completeness ratio $\ge 0.6$.
  - Frames with jitter $> 250\text{ ms}$ are flagged for interpolation or packet recovery.

---

### TC-03: PyTorch LSTM Autoencoder Fall Anomaly Detection
- **Objective**: Process a violent impact kinematic sequence and verify anomaly threshold crossing.
- **Endpoint**: `POST /api/v1/ml/infer/imu`
- **Payload**:
  ```json
  {
    "tourist_id": "tourist_002_elena",
    "sampling_rate_hz": 50,
    "window_samples": 150,
    "features": [
      [0.11, 0.96, 0.15, 0.02, 0.04, 0.01, 0.98, 0.05],
      [-0.42, 0.31, -0.10, 1.25, 2.40, -0.85, 0.53, 2.84],
      [3.12, 3.45, -1.80, 4.10, -5.20, 3.10, 4.98, 7.32],
      [0.02, 0.03, 0.99, 0.00, 0.01, 0.00, 0.99, 0.01]
    ]
  }
  ```
- **Expected Response**:
  ```json
  {
    "reconstruction_error": 0.884,
    "anomaly_score": 0.92,
    "is_anomaly": true,
    "severity": "CRITICAL",
    "classification": "FALL_IMPACT_AND_IMMOBILITY",
    "confidence": 0.954
  }
  ```
- **Expected Status**: `200 OK`

---

### TC-04: Geospatial Boundary Traversal & Multilingual Hazard Warning
- **Objective**: Ingest GPS coordinate inside `zone_danger_guna_caves`; verify geospatial containment and multilingual alert push.
- **Endpoint**: `POST /api/v1/location/ingest`
- **Payload**:
  ```json
  {
    "tourist_id": "tourist_002_elena",
    "latitude": 10.2162,
    "longitude": 77.4839,
    "accuracy": 5.0,
    "timestamp": "2026-10-26T12:01:30Z"
  }
  ```
- **Expected Behavior**:
  - MongoDB `2dsphere` query resolves containment inside `zone_danger_guna_caves`.
  - Safety state triggers transition to `WATCH` or `ELEVATED`.
  - WebSocket pushes multilingual warning:
    ```json
    {
      "event": "ZONE_HAZARD_ALERT",
      "zone_id": "zone_danger_guna_caves",
      "level": "DANGER",
      "message": "DANGER: High-risk drop zone with vertical chasms and unstable terrain."
    }
    ```

---

### TC-05: Multi-Signal Risk Fusion & 6-State FSM Transition
- **Objective**: Validate deterministic rule escalation when high kinematic anomaly coincides with dangerous geofence dwell.
- **State Transition**: `WATCH` $\rightarrow$ `ELEVATED` $\rightarrow$ `INCIDENT_CANDIDATE`.
- **Input Signals**:
  1. `IMU_ANOMALY_HIGH` (Score: 0.92, Class: Fall)
  2. `GEOFENCE_DWELL_DANGER` (Zone: Guna Caves, Dwell: 180s)
  3. `SPEED_ZERO_IMMOBILITY` (Duration: 30s)
- **Expected Result**:
  - Combined Risk Score = $0.4 \times 0.92 + 0.35 \times 0.95 + 0.25 \times 0.80 = 0.9005$ ($\ge 0.85$ Critical Threshold).
  - Safety FSM transitions directly to `INCIDENT_CANDIDATE`.
  - Automated 30-second tourist confirmation countdown begins.

---

### TC-06: Emergency SOS Trigger, Deduplication & Priority Dispatch
- **Objective**: Trigger physical SOS button twice within 10 seconds; verify second attempt is deduplicated without dropping the primary incident.
- **Endpoint**: `POST /api/v1/tourists/me/sos`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "latitude": 10.2162,
    "longitude": 77.4839,
    "accuracy": 4.5,
    "trigger_source": "PHYSICAL_BUTTON_HOLD_3SEC",
    "client_timestamp": "2026-10-26T12:01:30Z"
  }
  ```
- **Expected Response (1st Call)**: `201 Created` with `incident_id: "inc_2026_1026_001"`.
- **Expected Response (2nd Call, within 10s)**: `200 OK` with `status: "DEDUPLICATED_ATTACHED_TO_EXISTING"`.

---

### TC-07: Automated Haversine / ETA Responder Allocation
- **Objective**: Calculate nearest eligible responders using Haversine distance and real-time status.
- **Endpoint**: `GET /api/v1/emergency/incidents/inc_2026_1026_001/recommend-responders`
- **Expected Response**:
  ```json
  {
    "incident_id": "inc_2026_1026_001",
    "candidates": [
      {
        "responder_id": "resp_forest_rescue_1",
        "distance_meters": 620,
        "eta_minutes": 7.5,
        "unit_type": "MOUNTAIN_SEARCH_AND_RESCUE",
        "rank": 1
      },
      {
        "responder_id": "resp_medical_emt_1",
        "distance_meters": 2400,
        "eta_minutes": 14.0,
        "unit_type": "AMBULANCE_ADVANCED_LIFE_SUPPORT",
        "rank": 2
      }
    ]
  }
  ```

---

### TC-08: Field Responder Mission Acceptance & Tactical Telemetry Sync
- **Objective**: Responder accepts mission and streams field status back to command center.
- **Endpoint**: `POST /api/v1/emergency/missions/resp_forest_rescue_1/accept`
- **Payload**:
  ```json
  {
    "incident_id": "inc_2026_1026_001",
    "responder_id": "resp_forest_rescue_1",
    "action": "ACCEPT_MISSION",
    "current_coordinates": { "latitude": 10.2180, "longitude": 77.4810 }
  }
  ```
- **Expected Status**: `200 OK`
- **Verification**: Command dashboard WebSocket receives `RESPONDER_EN_ROUTE` event with updated ETA.

---

### TC-09: DPDP Act 2023 Consent Revocation & DSR Export
- **Objective**: Execute Data Subject Right (DSR) export and verify telemetry redaction post-consent withdrawal.
- **Endpoint**: `POST /api/v1/compliance/dsr/export`
- **Payload**:
  ```json
  {
    "tourist_id": "tourist_001_arun",
    "request_type": "PORTABILITY_ARCHIVE",
    "verification_token": "token_arun_dsr_verified"
  }
  ```
- **Expected Status**: `200 OK`
- **Verification**: Returns password-protected JSON bundle containing personal itineraries, verified credentials, and consent history, with raw IMU streams redacted.

---

### TC-10: Authority AI Copilot Grounded Tool Call & Human-in-the-Loop Action
- **Objective**: Ask AI Copilot for incident resolution SOP; verify permission-bound tool call and execution token generation.
- **Endpoint**: `POST /api/v1/copilot/chat`
- **Payload**:
  ```json
  {
    "session_id": "sess_copilot_admin_01",
    "message": "What is the standard protocol for tourist fall inside Guna Caves, and which responder should be dispatched?"
  }
  ```
- **Expected Behavior**:
  - Model invokes RAG over mountain rescue SOP knowledge base.
  - Model issues structured `proposed_action`: `DISPATCH_RESPONDER`.
  - Requires human authorization token (`COPILOT_ACTION_TOKEN`) before execution; does not automatically mutate production database.

---

## 4. Security, Chaos & Negative Test Scenarios

### TC-11: Refresh Token Family Hijacking Detection
- **Objective**: Present an already invalidated refresh token (simulating token theft).
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Payload**: `{ "refresh_token": "<previously_rotated_token>" }`
- **Expected Status**: `401 Unauthorized`
- **Security Action**: Immediate revocation of the entire token family; user session terminated across all devices.

### TC-12: Anti-SSRF Webhook Boundary Validation
- **Objective**: Register an outbound webhook pointing to cloud metadata (`http://169.254.169.254/latest/meta-data/`) or loopback (`http://127.0.0.1:27017`).
- **Endpoint**: `POST /api/v1/integrations/webhooks`
- **Expected Status**: `422 Unprocessable Entity`
- **Error Response**: `SSRF_PROHIBITED_DESTINATION: Private and link-local IP addresses are blocked.`

### TC-13: NoSQL Injection Payload Sanitization
- **Objective**: Attempt NoSQL injection via login email field: `{"$gt": ""}`.
- **Endpoint**: `POST /api/v1/auth/login`
- **Expected Status**: `422 Unprocessable Entity`
- **Verification**: Pydantic strictly validates type string; rejected prior to database query evaluation.

### TC-14: High-Frequency Telemetry DoS / Rate Limiter Defense
- **Objective**: Send 250 requests/second from a single IP address on telemetry endpoint.
- **Expected Behavior**:
  - First 100 requests succeed (`200 OK`).
  - Subsequent requests receive `429 Too Many Requests` with `Retry-After` header.

---

## 5. Automated Test Execution Guide

### Backend Test Suites (510+ Tests)

```bash
cd backend

# 1. Run all unit and integration tests
pytest tests/ -v

# 2. Run with test coverage report
pytest tests/ --cov=app --cov-report=term-missing

# 3. Run specific domain suites
pytest tests/test_safety_engine.py -v         # Safety state machine & risk fusion
pytest tests/test_geofencing.py -v            # MongoDB 2dsphere geofencing
pytest tests/test_ml_inference.py -v          # PyTorch LSTM inference
pytest tests/test_emergency_response.py -v    # Incident lifecycle & dispatch
pytest tests/test_compliance_and_governance.py -v # DPDP Act 2023 & ISO 27001
pytest tests/test_security_hardening.py -v    # Auth, SSRF, injection defenses

# 4. Run ML inference benchmarks
python tests/benchmark_inference.py
```

### Frontend Test Suites (29 Tests)

```bash
cd frontend

# 1. Run Jest unit & integration test suites
npm test

# 2. Run TypeScript strict type verification
npm run type-check
```

### Synthetic Post-Deployment Verification

```bash
# Execute end-to-end non-destructive smoke test
python scripts/synthetic_smoke_test.py
```
