import SwiftUI
import MapKit
import CoreLocation

struct PatientDashboardView: View {
    @Environment(\.dismiss) var dismiss
    var patientId: Int
    var onLogout: () -> Void
    
    @State private var patientData: [String: Any]?
    @State private var isLoading = true
    @State private var showDoctorDetails = false
    @State private var showProfileCompletion = false
    @State private var unreadNotificationsCount = 0
    @State private var showNotifications = false
    @State private var selectedTab = 0 // 0: Home, 1: Nearby, 2: AI, 3: Hub, 4: Profile
    @State private var latestConsultation: [String: Any]? = nil
    
    
    private var isProfileComplete: Bool {
        guard let data = patientData else { return true }
        if let age = data["age"] as? Int {
            return age != 0
        }
        if let ageStr = data["age"] as? String, let age = Int(ageStr) {
            return age != 0
        }
        return false
    }
    
    var body: some View {
        ZStack(alignment: .bottom) {
            // Background
            DentalBackgroundView(animate: true)
                .ignoresSafeArea()
            
            if isLoading {
                ProgressView("Synchronizing Data Nodes...")
                    .tint(.dentalDarkBlue)
            } else {
                NavigationStack {
                    VStack(spacing: 0) {
                        // Content Area based on Selected Tab
                        Group {
                            switch selectedTab {
                            case 0:
                                dashboardHome
                            case 1:
                                ClinicRadarView(patientId: patientId, patientData: patientData, isTabRoot: true, onBack: { selectedTab = 0 })
                            case 2:
                                PuterChatView(
                                    userId: String(describing: patientId), 
                                    role: "patient", 
                                    userName: patientData?["full_name"] as? String ?? "Patient", 
                                    isTabRoot: true, 
                                    onBack: { selectedTab = 0 },
                                    treatmentName: latestConsultation?["treatment_name"] as? String,
                                    estimatedCost: Double(String(describing: latestConsultation?["estimated_cost"] ?? "0")),
                                    numberOfVisits: Int(String(describing: latestConsultation?["number_of_visits"] ?? "1"))
                                )
                            case 3:
                                PatientHubView()
                            case 4:
                                BriefDetailPage(profileData: patientData ?? [:], isDentist: false, isTabRoot: true, onBack: { selectedTab = 0 }, onLogout: onLogout) {
                                    fetchPatientDetails()
                                }
                            default:
                                dashboardHome
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .navigationBarHidden(true)
                        
                        // Premium Bottom Menu Bar
                        bottomMenuBar
                    }
                }
            }
        }
        .onAppear { 
            fetchPatientDetails()
        }

        .onChange(of: isLoading) { newValue in
            if !newValue && !isProfileComplete {
                showProfileCompletion = true
            }
        }
        .fullScreenCover(isPresented: $showProfileCompletion) {
            PatientProfileCompletionView(patientId: patientId, onComplete: {
                showProfileCompletion = false
                fetchPatientDetails()
            })
        }
        .sheet(isPresented: $showDoctorDetails) {
            DoctorDetailView(doctorData: [
                "name": patientData?["doctor_name"] as? String ?? "Unknown Clinician",
                "clinic": patientData?["clinic_name"] as? String ?? "N/A",
                "license": patientData?["license_number"] as? String ?? "N/A",
                "email": patientData?["doctor_email"] as? String ?? "N/A"
            ])
        }
    }
    
    private var dashboardHome: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Simplified Header
                HStack {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("PROTOCOL ACTIVE")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(.blue)
                        Text("Welcome Back, \(patientData?["full_name"] as? String ?? "Patient")")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                    
                    HStack(spacing: 15) {
                        Button(action: { showNotifications = true }) {
                            ZStack {
                                Image(systemName: "bell.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(.blue)
                                    .frame(width: 44, height: 44)
                                    .background(Color.blue.opacity(0.1))
                                    .clipShape(Circle())
                                
                                if unreadNotificationsCount > 0 {
                                    Circle()
                                        .fill(Color.red)
                                        .frame(width: 10, height: 10)
                                        .offset(x: 10, y: -10)
                                }
                            }
                        }
                        
                        Button(action: { selectedTab = 4 }) {
                            ZStack {
                                Circle().fill(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)).frame(width: 44, height: 44)
                                Text(String((patientData?["full_name"] as? String ?? "P").prefix(1)))
                                    .font(.system(size: 18, weight: .black))
                                    .foregroundColor(.white)
                            }
                        }
                    }
                }
                .fullScreenCover(isPresented: $showNotifications) {
                    NotificationsView(userId: patientId, userType: "PATIENT")
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                
                // Status Card
                VStack(alignment: .leading, spacing: 15) {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle().fill(.white.opacity(0.2)).frame(width: 40, height: 40)
                            Image(systemName: "shield.lefthalf.filled").foregroundColor(.white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("HEALTH CARD STATUS")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.white.opacity(0.7))
                            Text(isProfileComplete ? "FULLY SYNCHRONIZED" : "PENDING DATA SYNC")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                    Text("Neural diagnostics active for \(patientData?["city"] as? String ?? "Unknown Node").")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.9))
                }
                .padding(24)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                .cornerRadius(28)
                .shadow(color: .blue.opacity(0.2), radius: 10, y: 5)
                .padding(.horizontal, 20)
                
                
                // MARK: - Health Trackers Access Card
                NavigationLink(destination: HealthTrackersDashboardView(patientId: patientId, patientName: patientData?["full_name"] as? String ?? "Patient")) {
                    HStack(spacing: 0) {
                        // 1. Signature Vertical Accent Bar (Progress Orange)
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [.orange, .orange.opacity(0.7)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 4.5)
                        
                        HStack(spacing: 16) {
                            // 2. Icon Backdrop (Clinical Inner-Shadow Style)
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.orange.opacity(0.08))
                                    .frame(width: 48, height: 48)
                                
                                Image(systemName: "chart.xyaxis.line")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.orange)
                            }
                            
                            // 3. Clinical Typography
                            VStack(alignment: .leading, spacing: 3) {
                                Text("VITAL ANALYTICS")
                                    .font(.system(size: 9, weight: .bold, design: .rounded))
                                    .kerning(1.2)
                                    .foregroundColor(.secondary.opacity(0.8))
                                
                                Text("Health Trackers")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Monitor progress & medical logs")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.secondary.opacity(0.7))
                            }
                            
                            Spacer()
                            
                            // 4. Action Indicator
                            ZStack {
                                Circle()
                                    .fill(Color.gray.opacity(0.05))
                                    .frame(width: 28, height: 28)
                                
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.orange.opacity(0.6))
                            }
                        }
                        .padding(.vertical, 14)
                        .padding(.horizontal, 16)
                    }
                    .background(
                        ZStack {
                            Color.white
                            // Subtle internal gradient for depth
                            LinearGradient(
                                colors: [Color.orange.opacity(0.02), .clear],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        }
                    )
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.black.opacity(0.03), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 6)
                    .padding(.horizontal, 20)
                }
                .buttonStyle(.plain) // Removes default highlight to keep clinical look
                
                
                
                // MARK: - DASHBOARD ACCESS MODULES

                VStack(spacing: 16) {
                    
                    // 1. THERAPY TRAINING ACCESS (Green)
                    NavigationLink(destination: ExerciseTrainerView(patientId: patientId)) {
                        ClinicalModuleCard(
                            title: "THERAPY TRAINING",
                            subtitle: "Guided Mouth Exercises & Recovery",
                            category: "ACTIVE REHAB",
                            icon: "figure.strengthtraining.functional",
                            color: .green,
                            showLiveBadge: true
                        )
                    }

                    // 2. CLINICAL JOURNEY HUB (Purple)
                    NavigationLink(destination: ClinicalHubWrapper(patientId: patientId)) {
                        ClinicalModuleCard(
                            title: "CLINICAL JOURNEY",
                            subtitle: "Track treatment, AI plans & history",
                            category: "PATIENT RECORDS",
                            icon: "sparkles.rectangle.stack.fill",
                            color: .purple
                        )
                    }

                    // 3. MEDICATION SCHEDULE (Blue)
                    NavigationLink(destination: MedicationCalendarView(patientId: patientId)) {
                        ClinicalModuleCard(
                            title: "MEDICATION SCHEDULE",
                            subtitle: "View dose timings & history",
                            category: "PHARMA LOGS",
                            icon: "calendar.badge.clock",
                            color: .blue
                        )
                    }
                }
                .padding(.horizontal, 20)

                // MARK: - REUSABLE CLINICAL MODULE COMPONENT
            
                // MARK: - DOSSIER & RADAR NODES
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 16), GridItem(.flexible(), spacing: 16)], spacing: 16) {
                    
                    // Clinic Radar Node
                    Button(action: { selectedTab = 1 }) {
                        ClinicalNodeItem(
                            icon: "mappin.and.ellipse",
                            title: "Clinic Radar",
                            subtitle: "SECURE GEOLOCATION",
                            color: .blue,
                            badge: "LIVE"
                        )
                    }
                    
                    // Treatment Plan Node
                    NavigationLink(destination: ClinicalHubWrapper(patientId: patientId)) {
                        ClinicalNodeItem(
                            icon: "doc.text.fill.viewfinder",
                            title: "Review Plan",
                            subtitle: "AI MANAGED PLAN",
                            color: .cyan,
                            badge: "PROSTO"
                        )
                    }
                }
                .padding(.horizontal, 20)
                
                Spacer().frame(height: 100)
            }
        }
    }
    
    private var bottomMenuBar: some View {
        HStack(spacing: 0) {
            TabItem(icon: "house.fill", title: "Home", isSelected: selectedTab == 0) {
                selectedTab = 0
            }
            
            TabItem(icon: "mappin.and.ellipse", title: "Nearby", isSelected: selectedTab == 1) {
                selectedTab = 1
            }
            
            // Central Floating Action Button (FAB)
            Button(action: {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                    selectedTab = 2
                }
            }) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.blue, .cyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        .shadow(color: .blue.opacity(selectedTab == 2 ? 0.6 : 0.3),
                                radius: selectedTab == 2 ? 15 : 10,
                                y: selectedTab == 2 ? 8 : 5)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(.white)
                        .rotationEffect(.degrees(selectedTab == 2 ? 15 : 0))
                        .scaleEffect(selectedTab == 2 ? 1.1 : 1.0)
                }
                .offset(y: -20)
            }
            .frame(maxWidth: .infinity)
            
            TabItem(icon: "text.book.closed.fill", title: "Hub", isSelected: selectedTab == 3) {
                selectedTab = 3
            }
            
            TabItem(icon: "person.fill", title: "Me", isSelected: selectedTab == 4) {
                selectedTab = 4
            }
        }
        .padding(.horizontal, 10)
        .padding(.top, 15)
        .padding(.bottom, 25)
        .background(
            Color.white
                .shadow(color: Color.black.opacity(0.04), radius: 25, y: -5)
                .ignoresSafeArea(edges: .bottom)
        )
    }
    
    private func fetchPatientDetails() {
        APIService.getPatientDetails(patientId: patientId) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let data):
                    self.patientData = data
                    self.isLoading = false
                    fetchNotifications()
                    fetchLatestConsultation()
                case .failure:
                    self.isLoading = false
                }
            }
        }
    }

    private func fetchLatestConsultation() {
        APIService.getLatestConsultation(patientId: patientId) { result in
            DispatchQueue.main.async {
                if case .success(let data) = result {
                    self.latestConsultation = data
                }
            }
        }
    }

    private func fetchNotifications() {
        APIService.getNotifications(userId: patientId, userType: "PATIENT") { result in
            DispatchQueue.main.async {
                if case .success(let data) = result {
                    self.unreadNotificationsCount = data.filter { $0.is_read == 0 }.count
                }
            }
        }
    }

}

