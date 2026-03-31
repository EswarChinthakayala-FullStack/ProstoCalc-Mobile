# ⚙️ Backend Documentation: Server & API

> **Stack:** Node.js + Express.js + MySQL (MariaDB)  
> **Path:** `server/`

---

## 🚀 How to Run

```bash
cd server
npm install
node index.js
```

Default port: **3000** (configurable via `.env`)

---

## 📁 Server Structure

```
server/
├── index.js                    # Main entry point (Express setup)
├── db.js                       # MySQL connection pool
├── .env                        # Environment variables
├── package.json
├── routes/
│   ├── auth.js                 # Authentication (login, signup, OTP, password reset)
│   ├── treatment.js            # Treatment catalog, cost estimations, treatment plans
│   ├── consultation.js         # Consultation requests, appointments, scheduling
│   ├── clinic.js               # Clinic registration, dentist discovery, profiles
│   ├── chat.js                 # Secure doctor-patient messaging
│   ├── engagement.js           # User activity streaks & engagement
│   ├── exercise.js             # Physiotherapy exercises & logs
│   ├── habit_risk.js           # Habit risk analysis (OSMF screening)
│   ├── health_trackers.js      # Mouth opening, medication, streaks
│   ├── ai.js                   # AI chat sessions
│   ├── ai_proxy.js             # AI server proxy (Llama/TinyLlama relay)
│   └── web/                    # Web-specific routes
│       ├── dashboard.js        # Web dashboard data
│       ├── reports.js          # PDF report generation
│       ├── ai.js               # Web AI integrations
│       ├── treatment.js        # Web treatment APIs
│       ├── medications.js      # Web medication management
│       ├── analytics.js        # Web analytics
│       ├── health.js           # Web health tracker data
│       └── pdf_generator.js    # PDF generation service
├── utils/
│   └── ai.js                   # AI utility functions
└── test_*.js                   # Various test scripts
```

---

## 🔗 API Route Map

### Route Mounting (`index.js`)

| Mount Path | Route File | Scope |
|------------|------------|-------|
| `/` | `auth.js` | Authentication |
| `/` | `treatment.js` | Treatment catalog & cost |
| `/` | `consultation.js` | Consultations & appointments |
| `/` | `clinic.js` | Clinic profiles & discovery |
| `/` | `engagement.js` | User engagement |
| `/` | `chat.js` | Secure messaging |
| `/` | `habit_risk.js` | OSMF risk analysis |
| `/` | `exercise.js` | Exercise tracking |
| `/` | `health_trackers.js` | Health tracking |
| `/ai` | `ai.js` | AI chat |
| `/api` | `ai_proxy.js` | AI server proxy |
| `/web` | `web/*.js` | Web-specific routes |

---

