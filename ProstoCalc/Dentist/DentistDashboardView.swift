import SwiftUI
import MapKit

struct DentistDashboardView: View {
    @Environment(\.dismiss) var dismiss
    var dentistId: Int
    var onLogout: () -> Void
    
    @State private var dentistData: [String: Any]?
    @State private var isLoading = true
    @State private var showProfile = false
    @State private var showProfileCompletion = false
    @State private var showPricingEditor = false
    @State private var unreadNotificationsCount = 0
    @State private var showNotifications = false
    @State private var selectedTab = 0 // 0: Home, 1: Requests, 2: AI, 3: Schedule, 4: Estimate, 5: Hub
    @State private var selectedRequestId: Int? = nil
    @State private var selectedRequestData: [String: Any]? = nil
    @State private var showConsultationOverview = false
    @State private var showCalendar = false
    @State private var showSettings = false
    @State private var showHabitHistory = false
    
    // Streak State
    @State private var currentStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var showStreak = false
    
    // Top Requests Section
    @State private var topRequests: [[String: Any]] = []
    @State private var isLoadingTopRequests = false
    
    // Today’s Visits Preview
    @State private var todaysAppointments: [[String: Any]] = []
    @State private var isLoadingToday = false
    
    // Check if professional profile is complete
    private var isProfileComplete: Bool {
        guard let data = dentistData else { return true }
        let spec = data["specialization"] as? String ?? ""
        return !spec.isEmpty
    }
    
    // Robust check for registry completion
    private var isRegistryComplete: Bool {
        guard let data = dentistData, let latVal = data["latitude"] else { return false }
        let latStr = String(describing: latVal)
        if let latDouble = Double(latStr) {
            return latDouble != 0
        }
        return false
    }
    
