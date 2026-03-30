import SwiftUI

// MARK: - Dentist Habit Impact Analyzer View
struct HabitImpactAnalyzerView: View {
    let patientId: Int
    let patientName: String
    let dentistId: Int
    
    @Environment(\.dismiss) var dismiss
    
    // Habit Inputs
    @State private var tobaccoPerDay: String = ""
    @State private var tobaccoYears: String = ""
    @State private var arecaPerDay: String = ""
    @State private var arecaYears: String = ""
    @State private var alcohol: Bool = false
    
    // Clinical Data
    @State private var mouthOpeningMM: String = ""
    @State private var currentGrade: String = "Grade I"
    let gradeOptions = ["Grade I", "Grade II", "Grade III", "Grade IV"]
    
    // Results
    @State private var riskMultiplier: Double = 0
    @State private var fibrosisRiskPercent: Double = 0
    @State private var counselingLevel: String = ""
    @State private var simulations: [[String: Any]] = []
    @State private var hasResult = false
    @State private var isAnalyzing = false
    
    // History
    @State private var showHistory = false
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 25) {
                    // Header
                    headerSection
                    
                    // Habit Input Section
                    habitInputSection
                    
                    // Clinical Data Section
                    clinicalDataSection
                    
                    // Analyze Button
                    analyzeButton
                    
                    // Results Section
                    if hasResult {
                        resultSection
                        graphSection
                        disclaimerSection
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Habit Impact Analyzer")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.teal)
                        .frame(width: 36, height: 36)
                        .background(Circle().fill(Color.white.opacity(0.8)))
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showHistory.toggle() }) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.teal)
                }
            }
        }
        .fullScreenCover(isPresented: $showHistory) {
            HabitRiskHistoryView(patientId: patientId, patientName: patientName, dentistId: dentistId)
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        VStack(spacing: 18) {
            // 1. Clinical Diagnostic Icon
            ZStack {
                // Outer soft glow
                Circle()
                    .fill(Color.teal.opacity(0.12))
                    .frame(width: 85, height: 85)
                
                // Primary Brand Circle
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.teal, Color.teal.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 65, height: 65)
                    .shadow(color: Color.teal.opacity(0.3), radius: 15, y: 8)
                
                Image(systemName: "waveform.path.ecg.rectangle.fill")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(.top, 5)
            
            // 2. Identity & Metadata
            VStack(spacing: 6) {
                Text("AI HABIT IMPACT ANALYZER")
                    .font(.system(size: 10, weight: .black))
                    .tracking(2.5)
                    .foregroundColor(.teal.opacity(0.7))
                
                Text(patientName)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundColor(.primary.opacity(0.85))
                
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10))
                    Text("OSMF Risk Profiling Engine")
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.secondary.opacity(0.6))
            }
            
            // 3. Signature Registry Pill Accent
            Capsule()
                .fill(Color.teal.opacity(0.15))
                .frame(width: 45, height: 5)
                .padding(.top, 5)
        }
        .padding(.vertical, 35)
        .padding(.horizontal, 25)
        .frame(maxWidth: .infinity)
        .background(
            ZStack {
                // Professional Glassmorphism
                RoundedRectangle(cornerRadius: 32)
                    .fill(Color.white.opacity(0.85))
                
                // Subtle Border to define the shape against the grid
                RoundedRectangle(cornerRadius: 32)
                    .stroke(Color.teal.opacity(0.1), lineWidth: 1)
            }
        )
        .padding(.horizontal)
        .shadow(color: Color.black.opacity(0.03), radius: 20, x: 0, y: 12)
    }
    
    // MARK: - Habit Input
    private var habitInputSection: some View {
        HStack(spacing: 0) {
            // 1. Signature Vertical Accent Bar
            Rectangle()
                .fill(Color.orange)
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 22) {
                // 2. Section Header with Clinical Style
                HStack {
                    HabitSectionHeader(title: "HABIT PROFILE", icon: "flame.fill", color: .orange)
                    Spacer()
                    // Signature Registry accent
                    Capsule()
                        .fill(Color.orange.opacity(0.2))
                        .frame(width: 25, height: 4)
                }
                
                // 3. Grid of Input Fields
                VStack(spacing: 14) {
                    HStack(spacing: 14) {
                        HabitInputField(label: "Tobacco/Day", text: $tobaccoPerDay, icon: "smoke.fill", color: .red)
                        HabitInputField(label: "Tobacco Years", text: $tobaccoYears, icon: "calendar", color: .red)
                    }
                    
                    HStack(spacing: 14) {
                        HabitInputField(label: "Areca/Day", text: $arecaPerDay, icon: "leaf.fill", color: .green)
                        HabitInputField(label: "Areca Years", text: $arecaYears, icon: "calendar", color: .green)
                    }
                }
                
                // 4. Enhanced Alcohol Toggle Component
                HStack {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.purple.opacity(0.12))
                                .frame(width: 36, height: 36)
                            Image(systemName: "wineglass.fill")
                                .foregroundColor(.purple)
                                .font(.system(size: 16, weight: .bold))
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Alcohol")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.primary)
                            Text(alcohol ? "ACTIVE USAGE" : "NO USAGE REPORTED")
                                .font(.system(size: 8, weight: .black))
                                .tracking(1)
                                .foregroundColor(alcohol ? .red : .secondary.opacity(0.6))
                        }
                    }
                    
                    
                    
                    Toggle("", isOn: $alcohol)
                        .tint(.purple)
                        .scaleEffect(0.9) // Slightly smaller for a tighter clinical look
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.purple.opacity(0.04))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color.purple.opacity(0.1), lineWidth: 1)
                        )
                )
            }
            .padding(20)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 15, x: 0, y: 8)
        .padding(.horizontal)
    }
    
    // MARK: - Clinical Data
    private var clinicalDataSection: some View {
        HStack(spacing: 0) {
            // 1. Signature Clinical Teal Accent Bar
            Rectangle()
                .fill(Color.teal)
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 22) {
                // 2. Section Header with Clinical Style
                HStack {
                    HabitSectionHeader(title: "CLINICAL DATA", icon: "stethoscope", color: .teal)
                    Spacer()
                    // Signature Registry accent
                    Capsule()
                        .fill(Color.teal.opacity(0.2))
                        .frame(width: 25, height: 4)
                }
                
                HStack(spacing: 15) {
                    // 3. Mouth Opening Input Tile
                    VStack(alignment: .leading, spacing: 10) {
                        Label {
                            Text("Mouth Opening")
                                .font(.system(size: 10, weight: .heavy))
                                .tracking(0.5)
                        } icon: {
                            Image(systemName: "ruler")
                                .font(.system(size: 10))
                        }
                        .foregroundColor(.secondary)
                        
                        HStack {
                            TextField("0.0", text: $mouthOpeningMM)
                                .keyboardType(.decimalPad)
                                .font(.system(size: 20, weight: .black, design: .rounded))
                            
                            Text("mm")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.teal)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color.teal.opacity(0.04))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(Color.teal.opacity(0.12), lineWidth: 1)
                                )
                        )
                    }
                    
                    // 4. OSMF Grade Picker Tile
                    VStack(alignment: .leading, spacing: 10) {
                        Label {
                            Text("OSMF Grade")
                                .font(.system(size: 10, weight: .heavy))
                                .tracking(0.5)
                        } icon: {
                            Image(systemName: "chart.bar.fill")
                                .font(.system(size: 10))
                        }
                        .foregroundColor(.secondary)
                        
                        Menu {
                            Picker("Grade", selection: $currentGrade) {
                                ForEach(gradeOptions, id: \.self) { grade in
                                    Text(grade).tag(grade)
                                }
                            }
                        } label: {
                            HStack {
                                Text(currentGrade.isEmpty ? "Select" : currentGrade)
                                    .font(.system(size: 16, weight: .black, design: .rounded))
                                    .foregroundColor(.primary)
                                
                                Spacer()
                                
                                Image(systemName: "chevron.up.chevron.down")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.teal)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(Color.teal.opacity(0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(Color.teal.opacity(0.12), lineWidth: 1)
                                    )
                            )
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 15, x: 0, y: 8)
        .padding(.horizontal)
    }
    
    // MARK: - Analyze Button
    private var analyzeButton: some View {
        Button(action: performAnalysis) {
            HStack(spacing: 12) {
                if isAnalyzing {
                    ProgressView()
                        .tint(.white)
                } else {
                    // Professional medical AI icon
                    Image(systemName: "sparkles.rectangle.stack.fill")
                        .font(.system(size: 18, weight: .bold))
                }
                
                Text(isAnalyzing ? "COMPUTING CLINICAL RISK..." : "ANALYZE FIBROSIS PROFILE")
                    .font(.system(size: 14, weight: .black))
                    .tracking(1.5)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(
                ZStack {
                    // Professional Clinical Gradient
                    LinearGradient(
                        colors: [Color.teal, Color(hex: "0D9488")], // Teal to Darker Teal
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    
                    // Subtle inner highlight for a "3D glass" effect
                    RoundedRectangle(cornerRadius: 22)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        .padding(1)
                }
            )
            .cornerRadius(22)
            // High-end spread shadow
            .shadow(color: Color.teal.opacity(0.25), radius: 20, x: 0, y: 12)
        }
        .disabled(isAnalyzing)
        .padding(.horizontal, 25)
        .padding(.top, 10)
        .padding(.bottom, 20)
    }
    
    // MARK: - Results
    private var resultSection: some View {
        HStack(spacing: 0) {
            // 1. Signature Clinical Accent Bar (Teal for Analysis)
            Rectangle()
                .fill(Color.teal)
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 22) {
                // 2. Section Header
                HStack {
                    HabitSectionHeader(title: "ANALYSIS RESULTS", icon: "chart.bar.doc.horizontal.fill", color: .teal)
                    Spacer()
                    // Signature Registry accent
                    Capsule()
                        .fill(Color.teal.opacity(0.2))
                        .frame(width: 25, height: 4)
                }
                
                // 3. Metric Cards Row
                HStack(spacing: 12) {
                    ResultMetricCard(
                        title: "RISK MULTIPLIER",
                        value: "\(String(format: "%.1f", riskMultiplier))x",
                        color: riskMultiplier > 3.0 ? .red : riskMultiplier > 2.0 ? .orange : .green,
                        icon: "arrow.up.right.circle.fill"
                    )
                    
                    ResultMetricCard(
                        title: "FIBROSIS RISK",
                        value: "\(Int(fibrosisRiskPercent))%",
                        color: fibrosisRiskPercent > 65 ? .red : fibrosisRiskPercent > 40 ? .orange : .green,
                        icon: "waveform.path.ecg"
                    )
                }
                
                // 4. Clinical Counseling Banner
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.2))
                            .frame(width: 44, height: 44)
                        
                        Image(systemName: counselingIcon)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("COUNSELING INTENSITY")
                            .font(.system(size: 8, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(.white.opacity(0.7))
                        
                        Text(counselingLevel.uppercased())
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "checkmark.shield.badge.fill")
                        .font(.system(size: 24))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundColor(.white.opacity(0.6))
                }
                .padding(18)
                .background(
                    ZStack {
                        LinearGradient(colors: counselingGradientColors,
                                      startPoint: .leading, endPoint: .trailing)
                        
                        // Subtle clinical texture
                        Image(systemName: "cross.case.fill")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 80)
                            .opacity(0.05)
                            .offset(x: 100)
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .shadow(color: counselingGradientColors[0].opacity(0.3), radius: 10, y: 6)
            }
            .padding(20)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 15, x: 0, y: 8)
        .padding(.horizontal)
    }
    
    // MARK: - Graph Section
    private var graphSection: some View {
        HStack(spacing: 0) {
            // 1. Signature Clinical Teal Accent Bar
            Rectangle()
                .fill(Color.teal)
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 20) {
                // 2. Section Header
                HStack {
                    HabitSectionHeader(title: "REDUCTION SIMULATION", icon: "chart.xyaxis.line", color: .teal)
                    Spacer()
                    // Signature Registry accent
                    Capsule()
                        .fill(Color.teal.opacity(0.2))
                        .frame(width: 25, height: 4)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("PROJECTION MODEL")
                        .font(.system(size: 9, weight: .black))
                        .tracking(1.5)
                        .foregroundColor(.teal)
                    Text("Projected fibrosis risk at different habit usage levels")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.secondary)
                }
                
                // 3. Simulation Rows
                VStack(spacing: 18) {
                    ForEach(simulations.indices, id: \.self) { index in
                        let sim = simulations[index]
                        let label = sim["label"] as? String ?? ""
                        let risk = sim["fibrosis_risk_percent"] as? Double ?? 0
                        let tobacco = sim["tobacco_per_day"] as? Int ?? 0
                        let areca = sim["areca_per_day"] as? Int ?? 0
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .bottom) {
                                Text(label.uppercased())
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.primary.opacity(0.8))
                                    .frame(width: 80, alignment: .leading)
                                
                                // Habit Tag
                                HStack(spacing: 4) {
                                    Image(systemName: "pills.fill")
                                        .font(.system(size: 8))
                                    Text("T:\(tobacco) A:\(areca)")
                                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                                }
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.secondary.opacity(0.1))
                                .cornerRadius(4)
                                .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Text("\(Int(risk))%")
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                                    .foregroundColor(barColor(for: risk))
                            }
                            
                            // Professional Progress Bar
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.secondary.opacity(0.08))
                                        .frame(height: 8)
                                    
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(
                                            LinearGradient(
                                                colors: [barColor(for: risk), barColor(for: risk).opacity(0.7)],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .frame(width: geo.size.width * CGFloat(risk / 100.0), height: 8)
                                }
                            }
                            .frame(height: 8)
                        }
                    }
                }
                
                Divider().opacity(0.5)
                
                // 4. Clinical Legend
                HStack(spacing: 20) {
                    LegendDot(color: .green, text: "LOW")
                    LegendDot(color: .orange, text: "MODERATE")
                    LegendDot(color: .red, text: "INTENSIVE")
                }
                .padding(.top, 5)
            }
            .padding(22)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 15, x: 0, y: 8)
        .padding(.horizontal)
    }
    
    // MARK: - Disclaimer Section
    private var disclaimerSection: some View {
        HStack(alignment: .top, spacing: 14) {
            // 1. Safety Protocol Icon
            Image(systemName: "exclamationmark.shield.fill")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.teal.opacity(0.6))
                .padding(.top, 2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("CLINICAL DECISION SUPPORT NOTICE")
                    .font(.system(size: 9, weight: .black))
                    .tracking(1.2)
                    .foregroundColor(.primary.opacity(0.7))
                
                Text("This AI-generated analysis is intended for supportive screening only. It does not constitute a diagnosis and must be used in conjunction with a full clinical examination and professional judgment.")
                    .font(.system(size: 11, weight: .medium))
                    .lineSpacing(3)
                    .foregroundColor(.secondary)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack {
                // High-end subtle surface
                RoundedRectangle(cornerRadius: 18)
                    .fill(Color.secondary.opacity(0.03))
                
                // Refined dashed border for "Notice" feel
                RoundedRectangle(cornerRadius: 18)
                    .strokeBorder(
                        style: StrokeStyle(lineWidth: 1, dash: [4])
                    )
                    .foregroundColor(Color.secondary.opacity(0.15))
            }
        )
        .padding(.horizontal)
        .padding(.bottom, 30) // Extra padding for the bottom of the scroll view
    }
    
    // MARK: - Logic

    private func performAnalysis() {
        // 1. Initial Validation & Haptic Start
        guard !isAnalyzing else { return }
        
        // Impact feedback to confirm the button press physically
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        
        withAnimation(.easeInOut(duration: 0.3)) {
            isAnalyzing = true
        }
        
        // 2. Data Marshalling
        // We cast strictly to ensure clinical data integrity
        let payload: [String: Any] = [
            "patient_id": patientId,
            "dentist_id": dentistId,
            "tobacco_per_day": Int(tobaccoPerDay) ?? 0,
            "tobacco_years": Int(tobaccoYears) ?? 0,
            "areca_per_day": Int(arecaPerDay) ?? 0,
            "areca_years": Int(arecaYears) ?? 0,
            "alcohol": alcohol,
            "mouth_opening_mm": Double(mouthOpeningMM) ?? 0,
            "current_grade": currentGrade.isEmpty ? "Not Specified" : currentGrade
        ]
        
        // 3. API Execution
        APIService.analyzeHabitRisk(data: payload) { result in
            DispatchQueue.main.async {
                // Smoothly exit loading state
                withAnimation(.easeOut(duration: 0.2)) {
                    self.isAnalyzing = false
                }
                
                switch result {
                case .success(let resData):
                    // Success Haptic: Notification style
                    let successNotify = UINotificationFeedbackGenerator()
                    successNotify.notificationOccurred(.success)
                    
                    // 4. Orchestrated Result Animation
                    // Using a slightly slower spring for a "Medical Dashboard" reveal
                    withAnimation(.spring(response: 0.7, dampingFraction: 0.85, blendDuration: 0)) {
                        self.riskMultiplier = resData["risk_multiplier"] as? Double ?? 0
                        self.fibrosisRiskPercent = resData["fibrosis_risk_percent"] as? Double ?? 0
                        self.counselingLevel = resData["counseling_level"] as? String ?? "Unknown"
                        self.simulations = resData["simulations"] as? [[String: Any]] ?? []
                        self.hasResult = true
                    }
                    
                case .failure(let error):
                    // Error Haptic
                    let errorNotify = UINotificationFeedbackGenerator()
                    errorNotify.notificationOccurred(.error)
                    
                    print("Clinical Analysis Failure: \(error.localizedDescription)")
                    // Here you could trigger a state variable to show an 'Error Alert' in the UI
                }
            }
        }
    }
    
    private var counselingIcon: String {
        switch counselingLevel {
        case "Intensive": return "exclamationmark.triangle.fill"
        case "Moderate": return "exclamationmark.circle.fill"
        default: return "checkmark.circle.fill"
        }
    }
    
    private var counselingGradientColors: [Color] {
        switch counselingLevel {
        case "Intensive": return [.red, Color(hex: "DC2626")]
        case "Moderate": return [.orange, Color(hex: "EA580C")]
        default: return [.green, Color(hex: "16A34A")]
        }
    }
    
    private func barColor(for risk: Double) -> Color {
        if risk > 65 { return .red }
        if risk > 40 { return .orange }
        return .green
    }
}

