import SwiftUI

struct RoleSelectionView: View {
    // Animation States
    @State private var animateHeader = false
    @State private var animateCards = false
    
    var body: some View {
        ZStack {
            // MARK: - 1. Continuity Background
            DentalBackgroundView(animate: true)
            
            // 2. Main Content
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    
                    // MARK: - 2. Header Section
                    VStack(spacing: 16) {
                        HStack(spacing: 8) {
                            Image(systemName: "waveform.path.ecg")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(.blue)
                            
                            Text("SECURE GATEWAY")
                                .font(.system(size: 10, weight: .bold))
                                .tracking(2)
                                .foregroundStyle(.gray)
                        }
                        .opacity(0.8)
                        
                        Text("Identify Your Role")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.dentalDarkBlue, .black.opacity(0.8)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        
                        Text("Select your access level to synchronize\nclinical data or manage treatment plans.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                    }
                    .padding(.top, 40)
                    .offset(y: animateHeader ? 0 : -30)
                    .opacity(animateHeader ? 1 : 0)
                    
                    Spacer().frame(height: 60)
                    
                    // MARK: - 3. The "Access Cards"
                    VStack(spacing: 20) {
                        
                        // Patient Route
                        NavigationLink(destination: PatientLoginView()) {
                            DentalRoleCard(
                                title: "Patient Portal",
                                subtitle: "View treatment plans, 3D scans, and appointments.",
                                icon: "person.text.rectangle.fill",
                                gradientColors: [.blue, .cyan]
                            )
                        }
                        .buttonStyle(ScaleButtonStyle())
                        
                        // Dentist Route
                        NavigationLink(destination: DentistLoginView()) {
                            DentalRoleCard(
                                title: "Clinician Access",
                                subtitle: "Modify diagnostics, approve requests, and analyze data.",
                                icon: "stethoscope",
                                gradientColors: [.dentalDarkBlue, .teal]
                            )
                        }
                        .buttonStyle(ScaleButtonStyle())
                    }
                    .padding(.horizontal, 24)
                    .offset(y: animateCards ? 0 : 50)
                    .opacity(animateCards ? 1 : 0)
                    
                    Spacer().frame(height: 60)
                    
                    // Footer
                    Text("Version 2.0 • ProstoCalc Secure Core")
                        .font(.caption2)
                        .foregroundColor(.gray.opacity(0.5))
                        .padding(.bottom, 20)
                }
                .padding(.top, 60) // Safety for notch
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            withAnimation(.easeOut(duration: 0.8)) {
                animateHeader = true
            }
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.2)) {
                animateCards = true
            }
        }
    }
}

// MARK: - Component: Professional Role Card
struct DentalRoleCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let gradientColors: [Color]
    
    var body: some View {
        HStack(spacing: 20) {
            // Icon Container
            ZStack {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [gradientColors[0].opacity(0.15), gradientColors[1].opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 65, height: 65)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(gradientColors[0].opacity(0.3), lineWidth: 1)
                    )
                
                Image(systemName: icon)
                    .font(.system(size: 28, weight: .regular))
                    .foregroundStyle(
                        LinearGradient(
                            colors: gradientColors,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
            
            // Text Content
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.dentalDarkBlue)
                
                Text(subtitle)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)
                    .lineLimit(2)
            }
            
            Spacer()
            
            // Chevron
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.gray.opacity(0.4))
        }
        .padding(20)
        .background(
            ZStack {
                // Glass Effect
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(.ultraThinMaterial)
                
                // Gradient Border
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [.white, .white.opacity(0.0), gradientColors[0].opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            }
        )
        // Soft sophisticated shadow
        .shadow(color: Color.black.opacity(0.05), radius: 15, x: 0, y: 10)
    }
}

// MARK: - Button Style (Tactile Feel)
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