     var body: some View {
        ZStack(alignment: .bottom) {
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            if isLoading {
                VStack(spacing: 20) {
                    ProgressView()
                        .controlSize(.large)
                        .tint(.teal)
                    Text("SYNCHRONIZING CLINICAL NODES...")
                        .font(.system(size: 10, weight: .black))
                        .tracking(2)
                        .foregroundColor(.teal.opacity(0.7))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                NavigationStack {
                    VStack(spacing: 0) {
                        Group {
                            switch selectedTab {
                            case 0: dashboardHome
                            case 1:
                                if dentistData?["consultation_mode"] as? String == "CALCULATION_ONLY" {
                                    TreatmentCostEditorView(dentistId: dentistId)
                                } else {
                                    RequestManagementView(dentistId: dentistId)
                                }
                            case 2: PuterChatView(userId: String(describing: dentistId), role: "dentist", userName: dentistData?["full_name"] as? String ?? "Doctor", isTabRoot: true, onBack: { selectedTab = 0 })
                            case 3: DentistCostCalculatorView(selectedTab: $selectedTab)
                            case 4:
                                BriefDetailPage(profileData: dentistData ?? [:], isDentist: true, isTabRoot: true, onBack: { selectedTab = 0 }, onLogout: onLogout) {
                                    fetchDentistDetails()
                                }
                            case 5: ConsultationCalendarView(role: "DENTIST", userId: dentistId, onBack: { selectedTab = 0 })
                            case 6: DentistSettingsView(dentistId: dentistId, onLogout: onLogout, onBack: { selectedTab = 0 })
                            case 7: DentistHabitHistoryListView(dentistId: dentistId, onBack: { selectedTab = 0 })
                            case 8: DentistScheduleView(consultationMode: dentistData?["consultation_mode"] as? String ?? "FULL", onBack: { selectedTab = 0 })
                            default: dashboardHome
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .navigationBarHidden(true)
                        
                        if ![5, 6, 7, 8].contains(selectedTab) {
                            bottomMenuBar
                        }
                    }
                }
            }
        }
        .onAppear {
            fetchDentistDetails()
            fetchStreak()
            fetchTopRequests()
            fetchTodaysVisits()
        }
        .onChange(of: selectedTab) { newValue in
            // Refresh data when returning to home tab (tab 0)
            if newValue == 0 {
                fetchTopRequests()
                fetchTodaysVisits()
                fetchStreak()
            }
        }
        .onChange(of: isLoading) { newValue in
            if !newValue && !isProfileComplete {
                showProfileCompletion = true
            }
        }
        .fullScreenCover(isPresented: $showProfileCompletion) {
            if let id = Int(String(describing: dentistData?["id"] ?? "\(dentistId)")) {
                DentistProfileCompletionView(dentistId: id, onComplete: {
                    showProfileCompletion = false
                    fetchDentistDetails()
                })
            }
        }
        .fullScreenCover(isPresented: $showPricingEditor) {
            TreatmentCostEditorView(dentistId: dentistId)
                .onDisappear {
                    // Refresh data when returning from treatment editor
                    fetchTopRequests()
                    fetchTodaysVisits()
                }
        }
        .fullScreenCover(isPresented: $showConsultationOverview) {
            NavigationStack {
                ZStack(alignment: .top) {
                    // Clinical Background Pattern
                    DentalBackgroundView(animate: false)
                        .ignoresSafeArea()
                    
                    VStack(spacing: 0) {
                        // MARK: - Custom Medical Header
                        HStack {
                            Button(action: {
                                // Clear selection and dismiss using local state
                                selectedRequestId = nil
                                selectedRequestData = nil
                                showConsultationOverview = false
                            }) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(Color(red: 0.1, green: 0.7, blue: 0.7))
                                    .frame(width: 38, height: 38)
                                    .background(Color.white)
                                    .clipShape(Circle())
                                    .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                            }
                            
                            Spacer()
                            
                            Text("Consultation Details")
                                .font(.system(size: 17, weight: .bold, design: .rounded))
                                .foregroundColor(Color(white: 0.2))
                            
                            Spacer()
                            
                            // Balance spacer
                            Color.clear.frame(width: 38, height: 38)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.9))
                        
                        // MARK: - Content Area
                        Group {
                            if let req = selectedRequestData {
                                let reqId = req["id"] as? Int ?? Int(req["id"] as? String ?? "0") ?? 0
                                ConsultationOverviewView(
                                    requestId: reqId,
                                    patientId: req["patient_id"] as? Int ?? Int(req["patient_id"] as? String ?? "0") ?? 0,
                                    dentistId: dentistId,
                                    patientName: req["patient_name"] as? String ?? "Patient",
                                    dentistName: dentistData?["full_name"] as? String ?? "Dentist",
                                    chatId: req["chat_id"] as? Int ?? 0,
                                    role: "DENTIST",
                                    status: req["status"] as? String ?? "PENDING"
                                )
                            } else {
                                // Loading State Card (Matching Stat Card Design)
                                VStack(spacing: 20) {
                                    Spacer()
                                    ZStack {
                                        Circle()
                                            .fill(Color(red: 0.1, green: 0.8, blue: 0.8).opacity(0.1))
                                            .frame(width: 80, height: 80)
                                        
                                        ProgressView()
                                            .tint(Color(red: 0.1, green: 0.7, blue: 0.7))
                                            .scaleEffect(1.5)
                                    }
                                    
                                    Text("Fetching Patient Registry...")
                                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                                        .foregroundColor(.secondary)
                                    Spacer()
                                }
                            }
                        }
                    }
                }
                .navigationBarHidden(true)
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showCalendar) {
            NavigationStack {
                ConsultationCalendarView(role: "DENTIST", userId: dentistId)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                showCalendar = false
                            }
                        }
                    }
            }
        }
        .sheet(isPresented: $showSettings) {
            NavigationStack {
                DentistSettingsView(dentistId: dentistId, onLogout: onLogout)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                showSettings = false
                            }
                        }
                    }
            }
        }
        .sheet(isPresented: $showHabitHistory) {
            NavigationStack {
                DentistHabitHistoryListView(dentistId: dentistId)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                showHabitHistory = false
                            }
                        }
                    }
            }
        }
    }
    
    private var dashboardHome: some View {
        ScrollView {
            VStack(spacing: 22) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("CLINICIAN CORE")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(.teal)
                        
                        Text("Dr. \(dentistData?["full_name"] as? String ?? "Professional")")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                    
                    HStack(spacing: 12) {
                        Button(action: { showNotifications = true }) {
                            ZStack {
                                Image(systemName: "bell.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(.teal)
                                    .frame(width: 44, height: 44)
                                    .background(Color.white.opacity(0.8))
                                    .clipShape(Circle())
                                
                                if unreadNotificationsCount > 0 {
                                    Circle()
                                        .fill(Color.red)
                                        .frame(width: 10, height: 10)
                                        .offset(x: 10, y: -10)
                                }
                            }
                        }
                        Button(action: { selectedTab = 6}) {
                            ZStack {
                                Circle().fill(LinearGradient(colors: [.teal, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 44, height: 44)
                                Text(String((dentistData?["full_name"] as? String ?? "D").prefix(1)))
                                    .font(.system(size: 18, weight: .black))
                                    .foregroundColor(.white)
                            }
                            .shadow(color: .teal.opacity(0.2), radius: 10, y: 4)
                        }
                    }
                }
                .fullScreenCover(isPresented: $showNotifications) {
                    NotificationsView(userId: dentistId, userType: "DENTIST")
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                
                // Practice Status
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle().fill(.white.opacity(0.2)).frame(width: 40, height: 40)
                            Image(systemName: dentistData?["consultation_mode"] as? String == "CALCULATION_ONLY" ? "cpu" : "shield.checkered").foregroundColor(.white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("PRACTICE STATUS")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.white.opacity(0.7))
                            
                            if dentistData?["consultation_mode"] as? String == "CALCULATION_ONLY" {
                                Text("AI-ONLY ANALYTICS MODE")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                            } else {
                                Text(isRegistryComplete ? "CLINICALLY VERIFIED" : "REGISTRY PENDING")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    Text(dentistData?["consultation_mode"] as? String == "CALCULATION_ONLY"
                         ? "You are in AI-Analytics mode. Your node is hidden from patients."
                         : (isRegistryComplete
                            ? "Your practice at \(dentistData?["clinic_city"] as? String ?? "Assigned Site") is active."
                            : "Synchronize your clinic footprint to enable neural patient discovery."))
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.9))
                }
                .padding(22)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(LinearGradient(colors: [.teal, Color(hex: "0891B2")], startPoint: .topLeading, endPoint: .bottomTrailing))
                .cornerRadius(26)
                .shadow(color: .teal.opacity(0.18), radius: 10, y: 4)
                .padding(.horizontal, 18)
                
                // Streaks (Professional)
                if showStreak {
                    professionalStreakCard
                        .padding(.horizontal, 18)
                }
                
                // Consultation Queue (Top 3)
                VStack(alignment: .leading, spacing: 12) {
                    sectionHeader(title: "Consultation Queue", actionTitle: "View All") {
                        selectedTab = 1
                    }
                    if isLoadingTopRequests {
                        loadingRow(tint: .teal, text: "Loading requests...")
                    } else if topRequests.isEmpty {
                        emptyRow(icon: "tray", text: "No pending requests")
                    } else {
                        VStack(spacing: 10) {
                            ForEach(topRequests.indices, id: \.self) { i in
                                compactRequestRow(req: topRequests[i])
                            }
                        }
                    }
                }
                .padding(18)
                .background(Color.white.opacity(0.9))
                .cornerRadius(20)
                .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
                .padding(.horizontal, 18)
                
                // Today’s Visits (Top 3)
                VStack(alignment: .leading, spacing: 12) {
                    sectionHeader(title: "Today’s Visits", actionTitle: "View All") {
                        selectedTab = 8
                    }
                    if isLoadingToday {
                        loadingRow(tint: .indigo, text: "Loading today...")
                    } else if todaysAppointments.isEmpty {
                        emptyRow(icon: "calendar.badge.minus", text: "No visits scheduled today")
                    } else {
                        VStack(spacing: 10) {
                            ForEach(todaysAppointments.prefix(3).indices, id: \.self) { i in
                                compactVisitRow(app: todaysAppointments[i])
                            }
                        }
                    }
                }
                .padding(18)
                .background(Color.white.opacity(0.9))
                .cornerRadius(20)
                .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
                .padding(.horizontal, 18)
                
                // Practice Console (single column)
                VStack(alignment: .leading, spacing: 14) {
                    Text("Practice Console")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                        .padding(.horizontal, 6)
                    
                    // Statistics Row
                    HStack(spacing: 12) {
                        StatCard(title: "Today", value: "\(todaysAppointments.count)", icon: "calendar.badge.clock", color: .teal)
                        StatCard(title: "Pending", value: "\(topRequests.filter { ($0["status"] as? String) == "PENDING" }.count)", icon: "clock.badge.exclamationmark", color: .orange)
                        StatCard(title: "Active", value: "\(topRequests.filter { ($0["status"] as? String) == "APPROVED" }.count)", icon: "checkmark.circle.fill", color: .green)
                    }
                    
                    VStack(spacing: 16) {
                        // Daily Visits -> Schedule tab
                        Button {
                            selectedTab = 8
                        } label: {
                            ConsoleCard(icon: "list.bullet.indent", title: "Daily Visits", subtitle: "Manage flow", color: .teal)
                        }
                        .buttonStyle(.plain)
                        
                        // Calendar -> Calendar screen
                        Button {
                            selectedTab = 5
                        } label: {
                            ConsoleCard(icon: "calendar", title: "Calendar", subtitle: "Month/Week", color: .indigo)
                        }
                        .buttonStyle(.plain)
                        
                        // Pricing -> opens pricing editor sheet
                        Button {
                            showPricingEditor = true
                        } label: {
                            ConsoleCard(icon: "indianrupeesign.circle.fill", title: "Pricing", subtitle: "Edit rates", color: .cyan)
                        }
                        .buttonStyle(.plain)
                        
                        // Settings -> switch to settings screen via selectedTab
                        Button {
                            selectedTab = 6
                        } label: {
                            ConsoleCard(icon: "gearshape.fill", title: "Settings", subtitle: "Clinic prefs", color: .blue)
                        }
                        .buttonStyle(.plain)
                        
                        // Habit History (only when not in calculation-only mode)
                        if dentistData?["consultation_mode"] as? String != "CALCULATION_ONLY" {
                            Button {
                                selectedTab = 7
                            } label: {
                                ConsoleCard(icon: "waveform.path.ecg.rectangle.fill", title: "Habit History", subtitle: "AI Risk", color: .purple)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 18)
                
                Spacer().frame(height: 100)
            }
        }
    }
    
    private var bottomMenuBar: some View {
        HStack(spacing: 0) {
            DentistTabItem(icon: "house.fill", title: "Home", isSelected: selectedTab == 0) {
                selectedTab = 0
            }
            
            if dentistData?["consultation_mode"] as? String == "CALCULATION_ONLY" {
                DentistTabItem(icon: "indianrupeesign.circle.fill", title: "Pricing", isSelected: selectedTab == 1) {
                    selectedTab = 1
                }
            } else {
                DentistTabItem(icon: "bell.badge.fill", title: "Requests", isSelected: selectedTab == 1) {
                    selectedTab = 1
                }
            }
            
            // Center Floating Action Button (FAB)
            Button(action: {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                    selectedTab = 2
                }
            }) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "2DD4BF"), .teal],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        // Dynamic glowing shadow
                        .shadow(color: .teal.opacity(selectedTab == 2 ? 0.6 : 0.3),
                                radius: selectedTab == 2 ? 15 : 10,
                                y: selectedTab == 2 ? 8 : 5)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(.white)
                        // Subtle rotation and scale when active
                        .rotationEffect(.degrees(selectedTab == 2 ? 15 : 0))
                        .scaleEffect(selectedTab == 2 ? 1.1 : 1.0)
                }
                .offset(y: -20)
            }
            .frame(maxWidth: .infinity)
            
            DentistTabItem(icon: "indianrupeesign.circle.fill", title: "Estimate", isSelected: selectedTab == 3) {
                selectedTab = 3
            }
            
            DentistTabItem(icon: "square.grid.2x2.fill", title: "Hub", isSelected: selectedTab == 4) {
                selectedTab = 4
            }
        }
        .padding(.horizontal, 10)
        .padding(.top, 15)
        // Adds padding at the bottom to respect the iPhone home indicator seamlessly
        .padding(.bottom, 25) 
        .background(
            Color.white
                // Ultra-smooth shadow for depth
                .shadow(color: Color.black.opacity(0.04), radius: 25, y: -5)
                .ignoresSafeArea(edges: .bottom)
        )
    }
    
    // MARK: - Data
    private func fetchDentistDetails() {
        APIService.getDentistDetails(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let data):
                    self.dentistData = data
                    self.isLoading = false
                    fetchNotifications()
                case .failure(let error):
                    print("DEBUG: Fetch dentist failure: \(error)")
                    self.isLoading = false
                }
            }
        }
    }
    
    private func fetchNotifications() {
        APIService.getNotifications(userId: dentistId, userType: "DENTIST") { result in
            DispatchQueue.main.async {
                if case .success(let data) = result {
                    self.unreadNotificationsCount = data.filter { $0.is_read == 0 }.count
                }
            }
        }
    }
    
    private func fetchStreak() {
        APIService.updateConsistencyStreak(userId: dentistId, userType: "DENTIST") { result in
            DispatchQueue.main.async {
                if case .success(let response) = result {
                    if let data = response["data"] as? [String: Any] {
                        self.currentStreak = data["current_streak"] as? Int ?? 0
                        self.longestStreak = data["longest_streak"] as? Int ?? 0
                        self.showStreak = true
                    }
                }
            }
        }
    }
    
    private func fetchTopRequests() {
        isLoadingTopRequests = true
        APIService.getConsultationRequests(role: "DENTIST", id: dentistId) { result in
            DispatchQueue.main.async {
                self.isLoadingTopRequests = false
                switch result {
                case .success(let data):
                    let priority: [String: Int] = ["PENDING": 0, "APPROVED": 1, "COMPLETED": 2, "REJECTED": 3]
                    let sorted = data.sorted { a, b in
                        let sa = (a["status"] as? String) ?? "PENDING"
                        let sb = (b["status"] as? String) ?? "PENDING"
                        if priority[sa, default: 99] != priority[sb, default: 99] {
                            return priority[sa, default: 99] < priority[sb, default: 99]
                        }
                        let ida = (a["id"] as? Int) ?? Int(a["id"] as? String ?? "0") ?? 0
                        let idb = (b["id"] as? Int) ?? Int(b["id"] as? String ?? "0") ?? 0
                        return ida > idb
                    }
                    self.topRequests = Array(sorted.prefix(3))
                case .failure:
                    self.topRequests = []
                }
            }
        }
    }
    
    private func fetchTodaysVisits() {
        isLoadingToday = true
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())
        
        APIService.getDentistSchedule(dentistId: dentistId, date: todayStr) { result in
            DispatchQueue.main.async {
                self.isLoadingToday = false
                if case .success(let response) = result,
                   let data = response["data"] as? [String: Any] {
                    // Be tolerant to different keys and formats
                    var apps = data["appointments"] as? [[String: Any]] ?? []
                    if apps.isEmpty, let alt = data["visits"] as? [[String: Any]] {
                        apps = alt
                    }
                    self.todaysAppointments = apps.sorted { a, b in
                        let ta = firstNonEmpty(a["scheduled_time"], a["start_time"]) as? String ?? ""
                        let tb = firstNonEmpty(b["scheduled_time"], b["start_time"]) as? String ?? ""
                        let da = parseTimeFlexible(ta)
                        let db = parseTimeFlexible(tb)
                        switch (da, db) {
                        case let (l?, r?):
                            return l < r
                        case (nil, .some):
                            // nil last
                            return false
                        case (.some, nil):
                            // nil last
                            return true
                        case (nil, nil):
                            // fallback to string compare to keep deterministic order
                            return ta < tb
                        }
                    }
                } else {
                    self.todaysAppointments = []
                }
            }
        }
    }
    
    // MARK: - UI Helpers
    private func sectionHeader(title: String, actionTitle: String, action: @escaping () -> Void) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(.dentalDarkBlue)
            Spacer()
            Button(action: action) {
                HStack(spacing: 4) {
                    Text(actionTitle)
                        .font(.system(size: 12, weight: .black))
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundColor(.teal)
            }
            .buttonStyle(.plain)
        }
    }
    
    private func loadingRow(tint: Color, text: String) -> some View {
        HStack(spacing: 10) {
            ProgressView().tint(tint)
            Text(text)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.secondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(14)
    }
    
    private func emptyRow(icon: String, text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundColor(.secondary)
            Text(text)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.secondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(14)
    }
    
    private var professionalStreakCard: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle().stroke(Color.teal.opacity(0.15), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: min(1.0, CGFloat(Double(currentStreak) / Double(max(1, longestStreak)))))
                    .stroke(
                        LinearGradient(colors: [.teal, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(currentStreak)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                    Text("days")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 76, height: 76)
            
            VStack(alignment: .leading, spacing: 6) {
                Text("Consistency Streak")
                    .font(.system(size: 14, weight: .black))
                    .foregroundColor(.dentalDarkBlue)
                HStack(spacing: 8) {
                    Label("\(currentStreak) current", systemImage: "flame.fill")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.orange)
                    Text("•")
                        .foregroundColor(.secondary)
                    Text("Best \(longestStreak)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                }
                Text("Great consistency — keep your daily routines aligned.")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.white.opacity(0.95))
        .cornerRadius(18)
        .shadow(color: .black.opacity(0.04), radius: 10, y: 5)
    }
    
    private func compactRequestRow(req: [String: Any]) -> some View {
        let status = (req["status"] as? String) ?? "PENDING"
        let dateStr = (req["scheduled_date"] as? String) ?? ""
        let accentColor = statusColor(status)
        let reason = req["request_message"] as? String ?? "General Consultation"
        
        // Get request ID for fetching treatment plan
        let requestId = req["id"] as? Int ?? Int(req["id"] as? String ?? "0") ?? 0
        let _ = req["patient_id"] as? Int ?? Int(req["patient_id"] as? String ?? "0") ?? 0
        let patientName = req["patient_name"] as? String ?? "Patient"
        
        // ISO Date Parsing (Handles: 2026-03-01T18:30:00.000Z)
        var formattedDisplayDate: String {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            
            if let date = isoFormatter.date(from: dateStr) {
                let outputFormatter = DateFormatter()
                outputFormatter.dateFormat = "dd MMM yyyy" // Matches image: 03 Mar 2026
                return outputFormatter.string(from: date)
            }
            return dateStr
        }
        
        return Button {
            selectedRequestData = req  // Store request data directly
            selectedRequestId = requestId
            // Use async to ensure data is set before sheet is presented
            DispatchQueue.main.async {
                showConsultationOverview = true
            }
        } label: {
            HStack(spacing: 0) {
                // Vertical Accent Bar (Matches Image 3 sidebar)
                Rectangle()
                    .fill(accentColor)
                    .frame(width: 4)
                
                VStack(alignment: .leading, spacing: 12) {
                    // Header: Category Label + Status Badge
                    HStack {
                        Text("PATIENT ASSESSMENT")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .kerning(1.2)
                            .foregroundColor(accentColor)
                        
                        Spacer()
                        
                        Text(status.uppercased())
                            .font(.system(size: 9, weight: .black))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(accentColor.opacity(0.1))
                            .foregroundColor(accentColor)
                            .clipShape(Capsule())
                    }
                    
                    // Patient Name & Reason
                    VStack(alignment: .leading, spacing: 4) {
                        Text(patientName)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.primary)
                        
                        // The Reason/Message (Highlighted per your request)
                        Text(reason)
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    Divider()
                        .padding(.top, 4)
                    
                    // Footer: Date, Source and Cost
                    HStack(spacing: 8) {
                        Image(systemName: "calendar")
                        Text(formattedDisplayDate)
                        
                        Text("|")
                            .foregroundColor(.gray.opacity(0.3))
                        
                        Image(systemName: "clock")
                        Text("Scheduled")
                        
                        Spacer()
                        
                        // Show estimated cost if available
                        CostDisplayBadge(requestId: requestId)
                    }
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 16)
            }
            .background(Color(red: 0.98, green: 0.99, blue: 1.0)) // Subtle teal tint
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.black.opacity(0.04), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
    
    private func compactVisitRow(app: [String: Any]) -> some View {
        let status = (app["visit_status"] as? String) ?? "scheduled"
        let dateStr = (app["scheduled_date"] as? String) ?? ""
        let timeStr = firstNonEmpty(app["scheduled_time"], app["start_time"]) as? String ?? ""
        let name = (app["patient_name"] as? String) ?? "Patient"
        let category = (app["visit_category"] as? String) ?? "PATIENT ASSESSMENT"
        
        // Get request ID for fetching treatment plan cost
        let requestId = app["request_id"] as? Int ?? Int(app["request_id"] as? String ?? "0") ?? 0
        let _ = app["patient_id"] as? Int ?? Int(app["patient_id"] as? String ?? "0") ?? 0
        
        let accentColor = colorForVisitStatus(status)
        
        // ISO Date Parsing for format: 2026-03-01T18:30:00.000Z
        var formattedDisplayDate: String {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            
            if let date = isoFormatter.date(from: dateStr) {
                let outputFormatter = DateFormatter()
                outputFormatter.dateFormat = "dd MMM yyyy" // Matches "03 Mar 2026" in image
                return outputFormatter.string(from: date)
            }
            return dateStr
        }
        
        return Button {
            // Navigate to Schedule tab (tab index 3) for visits
            selectedTab = 3
        } label: {
            HStack(spacing: 0) {
                // 1. Vertical Accent Bar
                Rectangle()
                    .fill(accentColor)
                    .frame(width: 4)
                
                VStack(alignment: .leading, spacing: 12) {
                    // 2. Header: Uppercase Category Label & Status Badge
                    HStack {
                        Text(category.uppercased())
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .kerning(1.2)
                            .foregroundColor(accentColor)
                        
                        Spacer()
                        
                        Text(labelForVisitStatus(status).uppercased())
                            .font(.system(size: 9, weight: .black))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(accentColor.opacity(0.1))
                            .foregroundColor(accentColor)
                            .clipShape(Capsule())
                    }
                    
                    // 3. Patient Name & Primary Metadata
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(name)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.primary)
                            
                            // Unified Date/Time string
                            HStack(spacing: 8) {
                                Image(systemName: "calendar")
                                Text(formattedDisplayDate)
                                Text("|")
                                    .foregroundColor(.gray.opacity(0.3))
                                Image(systemName: "clock")
                                Text(timeStr)
                            }
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        // Dynamic Cost Display
                        CostDisplayBadge(requestId: requestId)
                    }
                    
                    Divider()
                        .padding(.top, 4)
                    
                    // 4. Clinical Analysis Footer Label
                    Text("CLINICAL ANALYSIS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary.opacity(0.7))
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 16)
            }
            .background(Color(red: 0.98, green: 0.99, blue: 1.0)) // Light Cyan Tint
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.black.opacity(0.04), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.02), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Formatting
    private func compactDateTimeString(dateStr: String, timeStr: String) -> String {
        let day = parseDate(dateStr)
        let time = parseTimeFlexible(timeStr)
        if let d = day, let t = time {
            let df = DateFormatter()
            df.dateFormat = "EEE, d MMM"
            let tf = DateFormatter()
            tf.dateFormat = "h:mm a"
            return "\(df.string(from: d)) • \(tf.string(from: t))"
        } else if let d = day {
            let df = DateFormatter()
            df.dateFormat = "EEE, d MMM"
            return df.string(from: d)
        } else if let t = time {
            let tf = DateFormatter()
            tf.dateFormat = "h:mm a"
            return tf.string(from: t)
        }
        return [dateStr, timeStr].filter { !$0.isEmpty }.joined(separator: " • ")
    }
    
    private func parseDate(_ str: String) -> Date? {
        let s = String(str.prefix(10)) // yyyy-MM-dd
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.date(from: s)
    }
    
    private func parseTimeFlexible(_ str: String) -> Date? {
        if str.isEmpty { return nil }
        let f1 = DateFormatter()
        f1.dateFormat = "HH:mm:ss"
        f1.locale = Locale(identifier: "en_US_POSIX")
        if let d = f1.date(from: str) { return d }
        let f2 = DateFormatter()
        f2.dateFormat = "HH:mm"
        f2.locale = Locale(identifier: "en_US_POSIX")
        if let d = f2.date(from: str) { return d }
        return nil
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case "PENDING": return .orange
        case "APPROVED": return .green
        case "REJECTED": return .red
        case "COMPLETED": return .blue
        default: return .gray
        }
    }
    
    private func colorForVisitStatus(_ status: String) -> Color {
        switch status {
        case "scheduled": return .blue
        case "arrived": return .orange
        case "in_progress": return .purple
        case "visited": return .green
        case "not_visited": return .red
        case "postponed": return .orange
        case "cancelled": return .gray
        default: return .secondary
        }
    }
    
    private func labelForVisitStatus(_ status: String) -> String {
        switch status {
        case "scheduled": return "CONFIRMED"
        case "arrived": return "ARRIVED"
        case "in_progress": return "IN CHAIR"
        case "visited": return "COMPLETED"
        case "not_visited": return "NO SHOW"
        case "postponed": return "POSTPONED"
        default: return status.uppercased()
        }
    }
    
    private func firstNonEmpty(_ a: Any?, _ b: Any?) -> Any? {
        if let s = a as? String, !s.isEmpty { return s }
        if let s = b as? String, !s.isEmpty { return s }
        return nil
    }
    
    
    struct DentistTabItem: View {
        let icon: String
        let title: String
        let isSelected: Bool
        let action: () -> Void
        
        // We can define the primary color here to match your theme
        private let activeColor = Color(hex: "2DD4BF") // Assuming you have your hex extension, otherwise use .teal
        private let inactiveColor = Color.gray.opacity(0.5)
        
        var body: some View {
            Button(action: {
                // Trigger a fluid spring animation on tap
                withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                    action()
                }
            }) {
                VStack(spacing: 5) {
                    Image(systemName: icon)
                        .font(.system(size: 22, weight: isSelected ? .bold : .medium))
                        .foregroundColor(isSelected ? activeColor : inactiveColor)
                        // Bouncy scale effect
                        .scaleEffect(isSelected ? 1.15 : 1.0)
                
                    Text(title)
                        .font(.system(size: 10, weight: isSelected ? .bold : .medium, design: .rounded))
                        .foregroundColor(isSelected ? activeColor : inactiveColor)
                
                    // Futuristic active dot indicator
                    Circle()
                        .fill(isSelected ? activeColor : Color.clear)
                        .frame(width: 4, height: 4)
                        .scaleEffect(isSelected ? 1 : 0.001)
                        .padding(.top, 2)
                }
                .frame(maxWidth: .infinity)
                .contentShape(Rectangle()) // Ensures the whole block is tappable, not just the text/icon
            }
            // Smooth out the color and structural transitions
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
        }
    }
    
    struct StatCard: View {
        let title: String
        let value: String
        let icon: String
        let color: Color
        
        var body: some View {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(color)
                        .font(.system(size: 18))
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(value)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundColor(color)
                    
                    Text(title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.gray)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(Color.white.opacity(0.9))
            .cornerRadius(24)
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white, lineWidth: 1))
            .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
        }
    }
    
    struct ConsoleCard: View {
        let icon: String
        let title: String
        let subtitle: String
        let color: Color
        
        var body: some View {
            HStack(spacing: 0) {
                // 1. Signature Vertical Accent Bar
                Rectangle()
                    .fill(color)
                    .frame(width: 4.5)
                
                HStack(spacing: 16) {
                    // 2. Clinical Icon Backdrop (Inner Shadow Style)
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(color.opacity(0.08))
                            .frame(width: 48, height: 48)
                        
                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(color)
                    }
                    
                    // 3. Typography following "AI Insights" style
                    VStack(alignment: .leading, spacing: 3) {
                        Text(subtitle.uppercased())
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .kerning(1.2)
                            .foregroundColor(.secondary.opacity(0.8))
                        
                        Text(title)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.2)) // Dental Dark Blue
                    }
                    
                    Spacer()
                    
                    // 4. Subtle Action Indicator
                    ZStack {
                        Circle()
                            .fill(Color.gray.opacity(0.05))
                            .frame(width: 28, height: 28)
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.teal.opacity(0.5))
                    }
                }
                .padding(.vertical, 14)
                .padding(.horizontal, 16)
            }
            .background(
                ZStack {
                    Color.white // Base
                    
                    // Subtle linear gradient to match the "Treatment Plan" cards
                    LinearGradient(
                        colors: [color.opacity(0.03), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                }
            )
            .cornerRadius(16)
            // Soft medical-grade shadow
            .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.black.opacity(0.03), lineWidth: 1)
            )
        }
    }
    
    struct DentistNodeItem: View {
        let icon: String
        let title: String
        let color: Color
        
        var body: some View {
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.08))
                        .frame(width: 56, height: 56)
                    Image(systemName: icon)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(color)
                }
                Text(title.uppercased())
                    .font(.system(size: 11, weight: .black))
                    .tracking(1)
                    .foregroundColor(.dentalDarkBlue)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 24)
            .background(Color.white.opacity(0.9))
            .cornerRadius(28)
            .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.white, lineWidth: 1))
            .shadow(color: .black.opacity(0.02), radius: 10, y: 5)
        }
    }
    
    struct RegistryBackground: View {
        let isComplete: Bool
        var body: some View {
            LinearGradient(
                colors: isComplete ? [.dentalDarkBlue, .teal] : [.red.opacity(0.8), .orange.opacity(0.8)],
                startPoint: .leading,
                endPoint: .trailing
            )
        }
    }
    
    // MARK: - Cost Display Badge
    // Fetches and displays the total treatment cost for a request
    struct CostDisplayBadge: View {
        let requestId: Int
        
        @State private var totalCost: Double = 0
        @State private var isLoading = true
        @State private var hasError = false
        
        var body: some View {
            VStack(alignment: .trailing, spacing: 2) {
                if isLoading {
                    Text("--")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(red: 0.1, green: 0.7, blue: 0.7))
                } else if hasError {
                    Text("₹0")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.secondary)
                } else {
                    Text("₹\(Int(totalCost))")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(red: 0.1, green: 0.7, blue: 0.7))
                }
                
                Text("TOTAL VALUE")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.secondary)
            }
            .onAppear {
                fetchCost()
            }
        }
        
        private func fetchCost() {
            guard requestId > 0 else {
                isLoading = false
                return
            }
            
            APIService.getTreatmentPlan(requestId: requestId) { result in
                DispatchQueue.main.async {
                    self.isLoading = false
                    switch result {
                    case .success(let plan):
                        if let plan = plan,
                           let items = plan["items"] as? [[String: Any]] {
                            let total = items.reduce(0.0) { sum, item in
                                let costStr = String(describing: item["cost"] ?? "0")
                                return sum + (Double(costStr) ?? 0.0)
                            }
                            self.totalCost = total
                        }
                    case .failure:
                        self.hasError = true
                    }
                }
            }
        }
    }
}