// MARK: - Supporting Views

struct HabitSectionHeader: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(color)
            
            Text(title)
                .font(.system(size: 10, weight: .black))
                .tracking(2)
                .foregroundColor(.secondary)
        }
    }
}

struct HabitInputField: View {
    let label: String
    @Binding var text: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 10))
                    .foregroundColor(color)
                Text(label)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }
            
            TextField("0", text: $text)
                .keyboardType(.numberPad)
                .padding(14)
                .background(color.opacity(0.05))
                .cornerRadius(14)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(color.opacity(0.15), lineWidth: 1)
                )
        }
    }
}

struct ResultMetricCard: View {
    let title: String
    let value: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // 1. Header: Icon Backdrop & Clinical Pill Accent
            HStack(alignment: .top) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.12))
                        .frame(width: 34, height: 34)
                    
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(color)
                }
                
                Spacer()
                
                // Signature Registry accent from your screenshots
                Capsule()
                    .fill(color.opacity(0.2))
                    .frame(width: 22, height: 4)
            }
            
            // 2. Metric Data
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundColor(.primary) // Keep value primary for professional legibility
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                
                Text(title.uppercased())
                    .font(.system(size: 8, weight: .heavy))
                    .tracking(1.2)
                    .foregroundColor(.secondary.opacity(0.7))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack {
                // High-end white surface (Glassmorphism)
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white)
                
                // Subtle color glow overlay
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.04), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                // Clean clinical border
                RoundedRectangle(cornerRadius: 20)
                    .stroke(color.opacity(0.12), lineWidth: 1)
            }
        )
        // Soft dashboard shadow
        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
}

