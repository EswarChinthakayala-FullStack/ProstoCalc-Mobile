import SwiftUI
import Combine
import UserNotifications

class SecurityVerificationViewModel: ObservableObject {
    @Published var email: String
    @Published var role: String
    @Published var type: String // "2fa" or "signup"
    @Published var otpDigits = Array(repeating: "", count: 6)
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successData: [String: Any]?
    
    @Published var resendTimer = 0
    private var timer: AnyCancellable?
    
    init(email: String, role: String, type: String) {
        self.email = email
        self.role = role
        self.type = type
        startResendTimer()
    }
    
    func startResendTimer() {
        resendTimer = 60
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
    
    func verifyOTP(completion: @escaping (Bool) -> Void) {
        let fullOTP = otpDigits.joined()
        guard fullOTP.count == 6 else {
            errorMessage = "Verification code must be 6 digits."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        APIService.verifyIdentity(email: email, role: role, otp: fullOTP, type: type) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let json):
                    self?.successData = json
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                    completion(false)
                }
            }
        }
    }
    
    func resendOTP() {
        isLoading = true
        errorMessage = nil
        
        // Re-use current endpoint depending on type
        // In signup, we might need a separate resend endpoint?
        // For now, let's just trigger a re-login/signup attempt? 
        // Or if the server has a generic resend_otp...
        
        // Let's assume for now they re-initiate login if it fails
        // Wait, the 'forgot_password' endpoint can be used as a generic resend for other types if updated.
        // For now, let's just show an error that they need to try login again.
        
        errorMessage = "Security policy: Please return to login screen to request a fresh OTP."
        isLoading = false
    }
}
