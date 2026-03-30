import SwiftUI

struct DentistScheduleView: View {
    @AppStorage("dentist_id") var dentistId: Int = 0
    var consultationMode: String = "FULL"
    var onBack: (() -> Void)? = nil
    
    @Environment(\.dismiss) var dismiss
    @State private var selectedDate = Date()
    @State private var appointments: [[String: Any]] = []
    @State private var postponedAppointments: [[String: Any]] = []
    @State private var slots: [[String: Any]] = []
    @State private var isLoading = false
    
    @State private var selectedAppointment: [String: Any]?
    @State private var showStatusActionSheet = false
    @State private var showRescheduleSheet = false
    @State private var showAddSlotSheet = false
    
    // New Slot state
    @State private var newSlotStart = Date()
    @State private var newSlotEnd = Date()
    @State private var newSlotLabel = ""
    @State private var selectedSlotColor = Color.teal
    
    // Toast state
    @State private var showToast = false
    @State private var toastMessage = ""
    
    // Rescheduling state
    @State private var newDate = Date()
    @State private var rescheduleReason = ""
    
    var body: some View {
        VStack(spacing: 0) {
            header
            datePickerRow
            
            if isLoading {
                Spacer()
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.2)
                        .tint(.teal)
                    Text("SYNCHRONIZING CLINICAL DATA...")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1.5)
                        .foregroundColor(.teal.opacity(0.8))
                }
                Spacer()
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 28) {
                        if appointments.isEmpty && slots.isEmpty && postponedAppointments.isEmpty {
                            emptyState
                        } else {
                            if !appointments.isEmpty {
                                VStack(alignment: .leading, spacing: 16) {
                                    sectionHeader(title: "CLINICAL QUEUE", count: appointments.count, countLabel: "VISITS")
                                    
                                    ForEach(appointments.indices, id: \.self) { index in
                                        appointmentCard(appointments[index])
                                    }
                                }
                            }
                            
                            if !postponedAppointments.isEmpty {
                                VStack(alignment: .leading, spacing: 16) {
                                    sectionHeader(title: "POSTPONED REQUESTS", count: postponedAppointments.count, countLabel: "PENDING")
                                    
                                    ForEach(postponedAppointments.indices, id: \.self) { index in
                                        appointmentCard(postponedAppointments[index])
                                    }
                                }
                            }
                            
                            if !slots.isEmpty {
                                VStack(alignment: .leading, spacing: 16) {
                                    sectionHeader(title: "OPERATORY SLOTS", count: slots.count, countLabel: "SLOTS")
                                    
                                    ForEach(slots.indices, id: \.self) { index in
                                        slotCard(slots[index])
                                    }
                                }
                            }
                        }
                    }
                    .padding(.vertical, 24)
                }
            }
        }
        .padding(.top, 20)
        .background(
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
        )
        .onAppear(perform: loadSchedule)
        .onChange(of: selectedDate) { _ in loadSchedule() }
        .actionSheet(isPresented: $showStatusActionSheet) {
            ActionSheet(
                title: Text("Clinical Status Control"),
                message: Text("Update the progressive status for \(selectedAppointment?["patient_name"] as? String ?? "the patient")."),
                buttons: statusButtons()
            )
        }
        .fullScreenCover(isPresented: $showRescheduleSheet) {
            rescheduleView
        }
        .fullScreenCover(isPresented: $showAddSlotSheet) {
            addSlotView
        }
    }
    
    // MARK: - View Components
    
    private var header: some View {
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
            
            VStack(alignment: .leading, spacing: 6) {
                Text("CLINIC SCHEDULE")
                    .font(.system(size: 11, weight: .black))
                    .tracking(2)
                    .foregroundColor(.teal)
                
                Text(consultationMode == "CALCULATION_ONLY" ? "Clinical Estimations" : "Patient Flow Control")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
            }
            Spacer()
            Button(action: { showAddSlotSheet = true }) {
                ZStack {
                    Circle().fill(Color.teal.opacity(0.1)).frame(width: 44, height: 44)
                    Image(systemName: "plus")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.teal)
                }
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 10)
        .padding(.bottom, 10)
    }
    
    private var datePickerRow: some View {
        VStack(spacing: 14) {
            
            // MARK: Section Title
            HStack {
                Label("Appointment Date", systemImage: "calendar")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            // MARK: Picker + Today Button
            HStack(spacing: 14) {
                
                DatePicker(
                    "",
                    selection: $selectedDate,
                    displayedComponents: .date
                )
                .labelsHidden()
                .datePickerStyle(.compact)
                .tint(.teal)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                
                Button(action: {
                    withAnimation(.easeInOut) {
                        selectedDate = Date()
                    }
                }) {
                    Text("Today")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [.teal, .cyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(color: .teal.opacity(0.4), radius: 8, y: 5)
                }
            }
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.15), radius: 15, y: 10)
        .padding(.horizontal, 20)
    }
    
    private func sectionHeader(title: String, count: Int, countLabel: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 11, weight: .black))
                .tracking(1.5)
                .foregroundColor(.secondary)
            Spacer()
            Text("\(count) \(countLabel)")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.teal)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color.teal.opacity(0.1))
                .cornerRadius(6)
        }
        .padding(.horizontal, 24)
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.minus")
                .font(.system(size: 56, weight: .light))
                .foregroundColor(.teal.opacity(0.4))
            
            Text("No operations scheduled for this node.")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.secondary)
        }
        .padding(.top, 120)
    }
    
    private func appointmentCard(_ app: [String: Any]) -> some View {
        
        let status = app["visit_status"] as? String ?? "scheduled"
        let category = app["visit_category"] as? String ?? "CONSULTATION"
        let priority = app["priority"] as? String ?? "NORMAL"
        
        let patientName = app["patient_name"] as? String ?? "Patient Name"
        let patientEmail = app["patient_email"] as? String ?? "No record email"
        
        // ✅ Parse Scheduled DateTime (handles timezone)
        let formattedDateTime: String = {
            guard let raw = app["scheduled_time"] as? String else {
                return "Time not set"
            }
            
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            
            var date: Date?
            
            // Try with fractional seconds first
            date = isoFormatter.date(from: raw)
            
            // Fallback without fractional seconds
            if date == nil {
                isoFormatter.formatOptions = [.withInternetDateTime]
                date = isoFormatter.date(from: raw)
            }
            
            guard let finalDate = date else {
                return raw
            }
            
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "dd MMM yyyy • h:mm a"
            return displayFormatter.string(from: finalDate)
        }()
        
        
        return VStack(alignment: .leading, spacing: 18) {
            
            // MARK: Header Section
            HStack(alignment: .top) {
                
                VStack(alignment: .leading, spacing: 6) {
                    
                    HStack(spacing: 8) {
                        Text(patientName)
                            .font(.system(size: 19, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        
                        if priority != "NORMAL" {
                            Text(priority.uppercased())
                                .font(.system(size: 10, weight: .black))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red.opacity(0.12))
                                .foregroundColor(.red)
                                .clipShape(Capsule())
                        }
                    }
                    
                    Text(patientEmail)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                statusBadge(status)
            }
            
            
            Divider().opacity(0.4)
            
            
            // MARK: Appointment Info Row
            HStack(spacing: 20) {
                
                Label {
                    Text(formattedDateTime)
                        .font(.system(size: 13, weight: .semibold))
                } icon: {
                    Image(systemName: "calendar")
                        .foregroundColor(.teal)
                }
                
                Label {
                    Text(category.capitalized)
                        .font(.system(size: 13, weight: .semibold))
                } icon: {
                    Image(systemName: "stethoscope")
                        .foregroundColor(.teal)
                }
                
                Spacer()
                
                if status != "postponed" {
                    Button(action: {
                        selectedAppointment = app
                        showStatusActionSheet = true
                    }) {
                        HStack(spacing: 4) {
                            Text("ACTION")
                            Image(systemName: "chevron.down")
                        }
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 9)
                        .background(Color(UIColor.systemGray6))
                        .foregroundColor(.primary)
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            
            
            // MARK: Dynamic Footer Section
            footerSection(status: status, app: app)
            
        }
        .padding(22)
        .background(
            RoundedRectangle(cornerRadius: 22)
                .fill(Color(UIColor.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.06), radius: 20, x: 0, y: 8)
        .padding(.horizontal, 24)
    }
    
    
    
    @ViewBuilder
    private func footerSection(status: String, app: [String: Any]) -> some View {
        
        if status == "postponed" {
            
            let formatted = formatPostponedDate(app)
            
            HStack(spacing: 8) {
                Image(systemName: "arrow.uturn.right.circle.fill")
                    .foregroundColor(.orange)
                
                Text("Rescheduled to: \(formatted)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.orange)
                
                Spacer()
            }
            .padding(14)
            .background(Color.orange.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
        }
        else if status == "arrived" || status == "in_progress" {
            
            HStack {
                
                Circle()
                    .fill(status == "arrived" ? Color.orange : Color.purple)
                    .frame(width: 8, height: 8)
                
                Text(status == "arrived" ? "Patient in waiting area" : "Treatment in progress")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if status == "arrived" {
                    actionButton(title: "START CHAIR", color: .purple) {
                        updateStatus(to: "in_progress", for: app)
                    }
                }
                else {
                    actionButton(title: "COMPLETE", color: .green) {
                        updateStatus(to: "visited", for: app)
                    }
                }
            }
        }
        else if status == "scheduled" {
            
            HStack {
                Text("Awaiting check-in")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                actionButton(title: "MARK ARRIVED", color: .blue) {
                    updateStatus(to: "arrived", for: app)
                }
            }
        }
    }
    
    
    private func actionButton(title: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .black))
                .padding(.horizontal, 18)
                .padding(.vertical, 9)
                .background(color)
                .foregroundColor(.white)
                .clipShape(Capsule())
        }
    }
    
    // ... [The rest of your struct methods: slotCard, addSlotView, rescheduleView, etc. remain unchanged but inherit the overall cleaner font styling indirectly.]
    
    private func slotCard(_ slot: [String: Any]) -> some View {
        let status = slot["slot_status"] as? String ?? "available"
        let label = slot["slot_label"] as? String ?? "Clinical Slot"
        let startTime = slot["start_time"] as? String ?? "00:00"
        let endTime = slot["end_time"] as? String ?? "00:00"
        
        // Safety check for color conversion
        var slotColor: Color = .teal
        if let _ = slot["color_code"] as? String {
            slotColor = Color.teal
        }
        
        return HStack(spacing: 16) {
            Circle()
                .fill(slotColor)
                .frame(width: 10, height: 10)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 15, weight: .bold))
                Text("\(startTime) - \(endTime)")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if status == "blocked" {
                Text("BLOCKED")
                    .font(.system(size: 9, weight: .black))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(UIColor.systemGray5))
                    .foregroundColor(.gray)
                    .cornerRadius(6)
            }
            
            HStack(spacing: 16) {
                if status == "available" {
                    Button(action: { updateSlotStatus(slot: slot, action: "block") }) {
                        Image(systemName: "lock.fill")
                            .foregroundColor(.orange)
                    }
                } else {
                    Button(action: { updateSlotStatus(slot: slot, action: "unblock") }) {
                        Image(systemName: "lock.open.fill")
                            .foregroundColor(.teal)
                    }
                }
                
                Button(action: { updateSlotStatus(slot: slot, action: "remove") }) {
                    Image(systemName: "trash.fill")
                        .foregroundColor(.red.opacity(0.8))
                }
            }
            .font(.system(size: 15))
        }
        .padding(20)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.03), radius: 10, y: 4)
        .padding(.horizontal, 24)
    }
    
    private var rescheduleView: some View {
        NavigationView {
            Form {
                Section(header: Text("New Visit Schedule")) {
                    DatePicker("New Date & Time", selection: $newDate)
                        .accentColor(.teal)
                    TextField("Reason for rescheduling", text: $rescheduleReason)
                }
                
                Section {
                    Button(action: postponeAppointment) {
                        Text("Confirm Postponement")
                            .frame(maxWidth: .infinity)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.orange)
                }
            }
            .navigationTitle("Postpone Visit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { showRescheduleSheet = false }
                        .foregroundColor(.primary)
                }
            }
        }
        .presentationDetents([.medium])
    }
    
    private var addSlotView: some View {
        NavigationStack {
            ZStack {
                
                // ✅ Background
                DentalBackgroundView(animate: true, isDentist: true)
                    .ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        
                        // MARK: Slot Details Card
                        VStack(spacing: 18) {
                            
                            Text("Slot Details")
                                .font(.system(size: 18, weight: .bold))
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            TextField("Label (e.g. Molar Surgery)", text: $newSlotLabel)
                                .padding()
                                .background(.ultraThinMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                            
                            VStack(spacing: 12) {
                                DatePicker("Start Time",
                                           selection: $newSlotStart,
                                           displayedComponents: .hourAndMinute)
                                
                                DatePicker("End Time",
                                           selection: $newSlotEnd,
                                           displayedComponents: .hourAndMinute)
                            }
                            .accentColor(.teal)
                            .padding()
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .padding()
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 22))
                        .shadow(color: .black.opacity(0.15), radius: 15, y: 10)
                        
                        
                        // MARK: Color Section
                        VStack(spacing: 16) {
                            Text("Visual Indicator")
                                .font(.system(size: 18, weight: .bold))
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            ColorPicker("Tag Color", selection: $selectedSlotColor)
                                .padding()
                                .background(.ultraThinMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .padding()
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 22))
                        .shadow(color: .black.opacity(0.15), radius: 15, y: 10)
                        
                        
                        // MARK: Action Button
                        Button(action: addScheduleSlot) {
                            Text("Allocate Clinical Slot")
                                .font(.system(size: 17, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(
                                    LinearGradient(
                                        colors: [.teal, .cyan],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .foregroundColor(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .shadow(color: .teal.opacity(0.4), radius: 12, y: 8)
                        }
                        .padding(.top, 10)
                        
                    }
                    .padding()
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("New Schedule Slot")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showAddSlotSheet = false
                    }
                }
            }
        }
    }
    
    private func statusBadge(_ status: String) -> some View {
        let (color, label) = {
            switch status {
            case "scheduled": return (Color.blue, "CONFIRMED")
            case "arrived": return (Color.orange, "ARRIVED")
            case "in_progress": return (Color.purple, "IN CHAIR")
            case "visited": return (Color.green, "COMPLETED")
            case "not_visited": return (Color.red, "NO SHOW")
            case "postponed": return (Color.orange, "POSTPONED")
            default: return (Color.gray, status.uppercased())
            }
        }()
        
        return Text(label)
            .font(.system(size: 9, weight: .black))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .foregroundColor(color)
            .cornerRadius(6)
    }
    
    private func statusButtons() -> [ActionSheet.Button] {
        let currentStatus = selectedAppointment?["visit_status"] as? String ?? "scheduled"
        var buttons: [ActionSheet.Button] = []
        
        switch currentStatus {
        case "scheduled":
            buttons.append(.default(Text("Mark Arrived (Checked-In)")) { updateStatus(to: "arrived") })
        case "arrived":
            buttons.append(.default(Text("Start Procedure (In-Chair)")) { updateStatus(to: "in_progress") })
        case "in_progress":
            buttons.append(.default(Text("Complete Visit (Checked-Out)")) { updateStatus(to: "visited") })
        default:
            break
        }
        
        buttons.append(.default(Text("Postpone / Reschedule")) { showRescheduleSheet = true })
        buttons.append(.default(Text("No Show / Not Visited")) { updateStatus(to: "not_visited") })
        buttons.append(.destructive(Text("Cancel Appointment")) { updateStatus(to: "cancelled") })
        buttons.append(.cancel())
        
        return buttons
    }
    
    // MARK: - Logic / Methods
    
    private func loadSchedule() {
        isLoading = true
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: selectedDate)
        
        APIService.getDentistSchedule(dentistId: dentistId, date: dateStr) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let response) = result {
                    if let data = response["data"] as? [String: Any] {
                        let allAppointments = data["appointments"] as? [[String: Any]] ?? []
                        
                        // Separate postponed appointments from regular ones
                        self.postponedAppointments = allAppointments.filter { app in
                            let status = app["visit_status"] as? String ?? ""
                            return status == "postponed"
                        }
                        
                        self.appointments = allAppointments.filter { app in
                            let status = app["visit_status"] as? String ?? ""
                            return status != "postponed"
                        }
                        
                        self.slots = data["slots"] as? [[String: Any]] ?? []
                    }
                }
            }
        }
    }
    
    private func updateStatus(to status: String, for app: [String: Any]? = nil) {
        let targetApp = app ?? selectedAppointment
        guard let appID = targetApp?["id"] as? Int else { return }
        
        let data: [String: Any] = [
            "appointment_id": appID,
            "new_status": status
        ]
        
        APIService.updateVisitStatus(data: data) { result in
            DispatchQueue.main.async {
                if case .success = result {
                    self.toastMessage = "Status: \(status.replacingOccurrences(of: "_", with: " ").uppercased())"
                    self.showToast = true
                }
                loadSchedule()
            }
        }
    }
    
    private func postponeAppointment() {
        guard let appID = selectedAppointment?["id"] as? Int else { return }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: newDate)
        formatter.dateFormat = "HH:mm"
        let timeStr = formatter.string(from: newDate)
        
        let data: [String: Any] = [
            "appointment_id": appID,
            "new_status": "postponed",
            "reason": rescheduleReason,
            "new_date": dateStr,
            "new_time": timeStr
        ]
        
        APIService.updateVisitStatus(data: data) { result in
            DispatchQueue.main.async {
                if case .success = result {
                    self.toastMessage = "Rescheduled Successfully"
                    self.showToast = true
                }
                showRescheduleSheet = false
                loadSchedule()
            }
        }
    }
    
    private func addScheduleSlot() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: selectedDate)
        formatter.dateFormat = "HH:mm:ss"
        let startStr = formatter.string(from: newSlotStart)
        let endStr = formatter.string(from: newSlotEnd)
        
        let colorStr = "#0D9488" // Temporary fallback
        
        let data: [String: Any] = [
            "dentist_id": dentistId,
            "action": "add",
            "date": dateStr,
            "start_time": startStr,
            "end_time": endStr,
            "slot_label": newSlotLabel.isEmpty ? "Operatory Slot" : newSlotLabel,
            "color_code": colorStr
        ]
        
        APIService.manageScheduleSlots(data: data) { result in
            DispatchQueue.main.async {
                if case .success = result {
                    self.toastMessage = "New Slot Allocated"
                    self.showToast = true
                    showAddSlotSheet = false
                    loadSchedule()
                }
            }
        }
    }
    
    private func updateSlotStatus(slot: [String: Any], action: String) {
        guard let slotID = slot["id"] as? Int else { return }
        
        let data: [String: Any] = [
            "dentist_id": dentistId,
            "action": action,
            "slot_id": slotID
        ]
        
        APIService.manageScheduleSlots(data: data) { result in
            DispatchQueue.main.async {
                if case .success = result {
                    self.toastMessage = "Slot \(action.capitalized)"
                    self.showToast = true
                    loadSchedule()
                }
            }
        }
    }
    
    // MARK: - Postponed Date Formatter (Timezone Safe)
    
    private func formatPostponedDate(_ app: [String: Any]) -> String {
        
        guard let raw = app["new_date"] as? String else {
            return "Date pending"
        }
        
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var date = isoFormatter.date(from: raw)
        
        if date == nil {
            isoFormatter.formatOptions = [.withInternetDateTime]
            date = isoFormatter.date(from: raw)
        }
        
        if date == nil {
            let fallbackFormatter = DateFormatter()
            fallbackFormatter.dateFormat = "yyyy-MM-dd"
            date = fallbackFormatter.date(from: raw)
        }
        
        guard let finalDate = date else {
            return raw
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "dd MMM yyyy • h:mm a"
        
        return displayFormatter.string(from: finalDate)
    }
}
