import SwiftUI
import Combine
import UserNotifications

class ForgotPasswordViewModel: ObservableObject {
    @Published var email = ""
    @Published var role = "patient" // default
    @Published var otp = ""
    @Published var otpDigits = Array(repeating: "", count: 6)
    @Published var newPassword = ""
    @Published var confirmPassword = ""
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var loginResult: [String: Any]? // Store successful login data
    
    @Published var resendTimer = 0
    private var timer: AnyCancellable?
    
    var isPasswordValid: Bool {
        // Requirements: 6 chars, 1 uppercase, 1 number, 1 special char
        let passwordRegex = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{6,}$"
        return NSPredicate(format: "SELF MATCHES %@", passwordRegex).evaluate(with: newPassword)
    }
    
    var passwordsMatch: Bool {
        !newPassword.isEmpty && newPassword == confirmPassword
    }
    
    func startResendTimer() {
        resendTimer = 30
        timer?.cancel()
        timer = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                if let self = self, self.resendTimer > 0 {
                    self.resendTimer -= 1
                } else {
                    self?.timer?.cancel()
                }
            }
    }
    
    func sendOTP(completion: @escaping (Bool) -> Void) {
        guard !email.isEmpty else {
            errorMessage = "Please enter your email."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        // Normalize email
        let normalizedEmail = email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        APIService.requestOTP(email: normalizedEmail, role: role) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let json):
                    if let otpReceived = json["otp"] as? String {
                        self?.triggerInAppNotification(otp: otpReceived)
                    }
                    self?.startResendTimer()
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                    completion(false)
                }
            }
        }
    }
    
    func verifyOTP(completion: @escaping (Bool) -> Void) {
        let fullOTP = otpDigits.joined()
        guard fullOTP.count == 6 else {
            errorMessage = "Please enter the 6-digit OTP."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        // Normalize email
        let normalizedEmail = email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        APIService.verifyOTP(email: normalizedEmail, role: role, otp: fullOTP) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success:
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                    completion(false)
                }
            }
        }
    }
    
    func resetPassword(completion: @escaping (Bool) -> Void) {
        guard isPasswordValid else {
            errorMessage = "Password must be at least 6 chars, 1 uppercase, 1 number, and 1 special char."
            return
        }
        guard passwordsMatch else {
            errorMessage = "Passwords do not match."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        // Normalize email
        let normalizedEmail = email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        let data: [String: Any] = [
            "email": normalizedEmail,
            "role": role,
            "otp": otpDigits.joined(),
            "new_password": newPassword
        ]
        
        APIService.resetPassword(data: data) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success:
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                    completion(false)
                }
            }
        }
    }
    
    func loginMobile(completion: @escaping (Bool) -> Void) {
        isLoading = true
        errorMessage = nil
        let normalizedEmail = email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let loginData: [String: Any] = ["email": normalizedEmail, "password": newPassword]
        
        if role == "dentist" {
            APIService.mobileLoginDentist(data: loginData) { [weak self] result in
                DispatchQueue.main.async {
                    self?.isLoading = false
                    switch result {
                    case .success(let json):
                        self?.loginResult = json
                        completion(true)
                    case .failure(let error):
                        self?.errorMessage = error.localizedDescription
                        completion(false)
                    }
                }
            }
        } else {
            APIService.mobileLoginPatient(data: loginData) { [weak self] result in
                DispatchQueue.main.async {
                    self?.isLoading = false
                    switch result {
                    case .success(let json):
                        self?.loginResult = json
                        completion(true)
                    case .failure(let error):
                        self?.errorMessage = error.localizedDescription
                        completion(false)
                    }
                }
            }
        }
    }
    
    private func triggerInAppNotification(otp: String) {
        let content = UNMutableNotificationContent()
        content.title = "ProstoCalc Security"
        content.body = "Your password reset OTP is \(otp). It expires in 10 minutes."
        content.sound = .default
        
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
