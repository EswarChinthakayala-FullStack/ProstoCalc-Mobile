# 🖥️ Frontend Documentation: Web Application

> **Stack:** React 18 + Vite + Tailwind CSS + Shadcn/UI + Framer Motion  
> **Path:** `Frontend/`

---

## 🚀 How to Run

```bash
cd Frontend
npm install
npm run dev
```

---

## 📁 Source Structure

```
Frontend/src/
├── App.jsx                    # Root router & providers
├── main.jsx                   # Entry point
├── index.css                  # Global styles
├── App.css                    # App-level styles
├── components/                # Reusable UI components
│   ├── ui/                    # Shadcn/UI primitives (Button, Input, Select, etc.)
│   ├── ClinicianSidebar.jsx   # Clinician navigation sidebar
│   ├── HelperBot.jsx          # Draggable AI helper bot
│   ├── NotificationBell.jsx   # Real-time notification bell
│   ├── RequireAuth.jsx        # Auth guard (role-based)
│   ├── RedirectIfAuthenticated.jsx
│   └── UniversalLoader.jsx    # Loading spinner
├── context/                   # React Context providers
│   ├── AuthContext.jsx        # Authentication state
│   ├── ThemeContext.jsx        # Dark/Light mode
│   ├── SidebarContext.jsx     # Sidebar collapsed state
│   └── NotificationContext.jsx # Notification state
├── hooks/                     # Custom hooks
├── services/                  # API + business logic
│   ├── api.js                 # All API calls (27KB)
│   ├── CostEstimatorService.js # Client-side hybrid estimator
│   └── googleCalendar.js      # Google Calendar integration
├── pages/                     # All route pages (see below)
├── layout/                    # App layout wrapper
├── lib/                       # Utility library (cn, etc.)
├── utils/                     # Helper utilities
├── constants/                 # App-wide constants
└── data/                      # Static data files
```

---

## 🗺️ Complete Route Map

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Marketing landing page |
| `/about` | `AboutPage` | About the platform |

### Authentication Routes (Redirect if logged in)

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `RoleSelectionPage` | Choose role: Clinician or Patient |
| `/signup` | `RoleSelectionPage` | Choose role for signup |
| `/login/clinician` | `LoginPage` | Clinician email/password login |
| `/signup/clinician` | `SignupPage` | Clinician registration |
| `/login/patient` | `PatientLoginPage` | Patient login |
| `/signup/patient` | `PatientSignupPage` | Patient registration |
| `/forgot-password` | `ForgotPassword` | OTP-based password recovery |

### Dashboard (Auto-redirect by role)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `DashboardRedirect` | Redirects to role-specific dashboard |

### Clinician Routes (Protected — role: `dentist`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard/clinician` | `ClinicianDashboard` | Main clinician dashboard |
| `/dashboard/clinician/schedule` | `DentistSchedulePage` | Appointment scheduling |
| `/dashboard/clinician/ai-chat/:sessionId?` | `ClinicianAIChat` | AI-powered clinical chat |
| `/dashboard/clinician/requests` | `RequestManagementPage` | Patient consultation requests |
| `/dashboard/clinician/consultation/:requestId` | `ConsultationHub` | Consultation overview |
| `/dashboard/clinician/consultation/:requestId/chat` | `SecureChat` | Secure doctor-patient chat |
| `/dashboard/clinician/consultation/:requestId/plan` | `TreatmentPlanBuilder` | Treatment plan creation + cost estimation |
| `/dashboard/clinician/consultation/:requestId/timeline` | `ClinicalTimeline` | Treatment progress tracking |
| `/dashboard/clinician/consultation/:requestId/notes` | `MedicalNotes` | Clinical notes manager |
| `/dashboard/clinician/consultation/:requestId/analyzer` | `HabitAnalyzer` | Patient habit/risk analysis |
| `/dashboard/clinician/history` | `ClinicalRegistry` | Past consultation history |
| `/dashboard/clinician/catalog` | `TreatmentSetup` | **Treatment Catalog & Pricing** ⭐ |
| `/dashboard/clinician/estimator` | `PriceEstimatorPage` | **AI Price Intelligence Engine** ⭐ |
| `/dashboard/clinician/odontogram` | `ToothOdontogramPage` | Interactive dental chart |
| `/dashboard/clinician/analytics` | `DentistAnalyticsPage` | Practice analytics & reports |
| `/dashboard/clinician/notifications` | `NotificationsPage` | Notification center |
| `/dashboard/clinician/patient/:patientId` | `PatientPortfolioPage` | Patient portfolio view |
| `/dentist/profile` | `DentistProfilePage` | Clinician profile |
| `/dentist/profile/edit` | `DentistProfileEditPage` | Edit clinician profile |