struct LegendDot: View {
    let color: Color
    let text: String
    
    var body: some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(text)
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - History View (Loads its own data from API)
struct HabitRiskHistoryView: View {
    let patientId: Int
    let patientName: String
    let dentistId: Int
    @Environment(\.dismiss) var dismiss
    
    @State private var history: [[String: Any]] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationStack {
            ZStack {
                DentalBackgroundView(animate: false, isDentist: true)
                    .ignoresSafeArea()
                
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading history...")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 15) {
                            if history.isEmpty {
                                VStack(spacing: 20) {
                                    Image(systemName: "chart.bar.xaxis.ascending")
                                        .font(.system(size: 50))
                                        .foregroundColor(.secondary.opacity(0.3))
                                    
                                    Text("No analysis history available.")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(.secondary)
                                }
                                .padding(.top, 100)
                            } else {
                                ForEach(history.indices, id: \.self) { index in
                                    let record = history[index]
                                    NavigationLink(destination: HabitRiskDetailView(record: record, patientName: patientName)) {
                                        HistoryRecordCard(record: record)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Risk History: \(patientName)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    BackButton {
                        dismiss()
                    }
                }
            }
            .navigationBarBackButtonHidden(true)
        }
        .onAppear(perform: loadHistory)
    }
    
    private func loadHistory() {
        isLoading = true
        APIService.getHabitRiskHistory(patientId: patientId, dentistId: dentistId) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let data) = result {
                    self.history = data
                }
            }
        }
    }
}

