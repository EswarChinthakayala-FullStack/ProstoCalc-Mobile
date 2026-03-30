import SwiftUI

struct PasswordResetSuccessView: View {
    @ObservedObject var viewModel: ForgotPasswordViewModel
    @Environment(\.dismiss) var dismiss
    @State private var animate = false
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
            VStack(spacing: 30) {
                Spacer()
                
                // Animated Success Icon
                ZStack {
                    Circle()
                        .fill(Color.green.opacity(0.1))
                        .frame(width: 120, height: 120)
                        .scaleEffect(animate ? 1.0 : 0.5)
                    
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 70))
                        .foregroundColor(.green)
                        .scaleEffect(animate ? 1.0 : 0.5)
                }
                
                VStack(spacing: 12) {
                    Text("Session Restored")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    
                    Text("Your password has been successfully updated. You may now establish a secure connection.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                
                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 40)
                }
                
                Spacer()
                
                Button(action: {
                    viewModel.loginMobile { success in
                        if success {
                            NotificationCenter.default.post(
                                name: NSNotification.Name("AutoLoginAfterReset"),
                                object: nil,
                                userInfo: ["result": viewModel.loginResult ?? [:], "role": viewModel.role]
                            )
                            dismiss()
                        } else {
                            // If auto-login fails, still allow manual login go back
                            dismiss()
                        }
                    }
                }) {
                    HStack(spacing: 10) {
                        if viewModel.isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Go to Digital Portal")
                                .fontWeight(.bold)
                            Image(systemName: "arrow.right.circle.fill")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .leading, endPoint: .trailing))
                    .foregroundColor(.white)
                    .cornerRadius(18)
                    .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                }
                .disabled(viewModel.isLoading)
                .padding(.horizontal, 30)
                .padding(.bottom, 30)
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                animate = true
            }
        }
    }
}
