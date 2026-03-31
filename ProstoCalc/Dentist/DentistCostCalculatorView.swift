import SwiftUI
import UIKit

// MARK: - Design System Constants
private enum DesignSystem {
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
    }
    
    enum CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
        static let xl: CGFloat = 24
    }
    
    enum Animation {
        static let standard = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.7)
        static let quick = SwiftUI.Animation.easeInOut(duration: 0.2)
    }
}

// MARK: - Premium Analysis Result Model (Reuse from NanobotService)
// PremiumAnalysisResult is defined in NanobotService.swift

// MARK: - Haptic Feedback Manager


final class HapticManager {
    static let shared = HapticManager()
    
    // Internal generators kept in memory for faster response
    private let selectionGenerator = UISelectionFeedbackGenerator()
    private let notificationGenerator = UINotificationFeedbackGenerator()
    
    private init() {}
    
    // MARK: - Preparation
    /// Call this when a user starts a gesture (like a long press or drag)
    /// to "warm up" the Taptic Engine.
    func prepare() {
        selectionGenerator.prepare()
        notificationGenerator.prepare()
    }
    
    // MARK: - Impact Feedback
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    // MARK: - Notification Feedback
    func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notificationGenerator.prepare()
        notificationGenerator.notificationOccurred(type)
    }
    
    // MARK: - Selection Feedback
    func selection() {
        selectionGenerator.prepare()
        selectionGenerator.selectionChanged()
    }
    
    // MARK: - Clinical Convenience Aliases
    /// Use for successful data saves or clinical analysis completion
    func success() {
        notification(.success)
    }
    
    /// Use for bulk deletions or disabling treatments
    func warning() {
        notification(.warning)
    }
    
    /// Use for failed API calls or invalid data entry
    func error() {
        notification(.error)
    }
}

// MARK: - Reusable Components

/// Custom Treatment Picker Menu - replaces problematic .pickerStyle(.menu)
struct TreatmentPickerMenu: View {
    let treatments: [String]
    @Binding var selectedTreatment: String
    let isLoading: Bool
    
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        Menu {
            if isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
            } else {
                ForEach(treatments, id: \.self) { treatment in
                    Button(action: {
                        HapticManager.shared.selection()
                        selectedTreatment = treatment
                    }) {
                        HStack {
                            Text(treatment)
                            if selectedTreatment == treatment {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }
            }
        } label: {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(0.8)
                } else {
                    Text(selectedTreatment)
                        .font(.system(size: 15, weight: .semibold))
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                }
            }
            .foregroundColor(.teal)
            .padding(.horizontal, DesignSystem.Spacing.md)
            .padding(.vertical, DesignSystem.Spacing.sm + 4)
            .background(Color.teal.opacity(0.1))
            .cornerRadius(DesignSystem.CornerRadius.medium)
        }
        .disabled(isLoading)
    }
}

/// Primary Action Button
struct PrimaryActionButton: View {
    let title: String
    let icon: String
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            if !isDisabled && !isLoading {
                HapticManager.shared.impact(.medium)
                action()
            }
        }) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.9)
                } else {
                    Text(title)
                    Image(systemName: icon)
                }
            }
            .font(.system(size: 14, weight: .black))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.large)
                    .fill(isDisabled ? Color.gray : Color.teal)
            )
        }
        .disabled(isDisabled || isLoading)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(DesignSystem.Animation.quick, value: isPressed)
    }
}

/// Secondary Action Button
struct SecondaryActionButton: View {
    let title: String
    let icon: String
    let isLoading: Bool
    let isDisabled: Bool
    let isSaved: Bool
    let isSavingState: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            if !isDisabled && !isLoading {
                HapticManager.shared.impact(.medium)
                action()
            }
        }) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.9)
                } else if isSaved {
                    Text("Log Saved")
                    Image(systemName: "checkmark.circle.fill")
                } else {
                    Text(title)
                    Image(systemName: icon)
                }
            }
            .font(.system(size: 14, weight: .black))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.large)
                    .fill((isSavingState || isSaved) ? Color.gray : Color.dentalDarkBlue)
            )
        }
        .disabled(isDisabled || isSavingState || isSaved)
    }
}

// MARK: - Main View

struct DentistCostCalculatorView: View {
    // MARK: - Environment & Bindings
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Binding var selectedTab: Int
    