struct ClinicalModuleCard: View {
    let title: String
    let subtitle: String
    let category: String
    let icon: String
    let color: Color
    var showLiveBadge: Bool = false
    
    var body: some View {
        HStack(spacing: 0) {
            // Signature Vertical Status Bar
            Rectangle()
                .fill(LinearGradient(colors: [color, color.opacity(0.7)], startPoint: .top, endPoint: .bottom))
                .frame(width: 4.5)
            
            HStack(spacing: 16) {
                // Clinical Icon Backdrop
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(color.opacity(0.08))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(color)
                }
                
                VStack(alignment: .leading, spacing: 3) {
                    Text(category)
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .kerning(1.2)
                        .foregroundColor(.secondary.opacity(0.8))
                    
                    Text(title)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    
                    Text(subtitle)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary.opacity(0.7))
                }
                
                Spacer()
                
                if showLiveBadge {
                    // Refined "LIVE" Clinical Badge
                    HStack(spacing: 4) {
                        Circle().fill(.white).frame(width: 4, height: 4)
                        Text("LIVE")
                            .font(.system(size: 8, weight: .black))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(Color.green))
                    .foregroundColor(.white)
                } else {
                    // Standard Action Indicator
                    ZStack {
                        Circle()
                            .fill(Color.gray.opacity(0.05))
                            .frame(width: 28, height: 28)
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(color.opacity(0.6))
                    }
                }
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
        }
        .background(
            ZStack {
                Color.white
                LinearGradient(colors: [color.opacity(0.02), .clear], startPoint: .leading, endPoint: .trailing)
            }
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.03), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 6)
    }
}


