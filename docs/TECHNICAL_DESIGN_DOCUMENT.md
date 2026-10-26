# TourSafe Technical Design Document (TDD)

> **Document Status**: Approved / Production Baseline  
> **System Name**: TourSafe B2G/G2C Tourist Safety & Incident Command Platform  
> **Version**: 1.0.0 (GA)  
> **Compliance Alignment**: DPDP Act 2023, ISO 27001:2022, SOC 2 Type II, NIST CSF  
> **Author**: TourSafe Engineering & Architecture Team  

---

## Executive Summary

TourSafe is an enterprise-grade Government-to-Government (B2G) and Government-to-Citizen (G2C) tourist safety and emergency response orchestration platform. It is engineered specifically for district tourism authorities, state police command centers, disaster response agencies, and international travelers.

The platform provides an end-to-end safety lifecycle encompassing:
1. **Cryptographic Identity**: W3C-compliant Verifiable Digital Tourist Credentials.
2. **Kinematic Anomaly Detection**: 50 Hz stream ingestion with PyTorch Bi-directional LSTM Autoencoder.
3. **Geospatial Geofencing**: MongoDB `2dsphere` spatial indexing with polygon containment and dwell detection.
4. **Multi-Signal Risk Fusion**: 6-state formal safety state machine evaluated by 9 deterministic safety rules.
5. **Multi-Agency Dispatch**: Haversine/ETA responder routing with automated SLA escalation.
6. **Sovereign Privacy**: DPDP Act 2023 compliance, cryptographic hash-chained immutable audit ledger, and automated retention sweeps.
7. **Grounded AI Copilot**: LLM decision support with Human-in-the-Loop action tokens and RAG.

---

## 1. High-Level System Architecture

The TourSafe architecture follows a defense-in-depth, decoupled microservices model optimized for low-latency telemetry ingestion, real-time spatial processing, and high availability.

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer (Universal Expo SDK 52)"]
        TouristApp["Tourist Mobile App<br/>(iOS / Android / Web)"]
        AuthorityDesk["Authority Command Center<br/>(Desktop Web / Tactical)"]
        ResponderApp["Field Responder App<br/>(Mobile / Tablet)"]
    end

    subgraph Edge_Gateway ["Edge & Gateway Layer"]
        Nginx["Nginx 1.27 Reverse Proxy<br/>TLS 1.3 Termination | Rate Limiting | Anti-DDoS"]
    end

    subgraph Core_Services ["Application Core (FastAPI ASGI)"]
        AuthSvc["Auth & Security Svc<br/>Argon2id | JWT Family Rotation"]
        TelemetrySvc["Telemetry Ingestion Svc<br/>50Hz WebSocket Ingest"]
        SafetyFSM["Safety Engine & FSM<br/>6-State Machine | Risk Fusion"]
        EmergencySvc["Emergency Dispatch Svc<br/>SLA Engine | Haversine Routing"]
        GeofenceSvc["Geofence Svc<br/>2dsphere Spatial Queries"]
        CopilotSvc["AI Copilot Svc<br/>RAG Engine | Tool Execution Registry"]
        ComplianceSvc["Privacy & Compliance Svc<br/>DPDP Act | Audit Hash-Chain"]
    end

    subgraph Data_Pipeline ["Message & Processing Pipeline"]
        RedisStream["Redis 7.2 Streams & Pub/Sub<br/>Sub-millisecond In-Memory Ingestion"]
        WorkerPool["Background Workers<br/>Window Aggregator | SLA Monitor"]
    end

    subgraph ML_Subsystem ["Machine Learning Subsystem"]
        MLInference["PyTorch / ONNX ML Service<br/>Bi-LSTM Autoencoder (150 samples)"]
        ModelRegistry["Versioned Model Registry<br/>Weights | Scalers | Thresholds"]
    end

    subgraph Storage_Layer ["Data & Storage Layer"]
        MongoDB[("MongoDB 7.0 Replica Set<br/>2dsphere Geo Indexes | User Vault")]
        ObjectStorage[("Encrypted Object Vault<br/>KYC Docs | Forensics | Backups")]
    end

    subgraph External_Integrations ["External Integrations"]
        GeminiLLM["Gemini 2.0 / OpenAI API<br/>Copilot Decision Support"]
        GovSMS["Gov CAD / SMS Gateway<br/>Emergency Broadcast"]
        Prometheus["Prometheus & OpenTelemetry<br/>Metrics & Trace Monitoring"]
    end

    %% Client Connections
    TouristApp -->|HTTPS / WSS| Nginx
    AuthorityDesk -->|HTTPS / WSS| Nginx
    ResponderApp -->|HTTPS / WSS| Nginx

    %% Edge to Services
    Nginx -->|Proxy Pass| Core_Services

    %% Core Service Interactions
    TelemetrySvc -->|Publish 50Hz Frames| RedisStream
    RedisStream -->|Stream Consumers| WorkerPool
    WorkerPool -->|Windowed Vector| MLInference
    MLInference -->|Anomaly Score| SafetyFSM
    SafetyFSM -->|State Transitions| EmergencySvc
    EmergencySvc -->|Spatial Proximity| GeofenceSvc

    %% Data Layer
    Core_Services -->|Read/Write Documents| MongoDB
    Core_Services -->|Audit Records| MongoDB
    CopilotSvc -->|External LLM Call| GeminiLLM
    EmergencySvc -->|Outbound Alerts| GovSMS
    Core_Services -->|Prometheus Metrics| Prometheus
    ComplianceSvc -->|Encrypted Storage| ObjectStorage