    // MARK: - App Storage
    @AppStorage("dentist_id") var dentistId: Int = 1
    
    // MARK: - Services
    // Using shared singleton for Nanobot service
    private let nanobotService = NanobotService.shared
    
    // MARK: - Input State
    @State private var patientIdInput: String = ""
    @State private var treatmentType = "Crown"
    @State private var teethCount = 1
    @State private var sessions = 1
    @State private var complexity: CoreMLCostEstimator.TreatmentComplexity = .medium
    @State private var material: CoreMLCostEstimator.MaterialType = .standard
    
    // MARK: - Premium Analytics State
    @State private var patientAge = 35
    @State private var hygieneRating = 7
    @State private var urgencyRating = 5
    
    // MARK: - Data & UI State
    @State private var pricelist: [String: Double] = [:]
    @State private var treatments = ["Extraction", "Crown", "Implant", "CD", "RPD", "RCT", "FMR"]
    @State private var estimation: CoreMLCostEstimator.EstimationResult?
    @State private var aiExplanation = ""
    @State private var premiumResult: PremiumAnalysisResult?
    
    // MARK: - Loading States
    @State private var isCalculating = false
    @State private var isSaving = false
    @State private var isSaved = false
    @State private var isLoadingPricing = true
    @State private var showSavedAlert = false
    
    // MARK: - Animation States
    @State private var showPremiumResult = false
    @State private var reportURL: IdentifiableURL? = nil
    
    struct IdentifiableURL: Identifiable {
        let id = UUID()
        let url: URL
    }
    
    // MARK: - Computed Properties
    private var isProcessing: Bool {
        isCalculating || isSaving
    }
    
    private var backgroundColor: Color {
        colorScheme == .dark ? Color.black : Color.dentalDarkBlue
    }
    
    private var cardBackground: Color {
        colorScheme == .dark ? Color.white.opacity(0.1) : Color.white
    }
    
