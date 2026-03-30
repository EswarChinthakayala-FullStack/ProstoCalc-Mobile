import SwiftUI

struct SelectedDateWrapper: Identifiable {
    let id = UUID()
    let date: Date
}

struct ConsultationCalendarView: View {
    @Environment(\.dismiss) var dismiss
    let role: String // "DENTIST" or "PATIENT"
    let userId: Int
    var onBack: (() -> Void)? = nil
    
    @State private var currentMonth = Date()
    @State private var events: [[String: Any]] = []
    @State private var selectedDate: SelectedDateWrapper? = nil
    @State private var isLoading = false
    @State private var isLoadingDayDetail = false
    @State private var selectedDateForDetail: Date? = nil
    @State private var cachedEventsForDate: [String: [[String: Any]]] = [:]
    @State private var dayDetailError: String? = nil
    
    // Status & View Mode
    @State private var statusFilter: String = "ALL"
    @State private var viewMode: Int = 0 // 0: Month, 1: Week
    @State private var showStatusPicker = false
    
    // Responsive state
    @State private var screenWidth: CGFloat = 0
    @State private var screenHeight: CGFloat = 0
    
    private let calendar = Calendar.current
    private let daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    
    // Screen size categories
    private var isCompact: Bool { screenWidth < 380 }
    private var isRegular: Bool { screenWidth >= 380 && screenWidth < 500 }
    private var isLarge: Bool { screenWidth >= 500 }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                DentalBackgroundView(animate: true, isDentist: role == "DENTIST")
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Professional Header
                    headerView
                        .padding(.horizontal, isCompact ? 12 : 20)
                        .padding(.top, 8)
                    
