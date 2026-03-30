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
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    @State private var verificationRequest: VerificationRequest?
    
    struct VerificationRequest: Identifiable {
        let id = UUID()
        let email: String
        let role: String
        let type: String
    }
    
    // Password Validation Properties
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
                                DentalInputView(text: $fullName, icon: "person.text.rectangle.fill", placeholder: "Dr. Full Name", isSecure: false)
                                    .textContentType(.name)
                                
                                DentalInputView(text: $clinicName, icon: "building.2.fill", placeholder: "Clinic / Hospital Name", isSecure: false)
                                    .textContentType(.organizationName)
                                
                                DentalInputView(text: $licenseNumber, icon: "rosette", placeholder: "Medical License ID", isSecure: false)
                                    .textInputAutocapitalization(.characters)
                                
                                DentalInputView(text: $email, icon: "envelope.fill", placeholder: "Practice Email", isSecure: false, keyboardType: .emailAddress, autocapitalization: .never)
                                
                                DentalInputView(text: $password, icon: "lock.fill", placeholder: "Create Secure Password", isSecure: true)
                                
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
                                if !isPasswordFormValid {
                                    alertMessage = "Security Protocol: Please meet all password complexity requirements."
                                    showAlert = true
                                    return
                                }
                                
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
                                                
                                                alertMessage = "Registration successful. Welcome to the provider network!"
                                                showAlert = true
                                                
                                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                                    dismiss()
                                                }
                                            } else {
                                                alertMessage = "Registration successful. Please login."
                                                showAlert = true
                                            }
                                        case .failure(let error):
                                            alertMessage = "Error: \(error.localizedDescription)"
                                            showAlert = true
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
                                            colors: (certifyLicense && isPasswordFormValid) ? [.dentalDarkBlue, .teal] : [.gray.opacity(0.4), .gray.opacity(0.6)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 18))
                                    .shadow(color: (certifyLicense && isPasswordFormValid) ? .teal.opacity(0.3) : .clear, radius: 15, y: 8)
                            }
                            .alert(isPresented: $showAlert) {
                                Alert(title: Text("Registration"), message: Text(alertMessage), dismissButton: .default(Text("OK")) {
                                    if alertMessage.contains("successfully") {
                                        dismiss()
                                    }
                                })
                            }
                            .disabled(!certifyLicense || !isPasswordFormValid)
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
