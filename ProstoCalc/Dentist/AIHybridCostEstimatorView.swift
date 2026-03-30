import SwiftUI
import Foundation

struct AIHybridCostEstimatorView: View {
    let dentistId: Int
    var patientName: String? = nil
    var dentistName: String? = nil
    
    @State private var treatmentType = "Extraction"
    @State private var treatments: [String] = []
    @State private var teethCount = 1
    @State private var sessions = 1
    @State private var complexity: CoreMLCostEstimator.TreatmentComplexity = .medium
    @State private var material: CoreMLCostEstimator.MaterialType = .standard
    
    @State private var estimation: CoreMLCostEstimator.EstimationResult?
    @State private var aiExplanation = ""
    @State private var isCalculatingServer = false
    @State private var isEstimatingLocal = false
    @State private var customCosts: [String: Double] = [:]
    @State private var isLoadingCosts = true
    
    var onAddPlan: (Double, String, String) -> Void // cost, explanation, treatmentName
    
    var body: some View {
        ZStack {
            // Assuming this is your custom background
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    headerSection
                    
                    if let est = estimation {
                        premiumEstimationCard(est)
                    }
                    
                    clinicalParameterSection
                    complexitySection
                    
                    serverAIActionSection
                    
                    if !aiExplanation.isEmpty {
                        clinicalJustificationCard
                    }
                    
                    injectButtonSection
                }
                .padding(.vertical, 20)
            }
        }
        .onAppear(perform: loadData)
        // Trigger background estimation when parameters change
        .onChange(of: treatmentType) { _ in updateEstimationAsync() }
        .onChange(of: teethCount) { _ in updateEstimationAsync() }
        .onChange(of: sessions) { _ in updateEstimationAsync() }
        .onChange(of: complexity) { _ in updateEstimationAsync() }
        .onChange(of: material) { _ in updateEstimationAsync() }
    }
    
    // MARK: - View Components
    
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text("NANOBOT ON-DEVICE AI")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(2)
                    .foregroundColor(.teal)
                
                Text("Hybrid Engine")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(Color("DentalDarkBlue", bundle: nil)) // Use your hex or asset here
            }
            Spacer()
            ZStack {
                Circle().fill(Color.teal.opacity(0.12)).frame(width: 48, height: 48)
                Image(systemName: "cpu.fill").font(.title3).foregroundColor(.teal)
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 10)
    }
    
    private var clinicalParameterSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Label("CLINICAL PARAMETERS", systemImage: "list.clipboard.fill")
                .font(.system(size: 12, weight: .black))
                .foregroundColor(.secondary)
                .padding(.horizontal, 4)
            
            VStack(spacing: 0) {
                // Procedure Picker (FIXED RESPONSIVENESS)
                HStack {
                    Text("Procedure")
                        .font(.system(size: 16, weight: .semibold))
                    
                    Spacer(minLength: 16)
                    
                    if treatments.isEmpty {
                        ProgressView().scaleEffect(0.8)
                    } else {
                        Menu {
                            ForEach(treatments, id: \.self) { treatment in
                                Button(action: {
                                    self.treatmentType = treatment
                                }) {
                                    Text(treatment)
                                }
                            }
                        } label: {
                            HStack(spacing: 6) {
                                Text(treatmentType)
                                    .font(.system(size: 15, weight: .semibold))
                                    .lineLimit(1) // Prevents multi-line wrapping
                                    .minimumScaleFactor(0.6) // Dynamically shrinks long text
                                    .truncationMode(.tail)
                                
                                Image(systemName: "chevron.up.chevron.down")
                                    .font(.system(size: 11, weight: .bold))
                            }
                            .foregroundColor(.teal)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color.teal.opacity(0.12))
                            .cornerRadius(10)
                        }
                    }
                }
                .padding(.vertical, 12)
                
                Divider().opacity(0.5)
                
                // Units Stepper
                Stepper(value: $teethCount, in: 1...32) {
                    HStack {
                        Text("Units / Teeth")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                        Text("\(teethCount)")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.teal)
                            .padding(.trailing, 8)
                    }
                }
                .padding(.vertical, 14)
                
                Divider().opacity(0.5)
                
                // Sessions Stepper
                Stepper(value: $sessions, in: 1...10) {
                    HStack {
                        Text("Expected Sessions")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                        Text("\(sessions)")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.teal)
                            .padding(.trailing, 8)
                    }
                }
                .padding(.vertical, 14)
            }
            .modifier(CardStyleModifier())
        }
        .padding(.horizontal, 24)
    }
    
    private var complexitySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Label("COMPLEXITY & MATERIAL", systemImage: "cube.transparent.fill")
                .font(.system(size: 12, weight: .black))
                .foregroundColor(.secondary)
                .padding(.horizontal, 4)
            
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Bio-Complexity Level")
                        .font(.system(size: 14, weight: .semibold))
                    
                    Picker("Complexity", selection: $complexity) {
                        ForEach(CoreMLCostEstimator.TreatmentComplexity.allCases, id: \.self) {
                            Text($0.rawValue).tag($0)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Material Classification")
                        .font(.system(size: 14, weight: .semibold))
                    
                    Picker("Material", selection: $material) {
                        ForEach(CoreMLCostEstimator.MaterialType.allCases, id: \.self) {
                            Text($0.rawValue).tag($0)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }
            .modifier(CardStyleModifier())
        }
        .padding(.horizontal, 24)
    }
    
    private func premiumEstimationCard(_ est: CoreMLCostEstimator.EstimationResult) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(est.engineVersion?.uppercased() ?? "ON-DEVICE PREDICTION")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1.2)
                        .foregroundColor(.teal)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("₹")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.teal)
                        Text("\(Int(est.baseCost))")
                            .font(.system(size: 42, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                    }
                }
                Spacer()
                
                if isEstimatingLocal {
                    ProgressView()
                        .frame(width: 44, height: 44)
                } else {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.teal)
                }
            }
            
            Divider().opacity(0.5)
            
            // Metrics Section
            HStack(alignment: .top, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("CONFIDENCE")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Text("\(Int(est.confidenceScore * 100))%")
                            .font(.system(size: 18, weight: .black))
                            .foregroundColor(.teal)
                        
                        ProgressView(value: est.confidenceScore)
                            .tint(.teal)
                            .frame(maxWidth: 80)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("PROJECTED RANGE")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                    
                    Text("₹\(Int(est.minRange)) – ₹\(Int(est.maxRange))")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.primary)
                }
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color(UIColor.systemBackground))
                .shadow(color: Color.teal.opacity(0.15), radius: 20, y: 10)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.teal.opacity(0.1), lineWidth: 1)
        )
        .padding(.horizontal, 24)
    }
    
    private var serverAIActionSection: some View {
        Button(action: runServerAI) {
            HStack(spacing: 12) {
                if isCalculatingServer {
                    ProgressView().tint(.white)
                    Text("Analyzing Clinical Data...")
                } else {
                    Image(systemName: "sparkles")
                    Text("Generate Clinical Breakdown")
                }
            }
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                LinearGradient(colors: [.teal, Color(red: 0.05, green: 0.58, blue: 0.53)], startPoint: .leading, endPoint: .trailing)
            )
            .cornerRadius(18)
            .shadow(color: .teal.opacity(0.3), radius: 10, y: 5)
        }
        .padding(.horizontal, 24)
        .disabled(isCalculatingServer)
    }
    
    private var clinicalJustificationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "doc.text.viewfinder")
                    .foregroundColor(.teal)
                Text("AI CLINICAL ANALYTICS")
                    .font(.system(size: 11, weight: .black))
                    .tracking(1.5)
                    .foregroundColor(.teal)
            }
            
            Text(aiExplanation)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(.primary.opacity(0.9))
                .lineSpacing(4)
            
            HStack(spacing: 6) {
                Circle().fill(Color.green).frame(width: 8, height: 8)
                Text("Proprietary Medical Protocol Applied")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
            }
            .padding(.top, 4)
        }
        .modifier(CardStyleModifier())
        .padding(.horizontal, 24)
    }
    
    private var injectButtonSection: some View {
        Button(action: {
            if let est = estimation {
                onAddPlan(est.baseCost, aiExplanation, treatmentType)
            }
        }) {
            HStack {
                Text("Inject into Treatment Design")
                Image(systemName: "arrow.up.right")
            }
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Color.primary) // Adapts beautifully to light/dark mode
            .cornerRadius(18)
            .shadow(color: Color.black.opacity(0.2), radius: 10, y: 5)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 20)
    }
    
    // MARK: - Logic / Methods
    
    private func loadData() {
        isLoadingCosts = true
        self.treatments = ["Extraction", "Crown", "Implant", "CD", "RPD", "RCT", "FMR"]
        
        APIService.getTreatmentCatalog(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                self.isLoadingCosts = false
                if case .success(let data) = result {
                    var map: [String: Double] = [:]
                    var treatmentNames: [String] = []
                    
                    for item in data {
                        if let name = item["name"] as? String,
                           let cost = item["effective_cost"] as? Double {
                            map[name] = cost
                            treatmentNames.append(name)
                        }
                    }
                    
                    self.customCosts = map
                    if !treatmentNames.isEmpty {
                        self.treatments = treatmentNames
                        if !treatmentNames.contains(self.treatmentType) {
                            self.treatmentType = treatmentNames[0]
                        }
                    }
                    self.updateEstimationAsync()
                }
            }
        }
    }
    
    private func updateEstimationAsync() {
        guard !treatments.isEmpty, treatments.contains(treatmentType) else { return }
        
        isEstimatingLocal = true
        
        // Capture state values before going to background thread
        let tType = treatmentType
        let tCount = teethCount
        let sCount = sessions
        let cLevel = complexity
        let mType = material
        let costs = customCosts
        
        DispatchQueue.global(qos: .userInitiated).async {
            let newEstimation = CoreMLCostEstimator.estimate(
                treatmentType: tType,
                teethCount: tCount,
                sessions: sCount,
                complexity: cLevel,
                material: mType,
                customPricelist: costs
            )
            
            DispatchQueue.main.async {
                self.estimation = newEstimation
                self.isEstimatingLocal = false
            }
        }
    }
    
    private func runServerAI() {
        isCalculatingServer = true
        
        CoreMLCostEstimator.estimateWithAI(
            treatmentType: treatmentType,
            teethCount: teethCount,
            complexity: complexity,
            material: material,
            dentistId: dentistId,
            patientName: patientName,
            dentistName: dentistName
        ) { result in
            DispatchQueue.main.async {
                self.isCalculatingServer = false
                switch result {
                case .success(let (est, explanation)):
                    self.estimation = est
                    self.aiExplanation = explanation
                case .failure(let error):
                    print("AI Error: \(error.localizedDescription)")
                }
            }
        }
    }
}

// MARK: - Reusable Modifiers

struct CardStyleModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(20)
            .background(Color(UIColor.systemBackground).opacity(0.95))
            .cornerRadius(20)
            .shadow(color: Color.black.opacity(0.04), radius: 10, y: 4)
    }
}