```

---

## 2. High-Frequency Telemetry Ingestion Pipeline

The telemetry subsystem processes continuous inertial measurement unit (IMU) streams (accelerometer and gyroscope) at 50 Hz from tourist smartphones or wearable devices to detect physical trauma, high-g falls, vehicular impacts, or sudden immobility.

```mermaid
sequenceDiagram
    autonumber
    participant Tourist as Tourist Device (50 Hz IMU)
    participant Edge as Nginx Reverse Proxy
    participant WS as FastAPI WebSocket Bus
    participant Redis as Redis Stream Buffer
    participant Agg as Sliding Window Aggregator
    participant ML as PyTorch Bi-LSTM Engine
    participant FSM as Safety State Machine

    Tourist->>Edge: Stream 50 Hz IMU Telemetry (WSS)
    Edge->>WS: Proxy Stream with Rate Limiter Verification
    WS->>Redis: Ingest Frame into Redis Stream Buffer
    Note over WS,Redis: TTL 120s, Sub-millisecond write latency

    loop Every 1.0 second (Stride)
        Agg->>Redis: Read latest 150 samples (3.0s window)
        Agg->>Agg: Validate Completeness Ratio (>= 0.6)
        Agg->>Agg: Feature Extraction: [ax, ay, az, gx, gy, gz, lin_acc, gyro_mag]
        Agg->>Agg: Robust Median/IQR Scaling
        Agg->>ML: Send 8-channel Feature Tensor [150, 8]
        ML->>ML: Bi-LSTM Autoencoder Reconstruction
        ML->>ML: Compute Mean Absolute Reconstruction Error
        ML->>FSM: Emit Anomaly Score + Kinematic Classification
    end

    alt Anomaly Score >= Threshold (0.85)
        FSM->>FSM: Trigger Transition from WATCH to INCIDENT_CANDIDATE
        FSM-->>Tourist: Push Haptic Confirmation Countdown (30s)
    end
```

### Telemetry Pipeline Mathematical Specifications

- **Sampling Rate ($f_s$)**: 50 Hz (1 frame every 20 ms).
- **Window Size ($W$)**: 150 samples ($T = 3.0$ seconds).
- **Window Stride ($S$)**: 50 samples ($\Delta t = 1.0$ second).
- **Completeness Ratio ($C$)**:
  $$C = \frac{N_{\text{received}}}{W} \ge 0.60$$
- **Magnitude Computations**:
  $$\text{Linear Acceleration Magnitude } = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
  $$\text{Angular Velocity Magnitude } = \sqrt{g_x^2 + g_y^2 + g_z^2}$$

---

## 3. Bi-directional LSTM Autoencoder ML Architecture

The anomaly detection engine relies on a Bi-directional Long Short-Term Memory Autoencoder trained exclusively on normal locomotion kinematics (walking, sitting, climbing stairs, leisurely movement). Anomalies (falls, collisions, collapses) fail reconstruction and yield high reconstruction error.

```mermaid
graph LR
    subgraph Input_Features ["Input Tensor [Batch, 150, 8]"]
        RawIn["8 Feature Channels<br/>50 Hz x 3 seconds"]
    end

    subgraph Encoder ["Bi-directional LSTM Encoder"]
        Enc1["Bi-LSTM Layer 1<br/>Hidden Size: 64 | Dropout: 0.2"]
        Enc2["Bi-LSTM Layer 2<br/>Hidden Size: 32"]
        Latent["Latent Bottleneck Vector<br/>Dimension: 16"]
    end

    subgraph Decoder ["Bi-directional LSTM Decoder"]
        Repeat["Repeat Vector (150 steps)"]
        Dec1["Bi-LSTM Layer 1<br/>Hidden Size: 32"]
        Dec2["Bi-LSTM Layer 2<br/>Hidden Size: 64"]
        TimeDist["TimeDistributed Dense<br/>Output Size: 8"]
    end

    subgraph Output_Scoring ["Reconstruction & Thresholding"]
        Reconstruction["Reconstructed Window [Batch, 150, 8]"]
        LossCalc["Reconstruction Error:<br/>MAE(Input, Output)"]
        Calibrator{"Threshold Check<br/>Normal < 0.40<br/>Warning 0.40 - 0.70<br/>Critical >= 0.85"}
    end

    RawIn --> Enc1 --> Enc2 --> Latent
    Latent --> Repeat --> Dec1 --> Dec2 --> TimeDist --> Reconstruction
    RawIn --> LossCalc
    Reconstruction --> LossCalc
    LossCalc --> Calibrator
