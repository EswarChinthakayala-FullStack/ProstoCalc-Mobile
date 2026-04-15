import SwiftUI

struct PatientLoginView: View {
    // MARK: - State Properties
    @State private var email = ""
    @State private var password = ""
    @State private var activeToast: Toast? = nil
    @State private var animateEntry = false
    @State private var isLoggedIn = false 
    @State private var currentPatientID: Int = 0
    @State private var activePatientID: PatientIDWrapper?
    @AppStorage("patient_id") var patientID: Int = 0
    @State private var navigationDestination: Destination?
    @State private var verificationRequest: VerificationRequest?
    
    struct VerificationRequest: Identifiable {
        let id = UUID()
        let email: String
        let role: String
        let type: String
    }
    
    enum Destination {
        case location
        case dashboard
    }
    
    @Environment(\.dismiss) var dismiss // To handle custom back button
    @State private var showForgotPassword = false
    
    struct PatientIDWrapper: Identifiable {
        let id: Int
    }
    
    var body: some View {
        ZStack {
            // 1. Theme Background
            DentalBackgroundView(animate: true)
            
            // 2. Main Content
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // MARK: - Custom Navigation Bar
                    HStack {
                        Button(action: { dismiss() }) {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.left")
                                Text("Gateway")
                            }
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.dentalDarkBlue)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 14)
                            .background(.ultraThinMaterial)
                            .clipShape(Capsule())
                            .overlay(
                                Capsule().stroke(Color.blue.opacity(0.1), lineWidth: 1)
                            )
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10) 
                    .zIndex(1)
                    