                    ScrollView {
                        VStack(spacing: isCompact ? 16 : 25) {
                            // Calendar Card
                            VStack(spacing: isCompact ? 12 : 20) {
                                monthSwitcher
                                
                                // Days Header
                                daysHeader
                                
                                calendarGrid
                            }
                            .padding(isCompact ? 16 : 25)
                            .background(
                                RoundedRectangle(cornerRadius: isCompact ? 20 : 30)
                                    .fill(.ultraThinMaterial)
                                    .shadow(color: .black.opacity(0.08), radius: isCompact ? 10 : 20, x: 0, y: 10)
                            )
                            
                            // Legend / Activity Snapshot
                            if role == "DENTIST" {
                                dentistLegend
                            } else {
                                patientLegend
                            }
                        }
                        .padding(isCompact ? 12 : 20)
                    }
                }
            }
            .onAppear {
                screenWidth = geometry.size.width
                screenHeight = geometry.size.height
            }
            .onChange(of: geometry.size.width) { newValue in
                screenWidth = newValue
            }
            .onChange(of: geometry.size.height) { newValue in
                screenHeight = newValue
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear(perform: loadEvents)
        .fullScreenCover(item: $selectedDate) { wrapper in
            DayDetailView(
                date: wrapper.date,
                role: role,
                userId: userId,
                events: eventsForDate(wrapper.date),
                isLoading: false
            )
            .onDisappear {
                // Reset loading and error states when dismissing
                self.isLoadingDayDetail = false
                self.dayDetailError = nil
            }
        }

        .fullScreenCover(isPresented: $showStatusPicker) {
            StatusFilterSheet(
                currentFilter: statusFilter,
                onSelect: { newFilter in
                    statusFilter = newFilter
                    showStatusPicker = false
                }
            )
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        HStack(spacing: isCompact ? 10 : 15) {
            Button(action: {
                if let onBack = onBack {
                    onBack()
                } else {
                    dismiss()
                }
            }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: isCompact ? 16 : 18, weight: .bold))
                    .foregroundColor(.teal)
                    .frame(width: isCompact ? 32 : 38, height: isCompact ? 32 : 38)
                    .background(Circle().fill(Color.white.opacity(0.8)))
                    .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(role == "DENTIST" ? "CLINICAL SCHEDULE" : "MY VISITS")
                    .font(.system(size: isCompact ? 8 : 10, weight: .black))
                    .tracking(2)
                    .foregroundColor(.secondary)
                
                Text(monthYearString(from: currentMonth))
                    .font(.system(size: isCompact ? 20 : 24, weight: .black, design: .rounded))
                    .foregroundColor(.dentalDarkBlue)
            }
            Spacer()
            
            if role == "DENTIST" {
                HStack(spacing: isCompact ? 8 : 12) {
                    // View Mode Picker
                    Picker("Mode", selection: $viewMode) {
                        Text("MONTH").tag(0)
                        Text("WEEK").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .frame(width: isCompact ? 100 : 120)
                    
                    // Custom Status Filter Button (replaces Menu)
                    Button(action: { showStatusPicker = true }) {
                        HStack(spacing: 4) {
                            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                .font(.system(size: isCompact ? 18 : 22))
                            if statusFilter != "ALL" {
                                Circle()
                                    .fill(Color.red)
                                    .frame(width: 8, height: 8)
                            }
                        }
                        .foregroundColor(.teal)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - Days Header
    private var daysHeader: some View {
        HStack(spacing: 0) {
            ForEach(daysOfWeek, id: \.self) { day in
                Text(day)
                    .font(.system(size: isCompact ? 8 : 10, weight: .black))
                    .foregroundColor(.secondary.opacity(0.6))
                    .frame(maxWidth: .infinity)
            }
        }
    }
    
    // MARK: - Month Switcher
    private var monthSwitcher: some View {
        HStack {
            Button(action: { changeMonth(by: -1) }) {
                Image(systemName: "chevron.left.circle.fill")
                    .foregroundColor(.teal)
                    .font(.system(size: isCompact ? 20 : 24))
            }
            Spacer()
            Text(monthString(from: currentMonth).uppercased())
                .font(.system(size: isCompact ? 12 : 14, weight: .black))
                .tracking(1)
            Spacer()
            Button(action: { changeMonth(by: 1) }) {
                Image(systemName: "chevron.right.circle.fill")
                    .foregroundColor(.teal)
                    .font(.system(size: isCompact ? 20 : 24))
            }
        }
        .padding(.horizontal, 10)
    }
    
    // MARK: - Calendar Grid
    private var calendarGrid: some View {
        let allDays = generateDaysInMonth(for: currentMonth)
        let days: [Date?] = {
            if viewMode == 0 { return allDays }
            // Weekly logic: filter for today's week
            let today = Date()
            guard let weekRange = calendar.dateInterval(of: .weekOfYear, for: today) else { return [] }
            return allDays.filter { date in
                guard let d = date else { return false }
                return d >= weekRange.start && d < weekRange.end
            }
        }()
        
        let columns = Array(repeating: GridItem(.flexible(), spacing: isCompact ? 6 : 10), count: 7)
        
        return LazyVGrid(columns: columns, spacing: isCompact ? 8 : 15) {
            ForEach(days, id: \.self) { date in
                if let date = date {
                    DayCell(
                        date: date,
                        isToday: calendar.isDateInToday(date),
                        events: eventsForDate(date),
                        role: role,
                        isCompact: isCompact
                    )
                    .onTapGesture {
                        self.selectedDate = SelectedDateWrapper(date: date)
                    }
                } else {
                    Color.clear.frame(height: isCompact ? 40 : 50)
                }
            }
        }
    }
    
    // MARK: - Dentist Legend
    private var dentistLegend: some View {
        HStack(spacing: isCompact ? 10 : 15) {
            LegendItem(color: .green, label: "Visited", isCompact: isCompact)
            LegendItem(color: .blue, label: "Scheduled", isCompact: isCompact)
            LegendItem(color: .orange, label: "Today", isCompact: isCompact)
            if !isCompact {
                LegendItem(color: Color(hex: "0D9488"), label: "Custom Slots", isCompact: isCompact)
            }
        }
        .padding(isCompact ? 12 : 16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - Patient Legend
    private var patientLegend: some View {
        HStack(spacing: isCompact ? 15 : 25) {
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                    .font(.system(size: isCompact ? 10 : 12))
                Text("Completed")
                    .font(.system(size: isCompact ? 8 : 10, weight: .bold))
            }
            HStack(spacing: 4) {
                Image(systemName: "clock.fill")
                    .foregroundColor(.blue)
                    .font(.system(size: isCompact ? 10 : 12))
                Text("Upcoming")
                    .font(.system(size: isCompact ? 8 : 10, weight: .bold))
            }
            HStack(spacing: 4) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                    .font(.system(size: isCompact ? 10 : 12))
                Text("Postponed")
                    .font(.system(size: isCompact ? 8 : 10, weight: .bold))
            }
        }
        .padding(isCompact ? 12 : 16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - Data Loading
    private func loadEvents() {
        isLoading = true
        let components = calendar.dateComponents([.month, .year], from: currentMonth)
        APIService.getCalendarEvents(
            role: role,
            userId: userId,
            month: components.month ?? 1,
            year: components.year ?? 2024
        ) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let data) = result {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        self.events = data
                    }
                }
            }
        }
    }
    
    private func eventsForDate(_ date: Date) -> [[String: Any]] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        
        var filtered = events.filter { event in
            // Use event_date from server if available, fallback to scheduled_date
            if let serverEventDate = event["event_date"] as? String {
                return serverEventDate == dateStr
            }
            guard let scheduled = event["scheduled_date"] as? String else { return false }
            let datePart = scheduled.prefix(10)
            return datePart == dateStr
        }
        
        if role == "DENTIST" && statusFilter != "ALL" {
            filtered = filtered.filter { ($0["visit_status"] as? String) == statusFilter }
        }
        
        return filtered
    }
    
    private func changeMonth(by amount: Int) {
        if let newMonth = calendar.date(byAdding: .month, value: amount, to: currentMonth) {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                currentMonth = newMonth
            }
            loadEvents()
        }
    }
    
    private func generateDaysInMonth(for date: Date) -> [Date?] {
        guard let range = calendar.range(of: .day, in: .month, for: date),
              let firstOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: date)) else { return [] }
        
        let firstWeekday = calendar.component(.weekday, from: firstOfMonth)
        var days: [Date?] = Array(repeating: nil, count: firstWeekday - 1)
        
        for day in range {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: firstOfMonth) {
                days.append(date)
            }
        }
        
        return days
    }
    
    private func monthYearString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: date)
    }
    
    private func monthString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM"
        return formatter.string(from: date)
    }
}

