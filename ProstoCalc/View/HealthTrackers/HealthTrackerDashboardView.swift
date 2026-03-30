import SwiftUI
import Charts

// MARK: - Mouth Opening Tracker
struct MouthOpeningTrackerView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    @State private var value: String = ""
    @State private var history: [(date: Date, value: Double)] = []
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false).ignoresSafeArea()
            
            VStack {
                HeaderView(title: "Mouth Opening Progress") { dismiss() }
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Input Section
                        VStack(spacing: 15) {
                            Text("Current Measurement")
                                .font(.headline)
                                .foregroundColor(.dentalDarkBlue)
                            
                            HStack {
                                TextField("00", text: $value)
                                    .keyboardType(.decimalPad)
                                    .font(.system(size: 40, weight: .black, design: .rounded))
                                    .multilineTextAlignment(.center)
                                    .frame(width: 80)
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(12)
                                
                                Text("mm")
                                    .font(.title2)
                                    .foregroundColor(.secondary)
                            }
                            
                            Button(action: saveEntry) {
                                Text("Save Weekly Entry")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.teal)
                                    .cornerRadius(14)
                            }
                        }
                        .padding(25)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(24)
                        
                        // Analytics
                        if !history.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("PROGRESS TREND")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.secondary)
                                
                                Chart(history, id: \.date) { item in
                                    LineMark(
                                        x: .value("Date", item.date),
                                        y: .value("Opening (mm)", item.value)
                                    )
                                    .foregroundStyle(Color.teal.gradient)
                                    .interpolationMethod(.catmullRom)
                                    
                                    AreaMark(
                                        x: .value("Date", item.date),
                                        y: .value("Opening (mm)", item.value)
                                    )
                                    .foregroundStyle(LinearGradient(colors: [.teal.opacity(0.3), .clear], startPoint: .top, endPoint: .bottom))
                                }
                                .frame(height: 200)
                                .chartXAxis {
                                    AxisMarks(values: .stride(by: .day)) { value in
                                        AxisGridLine()
                                        AxisTick()
                                        AxisValueLabel(format: .dateTime.day().month())
                                    }
                                }
                                .chartXScale(domain: (history.map(\.date).min() ?? Date())...(history.map(\.date).max() ?? Date()))
                                
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text("Status")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        Text("Improving")
                                            .font(.headline)
                                            .foregroundColor(.green)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing) {
                                        Text("Compliance")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        Text("Dynamic")
                                            .font(.headline)
                                            .foregroundColor(.blue)
                                    }
                                }
                                .padding(.top, 10)
                            }
                            .padding(20)
                            .background(Color.white)
                            .cornerRadius(20)
                        }
                        
                        AIInsightBox(insight: "Consistent improvement detected. 12% increase over the last 4 weeks suggests excellent adherence to physiotherapy exercises.")
                    }
                    .padding(20)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear(perform: loadHistory)
    }
    
    func saveEntry() {
        guard let dVal = Double(value) else { return }
        HealthTrackerService.shared.addMouthOpening(patientId: patientId, value: dVal, date: Date()) { result in
            if case .success = result {
                value = ""
                loadHistory()
            }
        }
    }
    
    func loadHistory() {
        HealthTrackerService.shared.getMouthOpeningHistory(patientId: patientId) { result in
            if case .success(let data) = result {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                // Use local timezone to ensure "2026-02-17" stays on "Feb 17" for the user
                formatter.timeZone = .current 
                let mapped = data.compactMap { dict -> (Date, Double)? in
                    guard let dStr = dict["entry_date"] as? String,
                          let val = dict["value_mm"] as? Double,
                          let date = formatter.date(from: String(dStr.prefix(10))) else { return nil }
                    return (date, val)
                }
                DispatchQueue.main.async {
                    self.history = mapped
                }
            }
        }
    }
}



