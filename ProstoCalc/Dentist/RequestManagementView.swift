import SwiftUI

struct RequestManagementView: View {
    @AppStorage("dentist_id") var storedDentistId: Int = 0
    var dentistId: Int = 0
    
    @State private var requests: [[String: Any]] = []
    @State private var isLoading = false
    @State private var selectedRequest: [String: Any]?
    @State private var showSchedulingSheet = false
    
    private var effectiveDentistId: Int {
        if dentistId != 0 { return dentistId }
        return storedDentistId
    }
    
    // Filtering & Searching
    @State private var searchText = ""
    @State private var selectedFilter = "ALL" // ALL, PENDING, APPROVED, COMPLETED
    
    private var filteredRequests: [[String: Any]] {
        requests.filter { req in
            let name = (req["patient_name"] as? String ?? "").lowercased()
            let status = req["status"] as? String ?? "PENDING"
            
            let matchesSearch = searchText.isEmpty || name.contains(searchText.lowercased())
            let matchesFilter = selectedFilter == "ALL" || status == selectedFilter
            
            return matchesSearch && matchesFilter
        }
    }
    
    // Scheduling parameters
    @State private var selectedDate = Date()
    @State private var selectedDuration = 30
    let durations = [15, 30, 45, 60]
    
    init(dentistId: Int = 0) {
        self.dentistId = dentistId
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 25) {
                    // Professional Header Section
                    headerSection
                    
                    // Search & Filter Section
                    searchFilterSection
                    
                    // Requests List
                    requestsListSection
                }
                .padding()
            }
        }
        .navigationBarHidden(true)
        .onAppear(perform: loadRequests)
        .fullScreenCover(isPresented: $showSchedulingSheet) {
            schedulingSheet
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 18) {
            // 1. Clinical Diagnostic Icon with Glow
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
                
                Image(systemName: "bell.badge.fill")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(.top, 5)
            
            // 2. Identity & Metadata
            VStack(spacing: 6) {
                Text("CONSULTATION REQUESTS")
                    .font(.system(size: 10, weight: .black))
                    .tracking(2.5)
                    .foregroundColor(.teal.opacity(0.7))
                
                Text("Waitlist Management")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundColor(.primary.opacity(0.85))
                
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10))
                    Text("Patient Queue Engine")
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
                
                // Subtle Border to define the shape
                RoundedRectangle(cornerRadius: 32)
                    .stroke(Color.teal.opacity(0.1), lineWidth: 1)
            }
        )
        .shadow(color: Color.black.opacity(0.03), radius: 20, x: 0, y: 12)
    }
    
    // MARK: - Search & Filter Section
    private var searchFilterSection: some View {
        VStack(spacing: 18) {
            // Search Bar - Professional Style
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.teal.opacity(0.6))
                
                TextField("Search patients...", text: $searchText)
                    .font(.system(size: 15))
            }
            .padding(16)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.9))
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.teal.opacity(0.1), lineWidth: 1)
                }
            )
            
            // Filter Chips - Professional Style
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(["ALL", "PENDING", "APPROVED", "COMPLETED"], id: \.self) { filter in
                        FilterChip(
                            title: filter,
                            isSelected: selectedFilter == filter,
                            color: filterColor(for: filter)
                        ) {
                            selectedFilter = filter
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Requests List Section
    private var requestsListSection: some View {
        VStack(spacing: 20) {
            if isLoading {
                VStack(spacing: 20) {
                    ProgressView()
                        .scaleEffect(1.5)
                    Text("Loading requests...")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.secondary)
                }
                .padding(.top, 80)
            } else if filteredRequests.isEmpty {
                emptyStateView
            } else {
                ForEach(filteredRequests.indices, id: \.self) { index in
                    let req = filteredRequests[index]
                    let status = req["status"] as? String ?? "PENDING"
                    
                    if status == "APPROVED" || status == "COMPLETED" {
                        NavigationLink(destination: ConsultationOverviewView(
                            requestId: req["id"] as? Int ?? 0,
                            patientId: req["patient_id"] as? Int ?? 0,
                            dentistId: effectiveDentistId,
                            patientName: req["patient_name"] as? String ?? "Patient",
                            dentistName: "Dr. Dentist",
                            chatId: req["chat_id"] as? Int ?? 0,
                            role: "DENTIST",
                            status: status
                        )) {
                            requestCard(req: req)
                        }
                    } else {
                        requestCard(req: req)
                    }
                }
            }
        }
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(Color.teal.opacity(0.1))
                    .frame(width: 100, height: 100)
                
                Image(systemName: searchText.isEmpty ? "tray" : "magnifyingglass")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.teal.opacity(0.4))
            }
            
            VStack(spacing: 8) {
                Text(searchText.isEmpty ? "No Requests Yet" : "No Results Found")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundColor(.primary)
                
                Text(searchText.isEmpty ? "New patient consultation requests will appear here" : "Try adjusting your search or filters")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.vertical, 80)
    }
    
    // MARK: - Request Card
    private func requestCard(req: [String: Any]) -> some View {
        let status = req["status"] as? String ?? "PENDING"
        let statusColor = statusColor(for: status)
        
        return HStack(spacing: 0) {
            // 1. Signature Status Accent Bar
            Rectangle()
                .fill(statusColor)
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 16) {
                // 2. Header with Patient Info
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(req["patient_name"] as? String ?? "Patient")
                            .font(.system(size: 18, weight: .black, design: .rounded))
                        
                        Text("Clinical Consultation")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    // Signature Registry accent
                    Capsule()
                        .fill(statusColor.opacity(0.15))
                        .frame(width: 22, height: 4)
                }
                
                // 3. Request Message
                if let msg = req["request_message"] as? String, !msg.isEmpty {
                    Text(msg)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                        .padding(.vertical, 4)
                }
                
                // 4. Action Buttons based on Status
                if status == "PENDING" {
                    actionButtons(req: req)
                } else if status == "APPROVED" {
                    approvedFooter
                } else if status == "COMPLETED" {
                    completedFooter
                }
            }
            .padding(20)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 15, x: 0, y: 8)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(statusColor.opacity(0.08), lineWidth: 1)
        )
    }
    
    // MARK: - Action Buttons
    private func actionButtons(req: [String: Any]) -> some View {
        HStack(spacing: 14) {
            // Accept Button - Professional Gradient
            Button(action: {
                selectedRequest = req
                showSchedulingSheet = true
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14, weight: .bold))
                    Text("ACCEPT CASE")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundColor(.white)
                .background(
                    ZStack {
                        LinearGradient(
                            colors: [Color.teal, Color(hex: "0D9488")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            .padding(1)
                    }
                )
                .cornerRadius(14)
                .shadow(color: Color.teal.opacity(0.2), radius: 10, x: 0, y: 6)
            }
            
            // Decline Button - Subtle
            Button(action: {
                respond(requestId: req["id"] as? Int ?? 0, status: "REJECTED")
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14, weight: .bold))
                    Text("DECLINE")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundColor(.red)
                .background(
                    ZStack {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.red.opacity(0.06))
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.red.opacity(0.15), lineWidth: 1)
                    }
                )
                .cornerRadius(14)
            }
        }
    }
    
    // MARK: - Approved Footer
    private var approvedFooter: some View {
        HStack(spacing: 12) {
            Label("View Activity Hub", systemImage: "arrow.right.circle.fill")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.teal)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.gray.opacity(0.4))
        }
        .padding(.top, 4)
    }
    
    // MARK: - Completed Footer
    private var completedFooter: some View {
        HStack(spacing: 12) {
            Label("View Summary", systemImage: "doc.text.fill")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.blue)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.gray.opacity(0.4))
        }
        .padding(.top, 4)
    }
    
    // MARK: - Scheduling Sheet
    private var schedulingSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Schedule Appointment")) {
                    DatePicker("Date & Time", selection: $selectedDate)
                    Picker("Duration", selection: $selectedDuration) {
                        ForEach(durations, id: \.self) { dur in
                            Text("\(dur) minutes").tag(dur)
                        }
                    }
                }
                
                Section {
                    Button(action: approveWithSchedule) {
                        Text("Confirm & Approve")
                            .frame(maxWidth: .infinity)
                            .bold()
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.green)
                }
            }
            .navigationTitle("New Appointment")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showSchedulingSheet = false }
                }
            }
        }
    }
    
    // MARK: - Helper Functions
    private func statusColor(for status: String) -> Color {
        switch status {
        case "PENDING": return .orange
        case "APPROVED": return .green
        case "REJECTED": return .red
        case "COMPLETED": return .blue
        default: return .gray
        }
    }
    
    private func filterColor(for filter: String) -> Color {
        switch filter {
        case "ALL": return .teal
        case "PENDING": return .orange
        case "APPROVED": return .green
        case "COMPLETED": return .blue
        default: return .teal
        }
    }
    
    private func loadRequests() {
        isLoading = true
        APIService.getConsultationRequests(role: "DENTIST", id: effectiveDentistId) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let data) = result {
                    self.requests = data
                }
            }
        }
    }
    
    private func respond(requestId: Int, status: String) {
        let data: [String: Any] = ["request_id": requestId, "status": status]
        APIService.respondToRequest(data: data) { result in
            DispatchQueue.main.async {
                loadRequests()
            }
        }
    }
    
    private func approveWithSchedule() {
        guard let reqID = selectedRequest?["id"] as? Int else { return }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: selectedDate)
        
        formatter.dateFormat = "HH:mm:ss"
        let timeStr = formatter.string(from: selectedDate)
        
        let data: [String: Any] = [
            "request_id": reqID,
            "status": "APPROVED",
            "scheduled_date": dateStr,
            "scheduled_time": timeStr,
            "duration_minutes": selectedDuration
        ]
        
        APIService.respondToRequest(data: data) { result in
            DispatchQueue.main.async {
                showSchedulingSheet = false
                loadRequests()
            }
        }
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            // Haptic tap for clinical precision
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            action()
        }) {
            HStack(spacing: 6) {
                if isSelected {
                    Image(systemName: "checkmark.seal.fill") // More professional "verified" icon
                        .font(.system(size: 10, weight: .bold))
                }
                
                Text(title.uppercased())
                    .font(.system(size: 10, weight: .black))
                    .tracking(1.5) // Increased tracking for a high-end look
            }
            .foregroundColor(isSelected ? .white : color.opacity(0.8))
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                ZStack {
                    if isSelected {
                        // High-contrast Clinical Gradient
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(
                                    colors: [color, color.opacity(0.85)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .shadow(color: color.opacity(0.25), radius: 8, x: 0, y: 4)
                    } else {
                        // Glassmorphic Unselected State
                        RoundedRectangle(cornerRadius: 12)
                            .fill(color.opacity(0.04))
                    }
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.white.opacity(0.2) : color.opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
    }
}
