# TourSafe

> **Mission-Critical B2G Tourist Safety & Real-Time Incident Command Platform**

TourSafe is an enterprise-grade Government-to-Government (B2G) and Government-to-Citizen (G2C) tourist safety platform designed for district tourism authorities, emergency response units, and state policing agencies. It delivers an end-to-end safety lifecycle: cryptographic identity issuance, high-frequency IMU kinematics anomaly detection, geospatial geofence containment, multi-tier automated dispatch orchestration, sovereign privacy governance (DPDP Act 2023 / ISO 27001), and grounded AI decision support.

---

## Architecture Overview

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
| **Geospatial Geofence Processor** | PostGIS-style spatial indexing with 2dsphere queries, dwell detection, and zone transition tracking | MongoDB 2dsphere indexes |
| **Safety State Machine** | Formally defined lifecycle: NORMAL → WATCH → ELEVATED → INCIDENT_CANDIDATE → INCIDENT → RECOVERING | Custom FSM, Redis active state |
| **Emergency Orchestration** | Incident lifecycle management, SLA escalation engine, responder auto-assignment, and multi-agency dispatch | FastAPI, MongoDB audit trail |
| **Authority AI Copilot** | Grounded LLM decision support with permission-aware tool registry, RAG document ingestion, and human-in-the-loop action proposals | Gemini / OpenAI / Bedrock |
| **Sovereign Privacy Governance** | DPDP Act 2023, ISO 27001, GDPR, SOC 2, NIST CSF compliance with DSR lifecycle, legal holds, and automated retention sweeps | Custom compliance engine |
| **Real-Time WebSocket Bus** | Low-latency event broadcasting for authority dashboards, tourist alerts, and responder dispatch | Starlette WebSocket, Redis pub/sub |

---

## Personas & Portals

### 1. Authority Command & Control Center (`/admin`)
- Live geospatial situational awareness map with clustered tourist, responder, and hazard layers
- Real-time incident triage with responder routing (Haversine/ETA) and multi-agency dispatch
- Grounded AI Copilot for operational intelligence, SOP lookup, and single-click escalation
- DPDP Act 2023 privacy dashboard, legal hold manager, and ISO 27001 audit export
- ML Ops console for model version management, drift monitoring, and retraining triggers

### 2. Tourist Safety Companion (`/tourist`)
- Instant 1-touch Emergency SOS with physical countdown and vibration feedback
- Verifiable W3C Digital Tourist Credential for rapid checkpoint access
- Real-time geofence warning alerts (safe, warning, danger, restricted zones)
- DPDP Privacy Center: granular consent toggles, DSR submission, and data portability bundle export
- Live safety score and proactive safety check-in prompts

### 3. Field Responder Operations (`/responder`)
- Live tactical dispatch queue with mission assignment notifications
- Turn-by-turn routing to incident coordinates, tourist telemetry diagnostics, and field note sync
- Offline-capable tactical updates with automatic reconciliation upon network restoration

---

## Tech Stack

### Frontend
| Layer | Technology |
|:---|:---|
| Framework | React Native 0.76 + Expo SDK 52 (Universal Web/Native) |
| Routing | Expo Router v4 (file-based) |
| State Management | Zustand v5 (21 stores) |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Maps | react-native-maps (native), Leaflet (web) |
| Forms | React Hook Form + Zod validation |
| Icons | lucide-react-native |
| Charts | victory-native, react-native-chart-kit |
| Notifications | expo-notifications, expo-haptics |

### Backend
| Layer | Technology |
|:---|:---|
| Framework | FastAPI (async ASGI) |
| ORM/Driver | Motor (async MongoDB), Pydantic V2 |
| Database | MongoDB 7.0 (2dsphere geospatial indexes) |
| Cache/Pub-Sub | Redis 7.2 |
| Authentication | JWT (HS256), Argon2 password hashing, refresh token rotation |
| ML Runtime | PyTorch (LSTM Autoencoder), scikit-learn, SciPy, NumPy |
| Security | HSTS, CSP, rate limiting, anti-SSRF, NoSQL injection sanitization |