// MARK: - Status Filter Sheet
struct StatusFilterSheet: View {
    let currentFilter: String
    let onSelect: (String) -> Void
    
    @Environment(\.dismiss) var dismiss
    
    private let options: [(String, String, String)] = [
        ("ALL", "All Statuses", "line.3.horizontal.decrease.circle"),
        ("visited", "Completed Only", "checkmark.circle.fill"),
        ("scheduled", "Scheduled Only", "calendar"),
        ("postponed", "Postponed/Missed", "exclamationmark.triangle.fill")
    ]
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(options, id: \.0) { option in
                    Button(action: { onSelect(option.0) }) {
                        HStack(spacing: 12) {
                            Image(systemName: option.2)
                                .font(.system(size: 18))
                                .foregroundColor(option.0 == currentFilter ? .teal : .secondary)
                                .frame(width: 28, height: 28)
                                .background(
                                    Circle()
                                        .fill(option.0 == currentFilter ? Color.teal.opacity(0.15) : Color.clear)
                                )
                            
                            Text(option.1)
                                .font(.system(size: 16, weight: option.0 == currentFilter ? .semibold : .regular))
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            if option.0 == currentFilter {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.teal)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Filter by Status")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 16, weight: .semibold))
                }
            }
        }
    }
}

// MARK: - Day Cell
struct DayCell: View {
    let date: Date
    let isToday: Bool
    let events: [[String: Any]]
    let role: String
    let isCompact: Bool
    
