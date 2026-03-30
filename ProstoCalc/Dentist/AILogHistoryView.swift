import SwiftUI
import Combine
import Charts

// MARK: - AILog Model
struct AILog: Identifiable, Codable {
    let id: Int
    let patientName: String
    let createdAt: String
    let totalEstimatedCost: Double
    let mode: String
    let explanations: [AIExplanation]?
    let items: [AITreatmentItem]?
    
    init(id: Int, data: [String: Any]) {
        self.id = id
        self.patientName = data["patient_name"] as? String ?? "Clinical Assessment"
        self.createdAt = data["created_at"] as? String ?? ""
        
        if let d = data["total_estimated_cost"] as? Double {
            self.totalEstimatedCost = d
        } else if let s = data["total_estimated_cost"] as? String, let d = Double(s) {
            self.totalEstimatedCost = d
        } else {
            self.totalEstimatedCost = 0.0
        }
        
        self.mode = data["mode"] as? String ?? "calculator"
        
        // Parse explanations
        if let expArray = data["explanations"] as? [[String: Any]] {
            self.explanations = expArray.map { AIExplanation(data: $0) }
        } else {
            self.explanations = nil
        }
        
        // Parse items
        if let itemArray = data["items"] as? [[String: Any]] {
            self.items = itemArray.map { AITreatmentItem(data: $0) }
        } else {
            self.items = nil
        }
    }
}

struct AIExplanation: Identifiable, Codable {
    let id: Int
    let explanationText: String
    
    init(data: [String: Any]) {
        self.id = UUID().hashValue
        self.explanationText = (data["explanation_text"] as? String) ?? 
                              (data["explanation"] as? String) ?? ""
    }
}

struct AITreatmentItem: Identifiable, Codable {
    let id: Int
    let treatmentName: String
    let subtotal: Double
    
    init(data: [String: Any]) {
        self.id = UUID().hashValue
        self.treatmentName = data["treatment_name"] as? String ?? "Treatment"
        
        if let d = data["subtotal"] as? Double {
            self.subtotal = d
        } else if let s = data["subtotal"] as? String, let d = Double(s) {
            self.subtotal = d
        } else {
            self.subtotal = 0.0
        }
    }
}

// MARK: - Filter Options
enum LogFilterOption: String, CaseIterable, Identifiable {
    case all = "All"
    case calculator = "Estimation"
    case approved = "Treatment Plan"
    
    var id: String { rawValue }
    
    var icon: String {
        switch self {
        case .all: return "line.3.horizontal.decrease.circle"
        case .calculator: return "dollarsign.circle"
        case .approved: return "list.bullet.clipboard"
        }
    }
}

enum DateRangeOption: String, CaseIterable, Identifiable {
    case week = "This Week"
    case month = "This Month"
    case quarter = "This Quarter"
    case year = "This Year"
    case all = "All Time"
    
    var id: String { rawValue }
    
    // Returns the start date for the current calendar period
    var startDate: Date {
        let calendar = Calendar.current
        let now = Date()
        
        switch self {
        case .week:
            // Start of current week (Monday)
            let weekday = calendar.component(.weekday, from: now)
            let daysToSubtract = (weekday - calendar.firstWeekday + 7) % 7
            return calendar.date(byAdding: .day, value: -daysToSubtract, to: calendar.startOfDay(for: now)) ?? now
            
        case .month:
            // Start of current month
            let components = calendar.dateComponents([.year, .month], from: now)
            return calendar.date(from: components) ?? now
            
        case .quarter:
            // Start of current quarter
            let month = calendar.component(.month, from: now)
            let quarterStartMonth = ((month - 1) / 3) * 3 + 1
            var components = calendar.dateComponents([.year], from: now)
            components.month = quarterStartMonth
            components.day = 1
            return calendar.date(from: components) ?? now
            
        case .year:
            // Start of current year (January 1)
            let components = calendar.dateComponents([.year], from: now)
            return calendar.date(from: components) ?? now
            
        case .all:
            // Return a date far in the past
            return calendar.date(byAdding: .year, value: -10, to: now) ?? now
        }
    }
    
    // Returns the end date for the current calendar period
    var endDate: Date {
        let calendar = Calendar.current
        let now = Date()
        
        switch self {
        case .week:
            // End of current week (Sunday)
            let weekday = calendar.component(.weekday, from: now)
            let daysToAdd = (calendar.firstWeekday - weekday + 7) % 7
            return calendar.date(byAdding: .day, value: daysToAdd, to: calendar.startOfDay(for: now)) ?? now
            
        case .month:
            // End of current month
            let components = calendar.dateComponents([.year, .month], from: now)
            if let startOfMonth = calendar.date(from: components),
               let nextMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) {
                return calendar.date(byAdding: .day, value: -1, to: nextMonth) ?? now
            }
            return now
            
        case .quarter:
            // End of current quarter
            let month = calendar.component(.month, from: now)
            let quarterEndMonth = ((month - 1) / 3) * 3 + 3
            var components = calendar.dateComponents([.year], from: now)
            components.month = quarterEndMonth
            components.day = 1
            if let startOfQuarterEnd = calendar.date(from: components),
               let nextQuarter = calendar.date(byAdding: .month, value: 1, to: startOfQuarterEnd) {
                return calendar.date(byAdding: .day, value: -1, to: nextQuarter) ?? now
            }
            return now
            
        case .year:
            // End of current year (December 31)
            var components = calendar.dateComponents([.year], from: now)
            components.year = components.year
            components.month = 12
            components.day = 31
            return calendar.date(from: components) ?? now
            
        case .all:
            // Return a date far in the future
            return calendar.date(byAdding: .year, value: 10, to: now) ?? now
        }
    }
    
    // Legacy property for backward compatibility
    var days: Int {
        switch self {
        case .week: return 7
        case .month: return 30
        case .quarter: return 90
        case .year: return 365
        case .all: return 3650
        }
    }
}