```

---

## 4. Safety State Machine (FSM) & Multi-Signal Risk Fusion

TourSafe enforces a formally verified, deterministic 6-state safety lifecycle. Transitions are governed by probabilistic risk fusion combining kinematics, spatial geofencing, itinerary compliance, and weather hazards.

```mermaid
stateDiagram-v2
    [*] --> NORMAL: Tourist Check-in / Credential Active

    NORMAL --> WATCH: Zone Warning / Minor Kinematic Jitter
    WATCH --> NORMAL: Resolved / Normal Telemetry Resumed

    WATCH --> ELEVATED: Geofence Dwell Exceeded OR High Anomaly Score
    ELEVATED --> WATCH: Check-in Acknowledged by Tourist

    ELEVATED --> INCIDENT_CANDIDATE: Severe Anomaly (Fall) OR Danger Zone Breach
    INCIDENT_CANDIDATE --> NORMAL: Tourist Dismisses False Alarm (PIN/Biometric)

    INCIDENT_CANDIDATE --> INCIDENT: 30s Timeout Expired OR Physical SOS Triggered
    NORMAL --> INCIDENT: Manual 1-Touch Emergency SOS Pressed

    INCIDENT --> RECOVERING: First Responders On Scene / Triage Completed
    RECOVERING --> NORMAL: Incident Formally Closed by Authority Commander
    RECOVERING --> [*]: Trip Completed / Credential Expired
```

### Risk Fusion Matrix

$$R_{\text{total}} = w_1 R_{\text{IMU}} + w_2 R_{\text{Geo}} + w_3 R_{\text{Itinerary}} + w_4 R_{\text{Env}}$$

Where weights satisfy $\sum w_i = 1.0$:
- $w_1 = 0.40$ (Kinematic Anomaly Score)
- $w_2 = 0.35$ (Geospatial Danger Level & Dwell Ratio)
- $w_3 = 0.15$ (Itinerary Deviation & Off-Trail Tracking)
- $w_4 = 0.10$ (Environmental Risk / Extreme Weather)

---

## 5. Geospatial Geofence Architecture

TourSafe leverages MongoDB's native `2dsphere` geospatial indexing to perform sub-millisecond point-in-polygon and spherical distance calculations without external GIS engine overhead.

```mermaid
graph TD
    subgraph Geo_Ingest ["Location Ingestion"]
        GPSPayload["Tourist GPS Fix<br/>[Lat, Lng, Accuracy, Altitude]"]
    end

    subgraph Spatial_Index ["MongoDB 2dsphere Spatial Engine"]
        GeoNear["$geoIntersects Query<br/>Matches Active Zone Polygons"]
        ZoneType{"Zone Classification"}
    end

    subgraph Actions ["Policy Execution"]
        Safe["Safe Zone<br/>Nominal Monitoring"]
        Warning["Warning Zone<br/>Reduce Anomaly Threshold<br/>Send Precautionary Alert"]
        Danger["Danger Zone<br/>Transition FSM to ELEVATED<br/>Start Dwell Timer"]
        Restricted["Restricted Zone<br/>Immediate INCIDENT_CANDIDATE<br/>Alert Forest / Police Command"]
    end

    GPSPayload --> GeoNear
    GeoNear --> ZoneType
    ZoneType -->|Safe Polygon| Safe
    ZoneType -->|Warning Polygon| Warning
    ZoneType -->|Danger Polygon| Danger
    ZoneType -->|Restricted Polygon| Restricted