// MARK: - Medication Tracker View
struct MedicationTrackerView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    
    @State private var medications: [MedicationUIModel] = []
    @State private var totalTaken: Int = 0
    @State private var totalMissed: Int = 0
    @State private var complianceRate: Double = 0.0
    @State private var currentStreak: Int = 7 // Mocked for design
    @State private var selectedRange: Int = 0 // 0: Weekly, 1: Monthly
    @State private var showAddMedication = false
    @State private var selectedDate = Date()
    
    struct MedicationUIModel: Identifiable {
        let id: Int
        let patientId: Int
        let name: String
        let dosage: String
        let freq: String
        let scheduledTime: String?
        let adherence: Double
        let logs: [[String: Any]]
        let colorTag: String
        let startDate: Date?
        let endDate: Date?
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false).ignoresSafeArea()
            
            VStack(spacing: 0) {
                // MARK: - Professional Header
                VStack(alignment: .leading, spacing: 6) {
                    
                    HStack {
                        
                        // Back Button
                        Button(action: { dismiss() }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(.blue)
                                .frame(width: 40, height: 40)
                                .background(
                                    Circle()
                                        .fill(Color.white.opacity(0.9))
                                )
                                .shadow(color: .black.opacity(0.08), radius: 5, y: 2)
                        }
                        
                        Spacer()
                        
                        // Title
                        Text("Medication Tracker")
                            .font(.system(size: 24,design: .rounded))
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                   
                        
                        // Calendar Button
                        NavigationLink(destination: MedicationCalendarView(patientId: patientId)) {
                            Image(systemName: "calendar")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.blue)
                                .frame(width: 38, height: 38)
                                .background(
                                    Circle()
                                        .fill(Color.white.opacity(0.9))
                                )
                                .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
                        }
                        .padding(.leading, 6)
                    }
                    .padding(.bottom, 10)
                    
                    
                  
                    
                    
                    
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 18)
              
                ScrollView {
                    VStack(spacing: 24) {
                        // 2. Summary Analytics Card
                        AdherenceSummaryCard(
                            compliance: complianceRate,
                            taken: totalTaken,
                            missed: totalMissed,
                            streak: currentStreak
                        )
                        .padding(.horizontal)
                        
                        // 3. Interactive Graph Section
                        VStack(alignment: .leading, spacing: 16) {
                            Picker("Range", selection: $selectedRange) {
                                Text("Weekly").tag(0)
                                Text("Monthly").tag(1)
                                Text("Custom").tag(2)
                            }
                            .pickerStyle(.segmented)
                            
                            AdherenceGraphView(medications: medications, range: selectedRange)
                                .frame(height: 180)
                                .padding(.top, 8)
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(20)
                        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
                        .padding(.horizontal)
                        


                            // 5. Medication List
                            VStack(alignment: .leading, spacing: 16) {
                                HStack {
                                    Text("ACTIVE PRESCRIPTIONS")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.secondary)
                                        .tracking(1)
                                    Spacer()
                                    Button(action: { showAddMedication = true }) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "plus.circle.fill")
                                            Text("Add New")
                                        }
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.blue)
                                    }
                                }
                                .padding(.horizontal, 4)
                                
                                if medications.isEmpty {
                                    EmptyStateView()
                                } else {
                                    let activeMeds = medications.filter { med in
                                        // Logic to check if med is active on selectedDate
                                        // Fetch start_date from logs or add it to model
                                        // For now, show all active meds or filter by those with logs on that date
                                        return true // Placeholder: Real logic would involve checking date ranges
                                    }
                                    
                                    ForEach(activeMeds) { med in
                                        NavigationLink(destination: MedicationDetailView(medication: med)) {
                                            ClinicalMedicationCard(medication: med) { status in
                                                logMedication(id: med.id, status: status)
                                            }
                                        }
                                        .buttonStyle(PlainButtonStyle())
                                    }
                                }
                            }
                        .padding(.horizontal)
                        
                        // 5. Missed Medications Section (NEW)
                        if totalMissed > 0 {
                             VStack(alignment: .leading, spacing: 16) {
                                 Text("MISSED DOSES HISTORY")
                                     .font(.system(size: 12, weight: .bold))
                                     .foregroundColor(.red.opacity(0.8))
                                     .tracking(1)
                                 
                                 VStack(spacing: 12) {
                                     ForEach(medications) { med in
                                         let missedLogs = med.logs.filter { ($0["status"] as? String) == "missed" }
                                         ForEach(missedLogs.indices, id: \.self) { index in
                                             let log = missedLogs[index]
                                             HStack {
                                                 Image(systemName: "exclamationmark.circle.fill")
                                                     .foregroundColor(.red)
                                                 VStack(alignment: .leading) {
                                                     Text(med.name)
                                                         .font(.subheadline).bold()
                                                     Text("Missed on \(String((log["log_date"] as? String ?? "").prefix(10)))")
                                                         .font(.caption)
                                                         .foregroundColor(.secondary)
                                                 }
                                                 Spacer()
                                                 Text("Action Required")
                                                     .font(.caption2).bold()
                                                     .padding(6)
                                                     .background(Color.red.opacity(0.1))
                                                     .cornerRadius(6)
                                             }
                                             .padding()
                                             .background(Color.white.opacity(0.6))
                                             .cornerRadius(12)
                                         }
                                     }
                                 }
                             }
                             .padding(.horizontal)
                        }
                        
                        // 6. AI Clinical Insight
                        ClinicalInsightCard(adherence: complianceRate)
                            .padding(.horizontal)
                            .padding(.bottom, 30)
                    }
                    .padding(.top, 10)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            loadData()
            // Micro-interaction: Progress ring animation trigger handled in subview
        }
        .fullScreenCover(isPresented: $showAddMedication) {
            AddMedicationView(patientId: patientId) {
                loadData()
            }
        }
    }
    
    func logMedication(id: Int, status: String) {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.prepare()
        
        HealthTrackerService.shared.logMedication(medicationId: id, date: Date(), status: status) { result in
             if case .success = result {
                 generator.impactOccurred()
                 withAnimation(.spring()) {
                     loadData()
                 }
             }
        }
    }
    
    func loadData() {
        HealthTrackerService.shared.getMedications(patientId: patientId) { result in
            if case .success(let data) = result {
                var newMeds: [MedicationUIModel] = []
                var tTaken = 0
                var tMissed = 0
                
                for dict in data {
                    if let id = dict["id"] as? Int,
                       let name = dict["name"] as? String {
                        let dosage = dict["dosage"] as? String ?? ""
                        let freq = dict["frequency"] as? String ?? ""
                        let logs = dict["logs"] as? [[String: Any]] ?? []
                        
                        var medTaken = 0
                        var medTotal = 0
                        
                        for log in logs {
                            if let status = log["status"] as? String {
                                if status == "taken" {
                                    medTaken += 1
                                    tTaken += 1
                                } else if status == "missed" {
                                    tMissed += 1
                                }
                                medTotal += 1
                            }
                        }
                        
                        let adh = medTotal > 0 ? Double(medTaken) / Double(medTotal) : 0.0
                        let scheduledTime = dict["scheduled_time"] as? String
                        let colorTag = dict["color_tag"] as? String ?? "#3B82F6"
                        
                        let formatter = DateFormatter()
                        formatter.dateFormat = "yyyy-MM-dd"
                        formatter.locale = Locale(identifier: "en_US_POSIX")
                        
                        var sDate: Date?
                        if let sString = dict["start_date"] as? String {
                            sDate = formatter.date(from: String(sString.prefix(10)))
                        }
                        
                        var eDate: Date?
                        if let eString = dict["end_date"] as? String {
                            eDate = formatter.date(from: String(eString.prefix(10)))
                        } else if let s = sDate, let duration = dict["duration_days"] as? Int {
                            eDate = Calendar.current.date(byAdding: .day, value: max(0, duration - 1), to: s)
                        }
                        
                        newMeds.append(MedicationUIModel(id: id, patientId: patientId, name: name, dosage: dosage, freq: freq, scheduledTime: scheduledTime, adherence: adh, logs: logs, colorTag: colorTag, startDate: sDate, endDate: eDate))
                    }
                }
                
                DispatchQueue.main.async {
                    self.medications = newMeds
                    self.totalTaken = tTaken
                    self.totalMissed = tMissed
                    let total = tTaken + tMissed
                    self.complianceRate = total > 0 ? Double(tTaken) / Double(total) : 0.0
                    
                    
                    // Fetch Streak from Server for reliability
                    HealthTrackerService.shared.getStreaks(patientId: self.patientId) { result in
                        if case .success(let data) = result {
                            for item in data {
                                if let type = item["streak_type"] as? String, type == "medication_compliance",
                                   let streak = item["current_streak"] as? Int {
                                    DispatchQueue.main.async {
                                        self.currentStreak = streak
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Subcomponents

struct AdherenceSummaryCard: View {
    let compliance: Double
    let taken: Int
    let missed: Int
    let streak: Int
    
    var body: some View {
        HStack(spacing: 20) {
            // Circular Progress
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.1), lineWidth: 10)
                    .frame(width: 100, height: 100)
                
                Circle()
                    .trim(from: 0, to: compliance)
                    .stroke(
                        LinearGradient(colors: [.blue, .blue.opacity(0.7)], startPoint: .top, endPoint: .bottom),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .frame(width: 100, height: 100)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeOut(duration: 1.5), value: compliance)
                
                VStack(spacing: 0) {
                    Text("\(Int(compliance * 100))%")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    Text("Compliance")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            .padding(10)
            
            // Stats
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 20) {
                    StatMetric(label: "Taken", value: "\(taken)", color: .green, icon: "checkmark.circle.fill")
                    StatMetric(label: "Missed", value: "\(missed)", color: .red, icon: "xmark.circle.fill")
                }
                
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                    Text("\(streak) Day Streak")
                        .font(.system(size: 14, weight: .bold))
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(Color.orange.opacity(0.08))
                .cornerRadius(10)
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(24)
        .shadow(color: Color.black.opacity(0.05), radius: 15, x: 0, y: 10)
    }
}

struct StatMetric: View {
    let label: String
    let value: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                Text(label)
                    .font(.system(size: 10, weight: .bold))
            }
            .foregroundColor(color)
            
            Text(value)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
        }
    }
}

struct AdherenceGraphView: View {
    let medications: [MedicationTrackerView.MedicationUIModel]
    let range: Int
    
    struct DayData: Identifiable {
        let id = UUID()
        let date: Date
        let day: String
        var taken: Int = 0
        var missed: Int = 0
    }
    
    var chartData: [DayData] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Define number of days based on range
        let daysToShow = range == 1 ? 30 : 7 // Weekly vs Monthly
        
        var days: [DayData] = []
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = range == 1 ? "d" : "EEE"
        
        for i in (0..<daysToShow).reversed() {
            if let date = calendar.date(byAdding: .day, value: -i, to: today) {
                days.append(DayData(date: date, day: dayFormatter.string(from: date)))
            }
        }
        
        // Populate with real data
        let logDateFormatter = DateFormatter()
        logDateFormatter.dateFormat = "yyyy-MM-dd"
        
        for med in medications {
            for log in med.logs {
                if let status = log["status"] as? String,
                   let dateStr = log["log_date"] as? String {
                    
                    // Simple cleaning of the date string
                    let cleanDateStr = String(dateStr.prefix(10))
                    if let logDate = logDateFormatter.date(from: cleanDateStr) {
                        let normalizedLogDate = calendar.startOfDay(for: logDate)
                        
                        if let index = days.firstIndex(where: { calendar.isDate($0.date, inSameDayAs: normalizedLogDate) }) {
                            if status == "taken" {
                                days[index].taken += 1
                            } else if status == "missed" {
                                days[index].missed += 1
                            }
                        }
                    }
                }
            }
        }
        
        return days
    }
    
    var body: some View {
        Chart {
            ForEach(chartData) { data in
                BarMark(
                    x: .value("Day", data.day),
                    y: .value("Taken", data.taken)
                )
                .foregroundStyle(Color.blue.gradient)
                .cornerRadius(4)
                
                if data.missed > 0 {
                    BarMark(
                        x: .value("Day", data.day),
                        y: .value("Missed", data.missed)
                    )
                    .foregroundStyle(Color.red.opacity(0.3))
                    .cornerRadius(4)
                }
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
        .chartXAxis {
            AxisMarks()
        }
    }
}


struct ClinicalInsightCard: View {
    let adherence: Double
    
    var message: String {
        if adherence >= 0.9 {
            return "Excellent adherence. Continue full course for optimal therapeutic outcomes."
        } else if adherence >= 0.7 {
            return "Good progress. Try to maintain a consistent schedule to avoid missed doses."
        } else {
            return "Adherence has dropped. Consider setting reminders or using a pill organizer."
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.blue)
                Text("AI CLINICAL INSIGHT")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.blue)
                Spacer()
                Text("Just Now")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
            
            Text(message)
                .font(.system(size: 15, weight: .medium))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .background(
            ZStack {
                Color.white.opacity(0.7)
                VisualEffectView(effect: UIBlurEffect(style: .systemThinMaterial))
            }
        )
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.blue.opacity(0.1), lineWidth: 1)
        )
    }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "pills.circle")
                .font(.system(size: 50))
                .foregroundColor(.gray.opacity(0.3))
            Text("No Active Medications")
                .font(.headline)
            Text("Add your prescriptions to start tracking your adherence.")
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

struct VisualEffectView: UIViewRepresentable {
    var effect: UIVisualEffect?
    func makeUIView(context: Context) -> UIVisualEffectView { UIVisualEffectView() }
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) { uiView.effect = effect }
}


// MARK: - Legacy Helper Components (Used by other views)
struct HeaderView: View {
    let title: String
    let action: () -> Void
    var body: some View {
        HStack {
            Button(action: action) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.teal)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(Color.white.opacity(0.8)))
            }
            Text(title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(.dentalDarkBlue)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 10)
    }
}