    var body: some View {
        VStack(spacing: isCompact ? 4 : 6) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.system(size: isCompact ? 12 : 14, weight: isToday ? .black : .bold))
                .foregroundColor(isToday ? .white : .primary)
                .frame(width: isCompact ? 26 : 30, height: isCompact ? 26 : 30)
                .background(isToday ? Color.orange : Color.clear)
                .clipShape(Circle())
            
            HStack(spacing: isCompact ? 2 : 3) {
                if role == "DENTIST" {
                    // Logic for dentist dots
                    let appointmentEvents = events.filter { ($0["event_type"] as? String) != "SLOT" }
                    let slotEvents = events.filter { ($0["event_type"] as? String) == "SLOT" }
                    
                    // Show dots for appointments (by status)
                    let statuses = Array(Set(appointmentEvents.compactMap { $0["visit_status"] as? String }))
                    ForEach(statuses.prefix(3), id: \.self) { status in
                        Circle()
                            .fill(colorForStatus(status.lowercased()))
                            .frame(width: isCompact ? 4 : 6, height: isCompact ? 4 : 6)
                    }
                    
                    // Show dots for slots (by color)
                    ForEach(slotEvents.indices, id: \.self) { i in
                        if i < 2 { // Max 2 slot dots
                            Circle()
                                .fill(Color(hex: slotEvents[i]["color_code"] as? String ?? "#0D9488"))
                                .frame(width: isCompact ? 4 : 6, height: isCompact ? 4 : 6)
                        }
                    }
                } else {
                    // Patient Icons
                    if let first = events.first {
                        let isRequest = (first["event_type"] as? String) == "REQUEST"
                        let status = (first["visit_status"] as? String ?? "pending").lowercased()
                        Image(systemName: isRequest ? "clock.badge.exclamationmark.fill" : iconForPatientStatus(status))
                            .font(.system(size: isCompact ? 8 : 10))
                            .foregroundColor(colorForStatus(status))
                    }
                }
            }
            .frame(height: isCompact ? 8 : 12)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, isCompact ? 4 : 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isToday ? Color.orange.opacity(0.1) : Color.clear)
        )
    }
    
    private func colorForStatus(_ status: String) -> Color {
        switch status.lowercased() {
        case "visited", "completed": return .green
        case "scheduled", "approved": return .blue
        case "arrived", "in_progress": return Color(hex: "0D9488")
        case "postponed", "not_visited", "rejected": return .red
        case "pending": return .orange
        default: return .secondary
        }
    }
    
    private func iconForPatientStatus(_ status: String) -> String {
        switch status {
        case "visited": return "checkmark.circle.fill"
        case "postponed": return "exclamationmark.triangle.fill"
        default: return "clock.fill"
        }
    }
}

// MARK: - Legend Item
struct LegendItem: View {
    let color: Color
    let label: String
    let isCompact: Bool
    
    var body: some View {
        HStack(spacing: isCompact ? 3 : 5) {
            Circle()
                .fill(color)
                .frame(width: isCompact ? 6 : 8, height: isCompact ? 6 : 8)
            Text(label)
                .font(.system(size: isCompact ? 7 : 9, weight: .bold))
        }
    }
}

// MARK: - Day Detail View
struct DayDetailView: View {
    let date: Date
    let role: String
    let userId: Int
    let events: [[String: Any]]
    var isLoading: Bool = false
    var onError: ((String) -> Void)? = nil
    
    @Environment(\.dismiss) var dismiss
    @State private var screenWidth: CGFloat = UIScreen.main.bounds.width > 0 ? UIScreen.main.bounds.width : 380
    @State private var internalLoading: Bool = false
    @State private var displayEvents: [[String: Any]] = []
    @State private var isEventsLoaded = false
    @State private var loadError: String? = nil
    @State private var showContent = false
    
    private var isCompact: Bool { screenWidth < 380 }
    
