import SwiftUI
import MapKit

struct PatientProfileView: View {
    @Environment(\.dismiss) var dismiss
    var patientData: [String: Any]
    var onLogout: () -> Void
    var onUpdate: () -> Void
    
    @State private var region: MKCoordinateRegion
    @State private var showForgotPassword = false
    @State private var showAIAssistant = false
    @State private var showProfileUpdate = false
    
    init(patientData: [String: Any], onLogout: @escaping () -> Void, onUpdate: @escaping () -> Void) {
        self.patientData = patientData
        self.onLogout = onLogout
        self.onUpdate = onUpdate
        
        let lat = Double(patientData["latitude"] as? String ?? "0") ?? (patientData["latitude"] as? Double ?? 0.0)
        let lng = Double(patientData["longitude"] as? String ?? "0") ?? (patientData["longitude"] as? Double ?? 0.0)
        
        _region = State(initialValue: MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false)
            
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
                    
                    Text("Patient Profile")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    
                    Spacer()
                    
                    Button(action: { showAIAssistant = true }) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 44, height: 44)
                            
                            Image(systemName: "sparkles")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                    .shadow(color: .blue.opacity(0.3), radius: 8, y: 4)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Profile Avatar Section
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .blue.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 110, height: 110)
                                
                                Text(String((patientData["full_name"] as? String ?? "P").prefix(1)))
                                    .font(.system(size: 44, weight: .bold, design: .rounded))
                                    .foregroundColor(.blue)
                            }
                            .overlay(Circle().stroke(Color.white, lineWidth: 2))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                            
                            VStack(spacing: 4) {
                                Text(patientData["full_name"] as? String ?? "Patient Name")
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                
                                Text(patientData["email"] as? String ?? "email@example.com")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.top, 20)
                        
                        // Information Grid Card
                        VStack(alignment: .leading, spacing: 20) {
                            // Section: Demographics
                            VStack(alignment: .leading, spacing: 12) {
                                ProfileSectionHeader(title: "DEMOGRAPHICS", icon: "person.fill")
                                
                                HStack(spacing: 20) {
                                    CompactInfoItem(label: "AGE", value: formatValue(patientData["age"]), icon: "calendar")
                                    CompactInfoItem(label: "GENDER", value: formatValue(patientData["gender"]), icon: "person.and.arrow.left.and.arrow.right")
                                }
                                
                                CompactInfoItem(label: "MEDICAL HISTORY", value: formatValue(patientData["medical_history"], fallback: "No history recorded"), icon: "cross.case.fill")
                            }
                            
                            Divider().opacity(0.5)
                            
                            // Section: Location
                            VStack(alignment: .leading, spacing: 12) {
                                ProfileSectionHeader(title: "GEOGRAPHIC DATA", icon: "mappin.and.ellipse")
                                
                                CompactInfoItem(label: "STREET ADDRESS", value: formatValue(patientData["street_address"]), icon: "mappin.circle.fill")
                                
                                HStack(spacing: 20) {
                                    CompactInfoItem(label: "CITY", value: formatValue(patientData["city"]), icon: "building.2.fill")
                                    CompactInfoItem(label: "STATE", value: formatValue(patientData["state"]), icon: "flag.fill")
                                }
                                
                                HStack(spacing: 20) {
                                    CompactInfoItem(label: "POSTAL CODE", value: formatValue(patientData["postal_code"]), icon: "number")
                                    CompactInfoItem(label: "COUNTRY", value: formatValue(patientData["country"]), icon: "globe")
                                }
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(28)
                        .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.white, lineWidth: 1.5))
                        .padding(.horizontal, 20)
                        
                        // Map Integration
                        VStack(alignment: .leading, spacing: 12) {
                            ProfileSectionHeader(title: "PRECISION GATEWAY", icon: "scope")
                            
                            Map(coordinateRegion: $region, annotationItems: [MapLocationPin(coordinate: region.center)]) { pin in
                                MapMarker(coordinate: pin.coordinate, tint: .blue)
                            }
                            .frame(height: 160)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white, lineWidth: 2))
                            
                            HStack {
                                Text("LAT: \(formatCoord(patientData["latitude"]))")
                                Spacer()
                                Text("LNG: \(formatCoord(patientData["longitude"]))")
                            }
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.blue.opacity(0.6))
                            .padding(.horizontal, 4)
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.6))
                        .cornerRadius(28)
                        .padding(.horizontal, 20)
                        
                        Spacer().frame(height: 100) // Space for bottom bar
                    }
                }
            }
            
            // Floating Action Bar (Bottom)
            VStack {
                Spacer()
                HStack(spacing: 15) {
                    // Update Button
                    ActionButton(icon: "pencil.line", label: "Update", color: .blue) {
                        showProfileUpdate = true
                    }
                    
                    // Forgot Password Button
                    ActionButton(icon: "lock.shield.fill", label: "Security", color: .dentalDarkBlue) {
                        showForgotPassword = true
                    }
                    
                    // Logout Button
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
        .sheet(isPresented: $showAIAssistant) {
            let pid = String(describing: patientData["id"] ?? "0")
            let name = patientData["full_name"] as? String ?? "Patient"
            PuterChatView(userId: pid, role: "patient", userName: name)
        }
        .fullScreenCover(isPresented: $showForgotPassword) {
            NavigationView {
                ForgotPasswordRequestView(viewModel: ForgotPasswordViewModel())
            }
        }
        .sheet(isPresented: $showProfileUpdate) {
            PatientUpdateProfileView(
                patientData: patientData,
                onUpdate: {
                    onUpdate()
                }
            )
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
    
    private func formatValue(_ val: Any?, fallback: String = "Information not provided") -> String {
        if let s = val as? String {
            return s.isEmpty ? fallback : s
        }
        if let i = val as? Int {
            return "\(i)"
        }
        if let d = val as? Double {
            return String(format: "%.0f", d)
        }
        return fallback
    }
}