### Authentication APIs (`routes/auth.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Clinician login (email + password) |
| POST | `/signup` | Clinician registration |
| POST | `/patient/login` | Patient login |
| POST | `/patient/signup` | Patient registration |
| POST | `/forgot-password` | Send OTP for password reset |
| POST | `/verify-otp` | Verify OTP code |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/send-verification-otp` | Email verification OTP |
| POST | `/verify-email-otp` | Verify email OTP |

---

### Treatment & Cost APIs (`routes/treatment.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get_treatment_catalog` | Get treatment catalog with dentist overrides |
| POST | `/update_treatment_costs` | Bulk update/create treatments & dentist pricing |
| POST | `/update_color_tag` | Update treatment color tag |
| POST | `/calculate_ai_cost` | **Core: AI-powered cost calculation** ⭐ |
| POST | `/save_cost_estimation` | Save estimation to database (atomic transaction) |
| GET | `/get_ai_cost_logs` | Fetch estimation history for a dentist |
| POST | `/save_ai_explanation` | Save AI-generated explanation text |
| POST | `/create_treatment_plan` | Create/update multi-item treatment plan |
| GET | `/get_treatment_plan` | Fetch treatment plan + items + appointments |
| POST | `/update_timeline` | Update treatment timeline status |
| GET | `/get_timeline` | Fetch treatment timeline entries |
| POST | `/update_plan_notes` | Update clinical notes on a plan |

---

### Consultation APIs (`routes/consultation.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request_consultation` | Patient requests consultation |
| GET | `/get_requests` | Get consultation requests for a dentist |
| POST | `/respond_request` | Accept/reject consultation request |
| GET | `/get_patient_requests` | Get patient's consultation requests |
| POST | `/schedule_appointment` | Schedule an appointment |
| GET | `/get_appointments` | Get appointments for a dentist |
| POST | `/update_appointment_status` | Update visit status |
| POST | `/reschedule_appointment` | Reschedule with reason |

---

### Health & Tracking APIs

| Route File | Key Endpoints |
|------------|---------------|
| `health_trackers.js` | Mouth opening logs, medication CRUD, medication adherence, streaks |
| `exercise.js` | Exercise library, workout logs, AI insights |
| `habit_risk.js` | OSMF risk analysis, behavior logs, relapse events |
| `engagement.js` | Activity streak tracking |

---

## 💾 Database Schema (`prostocalc_db.sql`)

### Core Tables (30+ tables)

| Table | Purpose |
|-------|---------|
| `dentists` | Clinician accounts |
| `patients` | Patient accounts |
| `dentist_profiles` | Extended clinician data |
| `patient_profiles` | Extended patient data |
| `treatment_catalog` | Global treatment definitions |
| `dentist_treatment_costs` | Per-dentist cost overrides |
| `treatment_plans` | Treatment plans with cost sharing |
| `treatment_plan_items` | Individual items in a plan |
| `treatment_timeline` | Treatment progress milestones |
| `ai_cost_estimations` | AI cost estimation logs |
| `ai_cost_estimation_items` | Individual items in estimations |
| `ai_treatment_explanations` | AI-generated justification text |
| `ai_chats` / `ai_chat_sessions` | AI chat history |
| `consultation_requests` | Patient consultation requests |
| `appointments` | Scheduled appointments |
| `appointment_status_history` | Appointment audit trail |
| `chats` / `messages` | Secure messaging |
| `medications` / `medication_logs` | Medication tracking |
| `mouth_opening_logs` | Mouth opening measurements |
| `exercises` / `exercise_logs` | Exercise tracking |
| `habit_risk_analysis` | OSMF risk assessments |
| `habit_reduction_logs` | Tobacco/areca cessation logs |
| `health_streaks` | Streak tracking |
| `notifications` | In-app notifications |
| `password_resets` | OTP storage |
| `refresh_tokens` | JWT refresh tokens |
| `dentist_schedule_slots` | Available appointment slots |

### Treatment Catalog Categories

```sql
ENUM('GENERAL', 'SURGERY', 'PROSTHODONTICS', 'ENDODONTICS', 'ORTHODONTICS', 'PEDODONTICS')
```

---

## 🧠 AI Cost Calculation Flow (`/calculate_ai_cost`)

The backend mirrors the full 6-algorithm ensemble from the clinical intelligence engine:

1.  **Algorithm 1: Multivariate Regression** — Baseline with interaction effects.
2.  **Algorithm 2: GBDT** — Boosting model (5 rounds) for complex interactions.
3.  **Algorithm 3: Monte Carlo** — 1,000 randomized simulations (server-optimized).
4.  **Algorithm 4: Bayesian Inference** — Evidence updates from Age, Hygiene, Urgency.
5.  **Algorithm 5: KNN Regression** — Matching against 40 historical simulation cases.
6.  **Algorithm 6: Weighted Meta-Learner** — Final prediction using confidence-weighted voting.

### Clinical Parameters (Synced v5.0)
- **Complexity Multipliers:** Low (0.85x), Medium (1.0x), High (1.35x)
- **Material Multipliers:** Standard (1.0x), Premium (1.25x), Biocompatible (1.55x)
- **Volume Discount:** 5% discount per unit (max 25%).
- **Interaction Effect:** Synergistic multiplier for high-complexity premium materials.

### Response Data
The endpoint returns a detailed calculation payload including:
- `base_cost`, `gst`, `total_cost`
- `min_range`, `max_range`
- `confidence_score` & `model_agreement`
- `regional_market_median`
- `algorithm_breakdown` (List of individual algorithm predictions & weights)
- `clinical_justification` (AI-generated report) 
- `engine_version` ("ProstoAI-Ensemble-v5.0")

