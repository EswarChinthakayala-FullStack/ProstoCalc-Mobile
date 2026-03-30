import Foundation

struct HealthTrackerService {
    static let shared = HealthTrackerService()
    
    // MARK: - Mouth Opening
    func addMouthOpening(patientId: Int, value: Double, date: Date, completion: @escaping (Result<Bool, Error>) -> Void) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        let dateStr = formatter.string(from: date)
        
        let body: [String: Any] = [
            "patient_id": patientId,
            "value_mm": value,
            "date": dateStr
        ]
        
        APIService.postRequest(endpoint: "add_mouth_opening", body: body) { result in
            switch result {
            case .success(let json):
                if let status = json["status"] as? String, status == "success" {
                    completion(.success(true))
                } else {
                    completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to log data"])))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    func getMouthOpeningHistory(patientId: Int, completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        APIService.performGetRequest(endpoint: "get_mouth_opening_history?patient_id=\(patientId)") { result in
            switch result {
            case .success(let data):
                if let rows = data as? [[String: Any]] {
                     completion(.success(rows))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // MARK: - Habit Reduction
    func logHabit(patientId: Int, tobacco: Int, areca: Int, date: Date, completion: @escaping (Result<Bool, Error>) -> Void) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        
        let body: [String: Any] = [
            "patient_id": patientId,
            "tobacco_count": tobacco,
            "areca_count": areca,
            "date": dateStr
        ]
        
        APIService.postRequest(endpoint: "add_habit_log", body: body) { result in
             switch result {
             case .success(let json):
                 if let status = json["status"] as? String, status == "success" {
                     completion(.success(true))
                 } else {
                     completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to log habit"])))
                 }
             case .failure(let error):
                 completion(.failure(error))
             }
        }
    }
    
    func getHabitHistory(patientId: Int, completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        APIService.performGetRequest(endpoint: "get_habit_history?patient_id=\(patientId)") { result in
            switch result {
            case .success(let data):
                if let rows = data as? [[String: Any]] {
                     completion(.success(rows))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // MARK: - Streaks
    func getStreaks(patientId: Int, completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        APIService.performGetRequest(endpoint: "get_streaks?patient_id=\(patientId)") { result in
            switch result {
            case .success(let data):
                if let rows = data as? [[String: Any]] {
                     completion(.success(rows))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // MARK: - Medications
    func addMedication(patientId: Int, name: String, dosage: String, frequency: String, duration: Int, startDate: Date, endDateStr: String, scheduledTime: String, colorTag: String, completion: @escaping (Result<Bool, Error>) -> Void) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: startDate)
        
        let body: [String: Any] = [
            "patient_id": patientId,
            "name": name,
            "dosage": dosage,
            "frequency": frequency,
            "duration_days": duration,
            "start_date": dateStr,
            "end_date": endDateStr,
            "scheduled_time": scheduledTime,
            "color_tag": colorTag
        ]
        
        APIService.postRequest(endpoint: "add_medication", body: body) { result in
             switch result {
             case .success(let json):
                 if let status = json["status"] as? String, status == "success" {
                     completion(.success(true))
                 } else {
                     completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to add medication"])))
                 }
             case .failure(let error):
                 completion(.failure(error))
             }
        }
    }
    
    func getMedications(patientId: Int, completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        APIService.performGetRequest(endpoint: "get_medications?patient_id=\(patientId)") { result in
            switch result {
            case .success(let data):
                if let rows = data as? [[String: Any]] {
                     completion(.success(rows))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    func logMedication(medicationId: Int, date: Date, status: String, completion: @escaping (Result<Bool, Error>) -> Void) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        
        let body: [String: Any] = [
            "medication_id": medicationId,
            "date": dateStr,
            "status": status
        ]
        
        APIService.postRequest(endpoint: "log_medication", body: body) { result in
             switch result {
             case .success(let json):
                 if let rStatus = json["status"] as? String, rStatus == "success" {
                     completion(.success(true))
                 } else {
                     completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to log medication"])))
                 }
             case .failure(let error):
                 completion(.failure(error))
             }
        }
    }
    
    func updateMedication(id: Int, scheduledTime: String, frequency: String, colorTag: String, completion: @escaping (Result<Bool, Error>) -> Void) {
        let body: [String: Any] = [
            "id": id,
            "scheduled_time": scheduledTime,
            "frequency": frequency,
            "color_tag": colorTag
        ]
        
        APIService.postRequest(endpoint: "update_medication", body: body) { result in
            switch result {
            case .success(let json):
                if let status = json["status"] as? String, status == "success" {
                    completion(.success(true))
                } else {
                    completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Update failed"])))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    func deleteMedication(id: Int, completion: @escaping (Result<Bool, Error>) -> Void) {
        let body: [String: Any] = ["id": id]
        APIService.postRequest(endpoint: "delete_medication", body: body) { result in
            switch result {
            case .success(let json):
                if let status = json["status"] as? String, status == "success" {
                    completion(.success(true))
                } else {
                    completion(.failure(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Delete failed"])))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}

// Extension to APIService to support generic POST if not already present
extension APIService {
    static func postRequest(endpoint: String, body: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            completion(.failure(.invalidURL))
            return
        }
        
        print("HealthTrackerService: POST to \(url) with body: \(body)")
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            print("HealthTrackerService: JSON error: \(error)")
            completion(.failure(.networkError(error)))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("HealthTrackerService: Network error: \(error)")
                completion(.failure(.networkError(error)))
                return
            }
            
            guard let data = data else {
                print("HealthTrackerService: No data in response")
                completion(.failure(.serverError("No response")))
                return
            }
            
            if let responseString = String(data: data, encoding: .utf8) {
                print("HealthTrackerService: Response: \(responseString)")
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                    completion(.success(json))
                } else {
                    completion(.failure(.decodingError(NSError(domain: "Decoding", code: 0))))
                }
            } catch {
                completion(.failure(.decodingError(error)))
            }
        }.resume()
    }
}
