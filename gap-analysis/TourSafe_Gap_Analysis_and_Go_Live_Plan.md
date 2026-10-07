# TourSafe — Gap Analysis and Go-Live Plan

**Prepared for:** Vishal and Sneha (VibeSync)
**Date:** 2026-10-07
**Language style:** Simplified Technical English (ASD-STE100)
**Inputs:** `TourSafe_Master_Project_Documentation.md` and `toursafe-react-main.zip`

---

## 1. Purpose and Scope

This document compares the plan (the Master Documentation) with the actual code (the ZIP file). It lists the gaps. It gives the next steps to put TourSafe in live operation.

### What was checked

- The full Master Documentation.
- The repository structure (956 files, without `node_modules`).
- The README, the CHANGELOG, and the backend configuration.
- The ML artifacts: metadata, threshold, and evaluation report.
- The frontend telemetry, offline buffer, authentication, and mock-data code.
- The identity and credential service.
- The notification and integration providers.
- The Docker Compose, Nginx, CI, CD, and Kubernetes files.

### What was NOT checked

- The tests were not run. The CHANGELOG states "510 passed". This is not confirmed here.
- The application was not started.
- Not every file was read. Findings cite the files that were read.
- Items marked **(not verified)** need a check by the team.

---

## 2. Summary

The repository is large and well structured. The backend is much more complete than the Master Documentation describes. But the project is **not ready for live use**.

Four problems block a live launch:

1. The AI model does not detect most anomalies (recall 10.6%).
2. Production can start without a database and not report an error.
3. Default secrets are in the committed files.
4. The CD pipeline does not deploy. Its steps only print text.

Three promised features do not exist in the code: the blockchain identity (DID), the e-FIR generation, and the hardware module.

### Status by syllabus module

| Module | Plan | Status | Main gap |
|---|---|---|---|
| 1. Foundation | Docker, FastAPI, MongoDB, Redis, CI | **Mostly done** | Socket.io is not used. The code uses native WebSocket. |
| 2. Traveler app and telemetry | 50 Hz IMU, 1 Hz GPS, SQLite AES-256 queue, Turf.js | **Partial** | The offline queue is plain `AsyncStorage`. No SQLite. No AES. No Turf.js. |
| 3. AI anomaly detection | LSTM autoencoder, ONNX, calibrated threshold | **Partial** | The model exists. Its quality is too low. The data is synthetic. |
| 4. Decentralized identity | DID, secp256k1, Polygon, IPFS, medical vault | **Not done** | No blockchain code exists. The QR credential uses a server HMAC. |
| 5. Command center and e-FIR | Dashboard, Mapbox, e-FIR PDF/JSON, dispatch | **Partial** | The dashboard and dispatch exist. The e-FIR service does not exist. |
| 6. Hardware | ESP32, MPU6050, NEO-6M | **Not started** | No firmware and no hardware test code. |
| 7. Security, test, deploy | Tests, Kubernetes, CI/CD, monitoring | **Partial** | CD is a placeholder. Secrets are hard-coded as defaults. |

---

## 3. What Exists (Verified Strengths)

| Area | Evidence |
|---|---|
| Backend API | 35 router modules in `backend/app/routers/`, registered in `backend/app/main.py`. |
| Telemetry ingestion | `/api/v1/telemetry/session/start`, `/batch`, `/session/stop` in `backend/app/routers/telemetry.py`. |
| Real-time bus | WebSocket at `/ws` and `/api/v1/ws` in `backend/app/routers/realtime.py`. |
| ML pipeline | LSTM autoencoder, trainer, evaluator, ONNX export, model registry, drift detector, shadow engine in `backend/app/ml/`. |
| ONNX parity | `metadata.json` shows `parity_verified: true`. Maximum difference is 3e-07. |
| Safety logic | Safety engine, risk fusion, and state machine in `backend/app/services/safety/`. |
| Geofencing | Server-side zone containment in `backend/app/services/geofencing/`. |
| Emergency response | SOS, incident lifecycle, escalation, and responder assignment in `backend/app/services/emergency/`. |
| Roles | Three portals: `/admin`, `/tourist`, `/responder` in `frontend/app/`. |
| Security code | Argon2, refresh-token rotation, rate limiting, SSRF protection, security headers. |
| Compliance code | Consent, data-subject requests, retention, legal hold. |
| Infrastructure files | Dockerfiles, Nginx with TLS settings, Kubernetes with HPA, Terraform, Prometheus. |
| Production config guard | `config.py` rejects a weak JWT secret, wildcard CORS, and debug mode when `ENVIRONMENT=production`. |

