import SwiftUI

struct PlanItem: Identifiable {
    let id = UUID()
    var treatmentId: Int
    var name: String
    var cost: Double
    var toothNumber: String = ""
    var sessions: Int = 1
}

struct TreatmentPlanBuilderView: View {
    let dentistId: Int
    var patientId: Int? = nil
    var patientName: String? = nil
    var dentistName: String? = nil
    var requestId: Int? = nil
    
    @State private var catalog: [[String: Any]] = []
    @State private var selectedItems: [PlanItem] = []
    @State private var clinicalNotes: String = ""
    @State private var aiExplanation: String = ""
    @State private var isGeneratingAI = false
    @State private var shareCosts = true
    @State private var shareAI = true
    @State private var showTreatmentPicker = false
    @State private var showAIEstimator = false
    @State private var isLoading = true
    @State private var showSyncReport = false
    @State private var isSubmitting = false
    @Environment(\.dismiss) var dismiss
    
    var totalCost: Double {
        selectedItems.reduce(0) { $0 + $1.cost }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                DentalBackgroundView(animate: false, isDentist: true)
                
                ScrollView {
                    VStack(spacing: 30) {
                        // 1. Total Header
                        totalHeader
                        
                        // 2. Treatment Items
                        VStack(alignment: .leading, spacing: 15) {
                            Text("PROCEDURE ARCHITECTURE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.5)
                                .foregroundColor(.teal)
                                .padding(.horizontal, 4)
                            
                            if selectedItems.isEmpty {
                                emptyStatePlaceholder
                            } else {
                                ForEach($selectedItems) { $item in
                                    itemRow(item: $item)
                                }
                            }
                            
                            HStack(spacing: 15) {
                                Button(action: { showTreatmentPicker = true }) {
                                    HStack {
                                        Image(systemName: "magnfifyingglass")
                                        Text("Catalog")
                                    }
                                    .font(.system(size: 13, weight: .bold))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.white.opacity(0.8))
                                    .foregroundColor(.teal)
                                    .cornerRadius(12)
                                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.teal.opacity(0.2), lineWidth: 1))
                                }
                                
                                Button(action: { showAIEstimator = true }) {
                                    HStack {
                                        Image(systemName: "sparkles")
                                        Text("AI Engine")
                                    }
                                    .font(.system(size: 13, weight: .bold))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.teal.opacity(0.1))
                                    .foregroundColor(.teal)
                                    .cornerRadius(12)
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        
                        // 3. AI Insight Section
                        aiSection
                        
                        // 4. Governance Section
                        governanceSection
                        
                        Spacer().frame(height: 120)
                    }
                    .padding(.vertical, 20)
                }
                
                // Bottom Submit Button
                VStack {
                    Spacer()
                    Button(action: submitPlan) {
                        HStack {
                            if isSubmitting {
                                ProgressView().tint(.white)
                            } else {
                                Text(requestId == nil ? "GENERATE ESTIMATE" : "FINALIZE & SYNC CASE")
                                Image(systemName: "arrow.right.circle.fill")
                            }
                        }
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(selectedItems.isEmpty ? Color.gray.opacity(0.3) : Color.teal)
                        .cornerRadius(18)
                        .shadow(color: .teal.opacity(0.2), radius: 10, y: 5)
                    }
                    .disabled(selectedItems.isEmpty || isSubmitting)
                    .padding(20)
                    .background(.ultraThinMaterial)
                }
            }
            .navigationTitle("Treatment Design")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")   // ← changed here
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 36, height: 36)
                            .background(Color.white.opacity(0.9))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
                    }
                }
            }
            .fullScreenCover(isPresented: $showTreatmentPicker) {
                procedurePicker
            }
            .fullScreenCover(isPresented: $showAIEstimator) {
                AIHybridCostEstimatorView(dentistId: dentistId, patientName: patientName, dentistName: dentistName) { cost, explanation, treatmentName in
                    selectedItems.append(PlanItem(treatmentId: 0, name: "AI: \(treatmentName)", cost: cost))
                    if !explanation.isEmpty { self.aiExplanation = explanation }
                    showAIEstimator = false
                }
            }
            .fullScreenCover(isPresented: $showSyncReport) {
                CostExplanationView(explanation: aiExplanation)
            }
        }
        .onAppear {
            loadCatalog()
            loadExistingPlan()
        }
    }
    
    private var emptyStatePlaceholder: some View {
        VStack(spacing: 15) {
            Image(systemName: "tray.and.arrow.down")
                .font(.system(size: 30))
                .foregroundColor(.teal.opacity(0.3))
            Text("PROTOCOL PENDING")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.teal)
            Text("Inject procedures from the catalog or use the AI engine to design the clinical journey.")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(Color.teal.opacity(0.03))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [5]))
                .foregroundColor(.teal.opacity(0.2))
        )
    }
    
    private var totalHeader: some View {
        VStack(spacing: 8) {
            Text("TOTAL ESTIMATED INVESTMENT")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.white.opacity(0.7))
            
            Text("₹\(totalCost, specifier: "%.2f")")
                .font(.system(size: 36, weight: .black, design: .rounded))
                .foregroundColor(.white)
            
            if !selectedItems.isEmpty {
                Button(action: generateAIExplanation) {
                    HStack {
                        if isGeneratingAI {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "icloud.and.arrow.down.fill")
                            Text("Cloud Cost Analysis")
                        }
                    }
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(.white)
                    .padding(.horizontal, 15)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.15))
                    .clipShape(Capsule())
                }
                .disabled(isGeneratingAI)
                .padding(.top, 5)
            }
        }
        .padding(30)
        .frame(maxWidth: .infinity)
        .background(LinearGradient(colors: [.teal, .dentalDarkBlue], startPoint: .topLeading, endPoint: .bottomTrailing))
        .cornerRadius(24)
        .padding(.horizontal, 20)
    }
    
    private func itemRow(item: Binding<PlanItem>) -> some View {
        VStack(spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(item.wrappedValue.name.uppercased())
                        .font(.system(size: 13, weight: .black))
                        .tracking(1)
                        .foregroundColor(.dentalDarkBlue)
                    
                    Text(item.wrappedValue.treatmentId == 0 ? "AI PROJECTED DATA" : "DATABASE REGISTERED")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.teal)
                }
                
                Spacer()
                
                Button(action: { selectedItems.removeAll(where: { $0.id == item.wrappedValue.id }) }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.red.opacity(0.4))
                }
            }
            
            HStack(spacing: 20) {
                // Tooth Input
                VStack(alignment: .leading, spacing: 6) {
                    Text("TOOTH NODE")
                        .font(.system(size: 8, weight: .black))
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Image(systemName: "number")
                            .font(.system(size: 10))
                            .foregroundColor(.teal)
                        TextField("00", text: item.toothNumber)
                            .keyboardType(.numberPad)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.1), lineWidth: 1))
                }
                
                // Cost Input
                VStack(alignment: .leading, spacing: 6) {
                    Text("BASE INVESTMENT")
                        .font(.system(size: 8, weight: .black))
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Text("₹")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.teal)
                        TextField("Cost", value: item.cost, format: .number)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.1), lineWidth: 1))
                }
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.95))
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.03), radius: 15, y: 8)
    }
    
    private var aiSection: some View {
        SmartAssistantPanel(context: AssistantContext(
            treatmentName: selectedItems.map { $0.name }.joined(separator: ", "),
            estimatedCost: totalCost,
            numberOfVisits: selectedItems.reduce(0) { $0 + $1.sessions },
            clinicType: "General Practice",
            toothDetails: selectedItems.map { "\($0.name) (Tooth: \($0.toothNumber))" }.joined(separator: "; "),
            userName: dentistName,
            userRole: "dentist"
        ), isCloud: false, isDetailed: true, isDentist: true, assistantMessage: $aiExplanation)
        .padding(.horizontal, 20)
    }
    
    private var governanceSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            Label("CASE GOVERNANCE", systemImage: "shield.checkerboard")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.teal)
            
            VStack(spacing: 15) {
                Toggle(isOn: $shareCosts) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Visible Economics")
                            .font(.system(size: 14, weight: .bold))
                        Text("Allow patient accessibility to cost nodes")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                }
                .tint(.teal)
                
                Divider().background(Color.teal.opacity(0.1))
                
                Toggle(isOn: $shareAI) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Aesthetic Justification")
                            .font(.system(size: 14, weight: .bold))
                        Text("Inject AI clinical logic into patient dossier")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                }
                .tint(.teal)
            }
        }
        .padding(25)
        .background(Color.white.opacity(0.8))
        .cornerRadius(28)
        .padding(.horizontal, 20)
    }
    
    private var procedurePicker: some View {
        ZStack {
            DentalBackgroundView(animate: false, isDentist: true)
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                // Handle
                Capsule()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 40, height: 5)
                    .padding(.top, 12)
                
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("CLINICAL CATALOG")
                            .font(.system(size: 10, weight: .black))
                            .tracking(2)
                            .foregroundColor(.teal)
                        Text("Select Procedure")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                    Button("Done") { showTreatmentPicker = false }
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.teal)
                }
                .padding(.horizontal, 25)
                
                ScrollView {
                    VStack(spacing: 15) {
                        ForEach(catalog.indices, id: \.self) { index in
                            let t = catalog[index]
                            let cost = t["effective_cost"] as? Double ?? 0.0
                            
                            Button(action: {
                                let treatmentId = Int(String(describing: t["id"] ?? "0")) ?? 0
                                selectedItems.append(PlanItem(treatmentId: treatmentId, name: t["name"] as? String ?? "", cost: cost))
                                showTreatmentPicker = false
                                if aiExplanation.isEmpty { generateAIExplanation() }
                            }) {
                                HStack(spacing: 15) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(Color.teal.opacity(0.1))
                                            .frame(width: 48, height: 48)
                                        Image(systemName: "cross.case.fill")
                                            .foregroundColor(.teal)
                                            .font(.system(size: 18))
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(t["name"] as? String ?? "N/A")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundColor(.dentalDarkBlue)
                                        Text(t["category"] as? String ?? "General")
                                            .font(.system(size: 10, weight: .black))
                                            .foregroundColor(.secondary)
                                    }
                                    
                                    Spacer()
                                    
                                    Text("₹\(Int(cost))")
                                        .font(.system(size: 18, weight: .black, design: .rounded))
                                        .foregroundColor(.teal)
                                }
                                .padding(16)
                                .background(Color.white.opacity(0.95))
                                .cornerRadius(18)
                                .shadow(color: .black.opacity(0.02), radius: 10, y: 5)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
        }
    }
    
    private func loadCatalog() {
        APIService.getTreatmentCatalog(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let data) = result {
                    self.catalog = data.filter { ($0["is_enabled"] as? Int ?? 1) == 1 }
                }
            }
        }
    }
    
    private func loadExistingPlan() {
        guard let rid = requestId else { return }
        isLoading = true
        APIService.getTreatmentPlan(requestId: rid) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let data) = result, let plan = data {
                    // Load basic toggles
                    if let sc = plan["share_cost_details"] {
                        self.shareCosts = (String(describing: sc) == "1" || String(describing: sc).lowercased() == "true")
                    }
                    if let sa = plan["share_ai_explanation"] {
                        self.shareAI = (String(describing: sa) == "1" || String(describing: sa).lowercased() == "true")
                    }
                    
                    self.aiExplanation = plan["ai_explanation"] as? String ?? ""
                    self.clinicalNotes = plan["clinical_notes"] as? String ?? ""
                    
                    // Load Items
                    if let itemsArr = plan["items"] as? [[String: Any]] {
                        self.selectedItems = itemsArr.map { i in
                            let tId = Int(String(describing: i["treatment_id"] ?? "0")) ?? 0
                            let costVal = Double(String(describing: i["cost"] ?? "0")) ?? 0.0
                            
                            return PlanItem(
                                treatmentId: tId,
                                name: i["name"] as? String ?? "Procedure",
                                cost: costVal,
                                toothNumber: i["tooth_number"] as? String ?? "",
                                sessions: i["sessions_estimate"] as? Int ?? 1
                            )
                        }
                    }
                }
            }
        }
    }
    
    private func generateAIExplanation() {
        guard !selectedItems.isEmpty else { return }
        isGeneratingAI = true
        
        let procedures = selectedItems.map { "- \($0.name) (Tooth: \($0.toothNumber.isEmpty ? "All" : $0.toothNumber)): ₹\($0.cost)" }.joined(separator: "\n")
        
        let prompt = """
        Task: Senior Dental Clinical Analyst justification.
        Patient Name: \(patientName ?? "Patient")
        Doctor Name: \(dentistName ?? "Doctor")
        
        [PLAN DATA]
        \(procedures)
        Total Estimated Investment: ₹\(totalCost)
        
        [STRICT REQUIREMENTS]
        1. NO MARKDOWN (No **, no #, no -, no *).
        2. NO bold or italics.
        3. Plain text only.
        4. Address the patient by name: \(patientName ?? "Patient").
        5. Explain clinical necessity for each item.
        6. Max 150 words. Professional and unique.
        
        [MANDATORY FOOTER]
        Estimation only. Final clinical judgment determined by the attending surgeon.
        """
        
        APIService.getAICostExplanation(userPrompt: prompt) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let explanation):
                    self.isGeneratingAI = false
                    self.aiExplanation = explanation
                case .failure(let error):
                    print("Cloud AI Error: \(error.localizedDescription) - Attempting On-Device Fallback")
                    // Fallback to On-Device AI
                    OpenELMManager.shared.generateExplanation(prompt: prompt) { localResult in
                        DispatchQueue.main.async {
                            self.isGeneratingAI = false
                            if case .success(let localExp) = localResult {
                                self.aiExplanation = localExp + "\n\n*(Analysis processed locally on-device)*"
                            } else {
                                self.aiExplanation = "Failed to synchronize with clinical justification nodes. Please manually define treatment logic."
                            }
                        }
                    }
                }
            }
        }
    }
    
    private func submitPlan() {
        guard !isSubmitting else { return }
        isSubmitting = true
        
        let payload: [String: Any] = [
            "dentist_id": dentistId,
            "patient_id": patientId ?? 0,
            "request_id": requestId ?? 0,
            "share_cost_details": shareCosts,
            "share_ai_explanation": shareAI,
            "status": "FINAL",
            "ai_explanation": aiExplanation,
            "clinical_notes": clinicalNotes,
            "items": selectedItems.map { i in
                return [
                    "treatment_id": i.treatmentId,
                    "tooth_number": i.toothNumber,
                    "cost": i.cost,
                    "sessions": i.sessions
                ]
            }
        ]
        
        APIService.createTreatmentPlan(data: payload) { result in
            DispatchQueue.main.async {
                if case .success(let resData) = result {
                    // Success: Now log to AI Analytics Tables (Mode B: Approved)
                    let planId = Int(String(describing: resData["plan_id"] ?? "0")) ?? 0
                    let aiText = resData["ai_explanation"] as? String ?? ""
                    
                    self.saveApprovedEstimationLog(planId: planId, explanation: aiText) {
                        self.isSubmitting = false
                        self.dismiss()
                    }
                } else {
                    self.isSubmitting = false
                }
            }
        }
    }
    
    private func saveApprovedEstimationLog(planId: Int, explanation: String, completion: @escaping () -> Void) {
        // Mode B parameters
        let aiPayload: [String: Any] = [
            "user_id": dentistId,
            "patient_id": patientId ?? 0,
            "dentist_id": dentistId,
            "treatment_plan_id": planId,
            "mode": "approved", // Approved Mode
            "total_cost": totalCost,
            "confidence": 1.0, // Approved plans are 100% confident
            "explanation": explanation.isEmpty ? self.aiExplanation : explanation, // Atomic Save
            "language": "en",
            "context": "approved_plan",
            "items": selectedItems.map { i in
                return [
                    "name": i.name,
                    "cost": i.cost,
                    "quantity": 1,
                    "subtotal": i.cost,
                    "source": "dentist_catalog"
                ]
            }
        ]
        
        APIService.saveCostEstimation(data: aiPayload) { result in
            DispatchQueue.main.async {
                if case .success(let estId) = result {
                    print("TreatmentPlan: AI Log Saved (Atomic) for Plan #\(planId), EstID: \(estId)")
                    completion()
                } else {
                    print("TreatmentPlan: Failed to save cost estimation log.")
                    completion() // Dismiss anyway since core plan is saved
                }
            }
        }
    }
}