// MARK: - Detailed View for a single analysis record
struct HabitRiskDetailView: View {
    let record: [String: Any]
    let patientName: String
    @Environment(\.dismiss) private var dismiss
    private var riskPercent: Double {
        record["fibrosis_risk_percent"] as? Double ?? 0
    }
    
    private var riskMultiplier: Double {
        record["calculated_risk_multiplier"] as? Double ?? 0
    }
    
    private var counselingLevel: String {
        record["counseling_level"] as? String ?? "Unknown"
    }
    
    private var tobaccoPerDay: Int {
        if let v = record["tobacco_per_day"] as? Int { return v }
        if let s = record["tobacco_per_day"] as? String, let v = Int(s) { return v }
        return 0
    }
    
    private var tobaccoYears: Int {
        if let v = record["tobacco_years"] as? Int { return v }
        if let s = record["tobacco_years"] as? String, let v = Int(s) { return v }
        return 0
    }
    
    private var arecaPerDay: Int {
        if let v = record["areca_per_day"] as? Int { return v }
        if let s = record["areca_per_day"] as? String, let v = Int(s) { return v }
        return 0
    }
    
    private var arecaYears: Int {
        if let v = record["areca_years"] as? Int { return v }
        if let s = record["areca_years"] as? String, let v = Int(s) { return v }
        return 0
    }
    