struct TabItem: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    private let activeColor = Color.blue
    private let inactiveColor = Color.gray.opacity(0.5)
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                action()
            }
        }) {
            VStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: isSelected ? .bold : .medium))
                    .foregroundColor(isSelected ? activeColor : inactiveColor)
                    .scaleEffect(isSelected ? 1.15 : 1.0)
                
                Text(title)
                    .font(.system(size: 10, weight: isSelected ? .bold : .medium, design: .rounded))
                    .foregroundColor(isSelected ? activeColor : inactiveColor)
                
                Circle()
                    .fill(isSelected ? activeColor : Color.clear)
                    .frame(width: 4, height: 4)
                    .scaleEffect(isSelected ? 1 : 0.001)
                    .padding(.top, 2)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
    }
}

// MARK: - Premium UI Components

struct AssignedDoctorCard: View {
    let patientData: [String: Any]?
    let action: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("ASSIGNED CLINICIAN")
                .font(.system(size: 10, weight: .black))
                .tracking(1.5)
                .foregroundColor(.gray)
                .padding(.horizontal, 5)
            
            Button(action: action) {
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 60, height: 60)
                        Image(systemName: "person.badge.shield.checkmark.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 22))
                    }
                    .shadow(color: .dentalDarkBlue.opacity(0.1), radius: 10, y: 5)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(patientData?["doctor_name"] as? String ?? "Awaiting Assignment")
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                        
                        Text(patientData?["clinic_name"] as? String ?? "Clinical Hub")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.blue.opacity(0.7))
                    }
                    Spacer()
                    Image(systemName: "chevron.right.circle.fill")
                        .font(.system(size: 24))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundColor(.blue.opacity(0.3))
                }
                .padding(20)
                .background(Color.white.opacity(0.9))
                .cornerRadius(28)
                .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.white, lineWidth: 1.5))
                .shadow(color: .black.opacity(0.03), radius: 15, y: 10)
            }
        }
        .padding(.horizontal, 20)
    }
}