---

## 4. Gaps

Priority levels:

- **P0** — Blocks a live launch. Fix first.
- **P1** — Needed for a credible live pilot.
- **P2** — Needed to match the Master Documentation.

### P0 — Blockers

#### G-01 — The AI model detects too few anomalies

- **Finding:** The evaluation report of model v1.0.0 shows:
  - recall = 0.106 (14 of 132 anomalies detected)
  - precision = 0.34
  - F1 = 0.16
  - ROC-AUC = 0.61
  - verdict = `NEEDS_TUNING`
- The training did not converge (`converged: false`).
- The baseline Isolation Forest has ROC-AUC 0.95. The LSTM model is worse than the baseline.
- **Evidence:** `backend/app/ml/artifacts/v1.0.0/metadata.json`, `backend/app/ml/experiments/experiments.jsonl`.
- **Risk:** The system misses about 9 of 10 abnormal events. A user can think the system protects them when it does not.
- **Fix:**
  1. Do not describe the AI as "working" until the targets in section 7 are met.
  2. Keep manual SOS as the main emergency path.
  3. Collect real phone data (see G-02).
  4. Retrain with more epochs, a better loss, and a threshold chosen by the F1 curve.
  5. Compare the result with Isolation Forest. If the baseline is better, use the baseline in production.
- **Done when:** On a test set from unseen real subjects, recall ≥ 0.80 and false-positive rate ≤ 0.05. Inference time per window is below 100 ms.

#### G-02 — The training data is synthetic

- **Finding:** The subject IDs (`SUB_TR_01` and so on) come from `synthetic_generator.py`. The Master Documentation says: "Do not train a safety model entirely on fabricated random telemetry."
- **Evidence:** `backend/app/ml/dataset/synthetic_generator.py:432`.
- **Fix:**
  1. Load at least one public dataset (UCI HAR or similar) through `benchmark_loaders.py`.
  2. Record own data on physical phones: walking, stairs, sitting, phone drop, controlled shake. Use at least 8 subjects.
  3. Split the data by subject, not by random sample.
- **Done when:** The model card states the data sources. Real data is at least 50% of the training windows.

#### G-03 — Production can start without a database and not fail

- **Finding:** In `main.py`, the production branch runs `raise conn_err`. But the `raise` is inside a `try` block. The outer `except Exception` catches it and prints `[WARN]`. The server then continues to start.
- **Evidence:** `backend/app/main.py`, lifespan function.
- **Risk:** The API reports as running while the database is unreachable. SOS data can be lost.
- **Fix:**
  1. Re-raise the error in production so the process exits.
  2. Make `/health/ready` return a failure code when MongoDB or Redis is not reachable.
  3. Add a test that starts the app in production mode with a bad `MONGODB_URI` and expects exit.
- **Done when:** The test passes. The Kubernetes readiness probe removes the pod from service.

#### G-04 — Default secrets are in committed files

- **Finding 1:** `docker-compose.yml` has fallback values for the database password, the Redis password, and the JWT secret. The values are visible in the repository.
- **Finding 2:** `credential_service = CredentialService()` uses the fixed key `"toursafe_credential_hmac_signing_key_32bytes"`. The key does not come from settings. It has no production check.
- **Finding 3:** Database backups (`backups/*.json.gz`, `backend/backups/*.json.gz`) are in the repository. Their content was not inspected **(not verified)**.
- **Evidence:** `docker-compose.yml` lines 58–61, 93–95, 118–119, 140, 143; `backend/app/services/identity/credential_service.py` lines 35 and 423.
- **Fix:**
  1. Remove all `:-default` fallbacks from `docker-compose.yml`. Make the variables required.
  2. Add `CREDENTIAL_HMAC_KEY` to `Settings`. Reject the default value in production.
  3. Rotate every secret that was ever committed.
  4. Delete the backup files from the repository. Remove them from Git history. Add `backups/` and `*.log` to `.gitignore`.
  5. Run `gitleaks detect` on the full history.
- **Done when:** `docker compose config` fails when a secret is missing. Gitleaks reports zero findings.

#### G-05 — The CD pipeline does not deploy