### Infrastructure
| Layer | Technology |
|:---|:---|
| Containerization | Docker (multi-stage, non-root), Docker Compose |
| Orchestration | Kubernetes (Kustomize), HPA autoscaling |
| Reverse Proxy | Nginx 1.27 (rate limiting, gzip, structured JSON logging) |
| CI/CD | GitHub Actions (CI, CD, rollback, backup drills) |
| Monitoring | Prometheus (30-day retention), OpenTelemetry tracing |
| IaC | Terraform blueprints |

### Compliance & Governance
| Framework | Scope |
|:---|:---|
| DPDP Act 2023 | Indian data protection with consent lifecycle and DSR portability |
| ISO 27001 | Information security management system controls |
| SOC 2 | Trust service criteria readiness |
| GDPR | Data subject rights, retention policies, legal holds |
| NIST CSF | Cybersecurity framework alignment |

---

## Project Structure

```
toursafe/
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── core/                   # Config, database, Redis, security middleware, reliability
│   │   ├── ml/                     # ML pipeline: models, training, evaluation, preprocessing
│   │   │   ├── models/             # LSTM Autoencoder, baselines
│   │   │   ├── training/           # Trainer with early stopping
│   │   │   ├── evaluation/         # Evaluator, threshold calibrator
│   │   │   ├── preprocessing/      # Feature extractor, resampler, robust scaler
│   │   │   ├── dataset/            # Synthetic IMU generator, dataset builder
│   │   │   ├── lifecycle/          # Model registry, drift detector, shadow engine
│   │   │   └── artifacts/          # Versioned artifact manager (ONNX, weights)
│   │   ├── models/                 # Pydantic schemas (request/response)
│   │   ├── routers/                # 35+ API route modules
│   │   ├── schemas/                # Domain schemas (safety, incidents, analytics)
│   │   └── services/               # Business logic
│   │       ├── safety/             # Safety engine, rules, risk fusion, state machine
│   │       ├── emergency/          # SOS, incident lifecycle, escalation, dispatch
│   │       ├── ml/                 # Inference engine, anomaly scorer, episode manager
│   │       ├── geofencing/         # Zone containment, dwell detection
│   │       ├── telemetry/          # High-frequency telemetry pipeline
│   │       ├── compliance/         # Retention, legal holds, consent, DSR, vendor governance
│   │       ├── governance/         # Audit, jurisdiction, configuration governance
│   │       ├── copilot/            # AI copilot with RAG, tools, action proposals
│   │       ├── identity/           # Credential issuance, KYC verification
│   │       ├── notifications/      # Multi-channel notification dispatch
│   │       ├── security/           # Security events, rate limiting, injection protection
│   │       └── integrations/       # Pluggable integration registry (webhooks, adapters)
│   ├── tests/                      # 39 test modules, 510+ test cases
│   └── requirements.txt
├── frontend/                       # React Native / Expo universal app
│   ├── app/                        # File-based routing (Expo Router)
│   │   ├── admin/(tabs)/           # Authority: dashboard, map, alerts, tourists, zones, ML ops, analytics
│   │   ├── tourist/(tabs)/         # Tourist: dashboard, map, SOS, digital ID, itinerary, safety, incidents
│   │   ├── responder/              # Field responder operations
│   │   ├── auth/                   # Login with tabbed role selection
│   │   └── dev/                    # Development tools
│   ├── components/                 # Shared & role-specific UI components
│   ├── store/                      # 21 Zustand stores (auth, safety, SOS, telemetry, etc.)
│   ├── types/                      # 17 TypeScript type definition modules
│   ├── lib/                        # Utilities, API client, hooks
│   └── tests/                      # Frontend unit & integration tests
├── infra/                          # Infrastructure as Code
│   ├── docker/                     # MongoDB config, Redis config, init scripts
│   ├── k8s/base/                   # Kubernetes manifests, HPA, network policies
│   ├── monitoring/                 # Prometheus scrape configuration
│   └── terraform/                  # Cloud provisioning blueprints
├── nginx/                          # Nginx reverse proxy configuration
├── scripts/                        # Operations scripts (deploy, rollback, backup, security checks)
├── docs/                           # 45+ architecture & product documents
│   ├── product/                    # Product overview, workflows, feature matrix
│   ├── release/                    # Release manifests, runbooks, traceability
│   ├── security/                   # Security hardening documentation
│   ├── reliability/                # Reliability & observability docs
│   └── claude-sessions/            # Implementation session logs (35 prompts)
├── docker-compose.yml              # Production multi-service orchestration
├── docker-compose.dev.yml          # Local development stack
└── CHANGELOG.md                    # Full version history
```