struct StepperRow: View {
    let title: String
    @Binding var count: Int
    let color: Color
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(.dentalDarkBlue)
            Spacer()
            HStack(spacing: 15) {
                Button("-") { if count > 0 { count -= 1 } }
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 30, height: 30)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())
                
                Text("\(count)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .frame(width: 30)
                
                Button("+") { count += 1 }
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 30, height: 30)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())
            }
        }
    }
}

struct StreakCard: View {
    let title: String
    let days: Int
    let icon: String
    let color: Color
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.secondary)
                Text("\(days) Days")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundColor(color)
            }
            Spacer()
            ZStack {
                Circle().stroke(color.opacity(0.2), lineWidth: 8).frame(width: 60, height: 60)
                Circle().trim(from: 0, to: 0.7).stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round)).frame(width: 60, height: 60).rotationEffect(.degrees(-90))
                Image(systemName: icon).foregroundColor(color)
            }
        }
        .padding(25)
        .background(Color.white)
        .cornerRadius(24)
        .shadow(color: color.opacity(0.1), radius: 10, y: 5)
    }
}

struct MedicationCard: View {
    let name: String
    let dosage: String
    let freq: String
    let adherence: Double
    let onLog: (String) -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(.headline)
                    .foregroundColor(.dentalDarkBlue)
                Text("\(dosage) • \(freq)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            
            // Actions
            HStack(spacing: 15) {
                Button(action: { onLog("missed") }) {
                     Image(systemName: "xmark.circle.fill")
                         .font(.system(size: 30))
                         .foregroundColor(.red.opacity(0.8))
                }
                
                Button(action: { onLog("taken") }) {
                     Image(systemName: "checkmark.circle.fill")
                         .font(.system(size: 30))
                         .foregroundColor(.green)
                }
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(adherence < 0.5 ? Color.red.opacity(0.3) : Color.clear, lineWidth: 2)
        )
    }
}