// MARK: - View Model
@MainActor
final class AILogHistoryViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var logs: [AILog] = []
    @Published var filteredLogs: [AILog] = []
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var showError = false
    
    // Filter States
    @Published var searchText = ""
    @Published var selectedFilter: LogFilterOption = .all
    @Published var selectedDateRange: DateRangeOption = .month
    
    // Statistics
    @Published var totalCost: Double = 0
    @Published var averageCost: Double = 0
    @Published var totalLogs: Int = 0
    
    let dentistId: Int
    
    // MARK: - Initialization
    init(dentistId: Int) {
        self.dentistId = dentistId
    }
    
    // MARK: - Computed Properties
    var chartData: [CostChartData] {
        let _ = Calendar.current
        let _ = Date()
        
        // Group by date and calculate totals
        var groupedData: [String: Double] = [:]
        
        for log in filteredLogs {
            if let date = log.createdAt.toDate() {
                let formatter = DateFormatter()
                formatter.dateFormat = "MM/dd"
                let key = formatter.string(from: date)
                groupedData[key, default: 0] += log.totalEstimatedCost
            }
        }
        
        return groupedData.map { CostChartData(date: $0.key, cost: $0.value) }
            .sorted { $0.date < $1.date }
    }
    
    var modeDistribution: [ModeChartData] {
        var calculatorTotal: Double = 0
        var approvedTotal: Double = 0
        
        for log in filteredLogs {
            if log.mode == "calculator" {
                calculatorTotal += log.totalEstimatedCost
            } else {
                approvedTotal += log.totalEstimatedCost
            }
        }
        
        return [
            ModeChartData(mode: "Estimation", value: calculatorTotal, color: .teal),
            ModeChartData(mode: "Treatment Plan", value: approvedTotal, color: .blue)
        ]
    }
    
    // MARK: - Public Methods
    func loadLogs() async {
        isLoading = true
        errorMessage = nil
        
        await withCheckedContinuation { continuation in
            APIService.getAICostLogs(dentistId: dentistId) { [weak self] result in
                Task { @MainActor in
                    guard let self = self else {
                        continuation.resume()
                        return
                    }
                    
                    self.isLoading = false
                    
                    switch result {
                    case .success(let data):
                        self.logs = data.map { dict in
                            AILog(id: dict["id"] as? Int ?? UUID().hashValue, data: dict)
                        }
                        self.applyFilters()
                        self.calculateStatistics()
                        
                    case .failure(let error):
                        self.errorMessage = error.localizedDescription
                        self.showError = true
                    }
                    
                    continuation.resume()
                }
            }
        }
    }
    
    func applyFilters() {
        var result = logs
        
        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { log in
                log.patientName.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Apply mode filter
        if selectedFilter != .all {
            let modeString = selectedFilter == .calculator ? "calculator" : "approved"
            result = result.filter { $0.mode == modeString }
        }
        
        // Apply date range filter using proper calendar boundaries
        let startDate = selectedDateRange.startDate
        var endDate = selectedDateRange.endDate
        
        // Make end date inclusive by setting it to end of day
        let calendar = Calendar.current
        endDate = calendar.date(bySettingHour: 23, minute: 59, second: 59, of: endDate) ?? endDate
        
        // Debug logging
        #if DEBUG
        print("Filtering: \(selectedDateRange.rawValue)")
        print("Start date: \(startDate)")
        print("End date: \(endDate)")
        print("Total logs before filter: \(logs.count)")
        #endif
        
        result = result.filter { log in
            if let logDate = log.createdAt.toDate() {
                let isInRange = logDate >= startDate && logDate <= endDate
                #if DEBUG
                if !isInRange {
                    print("Log \(log.id) date: \(logDate) - excluded")
                }
                #endif
                return isInRange
            }
            // If we can't parse the date, include the log but warn
            #if DEBUG
            print("Log \(log.id): Could not parse date '\(log.createdAt)'")
            #endif
            return true
        }
        
        #if DEBUG
        print("Filtered count: \(result.count)")
        #endif
        
        withAnimation(.easeInOut(duration: 0.3)) {
            filteredLogs = result
        }
        
        calculateStatistics()
    }
    
    // MARK: - Private Methods
    private func calculateStatistics() {
        totalLogs = filteredLogs.count
        totalCost = filteredLogs.reduce(0) { $0 + $1.totalEstimatedCost }
        averageCost = totalLogs > 0 ? totalCost / Double(totalLogs) : 0
    }
}

// MARK: - Chart Data Models
struct CostChartData: Identifiable {
    let id = UUID()
    let date: String
    let cost: Double
    
    var parsedDate: Date {
        date.toDate() ?? Date()
    }
}

struct ModeChartData: Identifiable {
    let id = UUID()
    let mode: String
    let value: Double
    let color: Color
}

// MARK: - AILogHistoryView
struct AILogHistoryView: View {
    @Environment(\.dismiss) var dismiss
    let dentistId: Int
    
    @StateObject private var viewModel: AILogHistoryViewModel
    