    // MARK: - Body
    var body: some View {
        ZStack {
            // Background
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            // Main Content
            VStack(spacing: 0) {
                // Header
                headerView
                
                if isLoadingPricing {
                    loadingView
                } else {
                    mainContent
                }
            }
        }
        .onAppear(perform: onViewAppear)
        .onChange(of: treatmentType) { _ in updateEstimation() }
        .onChange(of: teethCount) { _ in updateEstimation() }
        .onChange(of: sessions) { _ in updateEstimation() }
        .onChange(of: complexity) { _ in updateEstimation() }
        .onChange(of: material) { _ in updateEstimation() }
        .sheet(item: $reportURL) { identifiable in
            ShareSheet(activityItems: [identifiable.url])
        }
        .alert("Estimation Saved", isPresented: $showSavedAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("The cost estimation has been logged successfully.")
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        HStack {
            Spacer()
            Text("CLINICAL COST ESTIMATOR")
                .font(.system(size: 14, weight: .black))
                .tracking(2)
                .foregroundColor(.teal)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 10)
        .padding(.bottom, DesignSystem.Spacing.lg)
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.2)
            
            Text("Syncing Clinic Pricing...")
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
        }
        .frame(maxHeight: .infinity)
    }
    
    // MARK: - Main Content
    private var mainContent: some View {
        ScrollView {
            VStack(spacing: DesignSystem.Spacing.lg) {
                // 1. Estimation Display Card
                estimationCard
                
                // 2. Configuration Section
                configurationSection
                
                // 3. Premium AI Report
                if let result = premiumResult {
                    premiumReportCard(result)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                
                // 4. AI Explanation
                if !aiExplanation.isEmpty {
                    aiExplanationCard
                }
                
                // 5. Action Buttons
                actionButtons
                
                Spacer().frame(height: 50)
            }
            .padding(.horizontal, DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Estimation Card
    private var estimationCard: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            // Main Cost Display
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("PROJECTED CLINICAL VALUE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white.opacity(0.8))
                    
                    if let est = estimation {
                        Text("₹\(est.baseCost, specifier: "%.0f")")
                            .font(.system(size: 40, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                            .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
                    } else {
                        Text("₹--")
                            .font(.system(size: 40, weight: .black, design: .rounded))
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                
                Spacer()
                
                // Variance Range
                if let est = estimation {
                    VStack(alignment: .trailing, spacing: DesignSystem.Spacing.xs) {
                        Text("VARIANCE RANGE")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                        
                        Text("₹\(est.minRange, specifier: "%.0f") - ₹\(est.maxRange, specifier: "%.0f")")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.15))
                            .cornerRadius(DesignSystem.CornerRadius.small)
                    }
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.3))
            
            // Info Row
            HStack {
                // Rate Source
                if let rate = pricelist[treatmentType] {
                    Label("Clinic Rate: ₹\(rate, specifier: "%.0f")", systemImage: "building.2.fill")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.teal)
                        .padding(.horizontal, DesignSystem.Spacing.sm)
                        .padding(.vertical, DesignSystem.Spacing.xs)
                        .background(Color.white)
                        .cornerRadius(DesignSystem.Spacing.xs)
                } else {
                    Label("Core ML Default Rate", systemImage: "cpu.fill")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))
                        .padding(.horizontal, DesignSystem.Spacing.sm)
                        .padding(.vertical, DesignSystem.Spacing.xs)
                }
                
                Spacer()
                
                // Confidence
                if let est = estimation {
                    Text("Confidence: \(Int(est.confidenceScore * 100))%")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))
                }
            }
        }
        .padding(DesignSystem.Spacing.lg)
        .background(
            LinearGradient(
                colors: [.teal, .dentalDarkBlue],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(DesignSystem.CornerRadius.xl)
        .shadow(color: .black.opacity(0.15), radius: 20, y: 10)
    }
    
    // MARK: - Configuration Section
    private var configurationSection: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            // Section Title
            Text("CONFIGURE TREATMENT VARIABLES")
                .font(.system(size: 10, weight: .black))
                .tracking(1)
                .foregroundColor(.teal)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // Configuration Card
            VStack(spacing: DesignSystem.Spacing.md) {
                // Treatment Picker - Custom Menu to prevent keyboard issues
                treatmentPickerRow
                
                Divider()
                    .padding(.vertical, DesignSystem.Spacing.sm)
                
                // Patient ID Field
                patientIdField
                
                Divider()
                    .padding(.vertical, DesignSystem.Spacing.sm)
                
                // Treatment Parameters
                treatmentParameters
                
                Divider()
                    .padding(.vertical, DesignSystem.Spacing.sm)
                
                // Patient Profile Sliders
                patientProfileSliders
            }
            .padding(DesignSystem.Spacing.lg)
            .background(cardBackground)
            .cornerRadius(DesignSystem.CornerRadius.xl)
        }
    }
    
    // MARK: - Treatment Picker Row
    private var treatmentPickerRow: some View {
        HStack {
            Text("Treatment")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.primary)
            
            Spacer()
            
            TreatmentPickerMenu(
                treatments: treatments,
                selectedTreatment: $treatmentType,
                isLoading: isLoadingPricing
            )
        }
    }
    
    // MARK: - Patient ID Field
    private var patientIdField: some View {
        TextField("Optional Patient ID", text: $patientIdInput)
            .keyboardType(.numberPad)
            .font(.system(size: 15))
            .padding(DesignSystem.Spacing.md)
            .background(cardBackground)
            .cornerRadius(DesignSystem.CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.medium)
                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
            )
            .accessibilityLabel("Optional Patient ID input")
            .accessibilityHint("Enter patient ID for record keeping")
    }
    
    // MARK: - Treatment Parameters
    private var treatmentParameters: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            // Units Stepper
            parameterRow(
                title: "UNITS (TEETH)",
                value: "\(teethCount)",
                stepperBinding: $teethCount,
                range: 1...32
            )
            
            // Sessions Stepper
            parameterRow(
                title: "SESSIONS REQ",
                value: "\(sessions)",
                stepperBinding: $sessions,
                range: 1...10
            )
            
            // Complexity Picker
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                Text("CLINICAL COMPLEXITY")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                
                Picker("Complexity", selection: $complexity) {
                    ForEach(CoreMLCostEstimator.TreatmentComplexity.allCases, id: \.self) {
                        Text($0.rawValue).tag($0)
                    }
                }
                .pickerStyle(.segmented)
                .accessibilityLabel("Clinical complexity level")
            }
            
            // Material Picker
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                Text("MATERIAL GRADE")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                
                Picker("Material", selection: $material) {
                    ForEach(CoreMLCostEstimator.MaterialType.allCases, id: \.self) {
                        Text($0.rawValue).tag($0)
                    }
                }
                .pickerStyle(.segmented)
                .accessibilityLabel("Material grade selection")
            }
        }
    }
    
    // MARK: - Parameter Row Helper
    private func parameterRow(title: String, value: String, stepperBinding: Binding<Int>, range: ClosedRange<Int>) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)
            
            Spacer()
            
            Stepper(value: stepperBinding, in: range) {
                Text(value)
                    .font(.system(size: 15, weight: .semibold))
            }
            .fixedSize()
            .accessibilityLabel("\(title): \(value)")
        }
    }
    
    // MARK: - Patient Profile Sliders
    private var patientProfileSliders: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("PATIENT PROFILE")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.teal)
            
            // Age Slider
            sliderRow(
                title: "Age",
                value: Binding(
                    get: { Double(patientAge) },
                    set: { patientAge = Int($0) }
                ),
                range: 1...100,
                valueDisplay: "\(patientAge)"
            )
            
            // Hygiene Slider
            sliderRow(
                title: "Hygiene",
                value: Binding(
                    get: { Double(hygieneRating) },
                    set: { hygieneRating = Int($0) }
                ),
                range: 1...10,
                valueDisplay: "\(hygieneRating)/10"
            )
            
            // Urgency Slider
            sliderRow(
                title: "Urgency",
                value: Binding(
                    get: { Double(urgencyRating) },
                    set: { urgencyRating = Int($0) }
                ),
                range: 1...10,
                valueDisplay: "\(urgencyRating)/10"
            )
        }
        .padding(.top, DesignSystem.Spacing.sm)
    }
    
    // MARK: - Slider Row Helper
    private func sliderRow(title: String, value: Binding<Double>, range: ClosedRange<Double>, valueDisplay: String) -> some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Slider(value: value, in: range, step: 1)
                .tint(.teal)
                .accessibilityLabel("\(title) slider")
            
            Text(valueDisplay)
                .font(.caption)
                .foregroundColor(.primary)
                .frame(width: 40, alignment: .trailing)
        }
    }
    
    // MARK: - Premium Report Card
    private func premiumReportCard(_ result: PremiumAnalysisResult) -> some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            // Header
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("PREMIUM CLINICAL SCORE")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.teal)
                    Text("PERSONAL DENTAL HEALTH SCORE")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.dentalDarkBlue)
                }
                
                Spacer()
                
                // Circular Score
                ZStack {
                    Circle()
                        .stroke(Color.teal.opacity(0.1), lineWidth: 8)
                        .frame(width: 70, height: 70)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(result.healthScore) / 100)
                        .stroke(
                            LinearGradient(colors: [.teal, .cyan], startPoint: .top, endPoint: .bottom),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 70, height: 70)
                        .rotationEffect(.degrees(-90))
                    
                    VStack(spacing: -2) {
                        Text("\(result.healthScore)")
                            .font(.system(size: 20, weight: .black, design: .rounded))
                        Text("pts")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    .foregroundColor(.dentalDarkBlue)
                }
                .shadow(color: .teal.opacity(0.2), radius: 5, y: 3)
            }
            
            // Premium Badge
            HStack {
                Label("PREMIUM AI ANALYSIS", systemImage: "crown.fill")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(.white)
                    .padding(.horizontal, DesignSystem.Spacing.sm)
                    .padding(.vertical, DesignSystem.Spacing.xs)
                    .background(Color.dentalDarkBlue)
                    .cornerRadius(DesignSystem.Spacing.xs)
                
                Spacer()
            }
            
            // Escalation Warning
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                HStack {
                    Image(systemName: "flame.fill").foregroundColor(.orange)
                    Text("COST ESCALATION PREDICTOR")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(.orange)
                }
                
                Text("AI warns: \"If treatment is delayed by 6 months, expected cost may increase by \(result.escalationPercentage)%–\(result.escalationPercentage + 15)%.\"")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.orange.opacity(0.8))
                    .padding(DesignSystem.Spacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(DesignSystem.CornerRadius.medium)
                
                Text(result.delayWarning)
                    .font(.system(size: 12))
                    .italic()
                    .foregroundColor(.secondary)
            }
            
            // Improvement Tips
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                Text("RESTORATIVE STRATEGY TIPS")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(.secondary)
                
                ForEach(result.improvementTips, id: \.self) { tip in
                    HStack(alignment: .top) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.teal)
                            .font(.system(size: 12))
                        Text(tip)
                            .font(.system(size: 12))
                            .foregroundColor(.primary)
                    }
                }
            }
            
            // Share Button
            Button(action: shareReport) {
                HStack {
                    Text("Generate Sharable Patient Report")
                    Image(systemName: "square.and.arrow.up")
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.teal)
                .padding(.vertical, DesignSystem.Spacing.sm + 2)
                .frame(maxWidth: .infinity)
                .background(Color.teal.opacity(0.1))
                .cornerRadius(DesignSystem.CornerRadius.medium)
            }
            .padding(.top, DesignSystem.Spacing.xs)
        }
        .padding(DesignSystem.Spacing.lg)
        .background(cardBackground)
        .cornerRadius(DesignSystem.CornerRadius.xl)
        .shadow(color: .black.opacity(0.06), radius: 15, x: 0, y: 10)
    }
    
    // MARK: - AI Explanation Card
    private var aiExplanationCard: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.dentalDarkBlue)
                Text("AI CLINICAL JUSTIFICATION")
                    .font(.system(size: 12, weight: .black))
                    .foregroundColor(.dentalDarkBlue)
            }
            
            let cleanText = aiExplanation
                .replacingOccurrences(of: "```markdown", with: "")
                .replacingOccurrences(of: "```", with: "")
            
            Text(LocalizedStringKey(cleanText))
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.primary)
                .lineSpacing(4)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .padding(DesignSystem.Spacing.md)
                .background(Color.teal.opacity(0.1))
                .cornerRadius(DesignSystem.CornerRadius.medium)
            
            if isSaved {
                HStack {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(.teal)
                    Text("Logged to Database")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary)
                }
                .padding(.top, DesignSystem.Spacing.xs)
            }
        }
        .padding(DesignSystem.Spacing.lg)
        .background(cardBackground)
        .cornerRadius(DesignSystem.CornerRadius.xl)
        .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
    }
    
    // MARK: - Action Buttons
    private var actionButtons: some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            PrimaryActionButton(
                title: "Analyze",
                icon: "brain.head.profile",
                isLoading: isCalculating,
                isDisabled: isCalculating || isSaving,
                action: analyzeEstimate
            )
            
            SecondaryActionButton(
                title: "Save Log",
                icon: "arrow.down.doc.fill",
                isLoading: isSaving,
                isDisabled: isSaving,
                isSaved: isSaved,
                isSavingState: isSaving,
                action: saveLog
            )
        }
    }
    
    // MARK: - Lifecycle Methods
    private func onViewAppear() {
        loadPricing()
    }
    
    // MARK: - Data Loading
    private func loadPricing() {
        // Set defaults immediately to prevent empty state
        treatments = ["Extraction", "Crown", "Implant", "CD", "RPD", "RCT", "FMR"]
        treatmentType = "Crown"
        
        APIService.getTreatmentCatalog(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                self.isLoadingPricing = false
                
                if case .success(let data) = result {
                    var prices: [String: Double] = [:]
                    var uniqueNames = Set<String>()
                    var orderedNames: [String] = []
                    
                    for item in data {
                        guard let name = item["name"] as? String else { continue }
                        
                        // Map long DB names to short App keys
                        var key = name
                        if name.contains("(CD)") { key = "CD" }
                        else if name.contains("(RPD)") { key = "RPD" }
                        else if name.contains("(RCT)") { key = "RCT" }
                        else if name.contains("(FMR)") { key = "FMR" }
                        
                        // Only add if unique
                        if !uniqueNames.contains(key) {
                            uniqueNames.insert(key)
                            orderedNames.append(key)
                        }
                        
                        // Prioritize custom_cost, then default_cost
                        if let custom = item["custom_cost"] as? Double, custom > 0 {
                            prices[key] = custom
                        } else if let customStr = item["custom_cost"] as? String,
                                  let d = Double(customStr), d > 0 {
                            prices[key] = d
                        } else if let def = item["default_cost"] as? Double {
                            prices[key] = def
                        }
                    }
                    
                    if !orderedNames.isEmpty {
                        self.treatments = orderedNames
                        if !orderedNames.contains(self.treatmentType) {
                            self.treatmentType = orderedNames[0]
                        }
                    }
                    
                    self.pricelist = prices
                    self.updateEstimation()
                } else {
                    self.updateEstimation()
                }
            }
        }
    }
    
    // MARK: - Estimation Update
    private func updateEstimation() {
        // Guard against invalid states
        guard !treatments.isEmpty else { return }
        guard treatments.contains(treatmentType) else { return }
        
        withAnimation(DesignSystem.Animation.standard) {
            self.estimation = CoreMLCostEstimator.estimate(
                treatmentType: treatmentType,
                teethCount: teethCount,
                sessions: sessions,
                complexity: complexity,
                material: material,
                patientAge: patientAge,
                hygieneRating: hygieneRating,
                urgencyRating: urgencyRating,
                customPricelist: pricelist
            )
            self.isSaved = false
        }
    }
    
    // MARK: - Analyze Action
    private func analyzeEstimate() {
        guard let est = estimation else { return }
        
        isCalculating = true
        isSaved = false
        premiumResult = nil
        
        let context = AssistantContext(
            treatmentName: treatmentType,
            estimatedCost: est.baseCost,
            numberOfVisits: sessions,
            clinicType: "ProstoCalc Estimate",
            toothDetails: "\(teethCount) Teeth / \(complexity.rawValue) Complexity / \(material.rawValue) Material",
            patientAge: patientAge,
            hygieneRating: hygieneRating,
            urgencyRating: urgencyRating
        )
        
        // Parallel Analysis
        let group = DispatchGroup()
        
        group.enter()
        nanobotService.generateSmartExplanation(context: context, isDetailed: true) { result in
            DispatchQueue.main.async {
                if case .success(let explanation) = result {
                    self.aiExplanation = explanation
                }
                group.leave()
            }
        }
        
        group.enter()
        nanobotService.generatePremiumAnalysis(context: context) { result in
            DispatchQueue.main.async {
                if case .success(let premium) = result {
                    self.premiumResult = premium
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        // Trigger animation via state change
                    }
                }
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            self.isCalculating = false
            HapticManager.shared.notification(.success)
        }
    }
    
    // MARK: - Save Action
    private func saveLog() {
        guard !isSaving, !isSaved else { return }
        guard let est = estimation else { return }
        
        let finalExplanation = aiExplanation.isEmpty
            ? "Standard cost estimation calculated based on clinic parameters."
            : aiExplanation
        
        isSaving = true
        
        let pid = Int(patientIdInput)
        let payload: [String: Any] = [
            "user_id": dentistId,
            "patient_id": pid ?? NSNull(),
            "dentist_id": dentistId,
            "total_cost": est.baseCost,
            "confidence": est.confidenceScore,
            "mode": "calculator",
            "explanation": finalExplanation,
            "language": "en",
            "context": "calculator",
            "items": [[
                "name": treatmentType,
                "cost": est.baseCost / Double(teethCount),
                "quantity": teethCount,
                "subtotal": est.baseCost,
                "source": pricelist[treatmentType] != nil ? "dentist_catalog" : "ai_adjusted"
            ]]
        ]
        
        APIService.saveCostEstimation(data: payload) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    self.isSaving = false
                    self.isSaved = true
                    HapticManager.shared.notification(.success)
                    
                    // Navigate to Dashboard after 1 second
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                        self.selectedTab = 0
                    }
                case .failure:
                    self.isSaving = false
                    HapticManager.shared.notification(.error)
                }
            }
        }
    }
    
    // MARK: - Share Action
    private func shareReport() {
        guard let est = estimation, let premium = premiumResult else { return }
        HapticManager.shared.impact(.heavy)
        
        let content = PDFReportContent(
            patientName: patientIdInput.isEmpty ? "Patient #\(Int.random(in: 1000...9999))" : "Patient ID: \(patientIdInput)",
            toothDetails: "\(teethCount) Teeth",
            treatmentName: treatmentType,
            totalCost: String(format: "%.0f", est.baseCost),
            visits: "\(sessions) (Estimated)",
            urgency: "\(urgencyRating)/10",
            healthScore: premium.healthScore,
            escalationRisk: premium.escalationPercentage,
            aiExplanation: aiExplanation,
            tips: premium.improvementTips
        )
        
        if let url = PDFGeneratorService.shared.generateClinicalReport(content: content) {
            self.reportURL = IdentifiableURL(url: url)
        }
    }
}

// MARK: - Preview
#Preview {
    DentistCostCalculatorView(selectedTab: .constant(3))
}