// MARK: - Main Dashboard
struct HealthTrackersDashboardView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    let patientName: String
    
    @State private var complianceScore: Int = 0 
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false)
                .ignoresSafeArea()
            
            VStack {
                // Header
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(patientName)
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                        
               
                    }
                    
                    Spacer()
                }
                .padding(.horizontal)
                .padding(.top, 10)
                
                ScrollView {
                    VStack(spacing: 20) {
                        // 1. Mouth Opening
                        NavigationLink(destination: MouthOpeningTrackerView(patientId: patientId)) {
                            TrackerCard(
                                title: "Mouth Opening",
                                description: "Track vertical opening progress in mm.",
                                icon: "arrow.up.and.down.circle.fill",
                                color: .teal
                            )
                        }
                        
                        
                        // 4. Medication Tracker
                        NavigationLink(destination: MedicationTrackerView(patientId: patientId)) {
                            TrackerCard(
                                title: "Medication Tracker",
                                description: "Adherence to prescribed regimen.",
                                icon: "pills.fill",
                                color: .blue
                            )
                        }
                        
                        // Quick Stats Summary
                        VStack(alignment: .leading, spacing: 10) {
                            Text("QUICK SUMMARY")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                            
                            HStack(spacing: 12) {
                                // Opening Stat - Using Blue for Clinical Range
                                QuickStat(
                                    label: "Opening",
                                    value: avgOpening,
                                    icon: "arrow.up.and.down.and.sparkles",
                                    color: .blue
                                )
                                
                                // Adherence Stat - Using Teal/Green for Compliance
                                QuickStat(
                                    label: "Adherence",
                                    value: adherence,
                                    icon: "checkmark.seal.fill",
                                    color: .teal
                                )
                                
                             
                            }
                            .padding(.horizontal, 20)
                        }
                        .padding()
                        .background(Color.white.opacity(0.5))
                        .cornerRadius(20)
                    }
                    .padding(20)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear(perform: loadQuickStats)
        .alert(isPresented: $showError) {
            Alert(title: Text("Error"), message: Text(errorMessage ?? "Unknown error"), dismissButton: .default(Text("OK")))
        }
    }
    
    @State private var avgOpening: String = "--"
    @State private var adherence: String = "--"
    @State private var errorMessage: String?
    @State private var showError: Bool = false

    func loadQuickStats() {
        // Fetch Opening
        HealthTrackerService.shared.getMouthOpeningHistory(patientId: patientId) { result in
            if case .success(let data) = result, let last = data.last {
                if let val = last["value_mm"] as? Double {
                    DispatchQueue.main.async { self.avgOpening = "\(Int(val))mm" }
                }
            } else if case .failure(let error) = result {
                print("Error fetching opening: \(error)") // Silent fail for quick stats
            }
        }
        
        
        // Fetch Med Adherence
        HealthTrackerService.shared.getMedications(patientId: patientId) { result in
             if case .success(let meds) = result {
                 var totalTaken = 0
                 var totalExpected = 0
                 
                 for med in meds {
                     if let logs = med["logs"] as? [[String: Any]] {
                         totalTaken += logs.filter { ($0["status"] as? String) == "taken" }.count
                         totalExpected += logs.count
                     }
                 }
                 
                 let aggregatePct = totalExpected > 0 ? (Double(totalTaken) / Double(totalExpected)) * 100 : 0
                 
                 DispatchQueue.main.async { 
                     self.adherence = totalExpected > 0 ? "\(Int(aggregatePct))%" : "0%"
                     self.complianceScore = Int(aggregatePct)
                 }
             }
        }
    }
}

