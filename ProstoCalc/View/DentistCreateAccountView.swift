import SwiftUI

struct DentistCreateAccountView: View {
    // MARK: - Properties
    @Environment(\.dismiss) var dismiss
    
    @State private var fullName = ""
    @State private var clinicName = ""
    @State private var licenseNumber = ""
    @State private var email = ""
    @State private var password = ""
    
    // Compliance State
    @State private var certifyLicense = false
    @State private var animateEntry = false
    @State private var activeToast: Toast? = nil
    
    @State private var verificationRequest: VerificationRequest?
    
    struct VerificationRequest: Identifiable {
        let id = UUID()
        let email: String
        let role: String
        let type: String
    }
    
    // Field Validation Properties
    var isNameValid: Bool { !fullName.isEmpty && fullName.count <= 30 && fullName.rangeOfCharacter(from: .decimalDigits) == nil }
    var isEmailValid: Bool { email.lowercased().contains("gmail") }
    var isLicenseValid: Bool { licenseNumber.count == 10 && licenseNumber.rangeOfCharacter(from: CharacterSet.decimalDigits.inverted) == nil }
    
    // Combined Validation
    var isFormValid: Bool {
        isNameValid && isEmailValid && isLicenseValid && isPasswordFormValid && certifyLicense
    }
    
    // Password Requirement Logic
    var hasMinLength: Bool { password.count >= 6 }
    var hasUppercase: Bool { password.rangeOfCharacter(from: .uppercaseLetters) != nil }
    var hasNumber: Bool { password.rangeOfCharacter(from: .decimalDigits) != nil }
    var hasSpecialChar: Bool { password.rangeOfCharacter(from: CharacterSet(charactersIn: "!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?")) != nil }
    
    var isPasswordFormValid: Bool { hasMinLength && hasUppercase && hasNumber && hasSpecialChar }
    
