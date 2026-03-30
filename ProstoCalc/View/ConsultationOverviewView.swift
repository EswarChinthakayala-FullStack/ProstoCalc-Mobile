import SwiftUI

struct ConsultationOverviewView: View {
    let requestId: Int
    let patientId: Int
    let dentistId: Int
    let patientName: String
    let dentistName: String
    let chatId: Int
    let role: String // "DENTIST" or "PATIENT"
    let status: String
    
    @Environment(\.dismiss) var dismiss
    @State private var showPlan = false
    @State private var showTimeline = false
    @State private var showChat = false
    @State private var showNotes = false
    @State private var notes: String = ""
    
    // Plan State
    @State private var existingPlan: [String: Any]? = nil
    @State private var isLoadingPlan = true
    
    // Engagement Analytics State
    @State private var engagement: [String: Any]? = nil
    @State private var isLoadingEngagement = true
    @State private var showHabitAnalyzer = false

    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: role == "DENTIST")
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 25) {
                    // Header Card
                    headerSection
                    

                    
                    // Dashboard Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                        overviewTile(
                            title: "Chat",
                            subtitle: "Secure Messaging",
                            icon: "bubble.left.and.bubble.right.fill",
                            color: .blue,
                            action: { showChat = true }
                        )
                        
                        overviewTile(
                            title: role == "DENTIST" ? (existingPlan == nil ? "Design Plan" : "Review Plan") : "Treatment Plan",
                            subtitle: existingPlan == nil ? "Initial Options" : "AI Managed Plan",
                            icon: existingPlan == nil ? "pencil.and.outline" : "doc.text.magnifyingglass",
                            color: .indigo,
                            action: { showPlan = true }
                        )
                        
                        overviewTile(
                            title: "History",
                            subtitle: "Clinical Timeline",
                            icon: "clock.badge.checkmark.fill",
                            color: .teal,
                            action: { showTimeline = true }
                        )
                        
                        overviewTile(
                            title: "Clinical Notes",
                            subtitle: "Confidential",
                            icon: "note.text",
                            color: .orange,
                            action: { showNotes = true }
                        )
                        if role == "DENTIST" {
                            overviewTile(
                                title: "Habit Analyzer",
                                subtitle: "AI Risk Engine",
                                icon: "waveform.path.ecg.rectangle.fill",
                                color: .purple,
                                action: { showHabitAnalyzer = true }
                            )
                        }
                        

                    }
                    .padding(.horizontal)
                    
                    // Quick Info Section
                    infoSection
                }
                .padding(.vertical)
            }
        }
        .navigationTitle("Clinical Hub")
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
            ToolbarItem(placement: .principal) {
                Text("ACTIVITY NODE #\(requestId)")
                    .font(.system(size: 10, weight: .black))
                    .tracking(2)
                    .foregroundColor(.secondary)
            }
        }
        .fullScreenCover(isPresented: $showChat) {
            SecureChatView(
                chatId: chatId,
                requestId: requestId,
                otherPartyName: role == "DENTIST" ? patientName : dentistName,
                myRole: role
            )
        }
        .fullScreenCover(isPresented: $showPlan) {
            if role == "DENTIST" {
                TreatmentPlanBuilderView(
                    dentistId: dentistId,
                    patientId: patientId,
                    patientName: patientName,
                    dentistName: dentistName,
                    requestId: requestId
                )
            } else {
                if let data = existingPlan {
                    PatientTreatmentPlanView(planData: data)
                } else {
                    noPlanPlaceholder
                }
            }
        }
        .fullScreenCover(isPresented: $showTimeline) {
            TreatmentTimelineView(requestId: requestId, isDentist: role == "DENTIST")
        }
        .fullScreenCover(isPresented: $showNotes) {
            PremiumNotesView(requestId: requestId, notes: $notes)
        }
        .fullScreenCover(isPresented: $showHabitAnalyzer) {
            NavigationStack {
                HabitImpactAnalyzerView(patientId: patientId, patientName: patientName, dentistId: dentistId)
            }
        }
        .fullScreenCover(isPresented: $showAIProgress) {
            AnalysisHistoryView(history: ExerciseService.shared.aiHistory, isPresented: $showAIProgress)
        }
        .onAppear {
            loadPlanStatus()
            Task {
                await ExerciseService.shared.fetchAIHistory(userId: patientId)
            }
        }
    }
    
    @State private var showAIProgress = false
    
    private var noPlanPlaceholder: some View {
        ZStack {
            DentalBackgroundView(animate: false, isDentist: false).ignoresSafeArea()
            VStack(spacing: 25) {
                ZStack {
                    Circle().fill(Color.indigo.opacity(0.1)).frame(width: 100, height: 100)
                    Image(systemName: "doc.text.magnifyingglass").font(.system(size: 40)).foregroundColor(.indigo)
                }
                Text("No active treatment plan found.")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                Text("Your clinician is currently designing your personalized AI-driven treatment journey.")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                Button("Got it") { showPlan = false }
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.indigo)
                    .padding(.top, 20)
            }
        }
    }
    
    private func loadPlanStatus() {
        self.isLoadingPlan = true
        APIService.getTreatmentPlan(requestId: requestId) { result in
            DispatchQueue.main.async {
                self.isLoadingPlan = false
                if case .success(let data) = result {
                    self.existingPlan = data
                    if let pNotes = data?["clinical_notes"] as? String {
                        self.notes = pNotes
                    }
                }
            }
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 25) {
            // 1. Profile Identity Section
            VStack(spacing: 16) {
                ZStack {
                    // Outer Glow matching the Dental Background
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.teal.opacity(0.15), .teal.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 90, height: 90)
                    
                    // Professional Avatar with Border
                    ZStack {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 70, height: 70)
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                        
                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 62, height: 62)
                            .symbolRenderingMode(.hierarchical)
                            .foregroundColor(.teal)
                    }
                }
                
                VStack(spacing: 4) {
                    Text(role == "DENTIST" ? patientName : dentistName)
                        .font(.system(size: 26, weight: .black, design: .rounded))
                        .foregroundColor(.primary)
                    
                    HStack(spacing: 8) {
                        Text(role == "DENTIST" ? "CLINICAL PATIENT" : "HEALTHCARE PROVIDER")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(.secondary)
                        
                        Text("•")
                            .foregroundColor(.teal.opacity(0.5))
                        
                        Text("ID: #\(requestId)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.teal)
                    }
                }
            }
            
            // 2. Status & Appointment Quick-View
            VStack(spacing: 20) {
                // Status Badge Row
                HStack {
                    let vStatus = existingPlan?["visit_status"] as? String
                    let isRescheduled = existingPlan?["rescheduled_from"] != nil
                    
                    // Logic derived from displayLabel and displayColor in original code
                    let (label, color) = getStatusDetails(status: vStatus, isRescheduled: isRescheduled)
                    
                    HStack(spacing: 6) {
                        Circle()
                            .fill(color)
                            .frame(width: 8, height: 8)
                        
                        Text(label)
                            .font(.system(size: 10, weight: .black))
                            .tracking(0.5)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(color.opacity(0.1))
                    .foregroundColor(color)
                    .clipShape(Capsule())
                    
                    Spacer()
                    
                    // Minimalist "Registry" Pill Accent
                    Capsule()
                        .fill(Color.teal.opacity(0.2))
                        .frame(width: 24, height: 4)
                }
                
                // Appointment Detail Card
                if let date = existingPlan?["scheduled_date"] as? String, !date.isEmpty {
                    let vStatus = existingPlan?["visit_status"] as? String
                    let appDetails = getAppointmentMeta(date: date, vStatus: vStatus)
                    
                    HStack(spacing: 15) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(appDetails.color.opacity(0.1))
                                .frame(width: 44, height: 44)
                            
                            Image(systemName: vStatus == "visited" ? "checkmark.seal.fill" : "calendar.badge.clock")
                                .font(.system(size: 18))
                                .foregroundColor(appDetails.color)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(appDetails.label)
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.secondary.opacity(0.7))
                                .tracking(1)
                            
                            Text("\(date.formattedDate()) @ \((existingPlan?["scheduled_time"] as? String ?? "TBD").formattedTime())")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundColor(.primary)
                        }
                        
                        Spacer()
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.5))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.05), lineWidth: 1))
                }
            }
            
            // 3. Professional Adjustment Alert (Postponement)
            if let originalDate = existingPlan?["original_date"] as? String {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        Image(systemName: "clock.arrow.2.circlepath")
                            .font(.system(size: 12, weight: .bold))
                        Text("SCHEDULE ADJUSTMENT")
                            .font(.system(size: 9, weight: .black))
                            .tracking(1)
                    }
                    .foregroundColor(.orange)
                    
                    Text("Postponed from original slot on \(originalDate.formattedDate()).")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    if let reason = existingPlan?["postpone_reason"] as? String, !reason.isEmpty {
                        Text(reason)
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.orange.opacity(0.1))
                            .foregroundColor(.orange)
                            .cornerRadius(8)
                    }
                }
                .padding(15)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.orange.opacity(0.03))
                .cornerRadius(16)
              
            }
        }
        .padding(25)
        .frame(maxWidth: .infinity)
        .background(
            ZStack {
                // Glass Surface
                RoundedRectangle(cornerRadius: 32)
                    .fill(Color.white.opacity(0.8))
                
                // Subtle Teal Glow to match background
                RoundedRectangle(cornerRadius: 32)
                    .stroke(
                        LinearGradient(
                            colors: [.teal.opacity(0.2), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.5
                    )
            }
        )
        .shadow(color: Color.black.opacity(0.04), radius: 20, x: 0, y: 10)
        .padding(.horizontal, 16)
    }

    // MARK: - Refactored Helpers for Design Cleanliness

    private func getStatusDetails(status: String?, isRescheduled: Bool) -> (String, Color) {
        guard let vs = status else { return ("UNKNOWN", .gray) }
        switch vs {
        case "scheduled": return (isRescheduled ? "RESCHEDULED" : "ON SCHEDULE", isRescheduled ? .indigo : .blue)
        case "arrived": return ("PATIENT ARRIVED", .blue)
        case "in_progress": return ("IN CHAIR", .purple)
        case "visited": return ("VISIT COMPLETED", .green)
        case "postponed": return ("POSTPONED", .orange)
        case "not_visited": return ("NO SHOW", .red)
        case "cancelled": return ("CANCELLED", .gray)
        default: return (vs.uppercased(), .gray)
        }
    }

    private func getAppointmentMeta(date: String, vStatus: String?) -> (label: String, color: Color) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let now = Calendar.current.startOfDay(for: Date())
        let appDate = formatter.date(from: date) ?? now
        
        if vStatus == "visited" { return ("LAST VISIT", .green) }
        if vStatus == "postponed" { return ("POSTPONED SLOT", .orange) }
        if appDate < now { return ("PAST APPOINTMENT", .secondary) }
        if appDate == now { return ("CURRENT APPOINTMENT", .blue) }
        return ("NEXT APPOINTMENT", .blue)
    }
    
    private func overviewTile(title: String, subtitle: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: {
            // Haptic feedback for a premium feel
            let impact = UIImpactFeedbackGenerator(style: .medium)
            impact.impactOccurred()
            action()
        }) {
            VStack(alignment: .leading, spacing: 18) {
                // 1. Header: Icon Backdrop & Modern Pill Accent
                HStack(alignment: .top) {
                    ZStack {
                        Circle()
                            .fill(color.opacity(0.12))
                            .frame(width: 42, height: 42)
                        
                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(color)
                    }
                    
                    Spacer()
                    
                    // The signature "Registry" pill accent
                    Capsule()
                        .fill(color.opacity(0.2))
                        .frame(width: 24, height: 4)
                }
                
                // 2. Data Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    Text(subtitle.uppercased())
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(1.2)
                        .foregroundColor(.secondary.opacity(0.7))
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                ZStack {
                    // High-end glassmorphism surface
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.white)
                    
                    // Subtle gradient depth
                    RoundedRectangle(cornerRadius: 24)
                        .fill(
                            LinearGradient(
                                colors: [color.opacity(0.05), .clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    // Refined border stroke
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(color.opacity(0.15), lineWidth: 1)
                }
            )
            // Soft shadow to match the registry dashboard depth
            .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 6)
        }
        .buttonStyle(PlainButtonStyle())
        .contentShape(Rectangle()) // Ensures the whole tile is tappable
    }
    
    private var infoSection: some View {
            VStack(alignment: .leading, spacing: 20) {
                // 1. Section Header with Clinical Icon
                HStack(spacing: 8) {
                    Image(systemName: "chart.pie.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.teal)
                    
                    Text("QUICK INSIGHTS")
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.5)
                        .foregroundColor(.teal.opacity(0.8))
                    
                    Spacer()
                    
                    Text("Live Data")
                        .font(.system(size: 8, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.teal.opacity(0.1))
                        .cornerRadius(5)
                        .foregroundColor(.teal)
                }
                .padding(.horizontal, 5)
                
                let items = existingPlan?["items"] as? [[String: Any]] ?? []
                let totalCost: Double = items.reduce(0.0) { acc, item in
                    let costStr = String(describing: item["cost"] ?? "0")
                    return acc + (Double(costStr) ?? 0.0)
                }
                let totalSessions: Int = items.count
                
                // 2. Grid-style Stat Items
                HStack(spacing: 12) {
                    statInsightItem(
                        label: "SESSIONS",
                        value: "\(totalSessions)",
                        icon: "calendar.badge.clock",
                        color: .teal
                    )
                    
                    statInsightItem(
                        label: "EST. TOTAL",
                        value: "₹\(Int(totalCost))",
                        icon: "indianrupeesign.circle.fill",
                        color: .indigo
                    )
                    
                    statInsightItem(
                        label: "RISK LEVEL",
                        value: totalCost > 10000 ? "MODERATE" : "LOW",
                        icon: "exclamationmark.shield.fill",
                        color: totalCost > 10000 ? .orange : .green
                    )
                }
            }
            .padding(20)
            .background(
                ZStack {
                    // Glassmorphic background to match Registry
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.white.opacity(0.7))
                    
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(Color.teal.opacity(0.1), lineWidth: 1)
                }
            )
            .padding(.horizontal)
            .shadow(color: Color.black.opacity(0.03), radius: 15, x: 0, y: 10)
        }

        // MARK: - Sub-component for individual insights
        private func statInsightItem(label: String, value: String, icon: String, color: Color) -> some View {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    ZStack {
                        Circle()
                            .fill(color.opacity(0.1))
                            .frame(width: 28, height: 28)
                        Image(systemName: icon)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(color)
                    }
                    Spacer()
                    Capsule()
                        .fill(color.opacity(0.2))
                        .frame(width: 15, height: 3)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(value)
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundColor(.primary)
                        .minimumScaleFactor(0.8)
                        .lineLimit(1)
                    
                    Text(label)
                        .font(.system(size: 7, weight: .heavy))
                        .tracking(0.5)
                        .foregroundColor(.secondary.opacity(0.7))
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.5))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(color.opacity(0.05), lineWidth: 1)
            )
        }
    
    private func getStatusColor() -> Color {
        switch status.uppercased() {
        case "APPROVED": return .green
        case "PENDING": return .orange
        case "REJECTED": return .red
        default: return .gray
        }
    }
    /* fetchEngagement() removed - streak no longer shown in overview */
}

struct StatViewItem: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 16, weight: .black, design: .rounded))
                .foregroundColor(.primary)
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.secondary)
        }
    }
}