```

---

## 6. Emergency Dispatch & Incident Orchestration Flow

Upon confirmation of an incident, the emergency orchestration engine activates multi-agency dispatch with SLA monitoring.

```mermaid
sequenceDiagram
    autonumber
    participant Tourist as Tourist / FSM
    participant EmerSvc as Emergency Orchestrator
    participant SLA as SLA Escalation Monitor
    participant Geo as Geospatial Router
    participant Resp as Nearest Responder Unit
    participant Auth as Command Center Dashboard

    Tourist->>EmerSvc: Trigger Incident (SOS / Anomaly Confirmed)
    EmerSvc->>EmerSvc: Deduplicate within 10-second Window
    EmerSvc->>Auth: Broadcast Live Incident Event (WebSocket)
    EmerSvc->>SLA: Start SLA Timers (Ack: 60s, Dispatch: 180s)

    EmerSvc->>Geo: Query Available Responders within 15 km
    Geo->>Geo: Calculate Haversine Distance & Terrain ETA
    Geo-->>EmerSvc: Return Ranked Responders (Police, EMT, Rescue)

    EmerSvc->>Resp: Dispatch Tactical Mission Notification
    Resp->>EmerSvc: Acknowledge & Accept Mission (ETA: 8 mins)
    EmerSvc->>SLA: Mark Dispatch SLA Satisfied
    EmerSvc->>Tourist: Broadcast "Responder Assigned & En Route"
    EmerSvc->>Auth: Update Tactical Map with Live Intercept Vector
```

---

## 7. Sovereign Privacy & DPDP Act 2023 Architecture

TourSafe complies with India's Digital Personal Data Protection (DPDP) Act 2023, ISO 27001, and GDPR through purpose-bound consent and immutable audit logging.

```mermaid
graph TB
    subgraph Consent_Layer ["Consent & Identity Vault"]
        UserConsent["Granular Consent Tokens<br/>GPS | IMU | Emergency Broadcast"]
        ConsentRevoke["Consent Revocation Gateway"]
    end

    subgraph DSR_Engine ["Data Subject Rights (DSR) Lifecycle"]
        DSRRequest["Tourist DSR Submission<br/>Portability / Erasure / Correction"]
        LegalHoldCheck{"Active Legal Hold<br/>or Open Incident?"}
        PortabilityBundle["Signed JSON Data Export"]
        PruneService["Cryptographic Shredding"]
    end

    subgraph Retention_Sweep ["Automated Lifecycle Sweeper"]
        RetentionCron["Daily Prune Sweep (02:00 UTC)"]
        TelemetryExpire["Purge IMU telemetry older than 30 days"]
        AuditLedger[("SHA-256 Hash-Chained<br/>Immutable Audit Ledger")]
    end

    UserConsent --> ConsentRevoke
    ConsentRevoke --> DSRRequest
    DSRRequest --> LegalHoldCheck
    LegalHoldCheck -->|No Hold| PortabilityBundle
    LegalHoldCheck -->|No Hold & Expired| PruneService
    LegalHoldCheck -->|Active Incident Hold| AuditLedger

    RetentionCron --> TelemetryExpire
    TelemetryExpire --> AuditLedger
    PruneService --> AuditLedger
```

### Cryptographic Audit Ledger Hash-Chaining

Every administrative decision, dispatch action, or data access event is cryptographically linked to the previous entry:

$$H_n = \text{SHA-256}\left(H_{n-1} \,\|\, T_{\text{timestamp}} \,\|\, \text{ActorID} \,\|\, \text{ActionType} \,\|\, \text{PayloadDigest}\right)$$

Any retroactive tampering in the database breaks the hash chain, immediately alerting the compliance monitoring daemon.

---

## 8. Authority AI Copilot Architecture

The AI Copilot provides operational intelligence to incident commanders while enforcing strict permission boundaries and preventing unauthorized database mutation.

```mermaid
graph LR
    subgraph User_Input ["Authority Commander"]
        AdminQuery["Natural Language Query / SOP Request"]
    end

    subgraph Copilot_Engine ["FastAPI Copilot Orchestrator"]
        PromptGuard["Prompt Injection & Anti-Exfiltration Sanitizer"]
        RAGRetriever["RAG Vector Retriever<br/>SOPs | Emergency Protocols | Contacts"]
        LLM["Gemini 2.0 / OpenAI Model"]
        ToolRegistry["Permission-Aware Tool Registry"]
    end

    subgraph Action_Execution ["Execution Boundary"]
        ActionProposal["Structured Action Proposal<br/>(e.g., DISPATCH_UNIT)"]
        TokenGen["Generate Ephemeral Action Token<br/>(TTL: 300s)"]
        HumanReview{"Commander Explicit<br/>Approval?"}
        ExecuteAction["Execute Command Mutation"]
    end

    AdminQuery --> PromptGuard --> RAGRetriever --> LLM
    LLM --> ToolRegistry --> ActionProposal
    ActionProposal --> TokenGen --> HumanReview
    HumanReview -->|Approved| ExecuteAction
    HumanReview -->|Rejected| PromptGuard
