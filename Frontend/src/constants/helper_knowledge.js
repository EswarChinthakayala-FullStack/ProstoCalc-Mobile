/**
 * Prosto AI Helper: Project Knowledge & Navigation Context
 */
export const PROJECT_CONTEXT = {
    name: "ProstoCalc",
    description: "An advanced Clinical Dental Decision Support System (CDSS) and Patient Engagement Hub. It helps dentists create accurate treatment plans using AI and allows patients to track their recovery journey.",
    mission: "To bridge the gap between complex dental clinical data and patient understanding through transparent AI-driven insights.",
    
    // Feature Mapping for Bot Responses
    features: {
        cost_estimation: "Uses AI (Ollama/Mistral) to predict treatment costs based on complexity, materials, and clinical standards.",
        treatment_planning: "Allows dentists to build multi-visit plans and share them securely with patients.",
        habit_analysis: "Uses AI to detect and analyze oral habits like bruxism or smoking patterns from patient logs.",
        exercise_training: "Interactive mouth-opening and jaw calibration exercises with progress tracking.",
        clinic_radar: "Finds the nearest verified dental clinics based on live GPS location."
    },

    // Navigation Mapping for "Take me to..." queries
    navigation: [
        { keywords: ["radar", "find clinic", "map", "nearby"], path: "/patient/radar", label: "Clinic Radar", role: "patient" },
        { keywords: ["chat", "ai", "ask"], path: "/patient/ai-chat", label: "AI Consultation", role: "patient" },
        { keywords: ["track", "vitals", "health", "history"], path: "/patient/trackers", label: "Health Trackers", role: "patient" },
        { keywords: ["exercise", "mouth", "opening", "jaw"], path: "/patient/mouth-opening", label: "Jaw Calibration", role: "patient" },
        { keywords: ["appointment", "requests", "consultation"], path: "/dashboard/clinician/requests", label: "Request Manager", role: "dentist" },
        { keywords: ["estimate", "price", "calculator"], path: "/dashboard/clinician/estimator", label: "Price Estimator", role: "dentist" },
        { keywords: ["analytics", "revenue", "reports"], path: "/dashboard/clinician/analytics", label: "Practice Analytics", role: "dentist" },
        { keywords: ["catalog", "treatments", "prices"], path: "/dashboard/clinician/catalog", label: "Treatment Catalog", role: "dentist" }
    ]
};
