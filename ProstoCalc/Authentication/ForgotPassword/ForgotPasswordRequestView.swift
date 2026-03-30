import SwiftUI

struct ForgotPasswordRequestView: View {
    @StateObject var viewModel: ForgotPasswordViewModel
    @Environment(\.dismiss) var dismiss
    @State private var navigateToOTP = false
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
            VStack(spacing: 0) {
                // Custom Navigation Bar
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.dentalDarkBlue)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    Spacer()
                    
                    Text("Identity Recovery")
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(.dentalDarkBlue.opacity(0.4))
                        .tracking(1)
                }
                .padding(.horizontal, 25)
                .padding(.top, 20)
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 40) {
                        
                        // Header Visual
                        VStack(spacing: 20) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .cyan.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 100, height: 100)
                                
                                Image(systemName: "lock.shield.fill")
                                    .font(.system(size: 40))
                                    .foregroundStyle(
                                        LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .top, endPoint: .bottom)
                                    )
                                    .shadow(color: .blue.opacity(0.2), radius: 10, y: 5)
                            }
                            
                            VStack(spacing: 10) {
                                Text("Password Recovery")
                                    .font(.system(size: 32, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("Select your institutional role and enter your registered credentials to initiate the OTP sequence.")
                                    .font(.system(size: 14))
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 30)
                                    .lineSpacing(4)
                            }
                        }
                        
                        // Input Section
                        VStack(spacing: 25) {
                            // Role Selector (Premium Style)
                            HStack(spacing: 0) {
                                RoleTab(title: "Patient", isSelected: viewModel.role == "patient") {
                                    viewModel.role = "patient"
                                }
                                RoleTab(title: "Dentist", isSelected: viewModel.role == "dentist") {
                                    viewModel.role = "dentist"
                                }
                            }
                            .padding(6)
                            .background(Color.white.opacity(0.5))
                            .background(.ultraThinMaterial)
                            .cornerRadius(20)
                            .padding(.horizontal, 25)
                            
                            // Email Input
                            VStack(alignment: .leading, spacing: 8) {
                                Text("AUTHENTICATION EMAIL")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.dentalDarkBlue.opacity(0.4))
                                    .padding(.leading, 10)
                                
                                HStack(spacing: 15) {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.blue.opacity(0.5))
                                        .font(.system(size: 18))
                                    
                                    TextField("e.g. name@clinic.com", text: $viewModel.email)
                                        .keyboardType(.emailAddress)
                                        .textInputAutocapitalization(.never)
                                        .disableAutocorrection(true)
                                }
                                .padding(.horizontal, 20)
                                .frame(height: 60)
                                .background(Color.white.opacity(0.8))
                                .cornerRadius(18)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 18)
                                        .stroke(LinearGradient(colors: [.white.opacity(0.8), .clear], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1)
                                )
                                .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
                            }
                            .padding(.horizontal, 25)
                            
                            // Action Button
                            Button(action: {
                                viewModel.sendOTP { success in
                                    if success {
                                        navigateToOTP = true
                                    }
                                }
                            }) {
                                HStack(spacing: 12) {
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text("Request Security Code")
                                            .fontWeight(.bold)
                                        Image(systemName: "chevron.right.circle.fill")
                                            .font(.title3)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(
                                    LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .leading, endPoint: .trailing)
                                )
                                .foregroundColor(.white)
                                .cornerRadius(20)
                                .shadow(color: .blue.opacity(0.3), radius: 15, y: 10)
                            }
                            .padding(.horizontal, 25)
                            .disabled(viewModel.isLoading)
                        }
                        
                        Spacer()
                    }
                    .padding(.top, 20)
                }
                
                NavigationLink(destination: OTPVerificationView(viewModel: viewModel), isActive: $navigateToOTP) {
                    EmptyView()
                }
            }
            
            // Premium Error Toast
            if let error = viewModel.errorMessage {
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        Image(systemName: "wifi.exclamationmark")
                            .font(.headline)
                        Text(error)
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .padding(.vertical, 16)
                    .padding(.horizontal, 24)
                    .background(
                        ZStack {
                            BlurView(style: .systemThinMaterialDark)
                            Color.red.opacity(0.8)
                        }
                    )
                    .foregroundColor(.white)
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.2), radius: 20, y: 10)
                    .padding(.bottom, 40)
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

struct RoleTab: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(isSelected ? .white : .dentalDarkBlue.opacity(0.5))
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    ZStack {
                        if isSelected {
                            RoundedRectangle(cornerRadius: 15)
                                .fill(LinearGradient(colors: [.dentalDarkBlue, .blue], startPoint: .leading, endPoint: .trailing))
                                .shadow(color: .blue.opacity(0.2), radius: 5, y: 2)
                        }
                    }
                )
        }
    }
}

struct BlurView: UIViewRepresentable {
    var style: UIBlurEffect.Style
    func makeUIView(context: Context) -> UIVisualEffectView {
        return UIVisualEffectView(effect: UIBlurEffect(style: style))
    }
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {}
}