    // Use passed isLoading parameter or internal loading
    private var shouldShowLoading: Bool {
        return (isLoading || internalLoading) && !isEventsLoaded
    }
    
    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ZStack {
                    DentalBackgroundView(animate: false, isDentist: role == "DENTIST")
                        .ignoresSafeArea()
                    
                    // Loading Overlay with smooth transition
                    if shouldShowLoading {
                        loadingOverlay
                            .transition(.opacity.combined(with: .scale(scale: 0.95)))
                    }
                    
                    // Error State
                    if let error = loadError {
                        errorOverlay(error: error)
                            .transition(.opacity)
                    }
                    
                    // Content with smooth transition
                    if isEventsLoaded && loadError == nil {
                        ScrollView {
                            VStack(alignment: .leading, spacing: isCompact ? 16 : 20) {
                                // Header Summary
                                summaryHeader
                                
                                Text("APPOINTMENT LOG")
                                    .font(.system(size: isCompact ? 8 : 10, weight: .black))
                                    .tracking(2)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                                
                                if displayEvents.isEmpty {
                                    VStack(spacing: 15) {
                                        Image(systemName: "calendar.badge.exclamationmark")
                                            .font(.system(size: isCompact ? 32 : 40))
                                            .foregroundColor(.secondary.opacity(0.3))
                                        Text("No clinical activity scheduled for this day.")
                                            .font(.system(size: isCompact ? 12 : 14, weight: .bold))
                                            .foregroundColor(.secondary)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, isCompact ? 60 : 100)
                                } else {
                                    ForEach(displayEvents.indices, id: \.self) { index in
                                        let event = displayEvents[index]
                                        if (event["event_type"] as? String) == "SLOT" {
                                            SlotCard(slot: event, isCompact: isCompact)
                                        } else if role == "DENTIST" {
                                            DentistVisitCard(event: event, isCompact: isCompact)
                                        } else {
                                            PatientVisitCard(event: event, isCompact: isCompact)
                                        }
                                    }
                                }
                            }
                            .padding(isCompact ? 12 : 20)
                        }
                        .transition(.opacity)
                    }
                }
            }
            .navigationTitle(dateString(from: date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: isCompact ? 16 : 18, weight: .bold))
                        }
                        .foregroundColor(.teal)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(Color.white.opacity(0.8)))
                    }
                }
            }
            .onAppear {
                screenWidth = UIScreen.main.bounds.width
                // Initialize loading state from parent
                internalLoading = isLoading
                // Load events if not already loaded
                if !isEventsLoaded {
                    loadDayEvents()
                }
            }
        }
    }
    
    // MARK: - Loading Overlay
    private var loadingOverlay: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            VStack(spacing: 25) {
                // Animated loading indicator
                VStack(spacing: 15) {
                    ProgressView()
                        .controlSize(.large)
                        .tint(.teal)
                        .scaleEffect(1.2)
                    
                    Text("LOADING DETAILS...")
                        .font(.system(size: isCompact ? 10 : 12, weight: .black))
                        .tracking(3)
                        .foregroundColor(.teal.opacity(0.8))
                }
                
                // Chevron left button for navigation back during loading
                Button(action: { dismiss() }) {
                    HStack(spacing: 6) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .bold))
                        Text("Go Back")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(
                        Capsule()
                            .fill(Color.teal.opacity(0.8))
                    )
                    .shadow(color: .black.opacity(0.2), radius: 5, y: 2)
                }
                .padding(.top, 10)
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.white.opacity(0.95))
            )
        }
    }
    
    // MARK: - Error Overlay
    private func errorOverlay(error: String) -> some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.red)
                
                Text("Unable to Load Details")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primary)
                
                Text(error)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                HStack(spacing: 15) {
                    Button(action: { dismiss() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 14, weight: .bold))
                            Text("Go Back")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.teal)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(
                            Capsule()
                                .fill(Color.teal.opacity(0.15))
                        )
                    }
                    
                    Button(action: {
                        loadError = nil
                        loadDayEvents()
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 14, weight: .bold))
                            Text("Retry")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(
                            Capsule()
                                .fill(Color.teal)
                        )
                    }
                }
            }
            .padding(30)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.white.opacity(0.95))
            )
        }
    }
    
    private func loadDayEvents() {
        // If events were passed, use them directly
        if !events.isEmpty {
            self.displayEvents = events
            self.isEventsLoaded = true
            // Reset loading states immediately - no artificial delay
            self.internalLoading = false
            // Trigger content animation
            withAnimation(.easeOut(duration: 0.3)) {
                self.showContent = true
            }
        } else {
            // Fetch events from API if not provided
            self.internalLoading = true
            self.loadError = nil
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            let dateStr = formatter.string(from: date)
            let components = Calendar.current.dateComponents([.month, .year, .day], from: date)
            
            APIService.getCalendarEvents(
                role: role,
                userId: userId,
                month: components.month ?? 1,
                year: components.year ?? 2024
            ) { result in
                DispatchQueue.main.async {
                    self.internalLoading = false
                    switch result {
                    case .success(let data):
                        // Filter events for this specific date
                        let filtered = data.filter { event in
                            if let serverEventDate = event["event_date"] as? String {
                                return serverEventDate == dateStr
                            }
                            guard let scheduled = event["scheduled_date"] as? String else { return false }
                            let datePart = scheduled.prefix(10)
                            return datePart == dateStr
                        }
                        self.displayEvents = filtered
                        self.isEventsLoaded = true
                        // Trigger content animation with smooth transition
                        withAnimation(.easeOut(duration: 0.3)) {
                            self.showContent = true
                        }
                    case .failure(let error):
                        self.loadError = error.localizedDescription
                        self.isEventsLoaded = true // Mark as loaded even on error to show error state
                    }
                }
            }
        }
    }
    
    private var summaryHeader: some View {
        VStack(alignment: .leading, spacing: isCompact ? 12 : 15) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("DAILY CAPACITY")
                        .font(.system(size: isCompact ? 6 : 8, weight: .black))
                        .foregroundColor(.white.opacity(0.8))
                    Text("\(displayEvents.count) Total Clusters")
                        .font(.system(size: isCompact ? 16 : 18, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                }
                Spacer()
                Image(systemName: "checklist")
                    .foregroundColor(.white)
                    .font(.system(size: isCompact ? 20 : 24))
            }
            .padding(isCompact ? 16 : 20)
            .background(
                LinearGradient(
                    colors: [role == "DENTIST" ? .teal : .blue, Color(hex: "1E1B4B")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(isCompact ? 16 : 20)
        }
        .padding(.horizontal)
    }
    
    private func dateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d MMMM"
        return formatter.string(from: date)
    }
}