---

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for full stack)
- **Node.js 20+** and **npm** (for frontend development)
- **Python 3.12+** (for backend development)
- **MongoDB 7.0** and **Redis 7.2** (or use Docker)

### Option 1: Full Stack with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url> toursafe
cd toursafe

# Start the full production stack
docker compose up -d

# Or start with the development stack (includes hot reload)
docker compose -f docker-compose.dev.yml up -d
```

The platform will be available at:
- **Frontend**: `http://localhost:8081` (dev) or `http://localhost:80` (production via Nginx)
- **Backend API**: `http://localhost:8000`
- **API Docs (Swagger)**: `http://localhost:8000/docs`
- **API Docs (ReDoc)**: `http://localhost:8000/redoc`

### Option 2: Local Development

```bash
# Backend
cd backend
cp .env.example .env          # Configure environment variables
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run web                    # Web browser
# or
npm start                      # Expo dev server (native)
```

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=toursafe
JWT_SECRET=<your-secure-random-string-min-32-chars>
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
DEBUG=True
```

---

## API Overview

The backend exposes **35+ route modules** organized by domain:

| Route Group | Prefix | Description |
|:---|:---|:---|
| Health | `/health` | Liveness, readiness, and startup probes |
| Auth | `/api/v1/auth` | JWT login, register, refresh token rotation |
| Tourists | `/api/v1/tourists` | Tourist profile CRUD |
| Authority | `/api/v1/authority` | Authority admin management |
| Location | `/api/v1/location` | GPS location ingestion and history |
| IMU | `/api/v1/imu` | 50 Hz accelerometer/gyroscope telemetry |
| Telemetry | `/api/v1/telemetry` | Windowed telemetry aggregation pipeline |
| Safety | `/api/v1/safety` | Multi-signal risk fusion, safety state, check-in |
| SOS | `/api/v1/tourists/me/sos` | Emergency SOS with deduplication |
| Emergency | `/api/v1/emergency` | Incident lifecycle, escalation, dispatch |
| Geofence | `/api/v1/geofence` | Zone containment, dwell detection |
| Zones | `/api/v1/zones` | Geospatial zone CRUD (2dsphere) |
| ML | `/api/v1/ml` | Anomaly inference, model management |
| Analytics | `/api/v1/analytics` | Operational intelligence, forecasting |
| Copilot | `/api/v1/copilot` | AI decision support with RAG |
| Identity | `/api/v1/identity` | Digital credential issuance, KYC |
| Compliance | `/api/v1/compliance` | Retention, legal holds, consent, DSR |
| Notifications | `/api/v1/notifications` | Multi-channel alert dispatch |
| Realtime | `/ws` | WebSocket event streaming |

---

## ML Pipeline

TourSafe includes a complete end-to-end machine learning pipeline for IMU-based motion anomaly detection:

### Pipeline Stages

1. **Synthetic Dataset Generation** — Multi-subject IMU trials with configurable normal/anomaly activity profiles
2. **Anti-Leakage Splitting** — Strict subject-wise train/val/test partitioning (no data leakage)
3. **Robust Scaling** — Median/IQR scaling fitted exclusively on normal training data
4. **LSTM Autoencoder Training** — Bidirectional LSTM with early stopping and learning rate scheduling
5. **Threshold Calibration** — Statistical percentile-based anomaly/warning/critical thresholds on validation errors
6. **Comprehensive Evaluation** — ROC-AUC, PR-AUC, F1, specificity against baselines (Isolation Forest, One-Class SVM, etc.)
7. **Versioned Artifact Export** — PyTorch weights, ONNX parity verification, scaler, thresholds, and metadata

### Training the Model

```bash
cd backend
python -m app.ml.pipeline --epochs 40 --batch-size 32 --version v1.0.0
```

### Key Specifications

| Parameter | Value |
|:---|:---|
| Input Frequency | 50 Hz |
| Window Size | 150 samples (3 seconds) |
| Feature Channels | 8 (accel X/Y/Z, gyro X/Y/Z, linear accel magnitude, rotation magnitude) |
| Model Architecture | Bidirectional LSTM Autoencoder |
| Inference Latency | < 10ms per window |

---

## Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v
```

