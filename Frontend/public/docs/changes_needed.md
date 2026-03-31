# 🔧 Changes Needed

> Based on the audit comparing the project against the doctor's requirements.

---

## ⚠️ Priority 1: Update Default Base Costs

**File:** `Frontend/src/services/CostEstimatorService.js` (lines 25–35)

The hardcoded default prices should be updated to match the doctor's values:

```diff
 this.defaultBaseCosts = {
-  "Extraction": 800,
-  "Crown": 5500,
-  "Implant": 35000,
-  "CD": 40000,
-  "RPD": 18000,
-  "RCT": 4500,
-  "FMR": 120000,
-  "Scaling": 1200,
-  "Filling": 1500
+  "Extraction": 0,       // Doctor: Free
+  "Crown": 1300,         // Doctor: ₹1,300
+  "Implant": 2500,       // Doctor: ₹2,500
+  "CD": 1400,            // Doctor: ₹1,400
+  "RPD": 60,             // Doctor: ₹60
+  "RCT": 420,            // Doctor: ₹420
+  "FMR": 45000,          // Doctor: Approx ₹40-50k (using midpoint)
+  "Scaling": 1200,       // Keep existing (not specified by doctor)
+  "Filling": 1500        // Keep existing (not specified by doctor)
 };
```

> **Note:** These are fallback defaults only. The Treatment Catalog (`/dashboard/clinician/catalog`) allows the doctor to set custom per-clinic pricing that overrides these defaults. However, matching the defaults ensures the first-use experience is accurate.

---

## ⚠️ Priority 2: Seed Treatment Catalog in Database

The `prostocalc_db.sql` has **no seed data** for the `treatment_catalog` table. The doctor should either:

**Option A:** Manually add treatments via the Treatment Catalog UI (`/dashboard/clinician/catalog`)

**Option B:** Add INSERT statements to the SQL dump:

```sql
INSERT INTO `treatment_catalog` (`name`, `category`, `default_cost`, `color_tag`) VALUES
('Extraction', 'SURGERY', 0.00, '#f43f5e'),
('Crown', 'PROSTHODONTICS', 1300.00, '#F59E0B'),
('Implant', 'PROSTHODONTICS', 2500.00, '#6366F1'),
('Complete Denture (CD)', 'PROSTHODONTICS', 1400.00, '#0D9488'),
('Removable Partial Denture (RPD)', 'PROSTHODONTICS', 60.00, '#3b82f6'),
('Root Canal Treatment (RCT)', 'ENDODONTICS', 420.00, '#22c55e'),
('Full Mouth Rehabilitation (FMR)', 'PROSTHODONTICS', 45000.00, '#8b5cf6'),
('Scaling', 'GENERAL', 1200.00, '#0D9488'),
('Filling', 'GENERAL', 1500.00, '#10b981');
```

---

## 💡 Priority 3: Minor Improvements (Optional)

### A. iOS Default Values
**File:** `ProstoCalc/Services/CoreMLCostEstimator.swift`

The iOS app likely has its own default costs that should also be updated to match the doctor's values.

### B. "Extraction = Free" Handling
When Extraction is ₹0 (free), the system should handle the zero-cost gracefully:
- Don't show ₹0 as a confusing cost
- Label it as "Complimentary" or "Included" in the UI
- Prevent division-by-zero in ML calculations that use base cost

### C. RPD Pricing Confirmation
The doctor specified RPD = ₹60, which is extremely low compared to industry standards (typically ₹5,000–25,000). This should be confirmed with the doctor:
- Is ₹60 the per-unit cost for a single clasp/component?
- Or is it a different pricing model?

### D. FMR Range Support
The doctor specified FMR as "Approx ₹40-50k" (a range). Currently, the system only stores a single default cost. Consider:
- Using the midpoint (₹45,000) as default
- Adding a `min_cost` and `max_cost` to the treatment catalog for range-based treatments

---

## ✅ No Changes Required For

| Feature | Status |
|---------|--------|
| Treatment selection (all 7 types) | ✅ Already includes all |
| Clinical Decision Support | ✅ Fully implemented |
| AI cost justification | ✅ Working |
| Per-dentist custom pricing | ✅ Catalog system in place |
| Health monitoring modules | ✅ Complete |
| Authentication system | ✅ Working with OTP |
| iOS mobile app | ✅ Feature-complete |
| Web responsive app | ✅ Working |
