import SwiftUI
import Charts

struct MedicationDetailView: View {
    @Environment(\.dismiss) var dismiss
    @State var medication: MedicationTrackerView.MedicationUIModel
    @State private var scheduledTime: Date
    @State private var frequency: String
    @State private var isLoading = false
    @State private var showDeleteConfirm = false
    @State private var selectedColor: String
    @State private var pickerColor: Color = .blue
    
    let colors = [
        ("#3B82F6", "Blue"),
        ("#10B981", "Green"),
        ("#EF4444", "Red"),
        ("#F59E0B", "Amber"),
        ("#8B5CF6", "Purple"),
        ("#EC4899", "Pink")
    ]
    
    let frequencies = ["Once a day", "Twice a day", "Thrice a day", "As needed"]
    
    init(medication: MedicationTrackerView.MedicationUIModel) {
        _medication = State(initialValue: medication)
        _frequency = State(initialValue: medication.freq)
        _selectedColor = State(initialValue: medication.colorTag)
        _pickerColor = State(initialValue: Color(hex: medication.colorTag))
        
        // Parse time string if exists
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        if let timeStr = medication.scheduledTime, let date = formatter.date(from: timeStr) {
            _scheduledTime = State(initialValue: date)
        } else {
            _scheduledTime = State(initialValue: Date())
        }
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false).ignoresSafeArea()
            VStack(spacing: 0) {
                
                // Header
                headerView
                
                ScrollView {
                    VStack(spacing: 24) {
                        // 1. Premium Header
                        VStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(Color(hex: medication.colorTag).opacity(0.1))
                                    .frame(width: 80, height: 80)
                                Image(systemName: "pills.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(Color(hex: medication.colorTag))
                            }
                            
                            VStack(spacing: 4) {
                                Text(medication.name)
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                Text(medication.dosage)
                                    .font(.title3)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.top, 20)
                        
                        // 2. Adherence Analytics Section
                        VStack(alignment: .leading, spacing: 20) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("ADHERENCE PERFORMANCE")
                                        .font(.system(size: 10, weight: .black))
                                        .tracking(1)
                                        .foregroundColor(.secondary)
                                    Text("\(Int(medication.adherence * 100))%")
                                        .font(.system(size: 32, weight: .black, design: .rounded))
                                        .foregroundColor(medication.adherence > 0.8 ? .green : .orange)
                                }
                                Spacer()
                                CircularProgressView(progress: medication.adherence, color: medication.adherence > 0.8 ? .green : .orange)
                                    .frame(width: 60, height: 60)
                            }
                            
                            // Line Chart
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Consistency Trend (Last 7 Days)")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.secondary)
                                
                                Chart {
                                    ForEach(getHistoryTrend(), id: \.date) { data in
                                        LineMark(
                                            x: .value("Day", data.day),
                                            y: .value("Doses", data.count)
                                        )
                                        .foregroundStyle(Color.blue.gradient)
                                        .interpolationMethod(.catmullRom)
                                        .symbol(Circle())
                                        
                                        AreaMark(
                                            x: .value("Day", data.day),
                                            y: .value("Doses", data.count)
                                        )
                                        .foregroundStyle(Color.blue.opacity(0.1).gradient)
                                    }
                                }
                                .frame(height: 120)
                                .chartXAxis {
                                    AxisMarks(values: .automatic) { _ in
                                        AxisValueLabel().font(.system(size: 8, weight: .bold))
                                    }
                                }
                                .chartYAxis {
                                    AxisMarks(values: [0, 1]) { _ in
                                        AxisGridLine()
                                        AxisValueLabel().font(.system(size: 8, weight: .bold))
                                    }
                                }
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(30)
                        .shadow(color: .black.opacity(0.04), radius: 15, y: 8)
                        
                        // 3. AI Clinical Insight Section
                        VStack(alignment: .leading, spacing: 15) {
                            HStack {
                                Image(systemName: "sparkles")
                                    .foregroundColor(.purple)
                                Text("AI CLINICAL INSIGHT")
                                    .font(.system(size: 10, weight: .black))
                                    .tracking(1)
                                    .foregroundColor(.secondary)
                            }
                            
                            Text(getAIInsight())
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.dentalDarkBlue)
                                .lineSpacing(4)
                            
                            if medication.adherence <= 0.7 {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill").foregroundColor(.orange)
                                    Text("High risk of recovery delay detected.")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.orange)
                                }
                                .padding(.top, 4)
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(24)
                        