    private var alcoholUsed: Bool {
        if let v = record["alcohol"] as? Bool { return v }
        if let v = record["alcohol"] as? Int { return v == 1 }
        if let s = record["alcohol"] as? String { return s == "1" || s == "true" }
        return false
    }
    
    private var mouthOpening: Double {
        if let v = record["mouth_opening_mm"] as? Double { return v }
        if let s = record["mouth_opening_mm"] as? String, let v = Double(s) { return v }
        return 0
    }
    
    private var currentGrade: String {
        record["current_grade"] as? String ?? "N/A"
    }
    
    private var createdAt: String {
        "\(record["created_at"] ?? "")"
    }
    
    private var riskColor: Color {
        if riskPercent > 65 { return .red }
        if riskPercent > 40 { return .orange }
        return .green
    }
    
    private var counselingGradientColors: [Color] {
        switch counselingLevel {
        case "Intensive": return [.red, Color(hex: "DC2626")]
        case "Moderate": return [.orange, Color(hex: "EA580C")]
        default: return [.green, Color(hex: "16A34A")]
        }
    }
    
    private var counselingIcon: String {
        switch counselingLevel {
        case "Intensive": return "exclamationmark.triangle.fill"
        case "Moderate": return "exclamationmark.circle.fill"
        default: return "checkmark.circle.fill"
        }
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false, isDentist: true)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 16) {
                        // 1. Clinical Icon with Registry Style
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [Color.teal, Color.teal.opacity(0.8)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 64, height: 64)
                                .shadow(color: Color.teal.opacity(0.2), radius: 15, y: 8)
                            
                            Image(systemName: "doc.text.magnifyingglass")
                                .font(.system(size: 26, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .padding(.top, 10)
                        
                        // 2. Patient Identity & Metadata
                        VStack(spacing: 6) {
                            Text("ANALYSIS DETAIL")
                                .font(.system(size: 10, weight: .black))
                                .tracking(3)
                                .foregroundColor(.teal.opacity(0.7))
                            
                            Text(patientName)
                                .font(.system(size: 24, weight: .black, design: .rounded))
                                .foregroundColor(.primary)
                            
                            if !createdAt.isEmpty {
                                HStack(spacing: 6) {
                                    Image(systemName: "clock.fill")
                                        .font(.system(size: 10))
                                    Text(createdAt.formattedDateTime())
                                }
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.secondary.opacity(0.6))
                            }
                        }
                        
                        // 3. Signature Registry Pill Accent (Matching the screenshot)
                        Capsule()
                            .fill(Color.teal.opacity(0.15))
                            .frame(width: 40, height: 4)
                            .padding(.top, 4)
                    }
                    .padding(30)
                    .frame(maxWidth: .infinity)
                    .background(
                        ZStack {
                            // High-end glass effect
                            RoundedRectangle(cornerRadius: 30)
                                .fill(Color.white.opacity(0.8))
                            
                            // Subtle Teal border
                            RoundedRectangle(cornerRadius: 30)
                                .stroke(Color.teal.opacity(0.1), lineWidth: 1)
                        }
                    )
                    .padding(.horizontal)
                    .shadow(color: Color.black.opacity(0.03), radius: 20, x: 0, y: 10)
                    
                    // Risk Metrics
                    HStack(spacing: 15) {
                        ResultMetricCard(
                            title: "RISK MULTIPLIER",
                            value: "\(String(format: "%.1f", riskMultiplier))x",
                            color: riskMultiplier > 3.0 ? .red : riskMultiplier > 2.0 ? .orange : .green,
                            icon: "arrow.up.right"
                        )
                        
                        ResultMetricCard(
                            title: "FIBROSIS RISK",
                            value: "\(Int(riskPercent))%",
                            color: riskColor,
                            icon: "chart.line.uptrend.xyaxis"
                        )
                    }
                    
                    // Counseling Level Banner
                    HStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(.white.opacity(0.2))
                                .frame(width: 48, height: 48)
                            
                            Image(systemName: counselingIcon)
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(.white)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("COUNSELING INTENSITY")
                                .font(.system(size: 8, weight: .black))
                                .tracking(1.5)
                                .foregroundColor(.white.opacity(0.7))
                            
                            Text(counselingLevel.uppercased())
                                .font(.system(size: 20, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                        }
                        
                        Spacer()
                        
                        Image(systemName: "checkmark.shield.badge.fill")
                            .font(.system(size: 24))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundColor(.white.opacity(0.5))
                    }
                    .padding(20)
                    .background(
                        ZStack {
                            LinearGradient(colors: counselingGradientColors, startPoint: .leading, endPoint: .trailing)
                            
                            // Subtle texture overlay
                            Image(systemName: "waveform.path.ecg")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 100)
                                .opacity(0.1)
                                .offset(x: 120)
                        }
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: counselingGradientColors[0].opacity(0.3), radius: 12, x: 0, y: 8)
   
                    // Habit Profile Details
                    HStack(spacing: 0) {
                        Rectangle()
                            .fill(Color.orange)
                            .frame(width: 5)
                        
                        VStack(alignment: .leading, spacing: 20) {
                            HabitSectionHeader(title: "HABIT PROFILE", icon: "flame.fill", color: .orange)
                            
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                DetailStatCard(label: "Tobacco/Day", value: "\(tobaccoPerDay)", icon: "smoke.fill", color: .red)
                                DetailStatCard(label: "Tobacco Years", value: "\(tobaccoYears)", icon: "calendar", color: .red)
                                DetailStatCard(label: "Areca/Day", value: "\(arecaPerDay)", icon: "leaf.fill", color: .green)
                                DetailStatCard(label: "Areca Years", value: "\(arecaYears)", icon: "calendar", color: .green)
                            }
                            
                            // Alcohol Tile - Refined for professional look
                            HStack {
                                HStack(spacing: 12) {
                                    ZStack {
                                        Circle().fill(Color.purple.opacity(0.1)).frame(width: 32, height: 32)
                                        Image(systemName: "wineglass.fill").font(.system(size: 14)).foregroundColor(.purple)
                                    }
                                    Text("Alcohol Usage").font(.system(size: 13, weight: .bold)).foregroundColor(.primary.opacity(0.7))
                                }
                                Spacer()
                                Text(alcoholUsed ? "DETECTED" : "NONE")
                                    .font(.system(size: 11, weight: .black))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(alcoholUsed ? Color.red.opacity(0.1) : Color.green.opacity(0.1))
                                    .foregroundColor(alcoholUsed ? .red : .green)
                                    .cornerRadius(6)
                            }
                            .padding(12)
                            .background(Color.gray.opacity(0.03))
                            .cornerRadius(12)
                        }
                        .padding(20)
                    }
                    .background(Color.white)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.04), radius: 10, y: 5)
                    
                    // Clinical Data Details
                    HStack(spacing: 0) {
                        Rectangle()
                            .fill(Color.teal)
                            .frame(width: 5)
                        
                        VStack(alignment: .leading, spacing: 18) {
                            HabitSectionHeader(title: "CLINICAL DATA", icon: "stethoscope", color: .teal)
                            
                            HStack(spacing: 12) {
                                DetailStatCard(label: "Mouth Opening", value: "\(String(format: "%.1f", mouthOpening)) mm", icon: "ruler", color: .teal)
                                DetailStatCard(label: "OSMF Grade", value: "GRADE \(currentGrade)", icon: "chart.bar.fill", color: .teal)
                            }
                        }
                        .padding(20)
                    }
                    .background(Color.white)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.04), radius: 10, y: 5)
                    
                    // Disclaimer Footer
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.indigo)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("AI ASSISTANCE NOTICE")
                                .font(.system(size: 8, weight: .black))
                                .foregroundColor(.indigo)
                            
                            Text("This analysis is supportive and not a substitute for professional clinical judgment.")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(Color.indigo.opacity(0.2), style: StrokeStyle(lineWidth: 1, dash: [4]))
                    )
                    .background(Color.indigo.opacity(0.02))
                }
                .padding()
            }
        }
        .navigationTitle("Analysis Detail")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            
            ToolbarItem(placement: .navigationBarLeading) {
                BackButton {
                    dismiss()
                }
            }
            
        }
        
    }
}