// MARK: - Dentist Visit Card
struct DentistVisitCard: View {
    let event: [String: Any]
    let isCompact: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: isCompact ? 10 : 15) {
            let isRequest = (event["event_type"] as? String) == "REQUEST"
            
            HStack {
                if isRequest {
                    Label("PENDING REQUEST", systemImage: "clock.badge.exclamationmark")
                        .font(.system(size: isCompact ? 8 : 10, weight: .black))
                        .foregroundColor(.orange)
                } else {
                    let time = event["scheduled_time"] as? String ?? "00:00"
                    Text(time.formattedTime())
                        .font(.system(size: isCompact ? 12 : 14, weight: .black, design: .rounded))
                        .foregroundColor(.teal)
                }
                
                Spacer()
                
                ClinicalStatusBadge(
                    status: (event["visit_status"] as? String ?? (isRequest ? "PENDING" : "scheduled")).uppercased(),
                    isCompact: isCompact
                )
            }
            
            VStack(alignment: .leading, spacing: isCompact ? 3 : 5) {
                Text(event["patient_name"] as? String ?? "Unknown Patient")
                    .font(.system(size: isCompact ? 14 : 18, weight: .black, design: .rounded))
                
                Text(event["request_type"] as? String ?? "General Consultation")
                    .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                    .foregroundColor(.secondary)
                
                if let priority = event["priority"] as? String, priority != "NORMAL" {
                    Text(priority)
                        .font(.system(size: isCompact ? 6 : 8, weight: .black))
                        .padding(.horizontal, isCompact ? 4 : 6)
                        .padding(.vertical, 2)
                        .background(priority == "EMERGENCY" ? Color.red : Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(4)
                }
            }
            
            Divider()
            
            HStack {
                NavigationLink(destination: ConsultationOverviewView(
                    requestId: event["request_id"] as? Int ?? 0,
                    patientId: event["patient_id"] as? Int ?? 0,
                    dentistId: event["dentist_id"] as? Int ?? 0,
                    patientName: event["patient_name"] as? String ?? "",
                    dentistName: event["dentist_name"] as? String ?? "",
                    chatId: (event["chat_id"] as? Int) ?? Int(event["chat_id"] as? String ?? "0") ?? 0,
                    role: "DENTIST",
                    status: event["request_status"] as? String ?? "PENDING"
                )) {
                    Label("View Record", systemImage: "doc.text.fill")
                        .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                }
                .buttonStyle(.borderedProminent)
                .tint(.teal)
                
                Spacer()
                
                if (event["visit_status"] as? String) == "postponed" {
                    Button(action: {}) {
                        Text("Reschedule")
                            .font(.system(size: isCompact ? 10 : 12, weight: .black))
                            .foregroundColor(.red)
                    }
                }
            }
        }
        .padding(isCompact ? 16 : 20)
        .background(Color.white)
        .cornerRadius(isCompact ? 16 : 20)
        .shadow(color: .black.opacity(0.04), radius: isCompact ? 6 : 10, y: isCompact ? 3 : 5)
    }
}

