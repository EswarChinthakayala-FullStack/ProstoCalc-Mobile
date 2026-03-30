import Foundation
import Combine


class HabitTrackingViewModel: ObservableObject {
    @Published var selectedRange: Int = 30 // 7, 30, 90
    @Published var tobaccoCount: Int = 0
    @Published var arecaCount: Int = 0
    
    // Analytics Data
    @Published var baseline: (tobacco: Int, areca: Int) = (0, 0)
    @Published var dailyLogs: [DailyLog] = []
    @Published var timeOfDayData: [TimeBlock] = []
    @Published var stats: AnalyticsStats?
    
    // Today's Total (Fetched)
    @Published var todayTotalTobacco: Int = 0
    @Published var todayTotalAreca: Int = 0
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    struct DailyLog: Identifiable {
        let id = UUID()
        let date: Date
        let tobacco: Int
        let areca: Int
        let total: Int
    }
    
    struct TimeBlock: Identifiable {
        let id = UUID()
        let name: String // Morning, Afternoon, Evening, Night
        let count: Int
    }
    
    struct AnalyticsStats {
        let currentAvg: Double
        let reductionPercent: Double
        let riskScore: Int
        let riskLevel: String // Low, Moderate, High
    }
    
    // Helper to format Date from String
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    func fetchAnalytics(patientId: Int) {
        self.isLoading = true
        let urlString = "get_habit_analytics?patient_id=\(patientId)&range=\(selectedRange)"
        
        APIService.performGetRequest(endpoint: urlString) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let json):
                    if let dict = json as? [String: Any] {
                         self?.parseAnalytics(dict)
                    }
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    private func parseAnalytics(_ data: [String: Any]) {
        // APIService already unwraps "data", so we use the dict directly

        
        // 1. Baseline
        if let baselineData = data["baseline"] as? [String: Any] {
            let t = baselineData["tobacco_baseline"] as? Int ?? 0
            let a = baselineData["areca_baseline"] as? Int ?? 0
            self.baseline = (t, a)
        }
        
        // 2. Daily Logs
        if let logsData = data["daily_logs"] as? [[String: Any]] {
            self.dailyLogs = logsData.compactMap { log in
                guard let dateStr = log["log_date"] as? String,
                      let date = self.dateFormatter.date(from: String(dateStr.prefix(10))) else { return nil }
                let t = Int(log["tobacco"] as? String ?? "0") ?? 0
                let a = Int(log["areca"] as? String ?? "0") ?? 0
                return DailyLog(date: date, tobacco: t, areca: a, total: t + a)
            }
        }
        
        // 3. Time of Day
        if let timeData = data["time_of_day"] as? [String: Int] {
            self.timeOfDayData = [
                TimeBlock(name: "Morning", count: timeData["Morning"] ?? 0),
                TimeBlock(name: "Afternoon", count: timeData["Afternoon"] ?? 0),
                TimeBlock(name: "Evening", count: timeData["Evening"] ?? 0),
                TimeBlock(name: "Night", count: timeData["Night"] ?? 0)
            ]
        }
        
        // 4. Stats
        if let statsData = data["stats"] as? [String: Any] {
            let avg = statsData["current_avg"] as? Double ?? 0.0
            let red = statsData["reduction_percent"] as? Double ?? 0.0
            let risk = statsData["risk_score"] as? Int ?? 0
            
            var level = "Low"
            if risk > 60 { level = "High" }
            else if risk > 30 { level = "Moderate" }
            
            self.stats = AnalyticsStats(currentAvg: avg, reductionPercent: red, riskScore: risk, riskLevel: level)
        }
        
        // 5. Calculate Today's Total
        let todayStr = dateFormatter.string(from: Date())
        if let logs = data["daily_logs"] as? [[String: Any]],
           let entry = logs.first(where: {
               guard let d = $0["log_date"] as? String else { return false }
               return d.prefix(10) == todayStr.prefix(10)
           }) {
             self.todayTotalTobacco = Int(entry["tobacco"] as? String ?? "0") ?? 0
             self.todayTotalAreca = Int(entry["areca"] as? String ?? "0") ?? 0
        } else {
             self.todayTotalTobacco = 0
             self.todayTotalAreca = 0
        }
    }
    
    func logTodayEntry(patientId: Int) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        
        let body: [String: Any] = [
            "patient_id": patientId,
            "entry_datetime": formatter.string(from: Date()),
            "tobacco_count": tobaccoCount,
            "areca_count": arecaCount
            // Future: Add craving/mood UI
        ]
        
        print("Saving Habit Entry: \(body)") // Debug print
        
        APIService.postRequest(endpoint: "log_habit_entry", body: body) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    self?.fetchAnalytics(patientId: patientId) // Refresh
                    self?.tobaccoCount = 0
                    self?.arecaCount = 0
                case .failure(let error):
                    self?.errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}