- **Finding:** Every deploy step in `.github/workflows/cd.yml` is an `echo` command. No `kubectl`, no migration, and no smoke test run.
- **Evidence:** `.github/workflows/cd.yml` lines 78–113.
- **Fix:** Replace each `echo` with a real command. See Phase 3 in section 6.
- **Done when:** A push to `main` deploys to staging. The smoke test runs against the staging URL. The job fails when the smoke test fails.

#### G-06 — Mock and bypass flags are enabled in the example environment

- **Finding:** `frontend/.env.example` sets `EXPO_PUBLIC_USE_MOCK=true` and `EXPO_PUBLIC_DEV_BYPASS=true`. A copy of this file gives an app that shows fake data and skips login.
- **Evidence:** `frontend/.env.example`; `frontend/lib/api.ts` line 528; `frontend/components/RoleSwitch.tsx` line 11.
- **Risk:** This violates the Master Documentation rule: "Never fake real-time."
- **Fix:**
  1. Set both flags to `false` in `.env.example`.
  2. Make the production build fail when either flag is `true`.
  3. Show a visible "DEMO DATA" banner when mock mode is active.
- **Done when:** A production build with `USE_MOCK=true` fails in CI.

### P1 — Needed for a credible live pilot

#### G-07 — The e-FIR service does not exist

- **Finding:** The backend has only three event names (`efir.created`, `efir.updated`, `efir.dispatched`) in `schemas/realtime.py`. No service creates an e-FIR. No PDF library is in `requirements.txt`. The frontend shows e-FIR data from `mockData.ts`.
- **Fix:**
  1. Add `backend/app/services/efir/` and `routers/efir.py`.
  2. Implement `POST /api/v1/efir/generate` and `GET /api/v1/efir/{incident_id}`.
  3. Collect: incident ID, time, traveler identity, GPS, anomaly type and score, geofence state, offline flag, emergency contacts, dispatch targets.
  4. Output JSON and PDF. Use `reportlab` or `weasyprint`.
  5. Store a SHA-256 hash of each e-FIR in the audit log.
  6. Replace the mock e-FIR screen with real API calls.
- **Done when:** A confirmed incident creates an e-FIR in less than 60 seconds. The PDF downloads from the admin screen.

#### G-08 — Real notification and dispatch providers are not connected

- **Finding:** The SMS, push, email, and voice providers work only when environment credentials exist. Without them, they return "dev provider stub" results. Adapters default to `is_real_provider=False`. No real agency acknowledgment exists.
- **Evidence:** `backend/app/services/notifications/providers/*.py`; `backend/app/services/integrations/adapters/base.py`.
- **Fix:**
  1. Create accounts for SMS (for example Twilio), push (Firebase Cloud Messaging), and email.
  2. Add credentials as secrets.
  3. Send one real SMS and one real push in staging.
  4. Create a "pilot recipient" list. Send all pilot alerts to this list only (see section 9).
- **Done when:** An SOS from a test phone reaches a real phone by SMS and push in less than 30 seconds.

#### G-09 — The offline queue is not encrypted

- **Finding:** `offlineBuffer.ts` stores telemetry as plain JSON in `AsyncStorage`. The Master Documentation requires an AES-256 SQLite queue.
- **Fix:**
  1. Add `expo-sqlite` for the queue.
  2. Generate a random key. Store the key in `expo-secure-store`.
  3. Encrypt each row before it is written.
  4. Delete a row only after the server acknowledges it.
  5. Keep the idempotency key already in `BufferedPacket`.
- **Done when:** A test in airplane mode buffers 10 minutes of data. After reconnect, the server receives all packets in order with no duplicates.

#### G-10 — Authentication tokens are in AsyncStorage

- **Finding:** `authStore.ts` saves the access and refresh tokens in `AsyncStorage`. This storage is not encrypted.
- **Fix:** Move the tokens to `expo-secure-store` on mobile. For web, use an HttpOnly cookie or memory storage.
- **Done when:** No token string exists in `AsyncStorage` after login.

#### G-11 — The WebSocket token is in the URL

- **Finding:** `realtimeClient.ts` connects with `?token=...`. Proxy logs can record URLs with the token.
- **Fix:** Send the token as the first WebSocket message, or use a short-lived one-time ticket from a REST call. Remove the token from the Nginx access log format.
- **Done when:** No token appears in any access log.

#### G-12 — Tests use a mock database