                        // 4. Action Section: Log Dose
                        VStack(alignment: .leading, spacing: 16) {
                            Text("LOG TODAY'S DOSE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                            
                            HStack(spacing: 12) {
                                actionButton(title: "Missed", icon: "xmark", color: .red) {
                                    logMedication(status: "missed")
                                }
                                actionButton(title: "Taken", icon: "checkmark", color: .green) {
                                    logMedication(status: "taken")
                                }
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(24)
                        
                        // 5. Dose History List
                        VStack(alignment: .leading, spacing: 16) {
                            Text("INTAKE HISTORY")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                            
                            if medication.logs.isEmpty {
                                Text("No history recorded yet.")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(.secondary)
                            } else {
                                VStack(spacing: 12) {
                                    ForEach(medication.logs.prefix(7).indices, id: \.self) { i in
                                        let log = medication.logs[i]
                                        HStack {
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(formatLogDate(log["log_date"] as? String ?? ""))
                                                    .font(.system(size: 13, weight: .bold))
                                                if let actual = log["actual_take_time"] as? String {
                                                    Text("Taken at \(ClinicalTimeFormatter.format(actual))")
                                                        .font(.system(size: 10))
                                                        .foregroundColor(.secondary)
                                                }
                                            }
                                            Spacer()
                                            let status = log["status"] as? String ?? "missed"
                                            Text(status.uppercased())
                                                .font(.system(size: 9, weight: .black))
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 4)
                                                .background(status == "taken" ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
                                                .foregroundColor(status == "taken" ? .green : .red)
                                                .cornerRadius(6)
                                        }
                                        if i < medication.logs.prefix(7).count - 1 { Divider() }
                                    }
                                }
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(24)
                        
                        // 6. Settings Section
                        VStack(alignment: .leading, spacing: 20) {
                            Text("EDIT DOSE SETTINGS")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                            
                            VStack(spacing: 15) {
                                DatePicker("Scheduled Intake", selection: $scheduledTime, displayedComponents: .hourAndMinute)
                                    .font(.system(size: 15, weight: .bold))
                                
                                Divider()
                                
                                HStack {
                                    Text("Intake Frequency")
                                        .font(.system(size: 15, weight: .bold))
                                    Spacer()
                                    Picker("Frequency", selection: $frequency) {
                                        ForEach(frequencies, id: \.self) { freq in
                                            Text(freq).tag(freq)
                                        }
                                    }
                                    .pickerStyle(.menu)
                                }
                                
                                Divider()
                                
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Color Identifier")
                                        .font(.system(size: 15, weight: .bold))
                                    
                                    HStack(spacing: 12) {
                                        ForEach(colors, id: \.0) { color in
                                            Circle()
                                                .fill(Color(hex: color.0))
                                                .frame(width: 28, height: 28)
                                                .overlay(
                                                    Circle()
                                                        .stroke(Color.primary.opacity(0.3), lineWidth: selectedColor == color.0 ? 3 : 0)
                                                )
                                                .shadow(color: .black.opacity(0.1), radius: 3)
                                                .onTapGesture {
                                                    selectedColor = color.0
                                                    pickerColor = Color(hex: color.0)
                                                }
                                                .scaleEffect(selectedColor == color.0 ? 1.1 : 1.0)
                                        }
                                        
                                        // Custom Color Picker
                                        ColorPicker("", selection: $pickerColor)
                                            .labelsHidden()
                                            .frame(width: 28, height: 28)
                                            .onChange(of: pickerColor) { newColor in
                                                if let hex = newColor.toHex() {
                                                    selectedColor = "#" + hex
                                                }
                                            }
                                    }
                                }
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(30)
                        
                        // 4. Action Buttons
                        VStack(spacing: 16) {
                            Button(action: updateMedication) {
                                if isLoading {
                                    ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Update Schedule")
                                        .font(.headline)
                                        .foregroundColor(.white)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(16)
                            .shadow(color: Color.blue.opacity(0.3), radius: 10, y: 5)
                            
                            Button(action: { showDeleteConfirm = true }) {
                                Text("Remove Medication")
                                    .font(.headline)
                                    .foregroundColor(.red)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(16)
                        }
                        
                        Spacer(minLength: 50)
                    }
                    .padding(24)
                }
            }
            
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .navigationBarHidden(true)
            .alert("Delete Medication", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) { deleteMedication() }
            } message: {
                Text("Are you sure you want to stop tracking \(medication.name)? This cannot be undone.")
            }
        }
    }
    
    // MARK: - Professional Header
    private var headerView: some View {
        HStack {
            
            Button(action: { dismiss() }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.teal)
                    .frame(width: 40, height: 40)
                    .background(
                        Circle()
                            .fill(Color.white.opacity(0.9))
                    )
                    .shadow(color: .black.opacity(0.08), radius: 5, y: 2)
            }
            
            Spacer()
            
            Text("Medication Details")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Spacer()
            
            // placeholder for symmetry
            Color.clear.frame(width: 40, height: 40)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
       
    }
    
    @State private var showSuccess = false
    @State private var successMessage = ""
    
    // ... inside body ...
    
    private func actionButton(title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                if showSuccess && title == successMessage {
                    Image(systemName: "checkmark.circle.fill")
                } else {
                    Image(systemName: icon)
                }
                Text(showSuccess && title == successMessage ? "Logged!" : title)
            }
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(showSuccess && title == successMessage ? Color.green : color)
            .cornerRadius(14)
            .shadow(color: color.opacity(0.2), radius: 8, y: 4)
        }
        .disabled(isLoading || showSuccess)
    }