                    // MARK: - Top Images (Left and Right)
                    HStack {
                        Image("image1")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 50, height: 50)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.blue.opacity(0.3), lineWidth: 2))
                        
                        Spacer()
                        
                        Image("image2")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 50, height: 50)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.blue.opacity(0.3), lineWidth: 2))
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer().frame(height: 40)
                    
                    // MARK: - Main Content Card
                    VStack(spacing: 30) {
                            
                            VStack(spacing: 8) {
                                Text("Patient Portal")
                                    .font(.system(size: 32, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Synchronize your clinical history and diagnostics via secure AI gateway.")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.gray.opacity(0.8))
                                    .multilineTextAlignment(.center)
                                    .lineSpacing(4)
                                    .padding(.horizontal, 10)
                            }
                        }
                        
                        // 2. Input Fields
                        VStack(spacing: 16) {
                            DentalInputView(
                                text: $email,
                                icon: "envelope.fill",
                                placeholder: "Email Address",
                                isSecure: false,
                                keyboardType: .emailAddress,
                                autocapitalization: .never,
                                status: email.isEmpty ? .none : (email.lowercased().contains("gmail") ? .success : .invalid)
                            )
                            
                            DentalInputView(
                                text: $password,
                                icon: "lock.fill",
                                placeholder: "Password",
                                isSecure: true,
                                showFaceID: true,
                                status: password.isEmpty ? .none : .none // Login password doesn't need real-time validation
                            )
                            
                            // Forgot Password Link
                            HStack {
                                Spacer()
                                Button(action: { showForgotPassword = true }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "key.viewfinder")
                                        Text("Recovery Access?")
                                    }
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(.dentalDarkBlue.opacity(0.6))
                                }
                                .padding(.top, 4)
                            }
                        }
                        
                        // 3. Login Action
                        Button(action: {
                            // Basic complexity check before sending to server
                            let passwordRegex = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{6,}$"
                            let isValid = NSPredicate(format: "SELF MATCHES %@", passwordRegex).evaluate(with: password)
                            
                            if !email.lowercased().contains("gmail") {
                                activeToast = Toast(message: "Validation: Only @gmail.com accounts are permitted.", type: .error)
                                return
                            }
                            
                            if !isValid {
                                activeToast = Toast(message: "Security Protocol: Password must be 6+ chars with complexity requirements.", type: .error)
                                return
                            }
                            
                            activeToast = Toast(message: "Authenticating with secure server...", type: .info)
                            
                            let patientData = [
                                "email": email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
                                "password": password
                            ]
                            
                            APIService.mobileLoginPatient(data: patientData) { result in
                                DispatchQueue.main.async {
                                     switch result {
                                     case .success(let json):
                                         if let user = json["user"] as? [String: Any], let idVal = user["id"] {
                                             let idInt: Int
                                             if let i = idVal as? Int {
                                                 idInt = i
                                             } else if let s = idVal as? String, let i = Int(s) {
                                                 idInt = i
                                             } else {
                                                 idInt = 0
                                             }
                                             
                                             let latVal = user["latitude"]
                                             let latStr = String(describing: latVal ?? "")
                                             
                                             currentPatientID = idInt
                                             self.patientID = idInt // Persist for sheets
                                             let wrapper = PatientIDWrapper(id: idInt)
                                             
                                             if !latStr.isEmpty && latStr != "0.0" && latStr != "0" {
                                                 navigationDestination = .dashboard
                                             } else {
                                                 navigationDestination = .location
                                             }
                                             activePatientID = wrapper
                                         }
                                         
                                     case .failure(let error):
                                         activeToast = Toast(message: "Login Failed: \(error.localizedDescription)", type: .error)
                                     }
                                }
                            }
                        }) {
                            Text("Establish Connection")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 56)
                                .background(
                                    LinearGradient(
                                        colors: [.dentalDarkBlue, .blue],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 18))
                                .shadow(color: .blue.opacity(0.3), radius: 15, y: 8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 18)
                                        .stroke(.white.opacity(0.2), lineWidth: 1)
                                )
                        }
                        .buttonStyle(ScaleButtonStyle())
                        
                        .fullScreenCover(item: $activePatientID) { wrapper in
                            Group {
                                if navigationDestination == .location {
                                    PatientLocationPermissionView(patientId: wrapper.id, onLogout: {
                                        activePatientID = nil
                                        dismiss()
                                    }, onComplete: {
                                        navigationDestination = .dashboard
                                        // Trigger a minor state refresh if needed, 
                                        // or just let the view switch since wrapper.id is same
                                    })
                                } else {
                                    PatientDashboardView(patientId: wrapper.id, onLogout: {
                                        ExerciseService.shared.clearData()
                                        activePatientID = nil
                                        dismiss()
                                    })
                                }
                            }
                        }
                        .fullScreenCover(isPresented: $showForgotPassword) {
                            NavigationStack {
                                ForgotPasswordRequestView(viewModel: ForgotPasswordViewModel())
                            }
                        }
                        .fullScreenCover(item: $verificationRequest) { req in
                            SecurityVerificationView(viewModel: SecurityVerificationViewModel(email: req.email, role: req.role, type: req.type)) { data in
                                // Verified callback
                                if let user = data["user"] as? [String: Any], let idVal = user["id"] {
                                    let idInt: Int
                                    if let i = idVal as? Int { idInt = i }
                                    else if let s = idVal as? String, let i = Int(s) { idInt = i }
                                    else { idInt = 0 }
                                    
                                    self.patientID = idInt
                                    currentPatientID = idInt
                                    
                                    // Trigger navigation after verification
                                    let latVal = user["latitude"]
                                    let latStr = String(describing: latVal ?? "")
                                    
                                    verificationRequest = nil
                                    
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                        if !latStr.isEmpty && latStr != "0.0" && latStr != "0" {
                                            navigationDestination = .dashboard
                                        } else {
                                            navigationDestination = .location
                                        }
                                        activePatientID = PatientIDWrapper(id: idInt)
                                    }
                                }
                            }
                        }
                        
                        // 4. Biometric Divider
                        HStack(spacing: 15) {
                            Rectangle().fill(LinearGradient(colors: [.clear, .gray.opacity(0.2)], startPoint: .leading, endPoint: .trailing)).frame(height: 1)
                            Text("PROTOCOL")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.gray.opacity(0.4))
                                .tracking(2)
                            Rectangle().fill(LinearGradient(colors: [.gray.opacity(0.2), .clear], startPoint: .leading, endPoint: .trailing)).frame(height: 1)
                        }
                        
                        // 5. Create Account Link
                        HStack(spacing: 4) {
                            Text("No profile identified?")
                                .foregroundColor(.secondary)
                            
                            NavigationLink(destination: CreateAccountView()) {
                                Text("Register Account")
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }
                        }
                        .font(.system(size: 14))
                    }
                    .padding(30)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 32, style: .continuous)
                                .fill(.white.opacity(0.7))
                            
                            RoundedRectangle(cornerRadius: 32, style: .continuous)
                                .fill(.ultraThinMaterial)
                            
                            // Subtle inner border
                            RoundedRectangle(cornerRadius: 32, style: .continuous)
                                .stroke(
                                    LinearGradient(colors: [.white.opacity(0.5), .clear, .blue.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                    lineWidth: 1.5
                                )
                        }
                    )
                    .shadow(color: .black.opacity(0.06), radius: 30, x: 0, y: 15)
                    .padding(.horizontal, 22)
                    .offset(y: animateEntry ? 0 : 40)
                    .opacity(animateEntry ? 1 : 0)
                    
                    Spacer().frame(height: 40)
                    
                    // Footer
                    VStack(spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: "lock.shield.fill")
                            Text("AES-256 CORE ENCRYPTION")
                        }
                        .font(.system(size: 9, weight: .black))
                        .tracking(1)
                        .foregroundColor(.gray.opacity(0.4))
                    }
                    .padding(.bottom, 20)
                        
                        // Privacy Policy Link
                        HStack(spacing: 4) {
                            Link("Privacy Policy", destination: URL(string: "https://eswarchinthakayala-fullstack.github.io/ProstoCalc-Mobile/index.html")!)
                        }
                        .font(.system(size: 10))
                        .foregroundColor(.blue.opacity(0.7))
                    }
                    .padding(.top, 60)
            }
        }
        .toastView(toast: $activeToast)
        .navigationBarHidden(true) // We use our custom back button
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                animateEntry = true
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("AutoLoginAfterReset"))) { notification in
            guard let userInfo = notification.userInfo,
                  let role = userInfo["role"] as? String,
                  role == "patient",
                  let result = userInfo["result"] as? [String: Any],
                  let user = result["user"] as? [String: Any],
                  let idVal = user["id"] else { return }
            
            let idInt: Int
            if let i = idVal as? Int { idInt = i }
            else if let s = idVal as? String, let i = Int(s) { idInt = i }
            else { return }
            
            let latVal = user["latitude"]
            let latStr = String(describing: latVal ?? "")
            
            self.patientID = idInt
            self.currentPatientID = idInt
            self.showForgotPassword = false
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                if !latStr.isEmpty && latStr != "0.0" && latStr != "0" {
                    navigationDestination = .dashboard
                } else {
                    navigationDestination = .location
                }
                activePatientID = PatientIDWrapper(id: idInt)
            }
        }
    }
}




// Preview
#Preview {
    PatientLoginView()
}
