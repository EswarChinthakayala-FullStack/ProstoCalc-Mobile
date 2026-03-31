# 📚 ProstoCalc — Project Documentation Hub

> **Project Title:** Chairside Prosthodontic Calculator App with Clinical Decision Support  
> **Audit Date:** March 31, 2026

---

## 📁 Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [Project Audit & Requirements](project_audit.md) | Full audit of the project against the doctor's requirements |
| 2 | [Frontend (Web)](frontend.md) | All frontend routes, pages, services, and architecture |
| 3 | [Backend (Server)](backend.md) | All API endpoints, database schema, and business logic |
| 4 | [Mobile App (iOS)](mobile_ios.md) | iOS app architecture, views, and services |
| 5 | [AI & Machine Learning](ai_ml.md) | AI/ML engines, LLM integration, and clinical intelligence |
| 6 | [**Estimation Algorithms**](algorithms.md) | **6 advanced algorithms: GBDT, Monte Carlo, Bayesian, KNN, Ensemble** |
| 7 | [Changes Needed](changes_needed.md) | Recommended improvements and fixes |

---

## ✅ Quick Verdict

**The project MEETS the doctor's core requirement** of being a "Chairside Prosthodontic Calculator App with Clinical Decision Support." It goes beyond a simple calculator — it is a full-featured clinical practice management platform with:

- ✅ Hybrid AI-powered cost estimation (Random Forest + Regression)
- ✅ Treatment catalog with per-dentist custom pricing
- ✅ AI-generated clinical justifications (LLM)
- ✅ Patient management, consultations, and scheduling
- ✅ Health tracking (Mouth Opening, Medication, Exercise, Habit Recovery)
- ✅ iOS and Web applications
- ⚠️ Default base costs in code don't match the doctor's values (see [Changes Needed](changes_needed.md))

---

## 🦷 Doctor's Provided Values

| Treatment | Doctor's Cost (₹) |
|-----------|-------------------|
| Extraction | Free (₹0) |
| Crown | ₹1,300 |
| Implant | ₹2,500 |
| CD (Complete Denture) | ₹1,400 |
| RPD (Removable Partial Denture) | ₹60 |
| RCT (Root Canal Treatment) | ₹420 |
| FMR (Full Mouth Rehabilitation) | Approx ₹40,000–50,000 |