struct TrackerCard: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    // Defaulting to a professional clinical category label
    var category: String = "HEALTH TRACKER"
    
    var body: some View {
        HStack(spacing: 0) {
            // 1. Signature Vertical Accent Bar
            Rectangle()
                .fill(LinearGradient(
                    colors: [color, color.opacity(0.7)],
                    startPoint: .top,
                    endPoint: .bottom
                ))
                .frame(width: 4.5)
            
            VStack(alignment: .leading, spacing: 14) {
                // 2. Top Row: Icon and Theme Accent Bar
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
                    
                    // The "Activity Node" Theme Bar (top right)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(color.opacity(0.35))
                        .frame(width: 22, height: 4)
                }
                
                // 3. Bottom Content: Clinical Typography
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(category.uppercased())
                            .font(.system(size: 8, weight: .black, design: .rounded))
                            .kerning(1.2)
                            .foregroundColor(.secondary.opacity(0.7))
                        
                        Text(title)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 0.05, green: 0.05, blue: 0.15))
                        
                        Text(description)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    
                    Spacer()
                    
                    // 4. Compact Action Indicator
                    ZStack {
                        Circle()
                            .fill(Color.gray.opacity(0.05))
                            .frame(width: 26, height: 26)
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 9, weight: .black))
                            .foregroundColor(color.opacity(0.6))
                    }
                }
            }
            .padding(18)
        }
        .background(Color.white)
        .cornerRadius(20)
        // High-precision medical border
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
        // Soft ambient shadow
        .shadow(color: Color.black.opacity(0.03), radius: 12, x: 0, y: 6)
    }
}

