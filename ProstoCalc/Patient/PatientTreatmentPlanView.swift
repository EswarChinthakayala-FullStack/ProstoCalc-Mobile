import SwiftUI

struct PatientTreatmentPlanView: View {
    let planData: [String: Any]
    @Environment(\.dismiss) var dismiss
    @State private var onDeviceExplanation: String = ""
    @State private var isGeneratingOnDevice = false
    @State private var showOnDeviceReport = false
    @State private var showSyncReport = false
    
    var items: [[String: Any]] {
        planData["items"] as? [[String: Any]] ?? []
    }
    
    var aiExplanation: String {
        planData["ai_explanation"] as? String ?? ""
    }
    
    var shareAI: Bool {
        guard let val = planData["share_ai_explanation"] else { return true }
        let str = String(describing: val).lowercased()
        return str == "1" || str == "true"
    }
    
    var shareCosts: Bool {
        guard let val = planData["share_cost_details"] else { return true }
        let str = String(describing: val).lowercased()
        return str == "1" || str == "true"
    }
    

    
    var body: some View {
        NavigationStack {
            ZStack {
                DentalBackgroundView(animate: false, isDentist: false)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        // Header Card
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .cyan.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 80, height: 80)
                                Image(systemName: "clipboard.fill")
                                    .font(.system(size: 30))
                                    .foregroundColor(.blue)
                            }
                            
                            VStack(spacing: 5) {
                                Text("OFFICIAL TREATMENT DESIGN")
                                    .font(.system(size: 10, weight: .black))
                                    .tracking(2)
                                    .foregroundColor(.gray)
                                
                                Text("₹\(totalCost, specifier: "%.2f")")
                                    .font(.system(size: 44, weight: .black, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Button(action: runOnDeviceAI) {
                                    HStack {
                                        if isGeneratingOnDevice {
                                            ProgressView().scaleEffect(0.8)
                                        } else {
                                            Image(systemName: "cpu.fill")
                                            Text("Generate Neural Report")
                                        }
                                    }
                                    .font(.system(size: 11, weight: .black))
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 15)
                                    .padding(.vertical, 8)
                                    .background(Color.blue.opacity(0.08))
                                    .clipShape(Capsule())
                                }
                                .disabled(isGeneratingOnDevice)
                            }
                        }
                        .padding(.top, 30)
                        
                        // AI Case Analysis
                        if shareAI && !aiExplanation.isEmpty {
                            VStack(alignment: .leading, spacing: 20) {
                                HStack {
                                    Label("AI CASE ANALYSIS", systemImage: "sparkles")
                                        .font(.system(size: 12, weight: .black))
                                        .foregroundColor(.blue)
                                    Spacer()
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundColor(.blue)
                                }
                                
                                VStack(alignment: .leading, spacing: 12) {
                                    ScrollView {
                                        Text(LocalizedStringKey(aiExplanation))
                                            .font(.system(size: 14, weight: .medium))
                                            .lineSpacing(4)
                                            .foregroundColor(.dentalDarkBlue)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                    }
                                    .frame(maxHeight: 150)
                                    
                                    Button(action: { showSyncReport = true }) {
                                        HStack {
                                            Image(systemName: "doc.plaintext.fill")
                                            Text("Review Official Report")
                                        }
                                        .font(.system(size: 11, weight: .black))
                                        .foregroundColor(.blue)
                                        .padding(.vertical, 10)
                                        .padding(.horizontal, 18)
                                        .background(Color.blue.opacity(0.1))
                                        .cornerRadius(12)
                                    }
                                }
                            }
                            .padding(25)
                            .background(Color.white.opacity(0.6))
                            .cornerRadius(28)
                            .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.blue.opacity(0.1), lineWidth: 1))
                            .padding(.horizontal, 20)
                        }

                        // Clinical Provider Notes
                        if let notes = planData["clinical_notes"] as? String, !notes.isEmpty {
                            VStack(alignment: .leading, spacing: 15) {
                                Label("CLINICAL NOTES", systemImage: "note.text")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.teal)
                                
                                Text(notes)
                                    .font(.system(size: 14, weight: .medium))
                                    .lineSpacing(4)
                                    .foregroundColor(.dentalDarkBlue)
                                    .italic()
                            }
                            .padding(25)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.teal.opacity(0.05))
                            .cornerRadius(20)
                            .padding(.horizontal, 20)
                        }
                        
                        // Procedures List
                        VStack(alignment: .leading, spacing: 20) {
                            Text("PROCEDURE ARCHITECTURE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 25)
                            
                            if items.isEmpty {
                                VStack(spacing: 15) {
                                    Image(systemName: "exclamationmark.triangle")
                                        .font(.system(size: 24))
                                        .foregroundColor(.orange)
                                    Text("No Active Treatment Design")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.secondary)
                                    Text("Your clinician has not finalized your digital dossier yet.")
                                        .font(.system(size: 11))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(30)
                                .background(Color.white.opacity(0.4))
                                .cornerRadius(20)
                                .padding(.horizontal, 20)
                            } else {
                                VStack(spacing: 15) {
                                    ForEach(0..<items.count, id: \.self) { index in
                                        procedureRow(items[index])
                                    }
                                }
                                .padding(.horizontal, 20)
                            }
                        }
                        
                        // Schedule Info
                        if let date = planData["scheduled_date"] as? String, !date.isEmpty {
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundColor(.blue)
                                let time = planData["scheduled_time"] as? String ?? ""
                                Text("Scheduled: \(date.formattedDate()) \(time.formattedTime())")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.dentalDarkBlue)
                            }
                            .padding(.vertical, 10)
                        }
                        
                        // On-Device AI Analysis (Nanobot)
                        VStack(alignment: .leading, spacing: 15) {
                            Text("NANOBOT ON-DEVICE ANALYSIS")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 25)
                            
                            SmartAssistantPanel(
                                context: AssistantContext(
                                    treatmentName: items.map { $0["name"] as? String ?? "" }.joined(separator: ", "),
                                    estimatedCost: totalCost,
                                    numberOfVisits: items.reduce(0) { $0 + (Int(String(describing: $1["sessions_estimate"] ?? "1")) ?? 1) },
                                    clinicType: "Patient Mode",
                                    toothDetails: items.map { "\($0["name"] as? String ?? "Procedure") (Tooth: \($0["tooth_number"] as? String ?? "N/A"))" }.joined(separator: "; ")
                                ),
                                isCloud: false,
                                assistantMessage: $onDeviceExplanation 
                            )
                            .padding(.horizontal, 20)
                        }

                        // Disclaimer
                        VStack(spacing: 8) {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.gray.opacity(0.3))
                            Text("This plan is generating based on current clinical findings. Final cost may vary based on surgical complexity and material upgrades requested during the procedure.")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.horizontal, 40)
                        .padding(.top, 20)
                        
                        Spacer().frame(height: 50)
                    }
                }
            }
            .navigationTitle("Treatment Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .font(.system(size: 16, weight: .bold))
                }
            }
        }
        .sheet(isPresented: $showOnDeviceReport) {
            CostExplanationView(explanation: onDeviceExplanation)
        }
        .sheet(isPresented: $showSyncReport) {
            CostExplanationView(explanation: aiExplanation)
        }
    }
    
    var totalCost: Double {
        items.reduce(0.0) { sum, item in
            let costStr = String(describing: item["cost"] ?? "0")
            let costVal = Double(costStr) ?? 0.0
            return sum + costVal
        }
    }
    
    private func procedureRow(_ item: [String: Any]) -> some View {
        HStack(spacing: 15) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.blue.opacity(0.05))
                    .frame(width: 44, height: 44)
                Text(String(describing: item["tooth_number"] ?? "N/A").prefix(2))
                    .font(.system(size: 14, weight: .black))
                    .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item["name"] as? String ?? "Clinical Procedure")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.dentalDarkBlue)
                
                Text("\(item["sessions_estimate"] ?? "1") Sessions")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if shareCosts {
                Text("₹\(Double(String(describing: item["cost"] ?? "0")) ?? 0.0, specifier: "%.0f")")
                    .font(.system(size: 16, weight: .black))
                    .foregroundColor(.dentalDarkBlue)
            }
        }
        .padding(18)
        .background(Color.white.opacity(0.8))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.02), radius: 8, y: 4)
    }
    
    private func runOnDeviceAI() {
        let planItems = items.map { i in
            return PlanItem(
                treatmentId: i["treatment_id"] as? Int ?? 0,
                name: i["name"] as? String ?? "Procedure",
                cost: Double(String(describing: i["cost"] ?? "0")) ?? 0.0,
                toothNumber: i["tooth_number"] as? String ?? "",
                sessions: i["sessions_estimate"] as? Int ?? 1
            )
        }
        
        isGeneratingOnDevice = true
        CostExplanationService.shared.explain(items: planItems, total: totalCost) { result in
            DispatchQueue.main.async {
                isGeneratingOnDevice = false
                if case .success(let explanation) = result {
                    self.onDeviceExplanation = explanation
                    self.showOnDeviceReport = true
                }
            }
        }
    }
}
