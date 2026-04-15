import SwiftUI

struct DentistLoginView: View {
    // MARK: - State Properties
    @State private var email = ""
    @State private var password = ""
    @State private var activeToast: Toast? = nil
    @State private var animateEntry = false
    @State private var isLoggedIn = false
    @AppStorage("dentist_id") var storedDentistID: Int = 0
    @State private var currentDentistID: Int = 0
    @State private var activeDentistID: DentistIDWrapper?
    @Environment(\.dismiss) var dismiss
    @State private var showForgotPassword = false
    @State private var verificationRequest: VerificationRequest?
    
    struct VerificationRequest: Identifiable {
        let id = UUID()
        let email: String
        let role: String
        let type: String
    }
    
    struct DentistIDWrapper: Identifiable {
        let id: Int
    }
    
    var body: some View {
        ZStack {
            // 1. Theme Background (The Grid)
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
                                Capsule().stroke(Color.teal.opacity(0.1), lineWidth: 1)
                            )
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    .zIndex(1)
                    
                    // MARK: - Top Images (Left and Right)
                    HStack {
                        Image("image2")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 50, height: 50)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.teal.opacity(0.3), lineWidth: 2))
                        
                        Spacer()
                        
                        Image("image1")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 50, height: 50)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.teal.opacity(0.3), lineWidth: 2))
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer().frame(height: 40)
                    
                    // MARK: - Main Content Card
                    VStack(spacing: 30) {
                            
                            VStack(spacing: 8) {
                                Text("Clinician Access")
                                    .font(.system(size: 32, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Authenticate clinical credentials to access high-fidelity patient 3D models.")
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
                                icon: "building.columns.fill",
                                placeholder: "Practice Email",
                                isSecure: false,
                                keyboardType: .emailAddress,
                                autocapitalization: .never,
                                status: email.isEmpty ? .none : (email.lowercased().contains("gmail") ? .success : .invalid)
                            )
                            .textContentType(.emailAddress)
                            
                            
                            DentalInputView(
                                text: $password,
                                icon: "lock.square.fill",
                                placeholder: "Secure Password",
                                isSecure: true,
                                showFaceID: true,
                                status: password.isEmpty ? .none : .none
                            )
                        }
                        
                        // 3. Login Action
                        Button(action: {
                            // Basic complexity check before sending to server
                            let passwordRegex = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{6,}$"
                            let isValid = NSPredicate(format: "SELF MATCHES %@", passwordRegex).evaluate(with: password)
                            
                            if !email.lowercased().contains("gmail") {
                                activeToast = Toast(message: "Validation: Practice email must be @gmail.com.", type: .error)
                                return
                            }
                            
                            if !isValid {
                                activeToast = Toast(message: "Security Protocol: Clinical passwords require 1 uppercase, 1 number, and 1 special char.", type: .error)
                                return
                            }
                            
                            activeToast = Toast(message: "Authorizing clinical credentials...", type: .info)
                            
                            let dentistData = [
                                "email": email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines),
                                "password": password
                            ]
                            
                            APIService.mobileLoginDentist(data: dentistData) { result in
                                DispatchQueue.main.async {
                                    switch result {
                                    case .success(let json):
                                        if let user = json["user"] as? [String: Any], let idVal = user["id"] {
                                            if let idInt = idVal as? Int {
                                                currentDentistID = idInt
                                            } else if let idStr = idVal as? String, let idInt = Int(idStr) {
                                                currentDentistID = idInt
                                            }
                                            self.storedDentistID = currentDentistID
                                        }
                                        // Trigger navigation state directly
                                        activeDentistID = DentistIDWrapper(id: currentDentistID)
                                    case .failure(let error):
                                        activeToast = Toast(message: "Access Denied: \(error.localizedDescription)", type: .error)
                                    }
                                }
                            }
                        }) {
                            Text("Authorized Login")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 56)
                                .background(
                                    LinearGradient(
                                        colors: [.dentalDarkBlue, .teal],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 18))
                                .shadow(color: .teal.opacity(0.3), radius: 15, y: 8)
                        }
                        .buttonStyle(ScaleButtonStyle())
                        
                        // Forgot Password Link
                        Button(action: { showForgotPassword = true }) {
                            HStack(spacing: 4) {
                                Image(systemName: "shield.lefthalf.filled")
                                Text("Recovery Technical Access?")
                            }
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.teal.opacity(0.7))
                        }
                        .padding(.top, -10)
                        
                        .fullScreenCover(item: $activeDentistID) { dentistWrapper in
                            DentistDashboardView(dentistId: dentistWrapper.id, onLogout: {
                                activeDentistID = nil
                                dismiss()
                            })
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
                                    
                                    self.storedDentistID = idInt
                                    currentDentistID = idInt
                                    
                                    verificationRequest = nil
                                    
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                        activeDentistID = DentistIDWrapper(id: idInt)
                                    }
                                }
                            }
                        }
                        
                        // 4. Registration Link
                        HStack(spacing: 6) {
                            Text("New Clinician?")
                                .foregroundColor(.secondary)
                            
                            NavigationLink(destination: DentistCreateAccountView()) {
                                Text("Apply for Access")
                                    .fontWeight(.bold)
                                    .foregroundColor(.teal)
                            }
                        }
                        .font(.system(size: 14))
                    }
                    .padding(30)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 32, style: .continuous)
                                .fill(.white.opacity(0.75))
                            
                            RoundedRectangle(cornerRadius: 32, style: .continuous)
                                .fill(.ultraThinMaterial)
                            
                            RoundedRectangle(cornerRadius: 32, style: .continuous)
                                .stroke(
                                    LinearGradient(colors: [.white.opacity(0.6), .clear, .teal.opacity(0.15)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                    lineWidth: 1.5
                                )
                        }
                    )
                    .shadow(color: Color.black.opacity(0.06), radius: 30, x: 0, y: 15)
                    .padding(.horizontal, 22)
                    .offset(y: animateEntry ? 0 : 40)
                    .opacity(animateEntry ? 1 : 0)
                    
                    Spacer().frame(height: 40)
                    
                    // Footer
                    VStack(spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.shield.fill")
                            Text("HIPAA COMPLIANT ENVIRONMENT")
                        }
                        .font(.system(size: 9, weight: .black))
                        .tracking(1)
                        .foregroundColor(.teal.opacity(0.6))
                    }
                    .padding(.bottom, 20)
                        
                        // Privacy Policy Link
                        HStack(spacing: 4) {
                            Link("Privacy Policy", destination: URL(string: "https://eswarchinthakayala-fullstack.github.io/ProstoCalc-Mobile/index.html")!)
                        }
                        .font(.system(size: 10))
                        .foregroundColor(.teal.opacity(0.7))
                    }
                    .padding(.top, 60)
            }
        }
        .toastView(toast: $activeToast)
        .navigationBarHidden(true)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                animateEntry = true
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("AutoLoginAfterReset"))) { notification in
            guard let userInfo = notification.userInfo,
                  let role = userInfo["role"] as? String,
                  role == "dentist",
                  let result = userInfo["result"] as? [String: Any],
                  let user = result["user"] as? [String: Any],
                  let idVal = user["id"] else { return }
            
            let idInt: Int
            if let i = idVal as? Int { idInt = i }
            else if let s = idVal as? String, let i = Int(s) { idInt = i }
            else { return }
            
            self.storedDentistID = idInt
            self.currentDentistID = idInt
            self.showForgotPassword = false
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                activeDentistID = DentistIDWrapper(id: idInt)
            }
        }
    }
}



// Preview
#Preview {
    DentistLoginView()
}