```

---

## 9. Database Model & Schema Architecture

MongoDB stores spatial geometries, telemetry aggregations, and relational incident documents.

```mermaid
erDiagram
    USERS ||--o{ TOURIST_PROFILES : has
    USERS ||--o{ RESPONDERS : operates_as
    TOURIST_PROFILES ||--o{ DIGITAL_CREDENTIALS : holds
    TOURIST_PROFILES ||--o{ INCIDENTS : triggers
    ZONES ||--o{ INCIDENTS : contains
    INCIDENTS ||--o{ DISPATCH_MISSIONS : generates
    RESPONDERS ||--o{ DISPATCH_MISSIONS : assigned_to
    INCIDENTS ||--o{ AUDIT_LOGS : records

    USERS {
        string id PK
        string email
        string password_hash
        string role
        string jurisdiction_id
        boolean is_active
        datetime created_at
    }

    TOURIST_PROFILES {
        string id PK
        string user_id FK
        string full_name
        string phone
        string nationality
        string safety_state
        double safety_score
        object current_location
        object consent_flags
    }

    ZONES {
        string id PK
        string zone_name
        string zone_type
        string risk_level
        polygon geometry
        double anomaly_threshold
        boolean is_active
    }

    INCIDENTS {
        string id PK
        string tourist_id FK
        string zone_id FK
        string severity
        string status
        object telemetry_trigger
        datetime created_at
        datetime resolved_at
    }

    DISPATCH_MISSIONS {
        string id PK
        string incident_id FK
        string responder_id FK
        string mission_status
        double distance_meters
        double eta_minutes
        datetime dispatched_at
    }

    AUDIT_LOGS {
        string id PK
        string prev_hash
        string current_hash
        string actor_id
        string action
        datetime timestamp
    }
```

---

## 10. Security Architecture & Threat Model

| Threat Category | Potential Attack Vector | TourSafe Defense-in-Depth Control |
|:---|:---|:---|
| **Identity Theft** | JWT theft & replay attacks | Refresh token rotation with automatic token family invalidation upon reuse detection. |
| **Credential Compromise**| Password database exfiltration | Argon2id memory-hard password hashing with per-user salt. |
| **Telemetry Spoofing** | Forged 50 Hz kinematic streams | Token-bound WebSocket sessions, jitter window analysis, and anomalous packet drop rate flags. |
| **Spatial Injection** | Malicious GeoJSON polygons | Strict Pydantic V2 GeoJSON polygon validation; coordinate bounding box sanity checks. |
| **SSRF** | Outbound webhook abuse targeting metadata | Anti-SSRF DNS resolution check blocking private IP ranges (`10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`). |
| **Denial of Service** | Telemetry ingestion flooding | Multi-tier sliding window rate limiters (General: 50 req/s, Auth: 5 req/s, Telemetry: 100 req/s). |
| **Network Snooping** | Internal communication eavesdropping | Nginx TLS 1.3 edge termination; internal Docker/K8s network isolation with no external IP on DBs. |

---

## 11. Reliability & Fault Tolerance

1. **Circuit Breakers**: Outbound connections to external LLMs and notification gateways are guarded with circuit breakers (tripping after 5 consecutive failures with 30s half-open reset).
2. **Graceful Degradation**: If Redis Streams experience temporary degradation, telemetry ingestion falls back to local in-process sliding FIFO buffers.
3. **Database Probes**: `/health/liveness` and `/health/readiness` continuously verify MongoDB replica set writeability and Redis socket responsiveness.
4. **Disaster Recovery**: Automated nightly database snapshots with automated restore verification drills (`scripts/backup_restore_drill.py`).
