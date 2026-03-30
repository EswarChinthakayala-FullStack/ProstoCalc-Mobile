import SwiftUI

struct SecurityVerificationView: View {
    @ObservedObject var viewModel: SecurityVerificationViewModel
    @Environment(\.dismiss) var dismiss
    @FocusState private var focusedField: Int?
    
    // Performance and Aesthetic State
    @State private var shakeOffset: CGFloat = 0
    @State private var animateEntry = false
    
    // Completion Callback (to handle the successful result in parent)
    var onVerified: ([String: Any]) -> Void
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
            VStack(spacing: 0) {
                // Precise Navigation Bar
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
                    
                    Text("IDENTITY VERIFICATION")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.dentalDarkBlue.opacity(0.4))
                        .tracking(2)
                }
                .padding(.horizontal, 25)
                .padding(.top, 20)
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 40) {
                        // 1. Icon & Core Context
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .fill(viewModel.role == "dentist" ? Color.dentalTeal.opacity(0.1) : Color.blue.opacity(0.1))
                                    .frame(width: 90, height: 90)
                                
                                Image(systemName: viewModel.type == "signup" ? "person.badge.shield.checkmark.fill" : "lock.shield.fill")
                                    .font(.system(size: 38))
                                    .foregroundColor(viewModel.role == "dentist" ? .dentalTeal : .blue)
                            }
                            .padding(.top, 30)
                            
                            VStack(spacing: 8) {
                                Text(viewModel.type == "signup" ? "Verify Account" : "Security Check")
                                    .font(.system(size: 30, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("A 6-digit verification code has been synchronized with your email address.")
                                    .font(.system(size: 14))
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 30)
                                
                                Text(viewModel.email)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.dentalDarkBlue)
                                    .padding(.top, 4)
                            }
                        }
                        
                        // 2. OTP Input Grid
                        HStack(spacing: 12) {
                            ForEach(0..<6) { index in
                                TextField("", text: $viewModel.otpDigits[index])
                                    .frame(width: 52, height: 70)
                                    .background(Color.white.opacity(0.85))
                                    .cornerRadius(18)
                                    .multilineTextAlignment(.center)
                                    .keyboardType(.numberPad)
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 18)
                                            .stroke(focusedField == index ? (viewModel.role == "dentist" ? Color.dentalTeal : Color.blue) : Color.blue.opacity(0.08), lineWidth: 2)
                                    )
                                    .shadow(color: focusedField == index ? (viewModel.role == "dentist" ? Color.dentalTeal : Color.blue).opacity(0.15) : Color.clear, radius: 10)
                                    .focused($focusedField, equals: index)
                                    .onChange(of: viewModel.otpDigits[index]) { newValue in
                                        if newValue.count > 1 {
                                            viewModel.otpDigits[index] = String(newValue.suffix(1))
                                        }
                                        
                                        if !newValue.isEmpty && index < 5 {
                                            focusedField = index + 1
                                        }
                                        
                                        // Auto-verify when all filled
                                        if viewModel.otpDigits.allSatisfy({ !$0.isEmpty }) {
                                            triggerVerification()
                                        }
                                    }
                            }
                        }
                        .offset(x: shakeOffset)
                        .padding(.horizontal, 20)
                        
                        // 3. Status & Logic Block
                        VStack(spacing: 25) {
                            Button(action: { triggerVerification() }) {
                                HStack(spacing: 12) {
                                    if viewModel.isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Authorize Profile")
                                            .fontWeight(.bold)
                                        Image(systemName: "shield.check.fill")
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 62)
                                .background(
                                    LinearGradient(
                                        colors: viewModel.role == "dentist" ? [.dentalDarkBlue, .dentalTeal] : [.dentalDarkBlue, .blue],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .foregroundColor(.white)
                                .cornerRadius(22)
                                .shadow(color: (viewModel.role == "dentist" ? Color.dentalTeal : Color.blue).opacity(0.3), radius: 15, y: 10)
                            }
                            .disabled(viewModel.isLoading)
                            .padding(.horizontal, 25)
                            
                            // Resend Mechanic
                            VStack(spacing: 8) {
                                Text("Didn't receive your code?")
                                    .font(.system(size: 13))
                                    .foregroundColor(.secondary)
                                
                                Button(action: { viewModel.resendOTP() }) {
                                    HStack(spacing: 4) {
                                        if viewModel.resendTimer > 0 {
                                            Text("Valid for \(viewModel.resendTimer)s")
                                        } else {
                                            Image(systemName: "arrow.triangle.2.circlepath")
                                            Text("Request Fresh Token")
                                                .fontWeight(.bold)
                                        }
                                    }
                                    .font(.system(size: 14))
                                    .foregroundColor(viewModel.resendTimer > 0 ? .gray : (viewModel.role == "dentist" ? .dentalTeal : .blue))
                                }
                                .disabled(viewModel.resendTimer > 0)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.top, 20)
                }
            }
            
            // Premium Error Display
            if let error = viewModel.errorMessage {
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        Image(systemName: "exclamationmark.shield.fill")
                        Text(error)
                            .font(.system(size: 14, weight: .medium))
                    }
                    .padding(.vertical, 16)
                    .padding(.horizontal, 22)
                    .background(.red.opacity(0.95))
                    .foregroundColor(.white)
                    .cornerRadius(16)
                    .shadow(radius: 12)
                    .padding(.horizontal, 22)
                    .padding(.bottom, 50)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .onAppear {
                    shake()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                        withAnimation { viewModel.errorMessage = nil }
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                focusedField = 0
            }
        }
    }
    
    func triggerVerification() {
        guard !viewModel.isLoading else { return }
        viewModel.verifyOTP { success in
            if success, let data = viewModel.successData {
                onVerified(data)
            }
        }
    }
    
    func shake() {
        for i in 0...6 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.04) {
                withAnimation(.interactiveSpring(response: 0.08, dampingFraction: 0.25, blendDuration: 0.1)) {
                    shakeOffset = i % 2 == 0 ? -8 : 8
                }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation { shakeOffset = 0 }
        }
    }
}