struct ClinicalNodeItem: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    var badge: String? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Top Row: Icon and the Signature Theme Bar
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
                
                // The "Theme Bar" from your screenshot (top right)
                RoundedRectangle(cornerRadius: 2)
                    .fill(color.opacity(0.3))
                    .frame(width: 20, height: 3.5)
            }
            
            // Text Stack: Large Bold Title + Micro Label
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(Color(red: 0.05, green: 0.05, blue: 0.15)) // Deep Midnight Blue
                
                HStack(spacing: 4) {
                    Text(subtitle.uppercased())
                        .font(.system(size: 8, weight: .black))
                        .kerning(1.0)
                        .foregroundColor(.secondary.opacity(0.7))
                    
                    if let badge = badge {
                        Text("• \(badge)")
                            .font(.system(size: 8, weight: .black))
                            .foregroundColor(color)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.white)
        )
        // Thin professional border instead of heavy shadows
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
        // Soft ambient lift
        .shadow(color: Color.black.opacity(0.02), radius: 8, x: 0, y: 4)
    }
}

struct DoctorDetailView: View {
    @Environment(\.dismiss) var dismiss
    let doctorData: [String: String]
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
            VStack(spacing: 0) {
                // Drag Handle
                Capsule()
                    .fill(.gray.opacity(0.3))
                    .frame(width: 40, height: 5)
                    .padding(.top, 12)
                
                VStack(spacing: 30) {
                    // Profile Header
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 100, height: 100)
                            
                            Image(systemName: "person.badge.shield.checkmark.fill")
                                .foregroundColor(.white)
                                .font(.system(size: 40))
                        }
                        .shadow(color: .dentalDarkBlue.opacity(0.2), radius: 15, y: 8)
                        
