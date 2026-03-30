import SwiftUI

struct ClinicalMedicationCard: View {
    let medication: MedicationTrackerView.MedicationUIModel
    let onLog: (String) -> Void
    
    // Theme color derived from medication data
    private var themeColor: Color { Color(hex: medication.colorTag) }
    
    var body: some View {
        HStack(spacing: 0) {
            // 1. Signature Vertical Accent Bar
            Rectangle()
                .fill(LinearGradient(
                    colors: [themeColor, themeColor.opacity(0.7)],
                    startPoint: .top,
                    endPoint: .bottom
                ))
                .frame(width: 4.5)
            
            VStack(alignment: .leading, spacing: 0) {
                // Main Content Area
                HStack(spacing: 16) {
                    // Clinical Icon Backdrop
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(themeColor.opacity(0.08))
                            .frame(width: 48, height: 48)
                        
                        Image(systemName: "pills.fill")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(themeColor)
                    }
                    
                    VStack(alignment: .leading, spacing: 3) {
                        Text("PHARMA LOG • \(medication.freq.uppercased())")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .kerning(1.2)
                            .foregroundColor(.secondary.opacity(0.8))
                        
                        Text(medication.name)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(Color(red: 0.05, green: 0.05, blue: 0.15))
                        
                        Text(medication.dosage)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    // Signature Top-Right Theme Bar
                    VStack {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(themeColor.opacity(0.35))
                            .frame(width: 22, height: 4)
                        Spacer()
                    }
                }
                .padding(16)
                
                // 2. Clinical Status Footer (Glassmorphic Style)
                let lastTakenLog = medication.logs.first { ($0["status"] as? String) == "taken" }
                if let actual = lastTakenLog?["actual_take_time"] as? String {
                    Divider()
                        .background(Color.black.opacity(0.05))
                    
                    HStack {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 10))
                            
                            Text("Last taken at \(formatMedicationTime(actual))")
                        }
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.green.opacity(0.8))
                        
                        Spacer()
                        
                        if let scheduled = medication.scheduledTime {
                            Text(calculatePunctuality(scheduled: scheduled, actual: actual).uppercased())
                                .font(.system(size: 9, weight: .black))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.gray.opacity(0.05))
                                .foregroundColor(.secondary)
                                .cornerRadius(4)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(themeColor.opacity(0.02))
                }
            }
        }
        .background(Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.03), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
    
    
    func formatMedicationTime(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let date = formatter.date(from: iso) else {
            return iso
        }
        
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "hh:mm a"
        
        let time = timeFormatter.string(from: date)
        
        if Calendar.current.isDateInToday(date) {
            return "\(time) today"
        }
        
        if Calendar.current.isDateInYesterday(date) {
            return "\(time) yesterday"
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "MMM d"
        
        return "\(time) \(dateFormatter.string(from: date))"
    }
    
    
    
    func calculatePunctuality(scheduled: String, actual: String) -> String {
        let sTime = ClinicalTimeFormatter.format(scheduled)
        let aTime = ClinicalTimeFormatter.format(actual)
        return sTime == aTime ? "On Time" : "Adherence Shift"
    }
}
