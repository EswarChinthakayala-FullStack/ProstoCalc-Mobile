# 📱 Mobile App Documentation: iOS (SwiftUI)

> **Stack:** SwiftUI + Swift 5 + Xcode  
> **Path:** `ProstoCalc/` (Xcode project: `ProstoCalc.xcodeproj`)

---

## 📁 App Structure

```
ProstoCalc/
├── ProstoCalcApp.swift              # App entry point
├── ContentView.swift                # Root navigation (role-based routing)
├── RoleSelection.swift              # Clinician vs Patient role picker
│
├── Authentication/
│   ├── ForgotPassword/              # Password recovery views
│   └── IdentityVerification/        # OTP verification views
│
├── OnBoarding/
│   ├── OnboardingView.swift         # Splash onboarding
│   ├── OnboardingStep.swift         # Step model
│   └── OnboardingCard.swift         # Card UI
│
├── Dentist/                         # Clinician-specific views
│   ├── DentistDashboardView.swift   # Main clinician dashboard
│   ├── DentistCostCalculatorView.swift  # ⭐ Core cost estimator
│   ├── AIHybridCostEstimatorView.swift  # Advanced AI estimator
│   ├── AILogHistoryView.swift       # Estimation log history
│   ├── TreatmentCostEditorView.swift    # Treatment catalog editor
│   ├── TreatmentPlanBuilderView.swift   # Treatment plan creation
│   ├── ClinicSetupView.swift        # Clinic profile setup
│   ├── DentistProfileView.swift     # Profile view
│   ├── DentistProfileCompletionView.swift
│   ├── DentistScheduleView.swift    # Appointment scheduler
│   ├── DentistSettingsView.swift    # App settings
│   └── RequestManagementView.swift  # Patient request management
│
├── Patient/                         # Patient-specific views
│   ├── PatientDashboardView.swift   # Main patient dashboard
│   ├── PatientHubView.swift         # Treatment hub
│   ├── PatientTreatmentPlanView.swift   # View treatment plans
│   ├── PatientProfileView.swift     # Profile view
│   ├── PatientProfileCompletionView.swift
│   ├── PatientUpdateProfileView.swift
│   ├── DentistDiscoveryView.swift   # Find nearby dentists
│   ├── NearbyClinicsView.swift      # Clinic map view
│   ├── NearbyClinicsViewModel.swift # Clinic discovery logic
│   ├── ClinicDetailView.swift       # Clinic detail page
│   ├── TimerView.swift              # Physiotherapy timer
│   └── ExerciseTrainerView.swift    # Exercise guide
│
├── Communication/
│   └── SecureChatView.swift         # Doctor-patient secure messaging
│
├── AI/
│   ├── NanobotService.swift         # AI service manager
│   ├── CostExplanationService.swift # Cost explanation logic
│   ├── LlamaEngine.swift           # Llama model interface
│   ├── LlamaBridge.h               # Obj-C bridge header (Llama C++)
│   ├── LlamaBridge.mm              # Obj-C++ bridge implementation
│   ├── OpenELMManager.swift        # OpenELM model manager
│   └── PromptBuilder.swift         # Clinical prompt templates
│
├── Services/
│   ├── APIService.swift            # HTTP API client (all backend calls)
│   ├── CoreMLCostEstimator.swift   # On-device ML cost estimation
│   ├── ExerciseService.swift       # Exercise data service
│   ├── HealthTrackerService.swift  # Health tracking service
│   ├── PDFGeneratorService.swift   # PDF report generation
│   └── ReminderManager.swift       # Local notification reminders
│
├── Models/
│   ├── Clinic.swift                # Clinic data model
│   ├── ExerciseModels.swift        # Exercise data models
│   ├── ToothData.swift             # Dental chart tooth data (all 32 teeth)
│   └── ProstoPlus/                 # Extended models
│
├── Components/
│   ├── ExerciseComponents.swift    # Exercise UI components
│   ├── ConsistencyStreakCard.swift  # Streak display card
│   └── UniversalToast.swift        # Toast notification system
│
├── Views/
│   └── CostExplanationView.swift   # AI explanation display
│
├── Extensions/                     # Swift extensions
├── Utils/                          # Utility helpers
└── Assets.xcassets/                # App icons & assets
```

---

## ⭐ Key Views for the Doctor

### 1. `DentistCostCalculatorView.swift` — Core Cost Estimator
- Select treatment (Extraction, Crown, Implant, CD, RPD, RCT, FMR)
- Adjust units (teeth), sessions, complexity, material grade
- Patient profile sliders (age, hygiene, urgency)
- Real-time cost calculation with variance range
- Syncs clinic-specific pricing from backend
- Premium AI analysis with health score gauge
- Escalation prediction & clinical tips
- PDF report generation for sharing

### 2. `TreatmentCostEditorView.swift` — Treatment Catalog Editor
- View/edit per-treatment pricing
- Add custom treatments
- Color-coded categories
- Enable/disable treatments

### 3. `AIHybridCostEstimatorView.swift` — Advanced AI Estimator
- Advanced hybrid estimation combining multiple ML models
- Detailed cost breakdown visualization

### 4. `SecureChatView.swift` — Doctor-Patient Communication
- Real-time secure messaging
- Embedded treatment plan sharing
- Clinical context during consultations

---

## 🧠 On-Device ML: `CoreMLCostEstimator.swift` (v5.0 Ensemble)

The iOS app runs a high-fidelity **6-algorithm ensemble** for on-device clinical cost intelligence, maintaining parity with the backend:

1. **Regression** — Deterministic baseline with clinical interaction effects.
2. **GBDT** — Simplified boosting model (5 rounds) optimized for mobile.
3. **Monte Carlo** — 500 randomized simulations per estimate.
4. **Bayesian** — Real-time updates from Patient profile sliders (Age, Hygiene, Urgency).
5. **KNN** — 7-dimensional similarity matching against 40 baked-in clinical cases.
6. **Meta-Learner** — Final prediction using confidence-weighted voting.

### Parity Specs
- **Coefficients:** 100% matched with Web/Backend (e.g., High Complexity = 1.35x).
- **Offline Logic:** Runs fully local with no network latency.
- **Engine Version:** Returns `ProstoAI-Ensemble-v5.0`.


---

## 📡 API Integration: `APIService.swift`

The iOS app communicates with the same Express backend as the web app via `APIService.swift`. Key API calls:

- Login/signup (clinician & patient)
- Fetch/update treatment catalog
- Calculate AI cost
- Save estimations
- Consultation management
- Health tracker data sync
- AI chat sessions

---

## 🔔 Native Features

| Feature | Implementation |
|---------|---------------|
| Haptic feedback | `HapticManager` (impact, selection, notification) |
| Local notifications | `ReminderManager` (medication reminders) |
| PDF generation | `PDFGeneratorService` (shareable reports) |
| GPS clinic discovery | `NearbyClinicsViewModel` (CoreLocation) |
| On-device AI | `LlamaEngine` + `OpenELMManager` (local LLM inference) |