                        VStack(spacing: 6) {
                            Text(doctorData["name"] ?? "Doctor Name")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(.dentalDarkBlue)
                            
                            HStack(spacing: 6) {
                                Circle().fill(.green).frame(width: 6, height: 6)
                                Text("VERIFIED CLINICIAN")
                                    .font(.system(size: 10, weight: .black))
                                    .tracking(1.5)
                                    .foregroundColor(.green)
                            }
                        }
                    }
                    .padding(.top, 20)
                    
                    // Clinical Credentials Card
                    VStack(alignment: .leading, spacing: 20) {
                        InfoRow(icon: "building.2.fill", label: "PRIMARY PRACTICE SITE", value: doctorData["clinic"] ?? "N/A")
                        InfoRow(icon: "doc.plaintext.fill", label: "CLINICAL LICENSE ID", value: doctorData["license"] ?? "N/A")
                        InfoRow(icon: "envelope.badge.shield.half.filled", label: "ENCRYPTED CHANNEL", value: doctorData["email"] ?? "N/A")
                    }
                    .padding(25)
                    .background(Color.white.opacity(0.5).background(.ultraThinMaterial))
                    .cornerRadius(28)
                    .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.white, lineWidth: 1.5))
                    .padding(.horizontal, 24)
                    
                    // Actions
                    VStack(spacing: 16) {
                        Button(action: { }) {
                            HStack {
                                Image(systemName: "bubble.left.and.bubble.right.fill")
                                Text("Open Secure Message")
                                    .font(.system(size: 16, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(18)
                            .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                        }
                        
                        Button(action: { dismiss() }) {
                            Text("Close Portfolio")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 28)
                    
                    Spacer()
                }
            }
        }
    }
}

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .font(.system(size: 20))
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(.gray.opacity(0.6))
                Text(value)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.dentalDarkBlue)
            }
            Spacer()
        }
    }
}

struct ClinicalHubWrapper: View {
    let patientId: Int
    @Environment(\.dismiss) var dismiss
    @State private var consultation: [String: Any]? = nil
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false, isDentist: false)
                .ignoresSafeArea()
            
            if isLoading {
                VStack(spacing: 20) {
                    ProgressView()
                        .scaleEffect(1.5)
                    Text("SYNCHRONIZING CLINICAL NODE...")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.blue)
                }
            } else if let con = consultation {
                let rId = Int(String(describing: con["id"] ?? "0")) ?? 0
                let dId = Int(String(describing: con["dentist_id"] ?? "0")) ?? 0
                let cId = Int(String(describing: con["chat_id"] ?? "0")) ?? 0
                
                ConsultationOverviewView(
                    requestId: rId,
                    patientId: patientId,
                    dentistId: dId,
                    patientName: con["patient_name"] as? String ?? "Patient",
                    dentistName: con["dentist_name"] as? String ?? "Clinician",
                    chatId: cId,
                    role: "PATIENT",
                    status: con["status"] as? String ?? "PENDING"
                )
            } else {
                VStack(spacing: 25) {
                    ZStack {
                        Circle().fill(Color.blue.opacity(0.1)).frame(width: 100, height: 100)
                        Image(systemName: "hand.raised.fill").font(.system(size: 40)).foregroundColor(.blue)
                    }
                    Text("No Active Clinical Journey")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                    Text("Schedule a consultation with a verified clinic to start your treatment journey.")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                    
                    Button("Return to Dashboard") { dismiss() }
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.blue)
                        .padding(.top, 20)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadLatest)
    }
    
    private func loadLatest() {
        APIService.getLatestConsultation(patientId: patientId) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let data) = result {
                    self.consultation = data
                }
            }
        }
    }
}