    // Responsive state
    @State private var screenWidth: CGFloat = 0
    @State private var showDateRangePicker = false
    @State private var showModePicker = false
    @State private var showFilterSheet = false
    
    private var isCompact: Bool { screenWidth < 380 }
    private var isRegular: Bool { screenWidth >= 380 && screenWidth < 500 }
    private var isLarge: Bool { screenWidth >= 500 }
    
    init(dentistId: Int) {
        self.dentistId = dentistId
        self._viewModel = StateObject(wrappedValue: AILogHistoryViewModel(dentistId: dentistId))
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                DentalBackgroundView(animate: true, isDentist: true)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header with search
                    headerView
                        .padding(.horizontal, isCompact ? 12 : 20)
                        .padding(.top, 8)
                    
                    if viewModel.isLoading {
                        loadingView
                    } else if viewModel.logs.isEmpty {
                        emptyView
                    } else {
                        ScrollView {
                            VStack(spacing: isCompact ? 16 : 20) {
                                // Statistics Cards
                                statisticsSection
                                
                                // Chart Section
                                if !viewModel.filteredLogs.isEmpty && isLarge {
                                    chartSection
                                }
                                
                                // Filter Pills
                                filterPillsSection
                                
                                // Logs List
                                logsListSection
                            }
                            .padding(isCompact ? 12 : 20)
                        }
                    }
                }
            }
            .onAppear {
                screenWidth = geometry.size.width
            }
            .onChange(of: geometry.size.width) { newValue in
                screenWidth = newValue
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("Retry") {
                    Task { await viewModel.loadLogs() }
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text(viewModel.errorMessage ?? "Failed to load logs")
            }
            .fullScreenCover(isPresented: $showDateRangePicker) {
            DateRangePickerSheet(
                selectedRange: viewModel.selectedDateRange,
                onSelect: { range in
                    viewModel.selectedDateRange = range
                    viewModel.applyFilters()
                }
            )
            .presentationDetents([.medium])
        }
        .fullScreenCover(isPresented: $showModePicker) {
            ModePickerSheet(
                selectedMode: viewModel.selectedFilter,
                onSelect: { mode in
                    viewModel.selectedFilter = mode
                    viewModel.applyFilters()
                }
            )
        }
        .fullScreenCover(isPresented: $showFilterSheet) {
            FilterSheetView(viewModel: viewModel)
        }
        }
        .navigationTitle("AI Clinical Registry")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: isCompact ? 14 : 16, weight: .bold))
                        .foregroundColor(.teal)
                        .frame(width: 36, height: 36)
                        .background(Circle().fill(Color.white.opacity(0.8)))
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showFilterSheet = true }) {
                    Image(systemName: "slider.horizontal.3")
                        .font(.system(size: isCompact ? 14 : 16, weight: .medium))
                        .foregroundColor(.teal)
                        .frame(width: 36, height: 36)
                        .background(Circle().fill(Color.white.opacity(0.8)))
                }
            }
        }
        .task {
            await viewModel.loadLogs()
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 20) {
            // 1. Brand & High-Level Stats
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "waveform.path.ecg")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.teal)
                        
                        Text("AI CLINICAL REGISTRY")
                            .font(.system(size: isCompact ? 8 : 10, weight: .black))
                            .tracking(2)
                            .foregroundColor(.teal.opacity(0.8))
                    }
                    
                    Text("AI Insights History")
                        .font(.system(size: isCompact ? 22 : 28, weight: .black, design: .rounded))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Stats summary with a more professional treatment
                if !viewModel.isLoading && !viewModel.logs.isEmpty {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("₹\(String(format: "%.0f", viewModel.totalCost))")
                            .font(.system(size: isCompact ? 18 : 22, weight: .black, design: .rounded))
                            .foregroundColor(.teal)
                        
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color.teal.opacity(0.3))
                                .frame(width: 6, height: 6)
                            Text("TOTAL VALUE")
                                .font(.system(size: isCompact ? 7 : 8, weight: .heavy))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.bottom, 2)
                }
            }
            .padding(.horizontal, 4)
            
            // 2. Interactive Search Bar
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.teal.opacity(0.1))
                        .frame(width: 32, height: 32)
                    
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.teal)
                }
                
                TextField("Search patient records...", text: $viewModel.searchText)
                    .font(.system(size: isCompact ? 15 : 16, weight: .medium, design: .rounded))
                    .autocorrectionDisabled()
                    .submitLabel(.search)
                    .onChange(of: viewModel.searchText) { _ in
                        viewModel.applyFilters()
                    }
                
                if !viewModel.searchText.isEmpty {
                    Button(action: {
                        withAnimation(.spring()) {
                            viewModel.searchText = ""
                            viewModel.applyFilters()
                        }
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 18))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundColor(.teal)
                    }
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.white.opacity(0.6))
                    
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.teal.opacity(0.15), lineWidth: 1)
                }
            )
            .shadow(color: Color.black.opacity(0.03), radius: 10, y: 5)
        }
        .padding(20)
        .background(
            // The main header background stays transparent to show the DentalBackgroundView
            // but uses a subtle gradient to ensure text readability
            LinearGradient(
                colors: [Color.white.opacity(0.2), .clear],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 24) {
            // Skeleton animation
            VStack(spacing: 18) {
                ForEach(0..<5, id: \.self) { _ in
                    SkeletonCard(isCompact: isCompact)
                }
            }
            .padding(.horizontal, isCompact ? 12 : 20)
            .padding(.top, 40)
        }
    }
    
    // MARK: - Empty View
    private var emptyView: some View {
        VStack(spacing: 20) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: isCompact ? 40 : 50))
                .foregroundColor(.teal.opacity(0.3))
            
            Text("NO CLINICAL DATA")
                .font(.system(size: isCompact ? 12 : 14, weight: .black))
                .foregroundColor(.teal)
            
            Text("Utilize the Cost Calculator or Treatment approved to generate AI insights.")
                .font(.system(size: isCompact ? 12 : 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
    
    // MARK: - Statistics Section
    private var statisticsSection: some View {
        HStack(spacing: isCompact ? 10 : 16) {
            LogStatCard(
                title: "Total Logs",
                value: "\(viewModel.totalLogs)",
                icon: "doc.text.fill",
                color: .teal,
                isCompact: isCompact
            )
            
            LogStatCard(
                title: "Total Value",
                value: "₹\(String(format: "%.0f", viewModel.totalCost))",
                icon: "dollarsign.circle.fill",
                color: .blue,
                isCompact: isCompact
            )
            
            LogStatCard(
                title: "Average",
                value: "₹\(String(format: "%.0f", viewModel.averageCost))",
                icon: "chart.bar.fill",
                color: .teal,
                isCompact: isCompact
            )
        }
    }
    
    // MARK: - Chart Section
    private var chartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("COST TRENDS")
                .font(.system(size: isCompact ? 8 : 10, weight: .black))
                .tracking(2)
                .foregroundColor(.secondary)
            
            // Bar Chart
            if #available(iOS 16.0, *) {
                Chart(viewModel.chartData) { data in
                    BarMark(
                        x: .value("Date", data.parsedDate, unit: .day),
                        y: .value("Cost", data.cost)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.teal, .blue],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.day().month())
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let doubleValue = value.as(Double.self) {
                                Text("₹\(Int(doubleValue))")
                                    .font(.system(size: 8))
                            }
                        }
                    }
                }
                .frame(height: 200)
            } else {
                // Fallback for iOS 15
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(viewModel.chartData.prefix(7)) { data in
                        VStack {
                            Rectangle()
                                .fill(
                                    LinearGradient(
                                        colors: [.teal, .blue],
                                        startPoint: .bottom,
                                        endPoint: .top
                                    )
                                )
                                .frame(height: CGFloat(data.cost / 100))
                            Text(data.date.prefix(5))
                                .font(.system(size: 8))
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .frame(height: 200)
            }
            
            // Mode Distribution
            HStack(spacing: 20) {
                ForEach(viewModel.modeDistribution) { data in
                    HStack(spacing: 8) {
                        Circle()
                            .fill(data.color)
                            .frame(width: 12, height: 12)
                        Text(data.mode)
                            .font(.system(size: isCompact ? 10 : 12, weight: .semibold))
                        Spacer()
                        Text("₹\(String(format: "%.0f", data.value))")
                            .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.ultraThinMaterial)
            )
        }
        .padding(isCompact ? 16 : 20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
        )
    }
    
    // MARK: - Filter Pills Section
    private var filterPillsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                // Date Range Filter
                Button(action: { showDateRangePicker = true }) {
                    FilterPill(
                        title: viewModel.selectedDateRange.rawValue,
                        icon: "calendar",
                        isActive: viewModel.selectedDateRange != .all,
                        isCompact: isCompact
                    )
                }
                .buttonStyle(.plain)
                
                // Mode Filter
                Button(action: { showModePicker = true }) {
                    FilterPill(
                        title: viewModel.selectedFilter.rawValue,
                        icon: viewModel.selectedFilter.icon,
                        isActive: viewModel.selectedFilter != .all,
                        isCompact: isCompact
                    )
                }
                .buttonStyle(.plain)
                
                // Clear Filters
                if viewModel.selectedDateRange != .month || viewModel.selectedFilter != .all || !viewModel.searchText.isEmpty {
                    Button(action: {
                        viewModel.selectedDateRange = .month
                        viewModel.selectedFilter = .all
                        viewModel.searchText = ""
                        viewModel.applyFilters()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark.circle.fill")
                            Text("Clear")
                        }
                        .font(.system(size: isCompact ? 11 : 12, weight: .semibold))
                        .foregroundColor(.red)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(Color.red.opacity(0.1))
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Logs List Section
    private var logsListSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("CLINICAL RECORDS")
                    .font(.system(size: isCompact ? 8 : 10, weight: .black))
                    .tracking(2)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(viewModel.filteredLogs.count) records")
                    .font(.system(size: isCompact ? 10 : 12, weight: .semibold))
                    .foregroundColor(.secondary)
            }
            
            if viewModel.filteredLogs.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 32))
                        .foregroundColor(.secondary.opacity(0.3))
                    Text("No matching records found")
                        .font(.system(size: isCompact ? 12 : 14, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 60)
            } else {
                ForEach(viewModel.filteredLogs) { log in
                    NavigationLink(destination: AILogDetailView(log: log)) {
                        LogCardView(log: log, isCompact: isCompact)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - Supporting Views


struct LogStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let isCompact: Bool
    
    private var themeTeal: Color { .teal }

    var body: some View {
        VStack(alignment: .leading, spacing: isCompact ? 8 : 12) {
            // 1. Icon & Accent Bar
            HStack(alignment: .top) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.12))
                        .frame(width: isCompact ? 32 : 38, height: isCompact ? 32 : 38)
                    
                    Image(systemName: icon)
                        .font(.system(size: isCompact ? 14 : 18, weight: .bold))
                        .foregroundColor(color)
                }
                
                Spacer()
                
                // Minimalist trend indicator or decorative element
                Capsule()
                    .fill(color.opacity(0.2))
                    .frame(width: 20, height: 4)
            }
            
            // 2. Data Content
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(size: isCompact ? 18 : 24, weight: .black, design: .rounded))
                    .foregroundColor(.primary)
                    .minimumScaleFactor(0.8)
                    .lineLimit(1)
                
                Text(title.uppercased())
                    .font(.system(size: isCompact ? 8 : 10, weight: .heavy))
                    .tracking(1)
                    .foregroundColor(.secondary)
            }
        }
        .padding(isCompact ? 12 : 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack {
                // Glassmorphism Base
                RoundedRectangle(cornerRadius: isCompact ? 16 : 20)
                    .fill(Color.white.opacity(0.6))
                
                // Subtle Gradient Overlay for depth
                RoundedRectangle(cornerRadius: isCompact ? 16 : 20)
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.05), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                // Thin Border
                RoundedRectangle(cornerRadius: isCompact ? 16 : 20)
                    .stroke(color.opacity(0.1), lineWidth: 1)
            }
        )
        // Soft Shadow to match the professional theme
        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
}