    func logMedication(status: String) {
        isLoading = true
        successMessage = status == "taken" ? "Taken" : "Missed"
        
        // We pass the current date, but the server now prefers its own local date for consistency
        HealthTrackerService.shared.logMedication(medicationId: medication.id, date: Date(), status: status) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success = result {
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    withAnimation {
                        self.showSuccess = true
                    }
                    
                    // Reset success state after 2 seconds
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        withAnimation {
                            self.showSuccess = false
                        }
                    }
                    
                    // Refresh data immediately
                    refreshData()
                }
            }
        }
    }
    
    func refreshData() {
        HealthTrackerService.shared.getMedications(patientId: medication.patientId) { result in
            DispatchQueue.main.async {
                if case .success(let data) = result {
                    if let dict = data.first(where: { ($0["id"] as? Int) == medication.id }) {
                        // Re-map to UI model
                        let id = dict["id"] as? Int ?? 0
                        let pId = dict["patient_id"] as? Int ?? medication.patientId
                        let name = dict["name"] as? String ?? ""
                        let dosage = dict["dosage"] as? String ?? ""
                        let freq = dict["frequency"] as? String ?? ""
                        let scheduledTime = dict["scheduled_time"] as? String
                        let logs = dict["logs"] as? [[String: Any]] ?? []
                        let colorTag = dict["color_tag"] as? String ?? "#3B82F6"
                        
                        // Recalculate adherence
                        let takenCount = logs.filter { ($0["status"] as? String) == "taken" }.count
                        let totalCount = logs.count
                        let adh = totalCount > 0 ? Double(takenCount) / Double(totalCount) : 0.0
                        
                        // Parse dates (keeping it simple for now as we did in calendar view)
                        let formatter = DateFormatter()
                        formatter.dateFormat = "yyyy-MM-dd"
                        let sDate = (dict["start_date"] as? String).flatMap { formatter.date(from: String($0.prefix(10))) }
                        let eDate = (dict["end_date"] as? String).flatMap { formatter.date(from: String($0.prefix(10))) }
                        
                        self.medication = MedicationTrackerView.MedicationUIModel(id: id, patientId: pId, name: name, dosage: dosage, freq: freq, scheduledTime: scheduledTime, adherence: adh, logs: logs, colorTag: colorTag, startDate: sDate, endDate: eDate)
                    }
                }
            }
        }
    }

    func getHistoryTrend() -> [(day: String, count: Int, date: Date)] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        var trend: [(day: String, count: Int, date: Date)] = []
        
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        let logFormatter = DateFormatter()
        logFormatter.dateFormat = "yyyy-MM-dd"
        
        for i in (0..<7).reversed() {
            if let date = calendar.date(byAdding: .day, value: -i, to: today) {
                let dateStr = logFormatter.string(from: date)
                let count = medication.logs.filter { ($0["log_date"] as? String ?? "").contains(dateStr) && ($0["status"] as? String) == "taken" }.count
                trend.append((day: formatter.string(from: date), count: count, date: date))
            }
        }
        return trend
    }

    func formatTime(_ timeStr: String) -> String {
        return ClinicalTimeFormatter.format(timeStr)
    }
    
    func formatLogDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(abbreviation: "UTC") // Treat as absolute date
        guard let date = formatter.date(from: String(dateStr.prefix(10))) else { return dateStr }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "EEEE, MMM d"
        return displayFormatter.string(from: date)
    }

    func getAIInsight() -> String {
        if medication.adherence > 0.9 {
            return "Excellent consistency! Maintaining your \(medication.name) schedule as prescribed is accelerating your biological recovery markers. Keep it up."
        } else if medication.adherence > 0.7 {
            return "Good progress, but minor gaps detected. Research indicates that \(medication.freq) adherence must be above 85% for optimal therapeutic effect."
        } else {
            return "Frequent missed doses are compromising treatment efficacy. We recommend syncing your intake with a fixed daily habit like breakfast."
        }
    }
    
    func updateMedication() {
        isLoading = true
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        let timeStr = formatter.string(from: scheduledTime)
        
        HealthTrackerService.shared.updateMedication(id: medication.id, scheduledTime: timeStr, frequency: frequency, colorTag: selectedColor) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success = result {
                    ReminderManager.shared.scheduleMedicationReminder(name: medication.name, time: timeStr)
                    dismiss()
                }
            }
        }
    }
    
    func deleteMedication() {
        HealthTrackerService.shared.deleteMedication(id: medication.id) { result in
            DispatchQueue.main.async {
                if case .success = result {
                    ReminderManager.shared.cancelMedicationReminder(name: medication.name)
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    dismiss()
                }
            }
        }
    }
}

struct CircularProgressView: View {
    let progress: Double
    let color: Color
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: 8)
            Circle()
                .trim(from: 0, to: CGFloat(progress))
                .stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}
