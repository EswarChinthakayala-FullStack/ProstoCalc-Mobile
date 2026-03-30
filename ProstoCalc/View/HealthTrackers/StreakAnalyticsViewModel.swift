import Foundation
import Combine

// MARK: - Data Models

struct StreakDayLog: Identifiable {
    let id = UUID()
    let date: Date
    let completed: Bool
}

struct StreakTypeAnalytics {
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var completionRate: Int = 0
    var consistencyScore: Int = 0
    var streakVelocity: Int = 0
    var riskScore: Int = 0
    var riskLevel: String = "Low"
    var missedThisWeek: Int = 0
    var recent7Completed: Int = 0
    var lastBreakDate: String? = nil
    var dailyChart: [StreakDayLog] = []
    var streakStatus: String = "active"
}

// MARK: - ViewModel

class StreakAnalyticsViewModel: ObservableObject {
    @Published var tobaccoFree = StreakTypeAnalytics()
    @Published var physio = StreakTypeAnalytics()
    @Published var selectedRange: Int = 30
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    
    func fetchAnalytics(patientId: Int) {
        isLoading = true
        let endpoint = "get_streak_analytics?patient_id=\(patientId)&range=\(selectedRange)"
        
        APIService.performGetRequest(endpoint: endpoint) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let response):
                    if let data = response as? [String: Any] {
                        self?.parseAnalytics(data)
                    } else {
                        self?.errorMessage = "Invalid response format"
                    }
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    private func parseAnalytics(_ data: [String: Any]) {
        if let tobacco = data["tobacco_free"] as? [String: Any] {
            tobaccoFree = parseStreakType(tobacco)
        }
        if let physioData = data["physio"] as? [String: Any] {
            physio = parseStreakType(physioData)
        }
    }
    
    private func parseStreakType(_ dict: [String: Any]) -> StreakTypeAnalytics {
        var result = StreakTypeAnalytics()
        result.currentStreak = dict["current_streak"] as? Int ?? 0
        result.longestStreak = dict["longest_streak"] as? Int ?? 0
        result.completionRate = dict["completion_rate"] as? Int ?? 0
        result.consistencyScore = dict["consistency_score"] as? Int ?? 0
        result.streakVelocity = dict["streak_velocity"] as? Int ?? 0
        result.riskScore = dict["risk_score"] as? Int ?? 0
        result.riskLevel = dict["risk_level"] as? String ?? "Low"
        result.missedThisWeek = dict["missed_this_week"] as? Int ?? 0
        result.recent7Completed = dict["recent_7_completed"] as? Int ?? 0
        result.lastBreakDate = dict["last_break_date"] as? String
        result.streakStatus = dict["streak_status"] as? String ?? "active"
        
        if let chart = dict["daily_chart"] as? [[String: Any]] {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            result.dailyChart = chart.compactMap { entry in
                guard let dateStr = entry["date"] as? String,
                      let date = formatter.date(from: dateStr) else { return nil }
                let completed = (entry["completed"] as? Int ?? 0) == 1
                return StreakDayLog(date: date, completed: completed)
            }
        }
        
        return result
    }
    
    func logStreakDay(patientId: Int, streakType: String, completed: Bool) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let body: [String: Any] = [
            "patient_id": patientId,
            "streak_type": streakType,
            "log_date": formatter.string(from: Date()),
            "is_completed": completed
        ]
        
        APIService.postRequest(endpoint: "log_streak_day", body: body) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    self?.fetchAnalytics(patientId: patientId)
                case .failure(let error):
                    self?.errorMessage = "Log failed: \(error.localizedDescription)"
                }
            }
        }
    }
}