- **39 test modules** covering all subsystems
- **510+ test cases** with 100% pass rate
- Includes unit, integration, E2E, regression, and benchmark tests
- Covers: auth, geofencing, ML inference, safety engine, emergency response, compliance, security hardening, reliability, and more

### Frontend Tests

```bash
cd frontend
npm test
```

- **29 test cases** across 11 test suites
- Covers: kinematics math, jitter statistics, FIFO buffer, haversine geospatial, semantic color tokens

### Type Checking

```bash
cd frontend
npm run type-check    # Zero TypeScript errors
```

---

## Deployment

### Docker Production Stack

```bash
docker compose up -d
```

Services deployed:
| Service | Replicas | CPU Limit | Memory Limit |
|:---|:---|:---|:---|
| `reverse_proxy` (Nginx) | 1 | 1.0 | 512 MB |
| `frontend` | 1 | 0.5 | 256 MB |
| `backend` (FastAPI) | 2 | 2.0 | 1536 MB |
| `worker` (Telemetry) | 1 | 1.0 | 512 MB |
| `ml_service` | 1 | 2.0 | 2048 MB |
| `mongodb` | 1 | 2.0 | 2048 MB |
| `redis` | 1 | 1.0 | 512 MB |
| `prometheus` | 1 | 0.5 | 512 MB |

### Kubernetes

```bash
kubectl apply -k infra/k8s/base/
```

Includes HPA autoscaling, network policies, ConfigMaps/Secrets, and Ingress configuration.

### CI/CD

GitHub Actions workflows:
- **ci.yml** — Lint, type-check, test, and build on every push/PR
- **cd.yml** — Automated deployment pipeline
- **rollback.yml** — Fast rollback procedure
- **db-backup-restore-drill.yml** — Automated disaster recovery testing

### Scripts

```bash
./scripts/deploy.sh              # Production deployment
./scripts/rollback.sh            # Rollback to previous version
./scripts/health-check.sh        # Verify all services are healthy
./scripts/security_check.py      # Security vulnerability scan
./scripts/backup_restore_drill.py # DR backup and restore verification
./scripts/bootstrap_admin.py     # Bootstrap initial admin user
```

---

## Security

TourSafe implements defense-in-depth security across all layers:

- **Authentication**: JWT access/refresh token rotation with automatic token family reuse detection
- **Password Hashing**: Argon2id (memory-hard, side-channel resistant)
- **Transport Security**: HSTS, TLS termination at Nginx, CORS origin whitelisting
- **Input Validation**: Pydantic V2 request sanitization, NoSQL injection prevention, anti-SSRF IP validation
- **Rate Limiting**: Per-IP sliding window limiters (general: 50 req/s, auth: 5 req/s, telemetry: 100 req/s)
- **Audit Logging**: SHA-256 cryptographic hash-chained immutable audit trail for administrative actions
- **Security Headers**: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- **Request Protection**: 10 MB body size limit, correlation ID tracking, safe error handling (no stack trace leaks)
- **Network Isolation**: Internal data network with zero external internet routing for MongoDB and Redis
- **Production Guards**: Fails-fast on weak JWT secrets, wildcard CORS, or debug mode in production

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Category | Files |
|:---|:---|
| **Product** | Overview, workflows, walkthrough, feature matrix, performance report |
| **Architecture** | Safety orchestration, emergency response, realtime, geofencing, ML, identity, analytics, telemetry, copilot |
| **Release** | System integration map, release manifest, production cutover, rollback runbook, traceability matrix |
| **Compliance** | DPDP Act 2023, ISO 27001, GDPR, vendor governance, access governance |
| **Security** | Security hardening, copilot security, RAG security |
| **Reliability** | Health probes, graceful degradation, metrics, tracing |
| **Implementation** | 35 prompt session logs with decisions, files changed, and verification results |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

**Current Version**: v1.0.0 (GA — 35 prompts, 510+ backend tests, 29 frontend tests)

---

## License

[Add your license here]

---

## Acknowledgments

Built with FastAPI, React Native, Expo, MongoDB, Redis, PyTorch, and Docker.