struct FilterPill: View {
    let title: String
    let icon: String
    let isActive: Bool
    let isCompact: Bool
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: isCompact ? 10 : 12))
            Text(title)
                .font(.system(size: isCompact ? 11 : 12, weight: .semibold))
        }
        .foregroundColor(isActive ? .white : .primary)
        .padding(.horizontal, isCompact ? 12 : 14)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(isActive ? Color.teal : Color.gray.opacity(0.15))
        )
    }
}



struct LogCardView: View {
    let log: AILog
    let isCompact: Bool
    
    // Theme colors for professional medical aesthetic
    private var primaryTeal: Color { Color.teal }
    private var accentBlue: Color { Color.blue }
    
    var body: some View {
        HStack(spacing: 0) {
            // 1. Vertical Status Indicator
            Rectangle()
                .fill(log.mode == "calculator" ? primaryTeal : accentBlue)
                .frame(width: 4)
            
            VStack(alignment: .leading, spacing: isCompact ? 10 : 14) {
                // 2. Header: Type and Cost
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: log.mode == "calculator" ? "function" : "Stethoscope")
                                .font(.system(size: isCompact ? 8 : 10, weight: .black))
                            
                            Text(log.mode == "calculator" ? "ESTIMATION LOG" : "TREATMENT PLAN")
                                .font(.system(size: isCompact ? 8 : 10, weight: .black))
                                .tracking(1.2)
                        }
                        .foregroundColor(log.mode == "calculator" ? primaryTeal : accentBlue)
                        
                        Text(log.patientName)
                            .font(.system(size: isCompact ? 16 : 18, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 0) {
                        Text("₹\(String(format: "%.0f", log.totalEstimatedCost))")
                            .font(.system(size: isCompact ? 18 : 22, weight: .black, design: .rounded))
                            .foregroundColor(primaryTeal)
                        
                        Text("TOTAL VALUE")
                            .font(.system(size: 7, weight: .heavy))
                            .foregroundColor(.secondary)
                    }
                }
                
                // 3. Metadata Row (Date & Mode)
                HStack(spacing: 12) {
                    Label(log.createdAt.formattedDate(), systemImage: "calendar")
                    
                    Divider().frame(height: 10)
                    
                    Label(log.mode == "calculator" ? "Manual" : "AI Generated",
                          systemImage: log.mode == "calculator" ? "hand.tap.fill" : "sparkles")
                }
                .font(.system(size: isCompact ? 10 : 11, weight: .bold))
                .foregroundColor(.secondary.opacity(0.8))
                
                // 4. Action Footer
                HStack {
                    Text("CLINICAL ANALYSIS")
                        .font(.system(size: isCompact ? 9 : 10, weight: .black))
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Text("Review")
                            .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: isCompact ? 14 : 16))
                    }
                    .foregroundColor(primaryTeal)
                }
                .padding(.top, isCompact ? 4 : 6)
            }
            .padding(isCompact ? 14 : 18)
        }
        .background(
            ZStack {
                // Glass effect
                RoundedRectangle(cornerRadius: isCompact ? 14 : 16)
                    .fill(Color.white.opacity(0.7))
                
                RoundedRectangle(cornerRadius: isCompact ? 14 : 16)
                    .stroke(primaryTeal.opacity(0.1), lineWidth: 1)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: isCompact ? 14 : 16))
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 4)
        .padding(.vertical, 4)
    }
}