    var body: some View {
        ZStack {
            // 1. Theme Background (The Grid)
            DentalBackgroundView(animate: true)
            
            VStack(spacing: 0) {
                
                // MARK: - Custom Nav Bar
                HStack {
                    Button(action: { dismiss() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.left")
                            Text("Doctor Login")
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
                
                // MARK: - Scrollable Form
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        
                        // 1. Clinical Header
                        VStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .stroke(AngularGradient(colors: [.teal, .dentalDarkBlue, .teal], center: .center), lineWidth: 1)
                                    .frame(width: 95, height: 95)
                                    .opacity(0.3)
                                
                                Circle()
                                    .fill(Color.teal.opacity(0.05))
                                    .frame(width: 80, height: 80)
                                
                                Image(systemName: "staroflife.fill")
                                    .font(.system(size: 36, weight: .thin))
                                    .foregroundStyle(
                                        LinearGradient(
                                            colors: [.dentalDarkBlue, .teal],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .shadow(color: .teal.opacity(0.4), radius: 10)
                            }
                            
                            VStack(spacing: 8) {
                                Text("Practice Enrollment")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Register your clinical credentials to access the provider network.")
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
                                DentalInputView(text: $fullName, icon: "person.text.rectangle.fill", placeholder: "Dr. Full Name", isSecure: false, status: fullName.isEmpty ? .none : (isNameValid ? .success : .invalid))
                                    .textContentType(.name)
                                    .onChange(of: fullName) { newValue in
                                        if newValue.count > 30 {
                                            fullName = String(newValue.prefix(30))
                                        }
                                    }
                                
                                DentalInputView(text: $clinicName, icon: "building.2.fill", placeholder: "Clinic / Hospital Name", isSecure: false)
                                    .textContentType(.organizationName)
                                
                                DentalInputView(text: $licenseNumber, icon: "rosette", placeholder: "Medical License ID", isSecure: false, status: licenseNumber.isEmpty ? .none : (isLicenseValid ? .success : .invalid))
                                    .textInputAutocapitalization(.characters)
                                
                                DentalInputView(text: $email, icon: "envelope.fill", placeholder: "Practice Email", isSecure: false, keyboardType: .emailAddress, autocapitalization: .never, status: email.isEmpty ? .none : (isEmailValid ? .success : .invalid))
                                
                                DentalInputView(text: $password, icon: "lock.fill", placeholder: "Create Secure Password", isSecure: true, status: password.isEmpty ? .none : (isPasswordFormValid ? .success : .none))
                                
                                // Real-time Validation UI
                                VStack(alignment: .leading, spacing: 6) {
                                    PasswordRequirementRow(isMet: hasMinLength, text: "Minimum 6 characters")
                                    PasswordRequirementRow(isMet: hasUppercase, text: "At least one uppercase letter")
                                    PasswordRequirementRow(isMet: hasNumber, text: "At least one number")
                                    PasswordRequirementRow(isMet: hasSpecialChar, text: "One special character (!@#$)")
                                }
                                .padding(.horizontal, 10)
                                .padding(.top, 4)
                            }
                            
                            // 3. License Attestation (Checkbox)
                            Button(action: { withAnimation { certifyLicense.toggle() } }) {
                                HStack(alignment: .top, spacing: 12) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 6)
                                            .stroke(certifyLicense ? Color.teal : Color.gray.opacity(0.35), lineWidth: 1.5)
                                            .frame(width: 20, height: 20)
                                        
                                        if certifyLicense {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(.teal)
                                        }
                                    }
                                    .padding(.top, 1)
                                    
                                    Text("I certify that I hold a valid license to practice dentistry and agree to the Provider Terms of Service.")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundColor(.gray.opacity(0.7))
                                        .multilineTextAlignment(.leading)
                                }
                            }
                            .padding(.vertical, 8)
                            
                            // 4. Submit Button
                            Button(action: {
                                if !isNameValid {
                                    activeToast = Toast(message: "Validation: Name must be 1-30 characters and contain no numbers.", type: .error)
                                    return
                                }
                                if !isEmailValid {
                                    activeToast = Toast(message: "Validation: Practice email must be a @gmail.com address.", type: .error)
                                    return
                                }
                                if !isLicenseValid {
                                    activeToast = Toast(message: "Validation: Medical License ID must be exactly 10 digits.", type: .error)
                                    return
                                }
                                if !isPasswordFormValid {
                                    activeToast = Toast(message: "Security Protocol: Please meet all password requirements.", type: .error)
                                    return
                                }
                                
                                activeToast = Toast(message: "Verifying credentials with medical network...", type: .info)
                                
                                let dentistData = [
                                    "full_name": fullName,
                                    "clinic_name": clinicName,
                                    "license_number": licenseNumber,
                                    "email": email,
                                    "password": password
                                ]
                                
                                APIService.mobileSignupDentist(data: dentistData) { result in
                                    DispatchQueue.main.async {
                                        switch result {
                                        case .success(let json):
                                            if let user = json["user"] as? [String: Any], let idVal = user["id"] {
                                                let idInt: Int
                                                if let i = idVal as? Int { idInt = i }
                                                else if let s = idVal as? String, let i = Int(s) { idInt = i }
                                                else { idInt = 0 }
                                                
                                                UserDefaults.standard.set(idInt, forKey: "dentist_id")
                                                activeToast = Toast(message: "Account verified. Welcome, Doctor.", type: .success)
                                                
                                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                                    dismiss()
                                                }
                                            } else {
                                                activeToast = Toast(message: "Submission successful. Pending verification.", type: .success)
                                            }
                                        case .failure(let error):
                                            activeToast = Toast(message: "Error: \(error.localizedDescription)", type: .error)
                                        }
                                    }
                                }
                            }) {
                                Text("Submit for Verification")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 56)
                                    .background(
                                        LinearGradient(
                                            colors: (certifyLicense && isFormValid) ? [.dentalDarkBlue, .teal] : [.gray.opacity(0.4), .gray.opacity(0.6)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 18))
                                    .shadow(color: (certifyLicense && isFormValid) ? .teal.opacity(0.3) : .clear, radius: 15, y: 8)
                            }
                            .disabled(!certifyLicense)
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
                                        LinearGradient(colors: [.white.opacity(0.6), .clear, .teal.opacity(0.15)], startPoint: .topLeading, endPoint: .bottomTrailing),
                                        lineWidth: 1.5
                                    )
                            }
                        )
                        .shadow(color: Color.black.opacity(0.06), radius: 30, x: 0, y: 15)
                        .padding(.horizontal, 22)
                        .fullScreenCover(item: $verificationRequest) { req in
                            SecurityVerificationView(viewModel: SecurityVerificationViewModel(email: req.email, role: req.role, type: req.type)) { data in
                                // Verified! 
                                // Since it's clinician signup, ideally we also store something or navigate.
                                if let user = data["user"] as? [String: Any], let idVal = user["id"] {
                                    let idInt: Int
                                    if let i = idVal as? Int { idInt = i }
                                    else if let s = idVal as? String, let i = Int(s) { idInt = i }
                                    else { idInt = 0 }
                                    
                                    UserDefaults.standard.set(idInt, forKey: "dentist_id")
                                    verificationRequest = nil
                                    
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                        dismiss()
                                    }
                                }
                            }
                        }
                        
                        Spacer().frame(height: 40)
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
    DentistCreateAccountView()
}
