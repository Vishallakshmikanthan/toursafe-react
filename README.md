# TourSafe

> **Mission-Critical B2G Tourist Safety & Real-Time Incident Command Platform**

[![License](https://img.shields.io/badge/License-Proprietary_All_Rights_Reserved-red.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Owner-Vishal_Lakshmikanthan-blue.svg)](https://github.com/Vishallakshmikanthan)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React Native / Expo](https://img.shields.io/badge/Frontend-Expo_SDK_52-black.svg)](https://expo.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-DPDP_Act_2023_|_ISO_27001-green.svg)](docs/governance)
[![Tests](https://img.shields.io/badge/Backend_Tests-510%2B_Passed-brightgreen.svg)](backend/tests)
[![Frontend Tests](https://img.shields.io/badge/Frontend_Tests-29_Passed-brightgreen.svg)](frontend/tests)

TourSafe is an enterprise-grade Government-to-Government (B2G) and Government-to-Citizen (G2C) tourist safety and emergency response platform designed for district tourism authorities, emergency response units, and state policing agencies. It delivers an end-to-end safety lifecycle: cryptographic identity issuance, high-frequency IMU kinematics anomaly detection (50 Hz), geospatial geofence containment, multi-tier automated dispatch orchestration, sovereign privacy governance (DPDP Act 2023 / ISO 27001), and grounded AI decision support.

---

## Key Documentation Links

- 📘 **[Technical Design Document (TDD)](docs/TECHNICAL_DESIGN_DOCUMENT.md)** — Architectural diagrams, data flows, FSM specifications, ML models, and privacy design.
- 🧪 **[Sample Data & Test Cases Catalog](docs/SAMPLE_DATA_AND_TEST_CASES.md)** — Comprehensive end-to-end test scenarios (TC-01 to TC-20), curl examples, and verification steps.
- 📦 **[Sample Data Repository](sample_data/toursafe_sample_data.json)** — Ready-to-use JSON data for zones, tourists, responders, incidents, and 50 Hz IMU telemetry.
- 📜 **[License & Ownership Agreement](LICENSE)** — Proprietary software license, copyright, and all rights reserved.
- 📋 **[Changelog](CHANGELOG.md)** — Release history and milestone logs.

---

## Architecture Overview

> 📖 **Comprehensive Documentation**: For in-depth architectural diagrams (telemetry pipeline, Bi-LSTM autoencoder, 6-state safety FSM, multi-agency dispatch sequence, DPDP Act 2023 hash-chained audit ledger, and database ERD), see the **[Technical Design Document (TDD)](docs/TECHNICAL_DESIGN_DOCUMENT.md)**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NGINX REVERSE PROXY                                │
│                   (TLS termination, rate limiting, gzip)                     │
└────────────┬───────────────────────────────────┬────────────────────────────┘
             │                                   │
     ┌───────▼────────┐                   ┌──────▼──────────┐
     │  FRONTEND      │                   │    BACKEND API   │
     │  React Native  │◄── WebSocket ────►│    FastAPI       │
     │  Expo v52      │                   │    Python 3.12+  │
     │  (Web/Native)  │                   └──────┬──────────┘
     └────────────────┘                          │
                                    ┌───────────┼───────────┐
                                    │           │           │
                              ┌─────▼──┐  ┌────▼───┐  ┌───▼────┐
                              │MongoDB │  │ Redis  │  │ML Svc  │
                              │ 7.0    │  │ 7.2    │  │PyTorch │
                              └────────┘  └────────┘  └────────┘
```

### Core Subsystems

| Subsystem | Description | Technology |
|:---|:---|:---|
| **Real-Time Telemetry Ingestion** | 50 Hz accelerometer & gyroscope streaming with windowed aggregation | FastAPI WebSocket, Redis Streams |
| **LSTM Motion Anomaly Engine** | Bidirectional LSTM Autoencoder for fall, impact, and inactivity detection | PyTorch, ONNX Runtime, scikit-learn |
| **Multi-Signal Risk Fusion** | 9-rule deterministic engine + probabilistic risk fusion across kinematics, geofencing, itineraries, and weather | Custom rule engine, Redis state |
| **Geospatial Geofence Processor** | PostGIS-style spatial indexing with `2dsphere` queries, dwell detection, and zone transition tracking | MongoDB `2dsphere` indexes |
| **Safety State Machine** | Formally defined lifecycle: `NORMAL` → `WATCH` → `ELEVATED` → `INCIDENT_CANDIDATE` → `INCIDENT` → `RECOVERING` | Custom FSM, Redis active state |
| **Emergency Orchestration** | Incident lifecycle management, SLA escalation engine, responder auto-assignment, and multi-agency dispatch | FastAPI, MongoDB audit trail |
| **Authority AI Copilot** | Grounded LLM decision support with permission-aware tool registry, RAG document ingestion, and human-in-the-loop action proposals | Gemini / OpenAI / Bedrock |
| **Sovereign Privacy Governance** | DPDP Act 2023, ISO 27001, GDPR, SOC 2, NIST CSF compliance with DSR lifecycle, legal holds, and automated retention sweeps | Custom compliance engine |
| **Real-Time WebSocket Bus** | Low-latency event broadcasting for authority dashboards, tourist alerts, and responder dispatch | Starlette WebSocket, Redis pub/sub |

---

## Personas & Portals

1. **Authority Command & Control Center (`/admin`)**
   - Live geospatial situational awareness map with clustered tourist, responder, and hazard layers.
   - Real-time incident triage with responder routing (Haversine/ETA) and multi-agency dispatch.
   - Grounded AI Copilot for operational intelligence, SOP lookup, and single-click escalation.
   - DPDP Act 2023 privacy dashboard, legal hold manager, and ISO 27001 audit export.
   - ML Ops console for model version management, drift monitoring, and retraining triggers.

2. **Tourist Safety Companion (`/tourist`)**
   - Instant 1-touch Emergency SOS with physical countdown and vibration feedback.
   - Verifiable W3C Digital Tourist Credential for rapid checkpoint access.
   - Real-time geofence warning alerts (safe, warning, danger, restricted zones).
   - DPDP Privacy Center: granular consent toggles, DSR submission, and data portability bundle export.
   - Live safety score and proactive safety check-in prompts.

3. **Field Responder Operations (`/responder`)**
   - Live tactical dispatch queue with mission assignment notifications.
   - Turn-by-turn routing to incident coordinates, tourist telemetry diagnostics, and field note sync.
   - Offline-capable tactical updates with automatic reconciliation upon network restoration.

---

## Setup & Installation

### System Prerequisites

Ensure you have the following installed on your host machine:

| Component | Minimum Version | Required For |
|:---|:---|:---|
| **Docker & Docker Compose** | v24.0+ / Compose v2.20+ | Recommended full-stack deployment |
| **Python** | 3.12+ | Backend API, ML pipeline, scripts |
| **Node.js & npm** | Node v20 LTS / npm 10+ | Frontend universal application |
| **MongoDB** | 7.0+ | Persistent storage (if running locally without Docker) |
| **Redis** | 7.2+ | Streaming cache & pub/sub (if running locally without Docker) |

---

### Option 1: Full Stack via Docker Compose (Recommended)

Docker Compose provides a complete, containerized environment with all services pre-wired:

```bash
# 1. Clone repository
git clone <repository-url> toursafe
cd toursafe

# 2. Configure environment variables (copy templates)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start the full production stack in the background
docker compose up -d

# OR: Start with the development stack (includes hot code reload)
docker compose -f docker-compose.dev.yml up -d
```

#### Running Services

Once started, the platform components are available at:

| Service | Local URL | Description |
|:---|:---|:---|
| **Frontend Web App** | `http://localhost:8081` (dev) / `http://localhost:80` (prod) | Universal Web/Mobile UI |
| **Backend API** | `http://localhost:8000` | FastAPI ASGI Server |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger UI |
| **Alternative API Docs** | `http://localhost:8000/redoc` | ReDoc UI |
| **Health Check Probe** | `http://localhost:8000/health/ready` | Readiness verification |
| **Prometheus Metrics** | `http://localhost:9090` | System metrics & scrape targets |

#### Stopping the Stack
```bash
docker compose down
# To clean up persistent volumes as well:
docker compose down -v
```

---

### Option 2: Local Manual Development Setup

If you prefer running services directly on your host machine:

#### Step 1: Start Databases (MongoDB & Redis)
You can run just the backing databases using Docker:
```bash
docker run -d --name toursafe-mongo -p 27017:27017 mongo:7.0
docker run -d --name toursafe-redis -p 6379:6379 redis:7.2-alpine
```

#### Step 2: Backend Setup
```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv

# On Linux / macOS:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env to set JWT_SECRET and other secrets if needed

# Start FastAPI development server with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 3: Bootstrap Initial Administrator Account
From the project root (with virtual environment active):
```bash
python scripts/bootstrap_admin.py \
  --email "admin@toursafe.gov" \
  --full-name "Chief Safety Administrator" \
  --jurisdiction "CENTRAL_COMMAND"
```

#### Step 4: Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env

# Start universal web development server
npm run web

# OR: Start Expo universal dev server (for iOS / Android testing via Expo Go)
npm start
```

---

### Option 3: Kubernetes Deployment

TourSafe provides production-ready Kubernetes manifests with Horizontal Pod Autoscaling (HPA) and Network Policies:

```bash
# Apply base manifests
kubectl apply -k infra/k8s/base/

# Check pod deployment status
kubectl get pods -l app=toursafe
```

---

## Environment Variables Reference

### Backend Configuration (`backend/.env`)

All settings are managed via Pydantic Settings in `backend/app/core/config.py`:

| Variable | Default Value | Required in Prod | Description |
|:---|:---|:---:|:---|
| **`APP_NAME`** | `TourSafe Backend` | No | Display name of the backend service. |
| **`APP_VERSION`** | `1.0.0` | No | Application semantic version. |
| **`BUILD_SHA`** | `unknown` | No | Git commit SHA for deployment tracking. |
| **`ENVIRONMENT`** | `development` | Yes | Runtime environment: `development`, `staging`, or `production`. |
| **`HOST`** | `0.0.0.0` | No | Network interface binding. |
| **`PORT`** | `8000` | No | HTTP port for the ASGI server. |
| **`DEBUG`** | `False` | Yes | Enable debug mode. **Enforced False in production.** |
| **`LOG_LEVEL`** | `INFO` | No | Logging verbosity: `DEBUG`, `INFO`, `WARNING`, `ERROR`. |
| **`MONGODB_URI`** | `mongodb://localhost:27017` | Yes | Connection string for MongoDB replica set. |
| **`MONGODB_DATABASE`** | `toursafe` | No | Target MongoDB database name. |
| **`MONGODB_MAX_POOL_SIZE`** | `100` | No | Maximum concurrent connection pool size. |
| **`MONGODB_MIN_POOL_SIZE`** | `10` | No | Minimum connection pool size. |
| **`MONGODB_TIMEOUT_MS`** | `5000` | No | MongoDB socket connection timeout in milliseconds. |
| **`MONGODB_TLS`** | `False` | Optional | Enable TLS encryption for database connection. |
| **`REDIS_URL`** | `redis://localhost:6379/0` | Yes | Connection URL for Redis cache and streaming bus. |
| **`REDIS_MAX_CONNECTIONS`** | `50` | No | Maximum Redis connection pool connections. |
| **`REDIS_SOCKET_TIMEOUT`** | `0.5` | No | Timeout in seconds for Redis socket operations. |
| **`JWT_SECRET`** | *Default Dev String* | **YES** | Minimum 32-character cryptographically secure key. Fails fast in prod if weak. |
| **`JWT_ALGORITHM`** | `HS256` | No | Algorithm for signing authentication tokens. |
| **`JWT_ACCESS_EXPIRE_MINUTES`**| `30` | No | Lifespan of access tokens in minutes. |
| **`JWT_REFRESH_EXPIRE_DAYS`** | `7` | No | Lifespan of refresh tokens in days. |
| **`JWT_ISSUER`** | `toursafe-auth-service` | No | Token issuer claim (`iss`). |
| **`JWT_AUDIENCE`** | `toursafe-client-applications` | No | Token audience claim (`aud`). |
| **`CORS_ORIGINS`** | `http://localhost:8081,...` | Yes | Comma-separated allowed origins. **Wildcard `*` rejected in prod.** |
| **`WS_PING_INTERVAL_SECONDS`**| `30` | No | Heartbeat interval for WebSocket connections. |
| **`WS_MAX_PAYLOAD_BYTES`** | `65536` (64 KB) | No | Max payload size per WebSocket message. |
| **`MAX_REQUEST_BODY_BYTES`** | `52428800` (50 MB) | No | Maximum HTTP body size (accommodates KYC docs/photos). |
| **`TELEMETRY_RETENTION_DAYS`**| `30` | No | Retention window for IMU streams (DPDP Act 2023 compliant). |
| **`TELEMETRY_WINDOW_DURATION_SEC`**| `3.0` | No | Duration of sliding window for anomaly inference. |
| **`TELEMETRY_WINDOW_STRIDE_SEC`** | `1.0` | No | Stride between consecutive inference windows. |
| **`TELEMETRY_NOMINAL_FREQUENCY_HZ`**| `50.0`| No | Expected sampling frequency from tourist devices. |
| **`TELEMETRY_MIN_COMPLETENESS_RATIO`**| `0.6` | No | Minimum received packets ratio required to trigger inference. |
| **`TELEMETRY_MAX_TIME_GAP_MS`** | `250.0` | No | Max allowable timestamp gap before flagging packet jitter. |
| **`ML_MODEL_VERSION`** | `v1.0.0` | No | Active version tag of PyTorch model weights. |
| **`ML_ARTIFACTS_DIR`** | `app/ml/artifacts` | No | Local directory storing ONNX / PyTorch models and scalers. |
| **`ML_WINDOW_SAMPLES`** | `150` | No | Window length ($3.0\text{s} \times 50\text{Hz}$). |
| **`ML_FEATURE_COUNT`** | `8` | No | Number of feature channels per timestep. |
| **`COPILOT_LLM_PROVIDER`** | `gemini` | Optional | LLM provider: `gemini`, `openai`, or `bedrock`. |
| **`COPILOT_MODEL`** | `gemini-2.0-flash` | Optional | Underlying model identifier. |
| **`COPILOT_TEMPERATURE`** | `0.1` | No | Temperature setting for grounded determinism. |
| **`COPILOT_MAX_TOKENS`** | `2048` | No | Max tokens per copilot response. |
| **`COPILOT_ACTION_TOKEN_TTL_SECONDS`**| `300` | No | TTL for human-in-the-loop action approval tokens. |
| **`GEMINI_API_KEY`** | *Empty* | If Gemini used | Google Gemini API key. |
| **`OPENAI_API_KEY`** | *Empty* | If OpenAI used | OpenAI API key. |
| **`STORAGE_PROVIDER`** | `local` | No | Object storage provider: `local`, `s3`, or `gcs`. |
| **`STORAGE_BUCKET_KYC`** | `toursafe-kyc-vault-private`| Yes | Secure bucket for identity documents. |
| **`STORAGE_BUCKET_BACKUPS`** | `toursafe-backups-dr` | Yes | Disaster recovery backup bucket. |

---

### Frontend Configuration (`frontend/.env`)

Client-side variables in Expo must be prefixed with `EXPO_PUBLIC_`:

| Variable | Default Value | Description |
|:---|:---|:---|
| **`EXPO_PUBLIC_API_URL`** | `http://localhost:8000` | Base URL for FastAPI backend endpoints. |
| **`EXPO_PUBLIC_WS_URL`** | `ws://localhost:8000/ws` | Base WebSocket URL for real-time alerts & telemetry. |
| **`EXPO_PUBLIC_DEV_BYPASS`** | `false` | When `true`, bypasses authentication screen for rapid UI development. |
| **`EXPO_PUBLIC_USE_MOCK`** | `false` | When `true`, uses static mock data from `lib/mockData.ts` without calling backend. |
| **`EXPO_PUBLIC_SUPABASE_URL`** | *Optional* | Optional Supabase cloud endpoint. |
| **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**| *Optional* | Optional Supabase anonymous client key. |
| **`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`**| *Optional* | Optional Mapbox vector tile token (Leaflet fallback used by default). |

---

## Testing & Quality Assurance

> 🧪 **Test Suite & Scenarios**: For the exhaustive test case matrix (TC-01 through TC-20), sample data dictionaries, request payloads, and negative/chaos scenarios, see the **[Sample Data & Test Cases Catalog](docs/SAMPLE_DATA_AND_TEST_CASES.md)**. Ready-to-use JSON seed data is located in **[`sample_data/toursafe_sample_data.json`](sample_data/toursafe_sample_data.json)**.

TourSafe features automated test suites across both backend and frontend layers:

### Running Backend Tests (510+ Tests)
```bash
cd backend

# Run all test suites
pytest tests/ -v

# Run with code coverage report
pytest tests/ --cov=app --cov-report=term-missing

# Run specific domain test suites
pytest tests/test_safety_engine.py -v         # Safety FSM & risk fusion
pytest tests/test_geofencing.py -v            # MongoDB 2dsphere spatial containment
pytest tests/test_ml_inference.py -v          # PyTorch LSTM inference engine
pytest tests/test_emergency_response.py -v    # SLA timers & multi-agency dispatch
pytest tests/test_compliance_and_governance.py -v # DPDP Act & audit hash-chaining
pytest tests/test_security_hardening.py -v    # JWT family reuse, SSRF, injection defenses
```

### Running Frontend Tests (29 Tests)
```bash
cd frontend

# Run Jest unit & integration test suites
npm test

# Run strict TypeScript compiler verification (Zero errors expected)
npm run type-check
```

### Running Post-Deployment Synthetic Smoke Test
Verify all operational subsystems end-to-end without alerting real field personnel:
```bash
python scripts/synthetic_smoke_test.py
```

---

## Machine Learning Pipeline

TourSafe includes an end-to-end pipeline to train, calibrate, evaluate, and export the Bi-directional LSTM Autoencoder:

```bash
cd backend

# Execute complete training run
python -m app.ml.pipeline --epochs 40 --batch-size 32 --version v1.0.0
```

### Pipeline Key Specifications
- **Input Channels**: 8 (`ax`, `ay`, `az`, `gx`, `gy`, `gz`, `lin_acc_mag`, `gyro_mag`)
- **Sampling Frequency**: 50 Hz
- **Window Size**: 150 samples (3.0 seconds)
- **Model Architecture**: Bi-directional LSTM Autoencoder (Encoder: 64 $\rightarrow$ 32 $\rightarrow$ Latent 16; Decoder: Repeat $\rightarrow$ 32 $\rightarrow$ 64 $\rightarrow$ Dense 8)
- **Inference Latency**: Sub-10ms per window on modern CPU

---

## Operational Scripts

Operational scripts in `scripts/`:

```bash
./scripts/bootstrap_admin.py       # Securely creates the root authority administrator
./scripts/synthetic_smoke_test.py  # Non-destructive end-to-end smoke test
./scripts/health-check.sh          # Verifies health and readiness probes
./scripts/security_check.py        # Static and configuration vulnerability scan
./scripts/backup_restore_drill.py  # Automated disaster recovery backup & restore verification
./scripts/deploy.sh                # Production zero-downtime deployment script
./scripts/rollback.sh              # Fast rollback to previous known-good deployment
```

---

## Ownership & License

**Copyright © 2026 Vishal Lakshmikanthan. All Rights Reserved.**

TourSafe, including all source code, architecture, algorithms, machine learning models, database schemas, and documentation, is the exclusive proprietary property of **Vishal Lakshmikanthan**.

Unauthorized copying, cloning, reverse engineering, redistribution, commercialization, or public deployment of this software without prior written authorization from the copyright owner is strictly prohibited.

See the complete [LICENSE](LICENSE) agreement for full proprietary terms and contact details.