// Extension placeholder for date formatting if not already defined
extension Date {
    func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: self)
    }
}

struct SkeletonCard: View {
    let isCompact: Bool
    @State private var isAnimating = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: isCompact ? 10 : 12) {
            HStack {
                VStack(alignment: .leading, spacing: isCompact ? 4 : 6) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 80, height: 12)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 150, height: 16)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 100, height: 12)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 60, height: 20)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 50, height: 10)
                }
            }
            
            Divider()
            
            HStack {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 120, height: 14)
                Spacer()
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 30, height: 14)
            }
        }
        .padding(isCompact ? 14 : 16)
        .background(
            RoundedRectangle(cornerRadius: isCompact ? 14 : 16)
                .fill(Color.white.opacity(0.5))
        )
        .opacity(isAnimating ? 0.6 : 1.0)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - Date Range Picker Sheet
struct DateRangePickerSheet: View {
    let selectedRange: DateRangeOption
    let onSelect: (DateRangeOption) -> Void
    
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                // 1. Clinical Grid Background
                DentalBackgroundView(animate: true, isDentist: true)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 2. Custom Professional Header
                    headerView
                    
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 16) {
                            // Category Label
                            HStack {
                                Text("SELECT TIME PERIOD")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .kerning(1.2)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(DateRangeOption.allCases.count) Options")
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundColor(.secondary.opacity(0.7))
                            }
                            .padding(.horizontal, 4)
                            .padding(.top, 20)

                            // 3. Custom Range Cards
                            ForEach(DateRangeOption.allCases) { option in
                                rangeOptionCard(for: option)
                            }
                        }
                        .padding(20)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack {
            BackButton {
                dismiss()
            }
            
            Spacer()
            
            Text("Date Range")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Spacer()
            
            // Symmetry spacer
            Color.clear
                .frame(width: 36, height: 36)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .overlay(
            Rectangle()
                .frame(height: 0.5)
                .foregroundColor(.gray.opacity(0.2)),
            alignment: .bottom
        )
    }
    
    // MARK: - Custom Card Component
    private func rangeOptionCard(for option: DateRangeOption) -> some View {
        let isSelected = selectedRange == option
        
        return Button(action: {
            onSelect(option)
            dismiss()
        }) {
            HStack(spacing: 0) {
                // Vertical Accent Bar (Teal if selected, Light Gray if not)
                Rectangle()
                    .fill(isSelected ? Color.teal : Color.gray.opacity(0.2))
                    .frame(width: 4)
                
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(option.rawValue)
                            .font(.system(size: 16, weight: isSelected ? .bold : .semibold))
                            .foregroundColor(isSelected ? .primary : .secondary)
                        
                        if isSelected {
                            Text("Current View")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.teal)
                        }
                    }
                    
                    Spacer()
                    
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.teal)
                            .font(.system(size: 20))
                    } else {
                        Circle()
                            .strokeBorder(Color.gray.opacity(0.3), lineWidth: 1)
                            .frame(width: 20, height: 20)
                    }
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 20)
            }
            .background(isSelected ? Color(red: 0.96, green: 0.99, blue: 1.0) : Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.teal.opacity(0.1) : Color.black.opacity(0.03), lineWidth: 1)
            )
            .shadow(color: isSelected ? Color.teal.opacity(0.05) : Color.clear, radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Mode Picker Sheet
struct ModePickerSheet: View {
    let selectedMode: LogFilterOption
    let onSelect: (LogFilterOption) -> Void
    
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                // 1. Clinical Background
                DentalBackgroundView(animate: true, isDentist: true)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 2. Custom Fixed Header
                    headerView
                    
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 16) {
                            // Section Header
                            HStack {
                                Text("LOG SOURCE TYPE")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .kerning(1.2)
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                            .padding(.horizontal, 4)
                            .padding(.top, 20)

                            // 3. Mode Selection Cards
                            ForEach(LogFilterOption.allCases) { option in
                                modeOptionCard(for: option)
                            }
                        }
                        .padding(20)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack {
            BackButton {
                dismiss()
            }
            
            Spacer()
            
            Text("Log Type")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Spacer()
            
            // Placeholder for symmetry
            Color.clear
                .frame(width: 36, height: 36)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }
    
    // MARK: - Mode Card Component
    private func modeOptionCard(for option: LogFilterOption) -> some View {
        let isSelected = selectedMode == option
        
        return Button(action: {
            onSelect(option)
            dismiss()
        }) {
            HStack(spacing: 0) {
                // Vertical Accent Bar
                Rectangle()
                    .fill(isSelected ? Color.teal : Color.gray.opacity(0.2))
                    .frame(width: 4)
                
                HStack(spacing: 16) {
                    // Icon Circle (Matches the small blue/gray icons in your images)
                    ZStack {
                        Circle()
                            .fill(isSelected ? Color.teal.opacity(0.1) : Color.gray.opacity(0.05))
                            .frame(width: 36, height: 36)
                        
                        Image(systemName: option.icon)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(isSelected ? .teal : .secondary)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(option.rawValue.uppercased())
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .kerning(0.5)
                            .foregroundColor(isSelected ? .teal : .secondary)
                        
                        Text(isSelected ? "Active Filter" : "Available Source")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary.opacity(0.6))
                    }
                    
                    Spacer()
                    
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.teal)
                            .font(.system(size: 20))
                    }
                }
                .padding(.vertical, 14)
                .padding(.horizontal, 16)
            }
            .background(isSelected ? Color(red: 0.96, green: 0.99, blue: 1.0) : Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.teal.opacity(0.1) : Color.black.opacity(0.03), lineWidth: 1)
            )
            .shadow(color: isSelected ? Color.teal.opacity(0.05) : Color.clear, radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}



