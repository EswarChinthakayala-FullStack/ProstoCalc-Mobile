import SwiftUI

struct MedicationCalendarView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    
    @State private var currentMonth = Date()
    @State private var selectedDate = Date()
    @State private var medications: [MedicationTrackerView.MedicationUIModel] = []
    @State private var isLoading = false
    
    private let calendar = Calendar.current
    private let daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                // MARK: - Header
                VStack(alignment: .leading, spacing: 8) {
                    
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
                        Text("Medication Schedule")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                        
                        Spacer()
                        
                        // Placeholder (keeps title centered)
                        Color.clear
                            .frame(width: 40, height: 40)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 10)
            
                    
                    
                    // Month Label
                    HStack(spacing: 6) {
                        Image(systemName: "clock")
                            .font(.system(size: 12))
                            .foregroundColor(.teal)
                        
                        Text(monthYearString(from: currentMonth))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 18)
             
                
                ScrollView {
                    VStack(spacing: 24) {
                        // 1. Calendar Card
                        VStack(spacing: 20) {
                            monthSwitcher
                            
                            HStack {
                                ForEach(daysOfWeek, id: \.self) { day in
                                    Text(day)
                                        .font(.system(size: 10, weight: .black))
                                        .foregroundColor(.secondary.opacity(0.6))
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            
                            calendarGrid
                        }
                        .padding(25)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(30)
                        .shadow(color: .black.opacity(0.05), radius: 20, x: 0, y: 10)
                        .padding(.horizontal)
                        
                        // 2. Daily Dose Section
                        VStack(alignment: .leading, spacing: 16) {
                            Text("DOSES FOR \(selectedDateString)")
                                .font(.system(size: 11, weight: .black))
                                .tracking(1)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 4)
                            
                            if isLoading {
                                ProgressView()
                                    .padding(.top, 40)
                            } else {
                                let dailyMeds = medicationsFor(date: selectedDate)
                                if dailyMeds.isEmpty {
                                    Text("No medications scheduled for this day.")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.secondary)
                                        .frame(maxWidth: .infinity, alignment: .center)
                                        .padding(.top, 40)
                                } else {
                                    ForEach(dailyMeds) { med in
                                        NavigationLink(destination: MedicationDetailView(medication: med)) {
                                            ClinicalMedicationCard(medication: med) { status in
                                                logMedication(id: med.id, status: status)
                                            }
                                        }
                                        .buttonStyle(PlainButtonStyle())
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 100)
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            loadData()
        }
    }
    
    private var selectedDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: selectedDate).uppercased()
    }
    
    private var monthSwitcher: some View {
        HStack {
            Button(action: { changeMonth(by: -1) }) {
                Image(systemName: "chevron.left.circle.fill")
                    .foregroundColor(.teal)
                    .font(.title2)
            }
            Spacer()
            Text(monthString(from: currentMonth).uppercased())
                .font(.system(size: 14, weight: .black))
                .tracking(1)
            Spacer()
            Button(action: { changeMonth(by: 1) }) {
                Image(systemName: "chevron.right.circle.fill")
                    .foregroundColor(.blue)
                    .font(.title2)
            }
        }
        .padding(.horizontal, 10)
    }
    
    private var calendarGrid: some View {
        let allDays = generateDaysInMonth(for: currentMonth)
        let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 7)
        
        return LazyVGrid(columns: columns, spacing: 15) {
            ForEach(allDays.indices, id: \.self) { index in
                if let date = allDays[index] {
                    let activeMeds = medicationsFor(date: date)
                    MedicationDayCell(
                        date: date,
                        isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                        isToday: calendar.isDateInToday(date),
                        medications: activeMeds
                    )
                    .onTapGesture {
                        withAnimation {
                            self.selectedDate = date
                        }
                    }
                } else {
                    Color.clear.frame(height: 50)
                }
            }
        }
    }
    
    private func medicationsFor(date: Date) -> [MedicationTrackerView.MedicationUIModel] {
        let targetDate = calendar.startOfDay(for: date)
        
        return medications.filter { med in
            guard let start = med.startDate else { return false }
            let s = calendar.startOfDay(for: start)
            
            // If we have an end date, check the range
            if let end = med.endDate {
                let e = calendar.startOfDay(for: end)
                return targetDate >= s && targetDate <= e
            }
            
            // If no end date but it's "As needed", maybe show it for 30 days or just today?
            // For now, if no end date, only show on start date to avoid cluttering calendar
            return calendar.isDate(targetDate, inSameDayAs: s)
        }
    }
    
    private func logMedication(id: Int, status: String) {
        HealthTrackerService.shared.logMedication(medicationId: id, date: selectedDate, status: status) { result in
            if case .success = result {
                loadData()
            }
        }
    }
    
    private func loadData() {
        isLoading = true
        HealthTrackerService.shared.getMedications(patientId: patientId) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let data) = result {
                    var newMeds: [MedicationTrackerView.MedicationUIModel] = []
                    for dict in data {
                        if let id = dict["id"] as? Int, let name = dict["name"] as? String {
                            let dosage = dict["dosage"] as? String ?? ""
                            let freq = dict["frequency"] as? String ?? ""
                            let scheduledTime = dict["scheduled_time"] as? String
                            let logs = dict["logs"] as? [[String: Any]] ?? []
                            
                            // Calculate adherence or other status if needed
                            let takenCount = logs.filter { ($0["status"] as? String) == "taken" }.count
                            let totalCount = logs.count
                            let adh = totalCount > 0 ? Double(takenCount) / Double(totalCount) : 0.0
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
                                // Fallback: calculate end date from duration
                                eDate = calendar.date(byAdding: .day, value: max(0, duration - 1), to: s)
                            }
                            
                            newMeds.append(MedicationTrackerView.MedicationUIModel(id: id, patientId: patientId, name: name, dosage: dosage, freq: freq, scheduledTime: scheduledTime, adherence: adh, logs: logs, colorTag: colorTag, startDate: sDate, endDate: eDate))
                        }
                    }
                    self.medications = newMeds
                }
            }
        }
    }
    
    private func changeMonth(by amount: Int) {
        if let newMonth = calendar.date(byAdding: .month, value: amount, to: currentMonth) {
            currentMonth = newMonth
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

struct MedicationDayCell: View {
    let date: Date
    let isSelected: Bool
    let isToday: Bool
    let medications: [MedicationTrackerView.MedicationUIModel]
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.system(size: 14, weight: isSelected ? .bold : .medium))
                .foregroundColor(isSelected ? .white : (isToday ? .blue : .primary))
                .frame(width: 32, height: 32)
                .background(isSelected ? Color.blue : (isToday ? Color.blue.opacity(0.1) : Color.clear))
                .clipShape(Circle())
            
            // Markers for meds
            HStack(spacing: 2) {
                ForEach(0..<min(medications.count, 4), id: \.self) { index in
                    Circle()
                        .fill(Color(hex: medications[index].colorTag))
                        .frame(width: 4, height: 4)
                }
            }
            .frame(height: 4)
        }
        .frame(maxWidth: .infinity)
    }
}
