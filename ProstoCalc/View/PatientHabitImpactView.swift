import SwiftUI

// MARK: - Patient Habit Impact View (Simplified)
struct PatientHabitImpactView: View {
    let patientId: Int

    @Environment(\.dismiss) var dismiss

    @State private var currentRisk: Double = 0
    @State private var zeroUseRisk: Double = 0
    @State private var reductionMin: Int = 0
    @State private var reductionMax: Int = 0
    @State private var counselingLevel: String = ""
    @State private var messages: [String] = []
    @State private var lastAnalyzed: String = ""
    @State private var isLoading = true
    @State private var hasData = false

    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 25) {
                    headerSection

                    if isLoading {
                        VStack(spacing: 20) {
                            ProgressView()
                                .scaleEffect(1.2)
                            Text("Loading your health insights...")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.secondary)
                        }
                        .padding(.top, 60)
                    } else if !hasData {
                        noDataSection
                    } else {
                        riskOverviewSection
                        messagesSection
                        motivationSection
                        disclaimerSection
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Health Insights")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.teal)
                }
            }
        }
        .onAppear(perform: loadSummary)
    }

    // MARK: - Header
    private var headerSection: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [Color(hex: "06B6D4"), Color(hex: "0891B2")],
                                        startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 70, height: 70)
                    .shadow(color: Color(hex: "06B6D4").opacity(0.35), radius: 15, y: 8)

                Image(systemName: "heart.text.clipboard.fill")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
            }

            Text("YOUR HEALTH INSIGHTS")
                .font(.system(size: 10, weight: .black))
                .tracking(3)
                .foregroundColor(.secondary)

            Text("Understand Your Oral Health Risk")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(.dentalDarkBlue)
        }
        .padding(30)
        .frame(maxWidth: .infinity)
        .background(Color.white.opacity(0.8))
        .cornerRadius(30)
        .shadow(color: .black.opacity(0.04), radius: 15, y: 8)
    }

    // MARK: - No Data
    private var noDataSection: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(Color.teal.opacity(0.1))
                    .frame(width: 90, height: 90)
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 36))
                    .foregroundColor(.teal)
            }

            Text("No Analysis Available Yet")
                .font(.system(size: 18, weight: .black, design: .rounded))

            Text("Your dentist will perform a habit impact analysis during your next visit. This will give you personalized insights about your oral health.")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
        .padding(.top, 40)
    }

    // MARK: - Risk Overview
    private var riskOverviewSection: some View {
        VStack(spacing: 20) {
            Text("YOUR RISK LEVEL")
                .font(.system(size: 10, weight: .black))
                .tracking(2)
                .foregroundColor(.secondary)

            // Circular Risk Indicator
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.1), lineWidth: 14)
                    .frame(width: 160, height: 160)

                Circle()
                    .trim(from: 0, to: CGFloat(currentRisk / 100.0))
                    .stroke(
                        LinearGradient(colors: riskGradientColors,
                                      startPoint: .topLeading, endPoint: .bottomTrailing),
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .frame(width: 160, height: 160)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 1.2), value: currentRisk)

                VStack(spacing: 4) {
                    Text("\(Int(currentRisk))%")
                        .font(.system(size: 36, weight: .black, design: .rounded))
                        .foregroundColor(riskColor)

                    Text("Current Risk")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                }
            }

            // Potential Improvement
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.down.circle.fill")
                        .foregroundColor(.green)
                        .font(.system(size: 16))

                    Text("With lifestyle changes, your risk could drop to")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.secondary)
                }

                Text("\(Int(zeroUseRisk))%")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundColor(.green)

                // Progress comparison
                HStack(spacing: 20) {
                    VStack(spacing: 4) {
                        Text("NOW")
                            .font(.system(size: 8, weight: .black))
                            .tracking(1)
                            .foregroundColor(.secondary)
                        
                        RoundedRectangle(cornerRadius: 6)
                            .fill(riskColor)
                            .frame(width: 60, height: 8)
                        
                        Text("\(Int(currentRisk))%")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                            .foregroundColor(riskColor)
                    }

                    Image(systemName: "arrow.right")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.secondary)

                    VStack(spacing: 4) {
                        Text("POSSIBLE")
                            .font(.system(size: 8, weight: .black))
                            .tracking(1)
                            .foregroundColor(.secondary)
                        
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.green)
                            .frame(width: 60, height: 8)
                        
                        Text("\(Int(zeroUseRisk))%")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                            .foregroundColor(.green)
                    }
                }
                .padding(.top, 8)
            }
            .padding(20)
            .background(Color.green.opacity(0.04))
            .cornerRadius(20)
        }
        .padding(25)
        .background(Color.white.opacity(0.8))
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.04), radius: 12, y: 6)
    }

    // MARK: - Messages
    private var messagesSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack(spacing: 8) {
                Image(systemName: "lightbulb.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.yellow)

                Text("WHAT YOU CAN DO")
                    .font(.system(size: 10, weight: .black))
                    .tracking(2)
                    .foregroundColor(.secondary)
            }

            ForEach(messages.indices, id: \.self) { index in
                HStack(alignment: .top, spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(Color.teal.opacity(0.1))
                            .frame(width: 30, height: 30)

                        Text("\(index + 1)")
                            .font(.system(size: 12, weight: .black))
                            .foregroundColor(.teal)
                    }

                    Text(messages[index])
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.primary)
                        .lineSpacing(3)
                }
                .padding(16)
                .background(Color.teal.opacity(0.04))
                .cornerRadius(16)
            }
        }
        .padding(25)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.8))
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.04), radius: 12, y: 6)
    }

    // MARK: - Motivation
    private var motivationSection: some View {
        VStack(spacing: 15) {
            Image(systemName: "sparkles")
                .font(.system(size: 30))
                .foregroundColor(.indigo)

            Text("Every small step matters!")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(.dentalDarkBlue)

            Text("Even reducing usage by half can have a meaningful positive impact on your oral health. Talk to your dentist about a plan that works for you.")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .lineSpacing(3)

            if !lastAnalyzed.isEmpty {
                Text("Last analyzed: \(lastAnalyzed.formattedDateTime())")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary.opacity(0.6))
                    .padding(.top, 5)
            }
        }
        .padding(25)
        .background(Color.indigo.opacity(0.04))
        .cornerRadius(24)
    }

    // MARK: - Disclaimer
    private var disclaimerSection: some View {
        HStack(spacing: 10) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 14))
                .foregroundColor(.teal.opacity(0.5))

            Text("AI analysis is supportive and not a substitute for clinical judgment. Always follow your dentist's advice.")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.teal.opacity(0.04))
        .cornerRadius(16)
    }

    // MARK: - Logic
    private func loadSummary() {
        APIService.getPatientHabitSummary(patientId: patientId) { result in
            DispatchQueue.main.async {
                self.isLoading = false

                switch result {
                case .success(let data):
                    guard let data = data else {
                        self.hasData = false
                        return
                    }

                    self.currentRisk = data["current_risk_percent"] as? Double ?? 0
                    self.zeroUseRisk = data["zero_use_risk_percent"] as? Double ?? 0
                    self.reductionMin = data["potential_reduction_min"] as? Int ?? 0
                    self.reductionMax = data["potential_reduction_max"] as? Int ?? 0
                    self.counselingLevel = data["counseling_level"] as? String ?? ""
                    self.messages = data["messages"] as? [String] ?? []
                    self.lastAnalyzed = "\(data["last_analyzed"] ?? "")"
                    self.hasData = true

                case .failure(let error):
                    print("Patient habit summary error: \(error)")
                    self.hasData = false
                }
            }
        }
    }

    private var riskColor: Color {
        if currentRisk > 65 { return .red }
        if currentRisk > 40 { return .orange }
        return .green
    }

    private var riskGradientColors: [Color] {
        if currentRisk > 65 { return [.red, Color(hex: "EF4444")] }
        if currentRisk > 40 { return [.orange, Color(hex: "F97316")] }
        return [.green, Color(hex: "22C55E")]
    }
}