struct FilterSheetView: View {
    @ObservedObject var viewModel: AILogHistoryViewModel
    @Environment(\.dismiss) var dismiss
    
    private var themeColor: Color { .teal }
    
    var body: some View {
        ZStack(alignment: .top) {
            // 1. Background Layer
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // 2. Fixed Professional Header
                fixedHeader
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 25) {
                        
                        // 3. Power Statistics Summary (Visualized)
                        statsDashboard
                        
                        // 4. Filter Sections
                        filterSection(title: "DATE RANGE", icon: "calendar") {
                            ForEach(DateRangeOption.allCases) { option in
                                selectionRow(
                                    title: option.rawValue,
                                    isSelected: viewModel.selectedDateRange == option
                                ) {
                                    viewModel.selectedDateRange = option
                                    applyAndDismiss()
                                }
                            }
                        }
                        
                        filterSection(title: "LOG TYPE", icon: "doc.text.magnifyingglass") {
                            ForEach(LogFilterOption.allCases) { option in
                                selectionRow(
                                    title: option.rawValue,
                                    isSelected: viewModel.selectedFilter == option
                                ) {
                                    viewModel.selectedFilter = option
                                    applyAndDismiss()
                                }
                            }
                        }
                        
                        // Bottom Padding for safe area
                        Color.clear.frame(height: 50)
                    }
                    .padding(20)
                }
            }
        }
    }
    
    // MARK: - Component: Header
    
    private var fixedHeader: some View {
        ZStack {
            
            // Center Title
            VStack(spacing: 2) {
            
                
                Text("History Filters")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
            }
            
            // Left Back Button
            HStack {
                BackButton{
                    dismiss()
                }
                Spacer()
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
    
    // MARK: - Component: Stats Dashboard
    
    private var statsDashboard: some View {
        VStack(alignment: .leading, spacing: 15) {
            Label("QUICK INSIGHTS", systemImage: "chart.bar.fill")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(themeColor)
            
            HStack(spacing: 12) {
                statCard(title: "Records", value: "\(viewModel.totalLogs)", icon: "list.clipboard", color: .teal)
                statCard(title: "Total Value", value: "₹\(Int(viewModel.totalCost))", icon: "indianrupeesign", color: .blue)
            }
            
            HStack(spacing: 12) {
                statCard(title: "Avg. Cost", value: "₹\(Int(viewModel.averageCost))", icon: "divide", color: .indigo)
                statCard(title: "Efficiency", value: "98%", icon: "bolt.fill", color: .orange)
            }
        }
    }
    
    private func statCard(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            // 1. Header: Integrated Icon & Vertical Accent
            HStack(alignment: .top) {
                ZStack {
                    // Soft background circle with clinical tint
                    Circle()
                        .fill(color.opacity(0.1))
                        .frame(width: 36, height: 36)
                    
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(color)
                }
                
                Spacer()
                
                // The signature clinical vertical bar, now used horizontally as a tab
                RoundedRectangle(cornerRadius: 2)
                    .fill(color.opacity(0.3))
                    .frame(width: 20, height: 4)
            }
            
            // 2. Data Content
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                
                // Uppercase tracking matches "CLINICAL ANALYSIS" style
                Text(title.uppercased())
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .kerning(1.1)
                    .foregroundColor(.secondary.opacity(0.7))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack {
                // Main Glass Surface (Matching the #FAFCFF tint in screenshots)
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(red: 0.98, green: 0.99, blue: 1.0))
                
                // Subtle 1pt stroke to define the edges against the DentalBackground
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.black.opacity(0.04), lineWidth: 1)
                
                // Internal Accent Shadow (Matches the value highlight in the registry)
                VStack {
                    Spacer()
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: [color.opacity(0.08), .clear],
                                startPoint: .bottom,
                                endPoint: .center
                            )
                        )
                        .frame(height: 40)
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        // Soft shadow to keep the clinical "floating" look
        .shadow(color: Color.black.opacity(0.02), radius: 8, x: 0, y: 4)
    }
    
    // MARK: - Component: Reusable Section
    
    private func filterSection<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 14))
                Text(title)
                    .font(.system(size: 11, weight: .black))
                    .tracking(1)
            }
            .foregroundColor(.secondary)
            .padding(.leading, 5)
            
            VStack(spacing: 0) {
                content()
            }
            .background(Color.white.opacity(0.8))
            .cornerRadius(20)
            .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
        }
    }
    
    private func selectionRow(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(.system(size: 15, weight: isSelected ? .bold : .medium, design: .rounded))
                    .foregroundColor(isSelected ? .primary : .primary.opacity(0.7))
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(themeColor)
                        .font(.system(size: 18))
                        .transition(.scale.combined(with: .opacity))
                } else {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1.5)
                        .frame(width: 18, height: 18)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
        // Add divider between rows except for the last one (handled by VStack spacing)
        .overlay(
            Divider().padding(.horizontal, 20), alignment: .bottom
        )
    }
    
    // MARK: - Helper
    
    private func applyAndDismiss() {
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
        viewModel.applyFilters()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            dismiss()
        }
    }
}
// MARK: - AILogDetailView
struct AILogDetailView: View {
    @Environment(\.dismiss) var dismiss
    let log: AILog
    
