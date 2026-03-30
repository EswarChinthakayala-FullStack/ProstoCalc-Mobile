import SwiftUI

struct PatientHubView: View {
    @AppStorage("patient_id") var patientId: Int = 0
    @State private var requests: [[String: Any]] = []
    @State private var isLoading = false
    
    // Filtering & Searching
    @State private var searchText = ""
    @State private var selectedFilter = "ALL" // ALL, PENDING, APPROVED, COMPLETED
    
    // Streak State - Removed from Hub
    
    private var filteredRequests: [[String: Any]] {
        requests.filter { req in
            let dentistName = (req["dentist_name"] as? String ?? "").lowercased()
            let clinicName = (req["clinic_name"] as? String ?? "").lowercased()
            let status = req["status"] as? String ?? "PENDING"
            
            let matchesSearch = searchText.isEmpty || dentistName.contains(searchText.lowercased()) || clinicName.contains(searchText.lowercased())
            let matchesFilter = selectedFilter == "ALL" || status == selectedFilter
            
            return matchesSearch && matchesFilter
        }
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("CLINICAL ACTIVITY")
                            .font(.system(size: 10, weight: .black))
                            .tracking(2)
                            .foregroundColor(.blue)
                        Text("Consultation Hub")
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                    
                    NavigationLink(destination: ConsultationCalendarView(role: "PATIENT", userId: patientId)) {
                        Image(systemName: "calendar")
                            .foregroundColor(.blue)
                            .font(.system(size: 20))
                            .frame(width: 44, height: 44)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 25)
                .padding(.top, 20)
                .padding(.bottom, 10)
                
                // Search & Filters
                VStack(spacing: 15) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.blue.opacity(0.6))
                        TextField("Search clinics or doctors...", text: $searchText)
                            .font(.system(size: 15))
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.8))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.blue.opacity(0.1), lineWidth: 1))
                    
                    // Filter Chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            PatientFilterChip(title: "ALL", isSelected: selectedFilter == "ALL") { selectedFilter = "ALL" }
                            PatientFilterChip(title: "PENDING", isSelected: selectedFilter == "PENDING") { selectedFilter = "PENDING" }
                            PatientFilterChip(title: "APPROVED", isSelected: selectedFilter == "APPROVED") { selectedFilter = "APPROVED" }
                            PatientFilterChip(title: "COMPLETED", isSelected: selectedFilter == "COMPLETED") { selectedFilter = "COMPLETED" }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 15)
                
                ScrollView {
                    VStack(spacing: 20) {
                        if isLoading {
                            ProgressView()
                                .padding(.top, 100)
                        } else if filteredRequests.isEmpty {
                            VStack(spacing: 15) {
                                Image(systemName: "magnifyingglass")
                                    .font(.system(size: 50))
                                    .foregroundColor(.blue.opacity(0.3))
                                Text(searchText.isEmpty ? "No activity found" : "No results for search")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.top, 150)
                        } else {
                            ForEach(filteredRequests.indices, id: \.self) { index in
                                let req = filteredRequests[index]
                                let status = req["status"] as? String ?? "PENDING"
                                
                                if status == "APPROVED" || status == "COMPLETED" {
                                    NavigationLink(destination: ConsultationOverviewView(
                                        requestId: req["id"] as? Int ?? 0,
                                        patientId: patientId,
                                        dentistId: req["dentist_id"] as? Int ?? 0,
                                        patientName: "Me",
                                        dentistName: req["dentist_name"] as? String ?? "Dentist",
                                        chatId: req["chat_id"] as? Int ?? 0,
                                        role: "PATIENT",
                                        status: status
                                    )) {
                                        patientRequestCard(req: req)
                                    }
                                } else {
                                    patientRequestCard(req: req)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 100)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            loadRequests()
            // fetchStreak() - Removed from Hub
        }
    }
    
    /* fetchStreak() removed - streak no longer shown in Hub */
    
    private func patientRequestCard(req: [String: Any]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(req["dentist_name"] as? String ?? "Dentist")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                    Text(req["clinic_name"] as? String ?? "Dental Clinic")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary)
                }
                Spacer()
                let clinicalStatus = req["visit_status"] as? String
                let isRescheduled = req["rescheduled_from"] != nil
                let displayStatus: String = {
                    if let vs = clinicalStatus {
                        if vs == "scheduled" { return isRescheduled ? "RESCHEDULED" : "ON SCHEDULE" }
                        if vs == "in_progress" { return "IN CHAIR" }
                        if vs == "visited" { return "COMPLETED" }
                        return vs.uppercased()
                    }
                    return req["status"] as? String ?? "PENDING"
                }()
                StatusBadge(status: displayStatus)
            }
            
            if req["status"] as? String == "APPROVED" {
                HStack(spacing: 8) {
                    Label("Open Activity Hub", systemImage: "sparkles")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.teal)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.gray.opacity(0.3))
                }
                .padding(.top, 4)
            }
            
            // Professional Postponement Alert
            if let originalDate = req["original_date"] as? String {
                VStack(alignment: .leading, spacing: 8) {
                    Divider().background(Color.orange.opacity(0.2))
                    
                    HStack(spacing: 8) {
                        Image(systemName: "clock.arrow.2.circlepath")
                            .font(.system(size: 14))
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("POSTPONED & RESCHEDULED")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.orange)
                                .tracking(1)
                            
                            let newDate = (req["scheduled_date"] as? String ?? "TBD").formattedDate()
                            Text("Your visit on \(originalDate.formattedDate()) has been moved to \(newDate).")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if let reason = req["postpone_reason"] as? String, !reason.isEmpty {
                        Text("Reason: \(reason)")
                            .font(.system(size: 10, weight: .medium))
                            .italic()
                            .foregroundColor(.secondary.opacity(0.8))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.orange.opacity(0.05))
                            .cornerRadius(6)
                    }
                }
                .padding(.top, 5)
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.03), radius: 10, x: 0, y: 5)
        .padding(.vertical, 6)
        .padding(.horizontal, 4)
    }
    
    private func loadRequests() {
        isLoading = true
        APIService.getConsultationRequests(role: "PATIENT", id: patientId) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let data) = result {
                    self.requests = data
                }
            }
        }
    }
}

struct StatusBadge: View {
    let status: String
    var body: some View {
        Text(status)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.1))
            .foregroundColor(statusColor)
            .cornerRadius(8)
    }
    
    var statusColor: Color {
        switch status.uppercased() {
        case "PENDING": return .orange
        case "APPROVED": return .green
        case "REJECTED": return .red
        case "COMPLETED", "VISITED": return .blue
        case "POSTPONED": return .orange
        case "RESCHEDULED": return .indigo
        case "ON SCHEDULE": return .blue
        case "ARRIVED": return .blue
        case "IN_PROGRESS", "IN CHAIR": return .purple
        default: return .gray
        }
    }
}
struct PatientFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11, weight: .black))
                .foregroundColor(isSelected ? .white : .blue)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color.blue.opacity(0.1))
                .cornerRadius(20)
        }
    }
}
