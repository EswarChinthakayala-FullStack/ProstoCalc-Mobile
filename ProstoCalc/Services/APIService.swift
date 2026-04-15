import Foundation

public struct APIConfig {
    #if targetEnvironment(simulator)
    // Simulator: use localhost
    public static let baseURL = "http://localhost:3000"
    #else
    // Real device: use local network IP (change as needed)
    public static let baseURL = "http://172.25.90.196:3000"
    #endif
    
    // AI Endpoint helper
    public static var aiURL: URL {
        return URL(string: "\(baseURL)/ai/chat")!
    }
}


struct APIService {

    // Change this URL to your local server IP if testing on actual device
    static let baseURL = APIConfig.baseURL

    
    enum APIError: Error, LocalizedError {
        case invalidURL
        case networkError(Error)
        case decodingError(Error)
        case serverError(String)
        
        var errorDescription: String? {
            switch self {
            case .invalidURL: return "Invalid Server URL configuration."
            case .networkError(let error): return "Network failure: \(error.localizedDescription)"
            case .decodingError: return "Failed to process data from server."
            case .serverError(let message): return message
            }
        }
    }
    
    static func registerDentist(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "signup_dentist", data: data) { result in
            completion(result)
        }
    }
    
    static func mobileSignupDentist(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "mobile_signup_dentist", data: data) { result in
            completion(result)
        }
    }
    
    static func loginDentist(data: [String: Any], completion: @escaping (Result<(String, [String: Any]?), APIError>) -> Void) {
        performRequest(endpoint: "login_dentist", data: data) { result in
            switch result {
            case .success(let json):
                let message = json["message"] as? String ?? "Success"
                let userData = json["user"] as? [String: Any]
                completion(.success((message, userData)))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func mobileLoginDentist(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "mobile_login_dentist", data: data) { result in
            completion(result)
        }
    }
    
    static func getDentistDetails(dentistId: Int, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "get_dentist_details?dentist_id=\(dentistId)") { result in
            if case .success(let data) = result, let dict = data as? [String: Any] {
                completion(.success(dict))
            } else {
                completion(.failure(.serverError("Unexpected data format")))
            }
        }
    }
    
    static func updateClinicDetails(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "save_clinic_details", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func saveDentistProfile(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "save_dentist_profile", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func registerPatient(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "signup_patient", data: data) { result in
            completion(result)
        }
    }
    
    static func mobileSignupPatient(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "mobile_signup_patient", data: data) { result in
            completion(result)
        }
    }
    
    // Return (Message, UserDictionary)
    static func loginPatient(data: [String: Any], completion: @escaping (Result<(String, [String: Any]?), APIError>) -> Void) {
        performRequest(endpoint: "login_patient", data: data) { result in
            switch result {
            case .success(let json):
                let message = json["message"] as? String ?? "Success"
                let user = json["user"] as? [String: Any]
                completion(.success((message, user)))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func mobileLoginPatient(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "mobile_login_patient", data: data) { result in
            completion(result)
        }
    }
    
    static func updatePatientLocation(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        print("APIService: Sending detailed location data: \(data)")
        performRequest(endpoint: "save_patient_location", data: data) { result in
             switch result {
             case .success(let json):
                 print("APIService: Location save success: \(json)")
                 completion(.success(json["message"] as? String ?? "Success"))
             case .failure(let error):
                 print("APIService: Location save error: \(error)")
                 completion(.failure(error))
             }
        }
    }
    
    static func getPatientDetails(patientId: Int, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "get_patient_details?patient_id=\(patientId)") { result in
            if case .success(let data) = result, let dict = data as? [String: Any] {
                completion(.success(dict))
            } else {
                completion(.failure(.serverError("Unexpected data format")))
            }
        }
    }
    
    static func savePatientFullProfile(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "save_patient_full_profile", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func savePatientProfile(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "save_patient_profile", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getNearbyClinics(lat: Double, lng: Double, completion: @escaping (Result<[Clinic], APIError>) -> Void) {
        performGetRequest(endpoint: "get_nearby_clinics?lat=\(lat)&lng=\(lng)") { result in
            switch result {
            case .success(let data):
                guard let array = data as? [[String: Any]] else {
                    completion(.failure(.serverError("Unexpected clinics data format")))
                    return
                }
                do {
                    let jsonData = try JSONSerialization.data(withJSONObject: array, options: [])
                    let clinics = try JSONDecoder().decode([Clinic].self, from: jsonData)
                    completion(.success(clinics))
                } catch {
                    print("Decoding error: \(error)")
                    completion(.failure(.decodingError(error)))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // MARK: - Password Reset
    static func requestOTP(email: String, role: String, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "forgot_password", data: ["email": email, "role": role]) { result in
            completion(result)
        }
    }
    
    static func verifyOTP(email: String, role: String, otp: String, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "verify_otp", data: ["email": email, "role": role, "otp": otp]) { result in
            completion(result)
        }
    }
    
    static func resetPassword(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "reset_password", data: data) { result in
            completion(result)
        }
    }
    
    // MARK: - Identity Verification (2FA / Signup)
    static func verifyIdentity(email: String, role: String, otp: String, type: String = "login", completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        let data = ["email": email, "role": role, "otp": otp, "type": type]
        performRequest(endpoint: "login_verify", data: data) { result in
            completion(result)
        }
    }
    
    // MARK: - Interaction System
    static func getDentistSettings(dentistId: Int, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "get_dentist_settings?dentist_id=\(dentistId)") { result in
            if case .success(let data) = result, let dict = data as? [String: Any] {
                completion(.success(dict))
            } else {
                completion(.failure(.serverError("Failed to fetch settings")))
            }
        }
    }
    
    static func saveDentistSettings(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "save_dentist_settings", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getAllDentists(completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_all_dentists") { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch dentists")))
            }
        }
    }
    
    static func sendConsultationRequest(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "send_consultation_request", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func sendConsultationRequest(patientId: Int, dentistId: Int, message: String, completion: @escaping (Result<String, APIError>) -> Void) {
        let data: [String: Any] = [
            "patient_id": patientId,
            "dentist_id": dentistId,
            "message": message
        ]
        sendConsultationRequest(data: data, completion: completion)
    }
    
    static func getConsultationRequests(role: String, id: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_consultation_requests?role=\(role)&id=\(id)") { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch requests")))
            }
        }
    }

    static func checkRequestStatus(patientId: Int, dentistId: Int, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "check_request_status?patient_id=\(patientId)&dentist_id=\(dentistId)") { result in
            if case .success(let data) = result, let dict = data as? [String: Any] {
                completion(.success(dict))
            } else {
                completion(.failure(.serverError("Failed to check status")))
            }
        }
    }
    
    static func respondToRequest(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "respond_to_request", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getMessages(chatId: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_messages?chat_id=\(chatId)") { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch messages")))
            }
        }
    }
    
    static func initChat(requestId: Int, completion: @escaping (Result<Int, APIError>) -> Void) {
        performRequest(endpoint: "init_chat", data: ["request_id": requestId]) { result in
            switch result {
            case .success(let json):
                if let chatId = json["chat_id"] as? Int {
                    completion(.success(chatId))
                } else if let chatIdStr = json["chat_id"] as? String, let chatId = Int(chatIdStr) {
                    completion(.success(chatId))
                } else {
                    completion(.failure(.serverError("Invalid chat ID format")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func sendMessage(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "send_message", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // MARK: - Professional Treatment Planning
    
    static func getTreatmentCatalog(dentistId: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_treatment_catalog?dentist_id=\(dentistId)") { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch catalog")))
            }
        }
    }
    
    static func updateTreatmentCosts(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "update_treatment_costs", data: data) { result in
            if case .success(let json) = result {
                completion(.success(json["message"] as? String ?? "Updated"))
            } else if case .failure(let error) = result {
                completion(.failure(error))
            }
        }
    }
    
    static func createTreatmentPlan(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "create_treatment_plan", data: data) { result in
            if case .success(let json) = result, let resData = json["data"] as? [String: Any] {
                completion(.success(resData))
            } else if case .failure(let error) = result {
                completion(.failure(error))
            }
        }
    }

    static func getServerAICostAnalysis(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "calculate_ai_cost", data: data) { result in
            if case .success(let json) = result, let resData = json["data"] as? [String: Any] {
                completion(.success(resData))
            } else if case .failure(let error) = result {
                completion(.failure(error))
            }
        }
    }
    
    static func getAICostExplanation(userPrompt: String, completion: @escaping (Result<String, APIError>) -> Void) {
        let data: [String: Any] = ["userPrompt": userPrompt]
        performRequest(endpoint: "explain_cost_ai", data: data) { result in
            switch result {
            case .success(let json):
                if let data = json["data"] as? [String: Any], let explanation = data["explanation"] as? String {
                    completion(.success(explanation))
                } else {
                    completion(.failure(.serverError("Malformed AI response")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getLatestConsultation(patientId: Int, completion: @escaping (Result<[String: Any]?, APIError>) -> Void) {
        performGetRequest(endpoint: "get_consultation_requests?role=PATIENT&id=\(patientId)") { result in
            switch result {
            case .success(let data):
                if let dataArray = data as? [[String: Any]], let first = dataArray.first {
                    completion(.success(first))
                } else {
                    completion(.success(nil))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getTreatmentPlan(requestId: Int? = nil, planId: Int? = nil, completion: @escaping (Result<[String: Any]?, APIError>) -> Void) {
        var query = ""
        if let rid = requestId { query = "request_id=\(rid)" }
        else if let pid = planId { query = "plan_id=\(pid)" }
        
        performGetRequest(endpoint: "get_treatment_plan?\(query)") { result in
            if case .success(let data) = result {
                completion(.success(data as? [String: Any]))
            } else {
                completion(.failure(.serverError("Failed to fetch plan")))
            }
        }
    }
    
    static func updateTimeline(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "update_timeline", data: data) { result in
            if case .success(let json) = result {
                completion(.success(json["message"] as? String ?? "Timeline updated"))
            } else if case .failure(let error) = result {
                completion(.failure(error))
            }
        }
    }
    
    static func getTimeline(requestId: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_timeline?request_id=\(requestId)") { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch timeline")))
            }
        }
    }
    
    static func savePlanNotes(requestId: Int, notes: String, completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "update_plan_notes", data: ["request_id": requestId, "notes": notes]) { result in
            if case .success(let json) = result {
                completion(.success(json["message"] as? String ?? "Notes updated"))
            } else if case .failure(let error) = result {
                completion(.failure(error))
            }
        }
    }
    
    static func getChatDetails(chatId: Int, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "get_chat_details?chat_id=\(chatId)") { result in
            if case .success(let data) = result, let dict = data as? [String: Any] {
                completion(.success(dict))
            } else {
                completion(.failure(.serverError("Failed to fetch chat details")))
            }
        }
    }

    // MARK: - AI Chat History & Sessions
    static func saveAIChat(userId: String, role: String, sessionId: Int?, message: String, response: String, completion: @escaping (Result<Bool, APIError>) -> Void) {
        var endpoint = "ai_chat_history?user_id=\(userId)&role=\(role)"
        if let sId = sessionId { endpoint += "&session_id=\(sId)" }
        
        let data: [String: Any] = [
            "message": message,
            "response": response
        ]
        
        performRequest(endpoint: endpoint, data: data) { result in
            switch result {
            case .success(_):
                completion(.success(true))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getAIChatHistory(userId: String, role: String, sessionId: Int? = nil, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        var endpoint = "ai_chat_history?user_id=\(userId)&role=\(role)"
        if let sId = sessionId { endpoint += "&session_id=\(sId)" }
        
        performGetRequest(endpoint: endpoint) { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch AI history")))
            }
        }
    }
    
    static func getAISessions(userId: String, role: String, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        let endpoint = "ai_sessions?user_id=\(userId)&role=\(role)"
        performGetRequest(endpoint: endpoint) { result in
            if case .success(let data) = result, let array = data as? [[String: Any]] {
                completion(.success(array))
            } else {
                completion(.failure(.serverError("Failed to fetch sessions")))
            }
        }
    }
    
    static func createAISession(userId: String, role: String, title: String, completion: @escaping (Result<Int, APIError>) -> Void) {
        let data: [String: Any] = ["user_id": userId, "role": role, "title": title]
        performRequest(endpoint: "ai_sessions", data: data) { result in
            switch result {
            case .success(let json):
                if let resData = json["data"] as? [String: Any], let id = resData["session_id"] as? Int {
                    completion(.success(id))
                } else {
                    completion(.failure(.serverError("Failed to create session")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func updateSessionTitle(sessionId: Int, title: String, completion: @escaping (Result<String, APIError>) -> Void) {
        let data: [String: Any] = ["session_id": sessionId, "title": title]
        performRequest(endpoint: "update_session_title", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Success"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func deleteSession(sessionId: Int, completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "delete_session", data: ["session_id": sessionId]) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Deleted"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    
    // MARK: - Cost Estimation & Explanation
    static func saveCostEstimation(data: [String: Any], completion: @escaping (Result<Int, APIError>) -> Void) {
        performRequest(endpoint: "save_cost_estimation", data: data) { result in
            switch result {
            case .success(let json):
                if let resData = json["data"] as? [String: Any] {
                    if let id = resData["estimation_id"] as? Int {
                        completion(.success(id))
                    } else if let idStr = resData["estimation_id"] as? String, let id = Int(idStr) {
                        completion(.success(id))
                    } else {
                        completion(.failure(.serverError("Invalid estimation ID format")))
                    }
                } else {
                    completion(.failure(.serverError("Failed to save estimation")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func saveAIExplanation(data: [String: Any], completion: @escaping (Result<String, APIError>) -> Void) {
        performRequest(endpoint: "save_ai_explanation", data: data) { result in
            switch result {
            case .success(let json):
                completion(.success(json["message"] as? String ?? "Saved"))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getAICostLogs(dentistId: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_ai_cost_logs?dentist_id=\(dentistId)") { result in
            switch result {
            case .success(let data):
                if let logs = data as? [[String: Any]] {
                    completion(.success(logs))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    
    static func performGetRequest(endpoint: String, completion: @escaping (Result<Any, APIError>) -> Void) {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            print("APIService GET: Invalid URL")
            completion(.failure(.invalidURL))
            return
        }
        
        print("APIService GET: Requesting \(url.absoluteString)")
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                print("APIService GET: Network error: \(error.localizedDescription)")
                completion(.failure(.networkError(error)))
                return
            }
            
            guard let data = data else {
                print("APIService GET: No data received")
                completion(.failure(.serverError("No data received")))
                return
            }
            
            if let responseStr = String(data: data, encoding: .utf8) {
                print("APIService GET: Response: \(responseStr)")
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                   let status = json["status"] as? String, status == "success",
                   let responseData = json["data"] {
                    completion(.success(responseData))
                } else {
                    print("APIService GET: Data parse error or status != success")
                    completion(.failure(.serverError("Data parse error or server error status")))
                }
            } catch {
                print("APIService GET: Decoding error: \(error.localizedDescription)")
                completion(.failure(.decodingError(error)))
            }
        }.resume()
    }
    
    static func performRequest(endpoint: String, data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            completion(.failure(.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Effectively disable timeout for AI models
        request.timeoutInterval = 3600.0 
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
            request.httpBody = jsonData
            if let requestString = String(data: jsonData, encoding: .utf8) {
                print("APIService POST [\(endpoint)]: Payload: \(requestString)")
            }
        } catch {
            completion(.failure(.networkError(error)))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(.networkError(error)))
                return
            }
            
            guard let data = data else {
                completion(.failure(.serverError("No data received")))
                return
            }
            
            // Debug print
            if let responseString = String(data: data, encoding: .utf8) {
                print("Response for \(endpoint): \(responseString)")
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                    if let status = json["status"] as? String, (status == "success" || status == "2fa_required" || status == "verification_required") {
                        completion(.success(json))
                    } else {
                        let message = json["message"] as? String ?? "Unknown error"
                        completion(.failure(.serverError(message)))
                    }
                } else {
                     completion(.failure(.serverError("Invalid JSON structure")))
                }
            } catch {
                completion(.failure(.decodingError(error)))
            }
        }.resume()
    }

    static func getDentistSchedule(dentistId: Int, date: String, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "get_dentist_schedule?dentist_id=\(dentistId)&date=\(date)") { result in
            switch result {
            case .success(let data):
                if let dict = data as? [String: Any] {
                    completion(.success(["status": "success", "data": dict]))
                } else {
                    completion(.failure(.serverError("Malformed schedule data")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    static func updateVisitStatus(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "update_visit_status", data: data, completion: completion)
    }

    static func manageScheduleSlots(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "manage_schedule_slots", data: data, completion: completion)
    }

    static func getNotifications(userId: Int, userType: String, completion: @escaping (Result<[NotificationItem], APIError>) -> Void) {
        performGetRequest(endpoint: "get_notifications?user_id=\(userId)&user_type=\(userType)") { result in
            switch result {
            case .success(let data):
                guard let itemsArray = data as? [[String: Any]] else {
                    completion(.failure(.serverError("Unexpected data format: Expected array of notifications")))
                    return
                }
                
                do {
                    let jsonData = try JSONSerialization.data(withJSONObject: itemsArray)
                    let items = try JSONDecoder().decode([NotificationItem].self, from: jsonData)
                    completion(.success(items))
                } catch {
                    print("DECODING ERROR in getNotifications: \(error)")
                    completion(.failure(.decodingError(error)))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    static func markNotificationAsRead(notificationId: Int, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "mark_notification_read", data: ["notification_id": notificationId], completion: completion)
    }

    static func getCalendarEvents(role: String, userId: Int, month: Int, year: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        let endpoint = "get_calendar_events?role=\(role)&user_id=\(userId)&month=\(month)&year=\(year)"
        performGetRequest(endpoint: endpoint) { result in
            switch result {
            case .success(let data):
                if let events = data as? [[String: Any]] {
                    completion(.success(events))
                } else {
                    completion(.failure(.serverError("Unable to parse calendar data")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    static func updateConsistencyStreak(userId: Int, userType: String, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(
            endpoint: "update_consistency_streak",
            data: ["user_id": userId, "user_type": userType],
            completion: completion
        )
    }

    static func getUserEngagement(userId: Int, userType: String, completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performGetRequest(endpoint: "get_user_engagement?user_id=\(userId)&user_type=\(userType)") { result in
            switch result {
            case .success(let data):
                if let dict = data as? [String: Any] {
                    completion(.success(dict))
                } else {
                    completion(.failure(.serverError("Malformed engagement data")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    // MARK: - Habit Risk Analysis
    
    static func analyzeHabitRisk(data: [String: Any], completion: @escaping (Result<[String: Any], APIError>) -> Void) {
        performRequest(endpoint: "analyze_habit_risk", data: data) { result in
            switch result {
            case .success(let json):
                if let resData = json["data"] as? [String: Any] {
                    completion(.success(resData))
                } else {
                    completion(.failure(.serverError("Failed to parse habit risk data")))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getHabitRiskHistory(patientId: Int, dentistId: Int? = nil, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        var endpoint = "get_habit_risk_history?patient_id=\(patientId)"
        if let did = dentistId {
            endpoint += "&dentist_id=\(did)"
        }
        performGetRequest(endpoint: endpoint) { result in
            switch result {
            case .success(let data):
                if let array = data as? [[String: Any]] {
                    completion(.success(array))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getPatientHabitSummary(patientId: Int, completion: @escaping (Result<[String: Any]?, APIError>) -> Void) {
        performGetRequest(endpoint: "get_patient_habit_summary?patient_id=\(patientId)") { result in
            switch result {
            case .success(let data):
                completion(.success(data as? [String: Any]))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    static func getAllHabitRiskHistory(dentistId: Int, completion: @escaping (Result<[[String: Any]], APIError>) -> Void) {
        performGetRequest(endpoint: "get_all_habit_risk_history?dentist_id=\(dentistId)") { result in
            switch result {
            case .success(let data):
                if let array = data as? [[String: Any]] {
                    completion(.success(array))
                } else {
                    completion(.success([]))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}