    @State private var screenWidth: CGFloat = 0
    
    private var isCompact: Bool { screenWidth < 380 }
    
    init(log: AILog) {
        self.log = log
    }
    
    // Legacy initializer for backward compatibility
    init(logData: [String: Any]) {
        self.log = AILog(id: logData["id"] as? Int ?? 0, data: logData)
    }
    
    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ZStack {
                    DentalBackgroundView(animate: false, isDentist: true)
                        .ignoresSafeArea()
                    
                    ScrollView {
                        VStack(spacing: isCompact ? 16 : 25) {
                            // 1. Receipt Header
                            headerSection
                            
                            // 2. Procedural Breakdown
                            if let items = log.items, !items.isEmpty {
                                proceduralBreakdownSection(items: items)
                            }
                            
                            // 3. AI Explanation
                            if let explanations = log.explanations, !explanations.isEmpty {
                                aiExplanationSection(explanations: explanations)
                            } else {
                                noExplanationSection
                            }
                            
                            Spacer().frame(height: 50)
                        }
                        .padding(.top, 20)
                        .padding(.horizontal, isCompact ? 12 : 20)
                    }
                    .onAppear {
                        screenWidth = geometry.size.width
                    }
                    .onChange(of: geometry.size.width) { newValue in
                        screenWidth = newValue
                    }
                }
            }
            .navigationTitle("Clinical Log")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: isCompact ? 14 : 16, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                    }
                }
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CLINICAL RECORD")
                        .font(.system(size: isCompact ? 8 : 10, weight: .black))
                        .tracking(2)
                        .foregroundColor(.white.opacity(0.6))
                    Text("#\(log.id)")
                        .font(.system(size: isCompact ? 14 : 18, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("TOTAL VALUE")
                        .font(.system(size: isCompact ? 8 : 10, weight: .black))
                        .tracking(2)
                        .foregroundColor(.white.opacity(0.6))
                    Text("₹\(String(format: "%.2f", log.totalEstimatedCost))")
                        .font(.system(size: isCompact ? 18 : 24, weight: .black))
                        .foregroundColor(.teal)
                }
            }
            .padding(isCompact ? 16 : 25)
            .background(Color.dentalDarkBlue)
            
            Divider()
                .background(Color.white.opacity(0.1))
            
            HStack {
                Label("AI Assisted", systemImage: "sparkles")
                Spacer()
                Text(log.createdAt.formattedDate())
            }
            .font(.system(size: isCompact ? 10 : 12, weight: .bold))
            .foregroundColor(.white.opacity(0.8))
            .padding(isCompact ? 12 : 15)
            .background(Color.dentalDarkBlue.opacity(0.9))
        }
        .cornerRadius(isCompact ? 16 : 20)
        .shadow(color: .black.opacity(0.2), radius: isCompact ? 10 : 15, y: isCompact ? 5 : 10)
    }
    
    // MARK: - Procedural Breakdown Section
    private func proceduralBreakdownSection(items: [AITreatmentItem]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("PROCEDURAL BREAKDOWN")
                .font(.system(size: isCompact ? 8 : 10, weight: .black))
                .foregroundColor(.secondary)
                .padding(.leading, isCompact ? 16 : 20)
                .padding(.bottom, 10)
            
            VStack(spacing: 1) {
                ForEach(items) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.treatmentName)
                                .font(.system(size: isCompact ? 12 : 14, weight: .bold))
                                .foregroundColor(.dentalDarkBlue)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("₹\(String(format: "%.0f", item.subtotal))")
                                .font(.system(size: isCompact ? 13 : 15, weight: .black))
                                .foregroundColor(.primary)
                            Text("Unit Cost Applicable")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(isCompact ? 12 : 16)
                    .background(Color.white)
                }
            }
            .cornerRadius(isCompact ? 12 : 16)
            .shadow(color: .black.opacity(0.05), radius: 5)
        }
    }
    
    // MARK: - AI Explanation Section
    private func aiExplanationSection(explanations: [AIExplanation]) -> some View {
        ForEach(explanations) { explanation in
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Image(systemName: "brain.head.profile")
                        .foregroundColor(.white)
                    Text("AI CLINICAL JUSTIFICATION")
                        .font(.system(size: isCompact ? 9 : 11, weight: .black))
                        .foregroundColor(.white)
                }
                .padding(isCompact ? 12 : 15)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    LinearGradient(
                        colors: [.teal, .blue],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                
                let cleanText = explanation.explanationText
                    .replacingOccurrences(of: "```markdown", with: "")
                    .replacingOccurrences(of: "```", with: "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                
                if !cleanText.isEmpty {
                    Text(LocalizedStringKey(cleanText))
                        .font(.system(size: isCompact ? 12 : 14, weight: .medium))
                        .foregroundColor(.dentalDarkBlue)
                        .lineSpacing(6)
                        .padding(isCompact ? 16 : 20)
                        .background(Color.white)
                } else {
                    Text("Clinical justification content is currently unavailable for this record.")
                        .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                        .foregroundColor(.secondary)
                        .padding(isCompact ? 20 : 25)
                        .background(Color.white)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .cornerRadius(isCompact ? 16 : 20)
            .shadow(color: .teal.opacity(0.1), radius: isCompact ? 6 : 10, y: isCompact ? 3 : 5)
        }
    }
    
    // MARK: - No Explanation Section
    private var noExplanationSection: some View {
        VStack(spacing: 15) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: isCompact ? 24 : 30))
                .foregroundColor(.gray.opacity(0.3))
            Text("No detailed AI analysis text found for this log.")
                .font(.system(size: isCompact ? 10 : 12, weight: .bold))
                .foregroundColor(.secondary)
        }
        .padding(isCompact ? 30 : 40)
    }
}

// MARK: - Date Extension
extension String {
    func toDate() -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = formatter.date(from: self) {
            return date
        }
        
        // Try ISO8601 format
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: self) {
            return date
        }
        
        isoFormatter.formatOptions = [.withInternetDateTime]
        if let date = isoFormatter.date(from: self) {
            return date
        }
        
        // Try other common formats
        let formats = [
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd",
            "dd-MM-yyyy HH:mm:ss",
            "dd-MM-yyyy"
        ]
        
        for format in formats {
            formatter.dateFormat = format
            if let date = formatter.date(from: self) {
                return date
            }
        }
        
        return nil
    }
    
    var shortDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MM/dd"
        if let date = toDate() {
            return formatter.string(from: date)
        }
        return self
    }
}