### Patient Routes (Protected — role: `patient`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard/patient` | `PatientDashboard` | Main patient dashboard |
| `/patient/radar` | `ClinicRadar` | Nearby clinics discovery (GPS-based) |
| `/patient/ai-chat/:sessionId?` | `AIChat` | AI dental assistant chat |
| `/patient/hub` | `PatientHub` | Treatment overview hub |
| `/patient/consultations` | `PatientConsultations` | All consultations list |
| `/patient/consultation/:requestId` | `PatientConsultationOverview` | Consultation details |
| `/patient/consultation/:requestId/chat` | `PatientSecureChat` | Secure chat with dentist |
| `/patient/consultation/:requestId/timeline` | `PatientClinicalTimeline` | Treatment timeline view |
| `/patient/consultation/:requestId/plan` | `PatientTreatmentPlan` | View treatment plan + costs |
| `/patient/consultation/:requestId/notes` | `PatientMedicalNotes` | View medical notes |
| `/patient/trackers` | `HealthTrackers` | All health trackers hub |
| `/patient/mouth-opening` | `MouthOpeningTracker` | Mouth opening measurement log |
| `/patient/therapy` | `ExerciseTraining` | Physiotherapy exercises |
| `/patient/journey` | `ClinicalJourney` | Full clinical journey view |
| `/patient/medication` | `MedicationSchedule` | Medication schedule & reminders |
| `/patient/medication/:medId` | `MedicationDetailPage` | Medication details |
| `/patient/habit-tracker` | `HabitRecoveryTracker` | Tobacco/areca cessation tracker |
| `/patient/profile` | `ProfilePage` | Patient profile |
| `/patient/profile/update` | `ProfileEditPage` | Edit patient profile |
| `/dashboard/patient/notifications` | `NotificationsPage` | Notification center |

### Error

| Route | Component | Description |
|-------|-----------|-------------|
| `*` | `NotFound` | 404 page |

---

## ⭐ Key Pages for the Doctor

### 1. Treatment Catalog (`/dashboard/clinician/catalog`)
- This is where the doctor sets custom prices for each treatment
- Add new treatments, set categories (Prosthodontics, Endodontics, etc.)
- Color-coded cards with enable/disable toggle
- Custom per-dentist pricing overrides global defaults

### 2. Price Intelligence Engine (`/dashboard/clinician/estimator`)
- 6-Algorithm Ensemble: Regression, GBDT, Monte Carlo, Bayesian, KNN, Meta-Learner
- Inputs: Treatment type, units, sessions, complexity, material, patient profile
- Outputs: Predicted cost, confidence score, min/max range, regional market median
- AI-generated clinical justification (LLM layer)
- Health score gauge + escalation risk prediction
- Save to database as training data for future predictions

### 3. Treatment Plan Builder (`/dashboard/clinician/consultation/:requestId/plan`)
- Build multi-item treatment plans per patient
- Auto-calculates total cost from the catalog
- AI explanation generation
- Share cost details & AI justification with patient
- Save as DRAFT or FINAL

---

## 🧠 Client-Side ML: `CostEstimatorService.js` (v5.0 Ensemble)

The frontend runs a **full 6-algorithm ensemble** engine for real-time intelligence:

1. **Regression** — Deterministic baseline with interaction effects.
2. **GBDT** — Boosting model (20 rounds) for complex interactions.
3. **Monte Carlo** — 10,000 randomized simulations per estimate.
4. **Bayesian** — Evidence updates from clinical parameters (Age, Hygiene, Urgency).
5. **KNN** — 7-dimensional similarity matching against 40 historical cases.
6. **Meta-Learner** — Final prediction using trust-weighted voting.

The result includes a **Confidence Score** and **Model Agreement** based on algorithm consensus.