- **Finding:** The test suite uses `mongomock-motor`. The CI starts Redis but not MongoDB.
- **Risk:** Real MongoDB behavior (indexes, `2dsphere` queries, transactions) is not tested.
- **Fix:** Add a MongoDB service to the CI job. Run a subset of tests (geofence, SOS, e-FIR) on the real database.
- **Done when:** The geofence and SOS tests pass on a real MongoDB 7.0 container.

#### G-13 — Domain names and certificates are not real

- **Finding:** All hosts use `*.toursafe.internal`. These names do not resolve on the public Internet. The Nginx certificate paths (`/etc/nginx/certs/toursafe.crt`) have no source in the repository.
- **Fix:** Buy or reuse a real domain. Use Let's Encrypt for certificates. Update `CORS_ORIGINS` and the app environment files.
- **Done when:** `https://api.<your-domain>/health/ready` returns 200 in a browser with a valid certificate.

### P2 — Match the Master Documentation

#### G-14 — Decentralized identity (Module 4) is not built

- **Finding:** No Solidity, Hardhat, ethers.js, IPFS, or secp256k1 code exists. The current credential is a QR token signed with a **server-side** HMAC key. The signature is cut to 32 characters. The private key is not on the device.
- **Note:** The word "polygon" in the code means a geofence shape. It does not mean the blockchain.
- **Fix (in this order):**
  1. Create `blockchain/` with a `DIDRegistry.sol` contract: `registerDID`, `resolveDID`, `grantEmergencyAccess`, `revokeEmergencyAccess`.
  2. Write Hardhat tests. Deploy to Polygon Amoy.
  3. In the app, generate a secp256k1 key with `ethers`. Store it in `expo-secure-store`. Never send it to the server.
  4. Encrypt the medical vault on the device. Store it on IPFS (Pinata). Store only the CID on-chain.
  5. Sign the QR token with the device key. Let the backend verify with the public key.
  6. Log each emergency access and each revocation in the audit log.
- **Keep:** The current HMAC credential as a fallback until the DID flow passes all tests.
- **Done when:** Demo 5 in the Master Documentation passes: scan, resolve, decrypt, audit, revoke.

#### G-15 — Medical data encryption is not confirmed

- **Finding:** `document_storage.py` writes `is_encrypted_at_rest: True` and `AES-256-GCM` in metadata. Real encryption was not found in the lines read. **(not verified)**
- **Fix:** Review the file. If the data is not encrypted, add real AES-GCM encryption with a key from KMS or a secret manager.

#### G-16 — Hardware module (Module 6) is not started

- **Finding:** No `hardware/` folder. No ESP32 or MPU6050 code.
- **Fix:** Create `hardware/firmware/`. Send the same JSON packet as the mobile app to `/api/v1/telemetry/batch`. Add the five hardware tests from the Master Documentation (crash, immobility, offline, geofence, SOS).
- **Note:** Do this after G-01 to G-13. Hardware is not needed for a live software pilot.

#### G-17 — Client-side geofence (Turf.js) is missing

- **Finding:** The geofence runs on the server only. The Master Documentation requires a local warning first, then server confirmation.
- **Fix:** Add `@turf/boolean-point-in-polygon`. Cache the zone list on the device. Show the local warning when no network exists.

#### G-18 — Window overlap differs from the plan

- **Finding:** `config.py` sets a 3.0 s window and a 1.0 s stride. This is 67% overlap. The Master Documentation says 50% overlap (1.5 s stride).
- **Fix:** Decide which value is correct. Change the code or the document. Retrain the model if the stride changes the data.

#### G-19 — Repository contains stray files

- **Finding:** `test_routes.py`, `test_routes2.py`, `test_routes3.py`, `test_register.py`, `backend/uvicorn.log`, `frontend/typecheck-output*.txt`, `frontend/tsc_output.txt`.
- **Fix:** Delete them. Add the patterns to `.gitignore`.

#### G-20 — Unused Supabase code remains

- **Finding:** `frontend/lib/supabase.ts` and the Supabase variables remain. The production login uses FastAPI.
- **Fix:** Remove the Supabase package, the file, and the variables. This reduces the attack surface and the confusion.

---

## 5. Differences Between the Documentation and the Code

The Master Documentation (section 33) says: "Do not combine both stacks accidentally." The code uses a third combination. The team must choose one of two options for each row: change the code, or change the document.

