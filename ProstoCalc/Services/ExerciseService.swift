import Foundation
import Combine

class ExerciseService: ObservableObject {
    static let shared = ExerciseService()
    private let baseURL = APIConfig.baseURL
    
    @Published var exercises: [Exercise] = []
    @Published var progress: ExerciseProgress?
    @Published var weeklyCompliance: [ComplianceDay] = []
    @Published var settings = ExerciseSettings(userId: nil, morningReminder: true, eveningReminder: true, smartReminders: true, morningTime: "09:00:00", eveningTime: "20:00:00")
    @Published var latestAIInsight: AIInsight?
    @Published var aiHistory: [AIInsight] = []
    @Published public var currentUserId: Int? = nil
    
    func clearData() {
        DispatchQueue.main.async {
            self.latestAIInsight = nil
            self.aiHistory = []
            self.progress = nil
            self.weeklyCompliance = []
            self.currentUserId = nil
        }
    }
    
    func fetchExercises() async {
        guard let url = URL(string: "\(baseURL)/exercises") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(ExerciseResponse.self, from: data)
            DispatchQueue.main.async {
                self.exercises = response.data
            }
        } catch {
            print("Error fetching exercises: \(error)")
        }
    }
    
    func fetchProgress(userId: Int) async {
        guard let url = URL(string: "\(baseURL)/exercise-progress/\(userId)") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(ProgressResponse.self, from: data)
            DispatchQueue.main.async {
                self.progress = response.data
            }
        } catch {
            print("Error fetching progress: \(error)")
        }
    }
    
    func fetchWeeklyCompliance(userId: Int) async {
        guard let url = URL(string: "\(baseURL)/weekly-compliance/\(userId)") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(ComplianceResponse.self, from: data)
            DispatchQueue.main.async {
                self.weeklyCompliance = response.data
            }
        } catch {
            print("Error fetching compliance: \(error)")
        }
    }

    func fetchSettings(userId: Int) async {
        guard let url = URL(string: "\(baseURL)/exercise-settings/\(userId)") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(SettingsResponse.self, from: data)
            DispatchQueue.main.async {
                self.settings = response.data
            }
        } catch {
            print("Error fetching settings: \(error)")
        }
    }
    
    func saveSettings() async {
        guard let url = URL(string: "\(baseURL)/exercise-settings") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(settings)
            let _ = try await URLSession.shared.data(for: request)
        } catch {
            print("Error saving settings: \(error)")
        }
    }
    
    func logExerciseCompletion(userId: Int, exerciseId: Int, duration: Int, reps: Int) async {
        guard let url = URL(string: "\(baseURL)/log-exercise") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "userId": userId,
            "exerciseId": exerciseId,
            "duration": duration,
            "reps": reps
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let _ = try await URLSession.shared.data(for: request)
            await fetchProgress(userId: userId)
        } catch {
            print("Error logging exercise: \(error)")
        }
    }

    func resetProgress(userId: Int) async {
        guard let url = URL(string: "\(baseURL)/reset-progress") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["userId": userId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let _ = try await URLSession.shared.data(for: request)
            await fetchProgress(userId: userId)
            await fetchWeeklyCompliance(userId: userId)
            latestAIInsight = nil
            aiHistory = []
        } catch {
            print("Error resetting progress: \(error)")
        }
    }

    func logMeasurement(userId: Int, measurement: Double) async {
        guard let url = URL(string: "\(baseURL)/log-measurement") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "userId": userId,
            "measurement": measurement
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let _ = try await URLSession.shared.data(for: request)
            await fetchProgress(userId: userId)
        } catch {
            print("Error logging measurement: \(error)")
        }
    }

    func runAIAnalysis(userId: Int) async {
        guard let url = URL(string: "\(baseURL)/analyze-progress") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["userId": userId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder().decode(APIResponse<AIInsight>.self, from: data)
            DispatchQueue.main.async {
                self.latestAIInsight = response.data
                self.aiHistory.insert(response.data, at: 0)
                self.currentUserId = userId
            }
        } catch {
            print("Error running AI analysis: \(error)")
        }
    }

    func fetchAIHistory(userId: Int) async {
        guard let url = URL(string: "\(baseURL)/ai-insight-history/\(userId)") else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(APIResponse<[AIInsight]>.self, from: data)
            DispatchQueue.main.async {
                self.aiHistory = response.data
                self.latestAIInsight = response.data.first
                self.currentUserId = userId
            }
        } catch {
            print("Error fetching AI history: \(error)")
        }
    }
}

// Response Wrappers
struct ExerciseResponse: Codable { let data: [Exercise] }
struct ProgressResponse: Codable { let data: ExerciseProgress }
struct ComplianceResponse: Codable { let data: [ComplianceDay] }
struct SettingsResponse: Codable { let data: ExerciseSettings }
struct APIResponse<T: Codable>: Codable { let data: T }
