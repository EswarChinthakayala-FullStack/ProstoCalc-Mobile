import SwiftUI

struct CreateAccountView: View {
    // MARK: - State Properties
    @Environment(\.dismiss) var dismiss
    
    @State private var fullName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var agreeToTerms = false
    
    @State private var animateEntry = false
    @State private var verificationRequest: VerificationRequest?
    @State private var activePatientID: Int?
    @State private var activeToast: Toast? = nil
    
    struct VerificationRequest: Identifiable {
        let id = UUID()
        let email: String
        let role: String
        let type: String
    }
    
    // Field Validation Properties
    var isNameValid: Bool { !fullName.isEmpty && fullName.count <= 30 && fullName.rangeOfCharacter(from: .decimalDigits) == nil }
    var isEmailValid: Bool { email.lowercased().contains("gmail") }
    var isPhoneValid: Bool {
        let phoneRegex = "^[6-9]\\d{9}$"
        return NSPredicate(format: "SELF MATCHES %@", phoneRegex).evaluate(with: phone)
    }
    
    // Combined Validation
    var isFormValid: Bool {
        isNameValid && isEmailValid && isPhoneValid && isPasswordFormValid && agreeToTerms
    }
    
    // Password Requirement Logic
    var hasMinLength: Bool { password.count >= 6 }
    var hasUppercase: Bool { password.rangeOfCharacter(from: .uppercaseLetters) != nil }
    var hasNumber: Bool { password.rangeOfCharacter(from: .decimalDigits) != nil }
    var hasSpecialChar: Bool { password.rangeOfCharacter(from: CharacterSet(charactersIn: "!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?")) != nil }
    var passwordsMatch: Bool { !password.isEmpty && password == confirmPassword }
    
    var isPasswordFormValid: Bool { hasMinLength && hasUppercase && hasNumber && hasSpecialChar && passwordsMatch }
    