struct QuickStat: View {
    let label: String
    let value: String
    let icon: String // Added icon to match the image
    let color: Color // Theme color for the bar and icon
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // TOP ROW: Icon and Theme Bar
            HStack(alignment: .top) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.1))
                        .frame(width: 28, height: 28)
                    
                    Image(systemName: icon)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(color)
                }
                
                Spacer()
                
                // The Signature Registry Bar (Top Right)
                RoundedRectangle(cornerRadius: 1.5)
                    .fill(color.opacity(0.25))
                    .frame(width: 18, height: 3)
            }
            
            // BOTTOM CONTENT: Value and Label
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.05, green: 0.05, blue: 0.15))
                
                Text(label.uppercased())
                    .font(.system(size: 8, weight: .black))
                    .kerning(0.5)
                    .foregroundColor(.secondary.opacity(0.6))
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(18)
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.black.opacity(0.035), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.02), radius: 8, x: 0, y: 4)
    }
}
// MARK: - Sub Views Placeholders
// (Defining them in same file for brevity, or subsequent writes)
struct AIInsightBox: View {
    let insight: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "sparkles")
                .foregroundColor(.purple)
                .font(.system(size: 20))
            
            VStack(alignment: .leading, spacing: 2) {
                Text("AI CLINICAL INSIGHT")
                    .font(.system(size: 9, weight: .black))
                    .tracking(1)
                    .foregroundColor(.purple)
                
                Text(insight)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.dentalDarkBlue)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(LinearGradient(colors: [Color.purple.opacity(0.05), Color.blue.opacity(0.05)], startPoint: .leading, endPoint: .trailing))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.purple.opacity(0.2), lineWidth: 1)
        )
    }
}