// MARK: - Patient Visit Card
struct PatientVisitCard: View {
    let event: [String: Any]
    let isCompact: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: isCompact ? 10 : 15) {
            let isRequest = (event["event_type"] as? String) == "REQUEST"
            
            HStack {
                VStack(alignment: .leading, spacing: isCompact ? 2 : 4) {
                    if isRequest {
                        Text("REQUEST SENT")
                            .font(.system(size: isCompact ? 12 : 14, weight: .black, design: .rounded))
                            .foregroundColor(.orange)
                    } else {
                        let time = event["scheduled_time"] as? String ?? "00:00"
                        Text(time.formattedTime())
                            .font(.system(size: isCompact ? 16 : 20, weight: .black, design: .rounded))
                            .foregroundColor(.blue)
                    }
                    Text(isRequest ? "Pending Review" : "Session Time")
                        .font(.system(size: isCompact ? 8 : 10, weight: .bold))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: isCompact ? 2 : 4) {
                    let badgeStatus = isRequest ? (event["request_status"] as? String ?? "PENDING") : (event["visit_status"] as? String ?? "scheduled")
                    ClinicalStatusBadge(status: badgeStatus.uppercased(), isCompact: isCompact)
                    
                    if event["original_date"] as? String != nil {
                        Text("Rescheduled")
                            .font(.system(size: isCompact ? 7 : 9, weight: .black))
                            .foregroundColor(.orange)
                    }
                }
            }
            
            VStack(alignment: .leading, spacing: isCompact ? 6 : 8) {
                HStack(spacing: isCompact ? 8 : 12) {
                    Circle()
                        .fill(Color.blue.opacity(0.1))
                        .frame(width: isCompact ? 32 : 40, height: isCompact ? 32 : 40)
                        .overlay(
                            Image(systemName: "person.fill")
                                .foregroundColor(.blue)
                                .font(.system(size: isCompact ? 14 : 16))
                        )
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(event["dentist_name"] as? String ?? "Unknown Clinician")
                            .font(.system(size: isCompact ? 13 : 16, weight: .black, design: .rounded))
                        Text(event["clinic_name"] as? String ?? "Dental Clinic")
                            .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                }
                
                Text("PROCEDURE: \(event["request_type"] as? String ?? "Initial Assessment")")
                    .font(.system(size: isCompact ? 9 : 11, weight: .black))
                    .padding(.top, isCompact ? 3 : 5)
                
                NavigationLink(destination: ConsultationOverviewView(
                    requestId: event["request_id"] as? Int ?? 0,
                    patientId: event["patient_id"] as? Int ?? 0,
                    dentistId: event["dentist_id"] as? Int ?? 0,
                    patientName: event["patient_name"] as? String ?? "",
                    dentistName: event["dentist_name"] as? String ?? "",
                    chatId: (event["chat_id"] as? Int) ?? Int(event["chat_id"] as? String ?? "0") ?? 0,
                    role: "PATIENT",
                    status: event["request_status"] as? String ?? "PENDING"
                )) {
                    HStack {
                        Text("VIEW CLINICAL HUB")
                        Image(systemName: "chevron.right")
                    }
                    .font(.system(size: isCompact ? 8 : 10, weight: .black))
                    .foregroundColor(.blue)
                    .padding(.top, isCompact ? 6 : 8)
                }
            }
        }
        .padding(isCompact ? 20 : 25)
        .background(Color.white)
        .cornerRadius(isCompact ? 20 : 24)
        .shadow(color: .black.opacity(0.06), radius: isCompact ? 10 : 15, y: isCompact ? 5 : 8)
    }
}