| Topic | Master Documentation | Actual code | Recommended action |
|---|---|---|---|
| Real-time transport | Socket.io | Native WebSocket and Redis pub/sub | Change the document. The current design works. |
| Telemetry transport | WebSocket stream | HTTP batch POST | Change the document. Batch upload is simpler and works offline. |
| Map | Mapbox GL JS | Leaflet (web) and react-native-maps | Change the document. Both are free of a Mapbox token. |
| Dashboard | Separate React app | One Expo app with `/admin` route | Change the document. |
| ML framework | TensorFlow/Keras | PyTorch with ONNX export | Change the document. ONNX parity is verified. |
| Identity | W3C DID on Polygon | HMAC-signed QR credential | Change the code (G-14). |
| Offline queue | AES-256 SQLite | Plain AsyncStorage | Change the code (G-09). |
| e-FIR | JSON and PDF service | Not present | Change the code (G-07). |
| Emergency numbers | Not mentioned | Not mentioned | Add a rule: link to the national emergency number (112 in India). See section 9. |

---

## 6. Go-Live Plan

The plan has five phases. Do the phases in order. Do not start a phase until the gate of the earlier phase is met.

### Phase 0 — Safe baseline (about 2–3 days)

**Goal:** The repository is clean and safe to deploy.

1. Do G-04: remove default secrets, rotate keys, delete backups from history.
2. Do G-19 and G-20: remove stray files and Supabase code.
3. Do G-06: set mock and bypass flags to `false`.
4. Do G-03: fix the startup error handling.
5. Run the full backend test suite. Record the real result in `CHANGELOG.md`.
6. Run `npm run type-check` and `npm test` in `frontend/`.

**Gate:** All tests pass on your own machine. Gitleaks reports zero findings. `docker compose up` starts all services with secrets from a `.env` file.

### Phase 1 — Real infrastructure (about 3–4 days)

**Goal:** The system runs on the public Internet with TLS.

Use this recommended minimum architecture:

| Component | Recommended option |
|---|---|
| Backend API (3 containers: api, worker, ml) | One VPS with Docker Compose, or a container host (Render, Railway, Fly.io) |
| MongoDB | Managed MongoDB (for example MongoDB Atlas) |
| Redis | Managed Redis (for example Upstash or Redis Cloud) |
| Reverse proxy and TLS | Caddy or Nginx with Let's Encrypt |
| Web frontend | Static host: `npx expo export --platform web`, then Vercel, Netlify, or Cloudflare Pages |
| Mobile app | EAS Build. Use internal testing (Android APK first) |
| Monitoring | Prometheus config already exists. Add a free uptime monitor on `/health/ready` |

**Warning:** Check the current free-tier limits and terms of each provider before you choose. The limits change.

Steps:

1. Buy a domain. Create `api.`, `app.`, and `admin.` records.
2. Create the managed MongoDB and Redis. Allow only your server IP.
3. Create `backend/.env.production` from the template. Use real secrets.
4. Set `ENVIRONMENT=production`. Start the stack.
5. Run `scripts/migrate.py` and `scripts/bootstrap_admin.py`.
6. Open `/health/ready`. Confirm that it returns 200.
7. Run `scripts/synthetic_smoke_test.py` against the public URL.
8. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` to the `https://` and `wss://` addresses.

**Gate:** An admin can log in on the public web URL. A tourist account can start a trip. The admin map shows the tourist.

### Phase 2 — Close the safety chain (about 1–2 weeks)

**Goal:** One real SOS travels from a phone to a real responder.

1. Do G-10 and G-11 (token security).
2. Do G-09 (encrypted offline queue).
3. Do G-08 (real SMS, push, email).
4. Do G-07 (e-FIR JSON and PDF).
5. Do G-12 (real MongoDB in CI).
6. Run Demo 1 (normal trip), Demo 2 (geofence), Demo 4 (SOS), and Demo 6 (dispatch) from the Master Documentation on two physical phones.
7. Measure the time from SOS press to admin alert. Target: less than 500 ms in the same region.

**Gate:** All four demos pass on physical devices over mobile data. Results are saved in `docs/testing/`.

### Phase 3 — Real CD and monitoring (about 3–5 days)

**Goal:** A merge to `main` deploys without manual steps.

1. In `cd.yml`, replace each `echo` step with a real command (`docker push`, `ssh` or `kubectl apply`, `scripts/migrate.py`, `scripts/synthetic_smoke_test.py`).
2. Store the deploy credentials as GitHub environment secrets.
3. Make the production job wait for manual approval.
4. Test `rollback.yml` on staging.
5. Add alerts for: API down, high error rate, WebSocket disconnect rate, and queue depth.
6. Run the backup-and-restore drill on the real database.