struct BackButton: View {
    var action: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: action) {
            Image(systemName: "chevron.left")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.cyan)
                .frame(width: 36, height: 36)
                .background(Circle().fill(Color.white))
                .scaleEffect(isPressed ? 0.9 : 1.0)
                .animation(.easeInOut(duration: 0.15), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}
// MARK: - Detail Stat Card
struct DetailStatCard: View {
    let label: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 1. Header: Icon Backdrop & Clinical Pill Accent
            HStack(alignment: .top) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.12))
                        .frame(width: 32, height: 32)
                    
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(color)
                }
                
                Spacer()
                
                // Signature Registry accent from your screenshots
                Capsule()
                    .fill(color.opacity(0.2))
                    .frame(width: 20, height: 4)
            }
            
            // 2. Data Content
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                
                Text(label.uppercased())
                    .font(.system(size: 8, weight: .heavy))
                    .tracking(1)
                    .foregroundColor(.secondary.opacity(0.8))
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack {
                // High-end white surface
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white)
                
                // Subtle color glow overlay for depth
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.04), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                // Refined clinical border
                RoundedRectangle(cornerRadius: 16)
                    .stroke(color.opacity(0.1), lineWidth: 1)
            }
        )
        // Soft shadow to match the registry dashboard
        .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 4)
    }
}

