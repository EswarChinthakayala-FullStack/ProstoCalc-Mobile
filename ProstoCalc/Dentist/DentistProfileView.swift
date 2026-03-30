import SwiftUI
import MapKit

struct DentistProfileView: View {
    @Environment(\.dismiss) var dismiss
    var dentistData: [String: Any]
    var onLogout: () -> Void
    
    @State private var region: MKCoordinateRegion
    @State private var showForgotPassword = false
    @State private var showAIAssistant = false
    
    init(dentistData: [String: Any], onLogout: @escaping () -> Void) {
        self.dentistData = dentistData
        self.onLogout = onLogout
        
        let lat = Double(dentistData["latitude"] as? String ?? "0") ?? (dentistData["latitude"] as? Double ?? 0.0)
        let lng = Double(dentistData["longitude"] as? String ?? "0") ?? (dentistData["longitude"] as? Double ?? 0.0)
        
        _region = State(initialValue: MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: lat != 0 ? lat : 12.9716, longitude: lng != 0 ? lng : 77.5946),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false, isDentist: true)
            
            VStack(spacing: 0) {
                // Professional Header
                HStack(spacing: 15) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                    }
                    
                    Text("Clinical Profile")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    
                    Spacer()
                    
                    Button(action: { showAIAssistant = true }) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: [.teal, .dentalLightBlue], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 44, height: 44)
                            
                            Image(systemName: "sparkles")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                    .shadow(color: .teal.opacity(0.3), radius: 8, y: 4)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Profile Avatar Section
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [.teal.opacity(0.1), .teal.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 110, height: 110)
                                
                                Text(String((dentistData["full_name"] as? String ?? "D").prefix(1)))
                                    .font(.system(size: 44, weight: .bold, design: .rounded))
                                    .foregroundColor(.teal)
                            }
                            .overlay(Circle().stroke(Color.white, lineWidth: 2))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                            
                            VStack(spacing: 4) {
                                Text(dentistData["full_name"] as? String ?? "Clinician Name")
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text("CERTIFIED CLINICAL SUPERVISOR")
                                    .font(.system(size: 10, weight: .black))
                                    .tracking(1.5)
                                    .foregroundColor(.teal)
                            }
                        }
                        .padding(.top, 20)
                        
                        // Practice Verification Card
                        VStack(alignment: .leading, spacing: 20) {
                            // Section: Clinical Identity
                            VStack(alignment: .leading, spacing: 12) {
                                ProfileSectionHeader(title: "CLINICAL IDENTITY", icon: "checkmark.shield.fill", color: .teal)
                                
                                HStack(spacing: 20) {
                                    CompactInfoItem(label: "SPECIALIZATION", value: dentistData["specialization"] as? String ?? "N/A", icon: "star.fill", color: .teal)
                                    CompactInfoItem(label: "EXPERIENCE", value: "\(dentistData["experience_years"] ?? "0") Years", icon: "clock.fill", color: .teal)
                                }
                                
                                CompactInfoItem(label: "PRIMARY PRACTICE", value: dentistData["clinic_name"] as? String ?? "N/A", icon: "building.2.fill", color: .teal)
                            }
                            
                            Divider().opacity(0.5)
                            
                            // Section: Clinical Operations
                            VStack(alignment: .leading, spacing: 12) {
                                ProfileSectionHeader(title: "CLINICAL OPERATIONS", icon: "doc.text.fill", color: .teal)
                                
                                HStack(spacing: 20) {
                                    CompactInfoItem(label: "CONSULTATION FEE", value: "₹\(dentistData["consultation_fee"] ?? "0.0")", icon: "indianrupeesign.circle.fill", color: .teal)
                                    CompactInfoItem(label: "LICENSE", value: dentistData["license_number"] as? String ?? "N/A", icon: "number", color: .teal)
                                }
                                
                                CompactInfoItem(label: "SECURE CHANNEL", value: dentistData["email"] as? String ?? "N/A", icon: "envelope.badge.shield.half.filled", color: .teal)
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(28)
                        .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.white, lineWidth: 1.5))
                        .padding(.horizontal, 20)
                        
                        // Map Integration
                        VStack(alignment: .leading, spacing: 12) {
                            ProfileSectionHeader(title: "CLINICAL SITE LOCATION", icon: "mappin.and.ellipse", color: .teal)
                            
                            Map(coordinateRegion: $region, annotationItems: [MapLocationPin(coordinate: region.center)]) { pin in
                                MapMarker(coordinate: pin.coordinate, tint: .teal)
                            }
                            .frame(height: 160)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white, lineWidth: 2))
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(dentistData["clinic_address"] as? String ?? "Full address not registered")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.secondary)
                                    .lineLimit(2)
                                
                                HStack {
                                    Text("LAT: \(formatCoord(dentistData["latitude"]))")
                                    Spacer()
                                    Text("LNG: \(formatCoord(dentistData["longitude"]))")
                                }
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.teal.opacity(0.6))
                            }
                            .padding(.horizontal, 4)
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.6))
                        .cornerRadius(28)
                        .padding(.horizontal, 20)
                        
                        Text("Protocol: ProstoCalc Clinical v2.0 | AES-256 | Live Gateway")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.gray.opacity(0.4))
                            .padding(.top, 10)
                            .padding(.bottom, 120) // Space for bottom bar
                    }
                }
            }
            
            // Floating Action Bar (Bottom)
            VStack {
                Spacer()
                HStack(spacing: 15) {
                    // Update Button
                    ActionButton(icon: "arrow.clockwise", label: "Sync", color: .teal) {
                        dismiss()
                    }
                    
                    // Security Button
                    ActionButton(icon: "lock.shield.fill", label: "Security", color: .dentalDarkBlue) {
                        showForgotPassword = true
                    }
                    
                    // Terminate Button
                    ActionButton(icon: "power", label: "Terminate", color: .red) {
                        dismiss()
                        onLogout()
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(
                    Capsule()
                        .fill(Color.white.opacity(0.95))
                        .background(Capsule().stroke(Color.white, lineWidth: 1))
                        .shadow(color: .black.opacity(0.1), radius: 20, y: 10)
                )
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
        }
        .navigationBarHidden(true)
        .fullScreenCover(isPresented: $showAIAssistant) {
            let did = String(describing: dentistData["id"] ?? "0")
            let name = dentistData["full_name"] as? String ?? "Doctor"
            PuterChatView(userId: did, role: "dentist", userName: name)
        }
        .fullScreenCover(isPresented: $showForgotPassword) {
            NavigationView {
                ForgotPasswordRequestView(viewModel: ForgotPasswordViewModel())
            }
        }
    }
    
    private func formatCoord(_ val: Any?) -> String {
        if let d = val as? Double {
            return String(format: "%.4f", d)
        } else if let s = val as? String, let d = Double(s) {
            return String(format: "%.4f", d)
        }
        return "0.0000"
    }
}