**Gate:** A deliberate bad commit fails the smoke test and rolls back automatically.

### Phase 4 — AI quality (about 2–4 weeks, runs in parallel with Phase 2)

**Goal:** The anomaly model meets the targets in section 7.

1. Do G-02: collect real data (at least 8 subjects, 3 phones).
2. Retrain the model. Use the lifecycle tools already in `backend/app/ml/lifecycle/`.
3. Compare the model with Isolation Forest on the same test set.
4. Run the winner in **shadow mode** (`shadow_engine.py`). Shadow mode records predictions but does not raise alerts.
5. Review the shadow-mode false alarms for at least 7 days.
6. Enable alerts only after the targets are met.

**Gate:** The model card shows the metrics in section 7 on unseen subjects.

### Phase 5 — Identity and hardware (after the pilot)

1. Do G-14, G-15, G-17, G-18.
2. Do G-16 (hardware) if you need it for the final demonstration.

---

## 7. Acceptance Targets

| Item | Target | Current |
|---|---|---|
| Anomaly recall (unseen subjects) | ≥ 0.80 | 0.106 |
| False-positive rate | ≤ 0.05 | 0.021 (but recall is too low) |
| Inference time per window | < 100 ms | not verified |
| SOS to admin alert | < 500 ms | not verified |
| e-FIR generation | < 60 s | no e-FIR service |
| Backend test suite | 100% pass on real run | claimed, not reproduced |
| Secrets in Git history | 0 | default secrets present |
| Public `/health/ready` | 200 with valid TLS | no public deployment |

---

## 8. Live-Readiness Checklist

Mark each item before the launch.

- [ ] No default secret exists in any file or in Git history.
- [ ] `ENVIRONMENT=production` and `DEBUG=false`.
- [ ] The API exits when MongoDB is not reachable.
- [ ] `EXPO_PUBLIC_USE_MOCK=false` and `EXPO_PUBLIC_DEV_BYPASS=false`.
- [ ] TLS is valid on the API, the web app, and the WebSocket.
- [ ] Tokens are in secure storage.
- [ ] One real SMS and one real push reach a test phone.
- [ ] An e-FIR PDF is generated for a test incident.
- [ ] Manual SOS works with no network, then syncs after reconnect.
- [ ] The CD pipeline deploys and rolls back.
- [ ] A backup restore drill passes on the real database.
- [ ] The privacy notice and consent screen are visible in the app.
- [ ] The AI alert feature is off, or in shadow mode, until G-01 is closed.
- [ ] The pilot disclaimer is visible (section 9).

---

## 9. Safety and Legal Cautions

**Warning:** TourSafe is not an official emergency service. Do not tell users that it replaces the national emergency number. In India, this number is 112. Show a clear message in the SOS screen: "For immediate danger, call 112."

**Warning:** Do not send automatic alerts to real police stations, hospitals, or emergency services without a written agreement with the agency. Until you have the agreement, send pilot alerts to named test recipients only.

**Caution:** The system collects location, identity, and medical data. This data is sensitive. Use only volunteer test users in the pilot. Get their consent. Delete their data when the pilot ends. Use the existing consent and retention services.

**Caution:** Do not publish the 20–30 minute to 5 minute improvement claim as a result. The Master Documentation says it is a target. Only measured tests can support it.

---

## 10. Recommended Order of Work (Short Form)

1. G-04, G-03, G-06 (safe baseline)
2. G-13 and Phase 1 (public deployment)
3. G-10, G-11, G-09 (device security)
4. G-08, G-07 (real alerts and e-FIR)
5. G-05, G-12 (real CD and real-database tests)
6. G-01, G-02 (AI quality, in parallel)
7. G-14, G-15, G-17, G-18 (identity and Master Documentation match)
8. G-16 (hardware)

---

## 11. Documentation Updates Needed

After each phase, update these files:

- `TourSafe_Master_Project_Documentation.md`: use the "Change the document" rows in section 5.
- `CHANGELOG.md`: record real test results and real deployment dates.
- `docs/agent-sessions/`: record each work session, as the Master Documentation requires.
- `README.md`: replace the claim "Mission-Critical" with "Pilot" until the live checklist is complete.
