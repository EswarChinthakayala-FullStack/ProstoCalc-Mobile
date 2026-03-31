import SwiftUI

struct ResetPasswordView: View {
    @ObservedObject var viewModel: ForgotPasswordViewModel
    @Environment(\.dismiss) var dismiss
    @State private var navigateToSuccess = false
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.dentalDarkBlue)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    Spacer()
                    
                    Text("Step 3 of 3")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(.dentalDarkBlue.opacity(0.4))
                        .tracking(1)
                }
                .padding(.horizontal, 25)
                .padding(.top, 20)
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 35) {
                        // Icon & Title
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .fill(Color.blue.opacity(0.1))
                                    .frame(width: 80, height: 80)
                                
                                Image(systemName: "shield.righthalf.filled")
                                    .font(.system(size: 30))
                                    .foregroundColor(.blue)
                            }
                            
                            VStack(spacing: 8) {
                                Text("New Password")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Create a robust and secure password to protect your clinical workspace.")
                                    .font(.system(size: 14))
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 40)
                            }
                        }
                        
                        VStack(spacing: 25) {
                            // Password Fields
                            VStack(spacing: 16) {
                                PremiumSecureField(text: $viewModel.newPassword, placeholder: "Enter New Password", icon: "lock.fill")
                                PremiumSecureField(text: $viewModel.confirmPassword, placeholder: "Re-enter to Confirm", icon: "lock.shield.fill")
                            }
                            .padding(.horizontal, 25)
                            
                            // Security Indicators
                            VStack(alignment: .leading, spacing: 12) {
                                Text("CRYPTO-PROTOCOL REQUIREMENTS")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.blue.opacity(0.4))
                                    .tracking(1)
                                    .padding(.leading, 5)
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    ValidationRow(isMet: viewModel.newPassword.count >= 6, text: "Structural length minimum 6 chars")
                                    ValidationRow(isMet: viewModel.newPassword.rangeOfCharacter(from: .uppercaseLetters) != nil, text: "Uppercase requirement")
                                    ValidationRow(isMet: viewModel.newPassword.rangeOfCharacter(from: .decimalDigits) != nil, text: "Include numerical parameters")
                                    ValidationRow(isMet: viewModel.newPassword.rangeOfCharacter(from: CharacterSet(charactersIn: "!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?")) != nil, text: "Special character integration")
                                    ValidationRow(isMet: viewModel.passwordsMatch, text: "Hash-match verification")
                                }
                            }
                            .padding(20)
                            .background(Color.white.opacity(0.6))
                            .background(.ultraThinMaterial)
                            .cornerRadius(20)
                            .padding(.horizontal, 25)
                            
                            // Submit Button
                            Button(action: {
                                viewModel.resetPassword { success in
                                    if success {
                                        navigateToSuccess = true
                                    }
                                }
                            }) {
                                HStack(spacing: 12) {
                                    if viewModel.isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Finalize Encryption Update")
                                            .fontWeight(.bold)
                                        Image(systemName: "checkmark.shield.fill")
                                    }
                                }
                                .padding(.horizontal, 20)
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(
                                    LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .leading, endPoint: .trailing)
                                )
                                .foregroundColor(.white)
                                .cornerRadius(20)
                                .shadow(color: .blue.opacity(0.3), radius: 15, y: 10)
                                .opacity(viewModel.isPasswordValid && viewModel.passwordsMatch ? 1.0 : 0.6)
                            }
                            .disabled(!viewModel.isPasswordValid || !viewModel.passwordsMatch || viewModel.isLoading)
                            .padding(.horizontal, 25)
                        }
                        
                        Spacer()
                    }
                    .padding(.top, 20)
                }
                .navigationDestination(isPresented: $navigateToSuccess) {
                    PasswordResetSuccessView(viewModel: viewModel)
                }
            }
            
            // Error layer
            if let error = viewModel.errorMessage {
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        Image(systemName: "bolt.horizontal.circle.fill")
                        Text(error)
                            .font(.system(size: 14, weight: .medium))
                    }
                    .padding(.vertical, 14)
                    .padding(.horizontal, 20)
                    .background(.red.opacity(0.9))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .shadow(radius: 10)
                    .padding(.bottom, 40)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                        viewModel.errorMessage = nil
                    }
                }
            }
        }
        .navigationBarHidden(true)
    }
}

struct PremiumSecureField: View {
    @Binding var text: String
    var placeholder: String
    var icon: String
    @State private var isVisible: Bool = false
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .foregroundColor(.blue.opacity(0.5))
                .frame(width: 20)
            
            if isVisible {
                TextField(placeholder, text: $text)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            } else {
                SecureField(placeholder, text: $text)
            }
            
            Button(action: { isVisible.toggle() }) {
                Image(systemName: isVisible ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 14))
                    .foregroundColor(.blue.opacity(0.4))
            }
        }
        .padding(.horizontal, 20)
        .frame(height: 60)
        .background(Color.white.opacity(0.8))
        .cornerRadius(18)
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.white.opacity(0.5), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.02), radius: 5, y: 2)
    }
}

struct ValidationRow: View {
    let isMet: Bool
    let text: String
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: isMet ? "checkmark.circle.fill" : "circle.dotted")
                .foregroundColor(isMet ? .green : .gray.opacity(0.3))
                .font(.system(size: 16, weight: .bold))
            
            Text(text)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(isMet ? .dentalDarkBlue : .secondary)
            
            Spacer()
        }
    }
}