    var body: some View {
        ZStack {
            // 1. Unified Background (The Grid)
            DentalBackgroundView(animate: true)
            
            VStack(spacing: 0) {
                // MARK: - Custom Navigation Bar
                HStack {
                    Button(action: { dismiss() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.left")
                            Text("Account Portal")
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
                
                // MARK: - Scrollable Form Content
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        
                        // 1. Header Section
                        VStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .stroke(AngularGradient(colors: [.dentalCyan, .dentalDarkBlue, .dentalCyan], center: .center), lineWidth: 1)
                                    .frame(width: 95, height: 95)
                                    .opacity(0.3)
                                
                                Circle()
                                    .fill(Color.blue.opacity(0.05))
                                    .frame(width: 80, height: 80)
                                
                                Image("image1")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 75, height: 75)
                                    .clipShape(Circle())
                            }
                            
                            VStack(spacing: 8) {
                                Text("New Patient Registration")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Initialize your secure clinical profile for AI-assisted diagnostics.")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.gray.opacity(0.8))
                                    .multilineTextAlignment(.center)
                                    .lineSpacing(4)
                                    .padding(.horizontal, 20)
                            }
                        }
                        .padding(.top, 20)
                        
                        Spacer().frame(height: 30)
                        
                        // 2. The Glass Form Card
                        VStack(spacing: 20) {
                            
                            // Input Group
                            VStack(spacing: 14) {
                                DentalInputView(text: $fullName, icon: "person.fill", placeholder: "Legal Full Name", isSecure: false, status: fullName.isEmpty ? .none : (isNameValid ? .success : .invalid))
                                    .textContentType(.name)
                                    .onChange(of: fullName) { newValue in
                                        if newValue.count > 30 {
                                            fullName = String(newValue.prefix(30))
                                        }
                                    }
                                
                                DentalInputView(text: $email, icon: "envelope.fill", placeholder: "Email Address", isSecure: false, keyboardType: .emailAddress, autocapitalization: .never, status: email.isEmpty ? .none : (isEmailValid ? .success : .invalid))
                                    .textContentType(.emailAddress)
                                
                                DentalInputView(text: $phone, icon: "phone.fill", placeholder: "Mobile Number", isSecure: false, status: phone.isEmpty ? .none : (isPhoneValid ? .success : .invalid))
                                    .keyboardType(.phonePad)
                                
                                DentalInputView(text: $password, icon: "lock.fill", placeholder: "Create Security Key", isSecure: true, status: password.isEmpty ? .none : (isPasswordFormValid ? .success : .none))
                                
                                // Real-time Validation UI
                                VStack(alignment: .leading, spacing: 6) {
                                    PasswordRequirementRow(isMet: hasMinLength, text: "Minimum 6 characters")
                                    PasswordRequirementRow(isMet: hasUppercase, text: "At least one uppercase letter")
                                    PasswordRequirementRow(isMet: hasNumber, text: "At least one number")
                                    PasswordRequirementRow(isMet: hasSpecialChar, text: "One special character (!@#$)")
                                }
                                .padding(.horizontal, 10)
                                .padding(.top, 4)
                                
                                DentalInputView(text: $confirmPassword, icon: "checkmark.shield.fill", placeholder: "Confirm Security Key", isSecure: true, status: confirmPassword.isEmpty ? .none : (passwordsMatch ? .success : .invalid))
                                
                                PasswordRequirementRow(isMet: passwordsMatch, text: "Passwords match")
                                    .padding(.horizontal, 10)
                            }
                            
                            // Terms & Conditions Checkbox
                            Button(action: { withAnimation { agreeToTerms.toggle() } }) {
                                HStack(alignment: .top, spacing: 12) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 6)
                                            .stroke(agreeToTerms ? Color.dentalCyan : Color.gray.opacity(0.35), lineWidth: 1.5)
                                            .frame(width: 20, height: 20)
                                        
                                        if agreeToTerms {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(.dentalCyan)
                                        }
                                    }
                                    .padding(.top, 1)
                                    
                                    Text("I authorize the processing of my medical data in strict accordance with HIPAA privacy standards and protocol.")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundColor(.gray.opacity(0.7))
                                        .multilineTextAlignment(.leading)
                                }
                            }
                            .padding(.vertical, 8)
                            
                            // 3. Action Button
                            Button(action: {
                                if !isNameValid {
                                    activeToast = Toast(message: "Validation: Name must be 1-30 characters and contain no numbers.", type: .error)
                                    return
                                }
                                if !isEmailValid {
                                    activeToast = Toast(message: "Validation: Only @gmail.com addresses are permitted for this protocol.", type: .error)
                                    return
                                }
                                if !isPhoneValid {
                                    activeToast = Toast(message: "Validation: Phone must be 10 digits starting with 6-9.", type: .error)
                                    return
                                }
                                if !isPasswordFormValid {
                                    activeToast = Toast(message: "Security Protocol: Please meet all password requirements.", type: .error)
                                    return
                                }
                                
                                activeToast = Toast(message: "Synchronizing clinical profile...", type: .info)
                                
                                let patientData = [
                                    "full_name": fullName,
                                    "email": email,
                                    "password": password
                                ]
                                
                                APIService.mobileSignupPatient(data: patientData) { result in
                                    DispatchQueue.main.async {
                                        switch result {
                                        case .success(let json):
                                            if let user = json["user"] as? [String: Any], let idVal = user["id"] {
                                                let idInt: Int
                                                if let i = idVal as? Int { idInt = i }
                                                else if let s = idVal as? String, let i = Int(s) { idInt = i }
                                                else { idInt = 0 }
                                                
                                                UserDefaults.standard.set(idInt, forKey: "patient_id")
                                                activeToast = Toast(message: "Welcome to ProstoCalc!", type: .success)
                                                
                                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                                    dismiss()
                                                }
                                            } else {
                                                activeToast = Toast(message: "Registration successful. Please sign in.", type: .success)
                                            }
                                        case .failure(let error):
                                            activeToast = Toast(message: "Error: \(error.localizedDescription)", type: .error)
                                        }
                                    }
                                }
                            }) {
                                Text("Finalize Secure Profile")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 56)
                                    .background(
                                        LinearGradient(
                                            colors: (agreeToTerms && isFormValid) ? [.dentalDarkBlue, .blue] : [.gray.opacity(0.4), .gray.opacity(0.6)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 18))
                                    .shadow(color: (agreeToTerms && isFormValid) ? .blue.opacity(0.3) : .clear, radius: 15, y: 8)
                            }
                            .disabled(!agreeToTerms)
                            .buttonStyle(ScaleButtonStyle())
                        }
                        .padding(26)
                        .background(
                            ZStack {
                                RoundedRectangle(cornerRadius: 32, style: .continuous)
                                    .fill(.white.opacity(0.75))
                                
                                RoundedRectangle(cornerRadius: 32, style: .continuous)
                                    .fill(.ultraThinMaterial)
                                
                                RoundedRectangle(cornerRadius: 32, style: .continuous)
                                    .stroke(
                                        LinearGradient(colors: [.white.opacity(0.6), .clear, .blue.opacity(0.15)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                        lineWidth: 1.5
                                    )
                            }
                        )
                        .shadow(color: Color.black.opacity(0.06), radius: 30, x: 0, y: 15)
                        .padding(.horizontal, 22)
                        .fullScreenCover(item: $verificationRequest) { req in
                            SecurityVerificationView(viewModel: SecurityVerificationViewModel(email: req.email, role: req.role, type: req.type)) { data in
                                // Verified! Get user data and login
                                if let user = data["user"] as? [String: Any], let idVal = user["id"] {
                                    let idInt: Int
                                    if let i = idVal as? Int { idInt = i }
                                    else if let s = idVal as? String, let i = Int(s) { idInt = i }
                                    else { idInt = 0 }
                                    
                                    UserDefaults.standard.set(idInt, forKey: "patient_id")
                                    activePatientID = idInt
                                    verificationRequest = nil
                                    
                                    // After dismiss, we should likely go to dashboard or onboarding
                                    // For simplicity in this view, let's just close everything and let ContentRefresher take over or similar
                                    // or navigate directly if possible.
                                    
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                        // Trigger a global login state change if needed, 
                                        // or just dismiss to return to the Gateway.
                                        dismiss()
                                    }
                                }
                            }
                        }
                        
                        // Bottom Spacer
                        Spacer().frame(height: 40)
                        
                        // Privacy Policy Link
                        HStack(spacing: 4) {
                            Link("Privacy Policy", destination: URL(string: "https://eswarchinthakayala-fullstack.github.io/ProstoCalc-Mobile/index.html")!)
                        }
                        .font(.system(size: 10))
                        .foregroundColor(.blue.opacity(0.7))
                    }
                    .padding(.top, 60)
                    .offset(y: animateEntry ? 0 : 40)
                    .opacity(animateEntry ? 1 : 0)
                }
            }
        }
        .toastView(toast: $activeToast)
        .navigationBarHidden(true)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.8)) {
                animateEntry = true
            }
        }
    }
}

// Preview
#Preview {
    CreateAccountView()
}
