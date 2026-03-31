import SwiftUI

struct OTPVerificationView: View {
    @ObservedObject var viewModel: ForgotPasswordViewModel
    @Environment(\.dismiss) var dismiss
    @State private var navigateToReset = false
    @FocusState private var focusedField: Int?
    
    // Premium Design State
    @State private var shakeOffset: CGFloat = 0
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
            VStack(spacing: 0) {
                // Custom Header
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
                    
                    Text("Step 2 of 3")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(.dentalDarkBlue.opacity(0.4))
                        .tracking(1)
                }
                .padding(.horizontal, 25)
                .padding(.top, 20)
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 40) {
                        // Icon & Title
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .fill(Color.dentalCyan.opacity(0.1))
                                    .frame(width: 80, height: 80)
                                
                                Image(systemName: "envelope.badge.shield.half.filled")
                                    .font(.system(size: 30))
                                    .foregroundColor(.dentalCyan)
                            }
                            .padding(.top, 20)
                            
                            VStack(spacing: 8) {
                                Text("Security Code")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("We sent a 6-digit verification code to")
                                    .font(.system(size: 14))
                                    .foregroundColor(.secondary)
                                
                                Text(viewModel.email)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.dentalDarkBlue)
                            }
                        }
                        
                        // OTP Input Grid (Using actual TextFields for interaction)
                        HStack(spacing: 10) {
                            ForEach(0..<6) { index in
                                TextField("", text: $viewModel.otpDigits[index])
                                    .frame(width: 48, height: 65)
                                    .background(Color.white.opacity(0.8))
                                    .cornerRadius(16)
                                    .multilineTextAlignment(.center)
                                    .keyboardType(.numberPad)
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(focusedField == index ? Color.dentalCyan : Color.blue.opacity(0.1), lineWidth: 2)
                                    )
                                    .shadow(color: focusedField == index ? Color.dentalCyan.opacity(0.1) : Color.clear, radius: 10)
                                    .focused($focusedField, equals: index)
                                    .onChange(of: viewModel.otpDigits[index]) { newValue in
                                        if newValue.count > 1 {
                                            viewModel.otpDigits[index] = String(newValue.suffix(1))
                                        }
                                        
                                        if !newValue.isEmpty && index < 5 {
                                            focusedField = index + 1
                                        } else if newValue.isEmpty && index > 0 {
                                            // Optional backward movement on delete handled by keyboard?
                                            // Standard SwiftUI TextField doesn't have a reliable "onDelete" for empty text.
                                        }
                                        
                                        // Auto-verify if all fields are filled
                                        if viewModel.otpDigits.allSatisfy({ !$0.isEmpty }) {
                                            verifyOTP()
                                        }
                                    }
                            }
                        }
                        .offset(x: shakeOffset)
                        .padding(.horizontal, 20)
                        
                        VStack(spacing: 25) {
                            // Verify Button
                            Button(action: { verifyOTP() }) {
                                HStack(spacing: 12) {
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text("Verify & Continue")
                                            .fontWeight(.bold)
                                        Image(systemName: "arrow.right")
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(
                                    LinearGradient(
                                        colors: [.dentalDarkBlue, Color(hex: "2DD4BF")],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .foregroundColor(.white)
                                .cornerRadius(20)
                                .shadow(color: Color(hex: "2DD4BF").opacity(0.3), radius: 15, y: 10)
                            }
                            .disabled(viewModel.isLoading)
                            .padding(.horizontal, 25)
                            
                            // Resend Section
                            VStack(spacing: 10) {
                                Text("Didn't receive the code?")
                                    .font(.system(size: 13))
                                    .foregroundColor(.secondary)
                                
                                Button(action: {
                                    viewModel.sendOTP { _ in }
                                }) {
                                    HStack(spacing: 6) {
                                        if viewModel.resendTimer > 0 {
                                            Image(systemName: "clock")
                                            Text("Resend in \(viewModel.resendTimer)s")
                                        } else {
                                            Image(systemName: "arrow.clockwise")
                                            Text("Resend OTP Code")
                                                .fontWeight(.bold)
                                        }
                                    }
                                    .font(.system(size: 14))
                                    .foregroundColor(viewModel.resendTimer > 0 ? .gray : .dentalCyan)
                                }
                                .disabled(viewModel.resendTimer > 0)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.top, 20)
                }
            }
            
            // Error layer
            if let error = viewModel.errorMessage {
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle.fill")
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
        .navigationDestination(isPresented: $navigateToReset) {
            ResetPasswordView(viewModel: viewModel)
        }
        .navigationBarHidden(true)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                focusedField = 0
            }
        }
    }
    
    func verifyOTP() {
        viewModel.verifyOTP { success in
            if success {
                navigateToReset = true
            }
        }
    }
    
    func shake() {
        for i in 0...5 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.05) {
                withAnimation(.interactiveSpring(response: 0.1, dampingFraction: 0.2, blendDuration: 0.1)) {
                    shakeOffset = i % 2 == 0 ? -10 : 10
                }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation {
                shakeOffset = 0
            }
        }
    }
}