struct HistoryRecordCard: View {
    let record: [String: Any]
    
    var body: some View {
        HStack(spacing: 0) {
            // 1. Signature Vertical Accent Bar (Dynamic Risk Color)
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [riskColor, riskColor.opacity(0.7)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 15) {
                // 2. Header: Risk Percentage and Status Badge
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: "waveform.path.ecg")
                                .font(.system(size: 10, weight: .bold))
                            Text("FIBROSIS RISK ASSESSMENT")
                                .font(.system(size: 9, weight: .black))
                                .tracking(1.2)
                        }
                        .foregroundColor(riskColor)
                        
                        Text("\(Int(record["fibrosis_risk_percent"] as? Double ?? 0))%")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(.primary.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    // Counseling Status Badge
                    Text(record["counseling_level"] as? String ?? "")
                        .font(.system(size: 9, weight: .black))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(riskColor.opacity(0.1))
                        .foregroundColor(riskColor)
                        .clipShape(Capsule())
                }
                
                // 3. Mini Stats Row
                HStack(spacing: 15) {
                    recordMiniStat(label: "TOBACCO", value: "\(record["tobacco_per_day"] as? Int ?? 0)/d", icon: "smoke.fill")
                    recordMiniStat(label: "ARECA", value: "\(record["areca_per_day"] as? Int ?? 0)/d", icon: "leaf.fill")
                    recordMiniStat(label: "MULTIPLIER", value: "\(String(format: "%.1f", record["calculated_risk_multiplier"] as? Double ?? 0))x", icon: "arrow.up.right.circle.fill")
                }
                
                Divider().opacity(0.5)
                
                // 4. Footer: Date and Action
                HStack {
                    Label("\(record["created_at"] ?? "")".formattedDateTime(), systemImage: "calendar")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary.opacity(0.6))
                    
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Text("View Details")
                            .font(.system(size: 11, weight: .bold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundColor(.teal)
                    }
                    .foregroundColor(.teal)
                }
            }
            .padding(18)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 10, x: 0, y: 5)
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
    }
    
    // Minimalist Stat Component for the Card
    private func recordMiniStat(label: String, value: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 0) {
                Text(value)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                Text(label)
                    .font(.system(size: 7, weight: .heavy))
                    .foregroundColor(.secondary.opacity(0.6))
            }
        }
        .padding(.trailing, 4)
    }
    
    private var riskColor: Color {
        let risk = record["fibrosis_risk_percent"] as? Double ?? 0
        if risk > 65 { return .red }
        if risk > 40 { return .orange }
        return .green
    }
}