// MARK: - Clinical Status Badge
struct ClinicalStatusBadge: View {
    let status: String
    let isCompact: Bool
    
    var color: Color {
        switch status.lowercased() {
        case "visited", "completed": return .green
        case "scheduled": return .blue
        case "arrived", "in_progress": return Color(hex: "0D9488")
        case "postponed", "not_visited", "rejected": return .red
        case "pending": return .orange
        case "cancelled": return .gray
        default: return .secondary
        }
    }
    
    var body: some View {
        Text(status)
            .font(.system(size: isCompact ? 6 : 8, weight: .black))
            .padding(.horizontal, isCompact ? 6 : 8)
            .padding(.vertical, isCompact ? 2 : 4)
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .clipShape(Capsule())
    }
}

// MARK: - Slot Card
struct SlotCard: View {
    let slot: [String: Any]
    let isCompact: Bool
    
    var body: some View {
        HStack(spacing: isCompact ? 8 : 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(Color(hex: slot["color_code"] as? String ?? "#0D9488"))
                .frame(width: 4)
                .frame(maxHeight: .infinity)
            
            VStack(alignment: .leading, spacing: isCompact ? 2 : 4) {
                Text((slot["slot_label"] as? String ?? "Custom Slot").uppercased())
                    .font(.system(size: isCompact ? 8 : 10, weight: .black))
                    .tracking(1)
                    .foregroundColor(.secondary)
                
                Text((slot["patient_name"] as? String ?? slot["slot_label"] as? String ?? "Block").capitalized)
                    .font(.system(size: isCompact ? 13 : 16, weight: .black, design: .rounded))
                    .foregroundColor(.primary)
                
                HStack(spacing: isCompact ? 2 : 4) {
                    Image(systemName: "clock")
                    Text("\(slot["scheduled_time"] as? String ?? "") - \(slot["end_time"] as? String ?? "")")
                }
                .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                .foregroundColor(.gray)
            }
            Spacer()
            
            if (slot["visit_status"] as? String) == "blocked" {
                Image(systemName: "lock.fill")
                    .foregroundColor(.gray)
            } else {
                Image(systemName: "calendar.badge.clock")
                    .foregroundColor(Color(hex: slot["color_code"] as? String ?? "#0D9488"))
            }
        }
        .padding(isCompact ? 12 : 15)
        .background(Color.white)
        .cornerRadius(isCompact ? 10 : 12)
        .shadow(color: .black.opacity(0.04), radius: isCompact ? 4 : 6, y: isCompact ? 2 : 3)
    }
}