struct HabitStat: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
            Text(value)
                .font(.system(size: 12, weight: .black, design: .rounded))
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Dentist Habit Analysis History List (for Dashboard)
struct DentistHabitHistoryListView: View {
    let dentistId: Int
    var onBack: (() -> Void)? = nil
    @Environment(\.dismiss) var dismiss
    
    @State private var patients: [[String: Any]] = []
    @State private var isLoading = true
    @State private var allHistory: [[String: Any]] = []
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Custom Header with Back Button
                HStack(spacing: 15) {
                    Button(action: {
                        if let onBack = onBack {
                            onBack()
                        } else {
                            dismiss()
                        }
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 38, height: 38)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                            .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("CLINICAL REGISTRY")
                            .font(.system(size: 10, weight: .black))
                            .tracking(2)
                            .foregroundColor(.secondary)
                        
                        Text("Habit History")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                )
                .padding(.bottom, 10)
                .padding(.horizontal)
                
                if isLoading {
                    Spacer()
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading analyses...")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                } else if allHistory.isEmpty {
                    Spacer()
                    VStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .fill(Color.purple.opacity(0.1))
                                .frame(width: 90, height: 90)
                            Image(systemName: "waveform.path.ecg.rectangle.fill")
                                .font(.system(size: 36))
                                .foregroundColor(.purple)
                        }
                        
                        Text("No Habit Analyses Yet")
                            .font(.system(size: 20, weight: .black, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                        
                        Text("Habit risk analyses will appear here once you perform them from a patient's consultation overview.")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 15) {
                            // Header
                            VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [Color(hex: "7C3AED"), Color(hex: "4F46E5")], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 60, height: 60)
                                    .shadow(color: Color(hex: "7C3AED").opacity(0.3), radius: 12, y: 6)
                                
                                Image(systemName: "waveform.path.ecg.rectangle.fill")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            Text("HABIT ANALYSIS HISTORY")
                                .font(.system(size: 10, weight: .black))
                                .tracking(3)
                                .foregroundColor(.secondary)
                            
                            Text("\(allHistory.count) Analyses")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.dentalDarkBlue)
                        }
                        .padding(25)
                        .frame(maxWidth: .infinity)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(24)
                        
                        // Group by patient
                        ForEach(groupedByPatient.keys.sorted(), id: \.self) { patientId in
                            if let records = groupedByPatient[patientId], !records.isEmpty {
                                let patientName = records.first?["patient_name"] as? String ?? "Patient #\(patientId)"
                                
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        ZStack {
                                            Circle()
                                                .fill(Color.purple.opacity(0.1))
                                                .frame(width: 36, height: 36)
                                            Text(String(patientName.prefix(1)))
                                                .font(.system(size: 14, weight: .black))
                                                .foregroundColor(.purple)
                                        }
                                        
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(patientName)
                                                .font(.system(size: 16, weight: .black, design: .rounded))
                                                .foregroundColor(.dentalDarkBlue)
                                            Text("\(records.count) analyses")
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    .padding(.horizontal, 5)
                                    
                                    ForEach(records.indices, id: \.self) { idx in
                                        let record = records[idx]
                                        NavigationLink(destination: HabitRiskDetailView(record: record, patientName: patientName)) {
                                            HistoryRecordCard(record: record)
                                        }
                                        .buttonStyle(PlainButtonStyle())
                                    }
                                }
                                .padding(20)
                                .background(Color.white.opacity(0.6))
                                .cornerRadius(24)
                            }
                        }
                    }
                    }
                    .padding(.bottom, 30)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear(perform: loadAllAnalyses)
    }
    
    private var groupedByPatient: [Int: [[String: Any]]] {
        var groups: [Int: [[String: Any]]] = [:]
        for record in allHistory {
            let pid: Int
            if let v = record["patient_id"] as? Int {
                pid = v
            } else if let s = record["patient_id"] as? String, let v = Int(s) {
                pid = v
            } else {
                continue
            }
            groups[pid, default: []].append(record)
        }
        return groups
    }
    
    private func loadAllAnalyses() {
        isLoading = true
        APIService.getAllHabitRiskHistory(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let data) = result {
                    self.allHistory = data
                }
            }
        }
    }
}
