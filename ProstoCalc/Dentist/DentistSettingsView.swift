import SwiftUI

struct DentistSettingsView: View {
    var dentistId: Int
    var onLogout: (() -> Void)?
    var onBack: (() -> Void)? = nil
    
    @Environment(\.dismiss) var dismiss
    
    @State private var acceptRequests = true
    @State private var isVisible = true
    @State private var consultationMode: ConsultationMode = .full
    
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    // Animation States
    @State private var showSuccessOverlay = false
    @State private var animateCheckmark = false
    
    @AppStorage("dentist_id") var storedDentistID: Int = 0
    
    enum ConsultationMode: String, CaseIterable, Identifiable {
        case full = "FULL"
        case calculationOnly = "CALCULATION_ONLY"
        var id: String { self.rawValue }
        var displayName: String {
            self == .full ? "Full Consultation Mode" : "Calculation & Prediction Only"
        }
    }
    
    var body: some View {
     
        ZStack {
            DentalBackgroundView(animate: false, isDentist: true)
            
            ScrollView {
                VStack(spacing: 24) {
                    customHeader
                    
                    disclaimerBanner
                    
                    patientDiscoveryCard
                    
                    practiceModeCard
                    
                    if let error = errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.footnote)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    
                    saveButton
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
            }
            
            // PhonePe/Paytm Style Success Overlay
            if showSuccessOverlay {
                successOverlay
            }
        }
        .onAppear(perform: loadSettings)
    }
    
    private var customHeader: some View {
        HStack(spacing: 15) {
            Button(action: {
                if let onBack = onBack {
                    onBack()
                } else {
                    dismiss()
                }
            }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.teal)
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(Color.white.opacity(0.8)))
                    .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("PRACTICE CONFIG")
                    .font(.system(size: 10, weight: .black))
                    .tracking(2)
                    .foregroundColor(.secondary)
                
                Text("Settings")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundColor(.dentalDarkBlue)
            }
            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }
    
    // MARK: - View Components
    
    private var disclaimerBanner: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Authentication Required")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Applying changes to your practice mode or visibility will require you to log out and log back in to refresh your secure session.")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
    }
    
    private var patientDiscoveryCard: some View {
        VStack(spacing: 0) {
            HStack {
                Label("Patient Discovery", systemImage: "person.3.sequence.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)
                Spacer()
            }
            .padding(.bottom, 16)
            
            Toggle(isOn: $isVisible) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Visible to Patients")
                        .font(.system(size: 16, weight: .semibold))
                    Text("Allow patients to find your profile")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
            }
            .tint(.teal)
            .padding(.bottom, 16)
            
            Divider().padding(.bottom, 16)
            
            Toggle(isOn: $acceptRequests) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Accept New Requests")
                        .font(.system(size: 16, weight: .semibold))
                    Text("Receive new consultation bookings")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
            }
            .tint(.teal)
            .disabled(!isVisible)
            .opacity(isVisible ? 1.0 : 0.5)
        }
        .modifier(CardModifier())
    }
    
    private var practiceModeCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Label("Practice Mode", systemImage: "briefcase.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
            
            Picker("Consultation Mode", selection: $consultationMode) {
                ForEach(ConsultationMode.allCases) { mode in
                    Text(mode.displayName).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            
            // Dynamic explanation based on selection
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(.teal)
                
                Text(consultationMode == .full
                     ? "Full suite enabled. Patients can interact with you directly, book appointments, and receive AI breakdowns."
                     : "Private mode. You can use the AI estimation tools for your own workflow, but patients cannot request consultations.")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.top, 8)
        }
        .modifier(CardModifier())
    }
    
    private var saveButton: some View {
        Button(action: saveSettings) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .padding(.trailing, 8)
                }
                Text(isLoading ? "Updating..." : "Save Configuration")
                    .font(.system(size: 18, weight: .bold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(isLoading ? Color.teal.opacity(0.7) : Color.teal)
            .cornerRadius(16)
            .shadow(color: Color.teal.opacity(0.3), radius: 10, y: 5)
        }
        .disabled(isLoading)
        .padding(.top, 10)
    }
    
    // MARK: - Success Overlay (PhonePe Style)
    
    private var successOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .transition(.opacity)
            
            VStack(spacing: 24) {
                // Animated Checkmark
                ZStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 80, height: 80)
                        .scaleEffect(animateCheckmark ? 1 : 0.5)
                        .opacity(animateCheckmark ? 1 : 0)
                    
                    Image(systemName: "checkmark")
                        .font(.system(size: 36, weight: .black))
                        .foregroundColor(.white)
                        .scaleEffect(animateCheckmark ? 1 : 0.2)
                        .opacity(animateCheckmark ? 1 : 0)
                }
                
                VStack(spacing: 8) {
                    Text("Update Successful!")
                        .font(.system(size: 22, weight: .bold))
                    
                    Text("Your practice settings have been updated. To apply these changes securely, please log back in.")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 10)
                }
                
                Button(action: {
                    storedDentistID = 0
                    onLogout?()
                }) {
                    Text("Logout Now")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.green)
                        .cornerRadius(12)
                }
                .padding(.top, 10)
            }
            .padding(32)
            .background(Color(UIColor.systemBackground))
            .cornerRadius(24)
            .shadow(radius: 20)
            .padding(.horizontal, 32)
            .onAppear {
                // Trigger the pop animation
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6, blendDuration: 0).delay(0.1)) {
                    animateCheckmark = true
                }
            }
        }
        .zIndex(1) // Ensure it sits on top of everything
    }
    
    // MARK: - Logic
    
    private func loadSettings() {
        isLoading = true
        errorMessage = nil
        
        APIService.getDentistSettings(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let data):
                    self.acceptRequests = data["accept_patient_requests"] as? Bool ?? true
                    self.isVisible = data["visible_to_patients"] as? Bool ?? true
                    if let modeStr = data["consultation_mode"] as? String {
                        self.consultationMode = ConsultationMode(rawValue: modeStr) ?? .full
                    }
                case .failure(let error):
                    self.errorMessage = "Failed to load settings: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func saveSettings() {
        isLoading = true
        errorMessage = nil
        
        let data: [String: Any] = [
            "dentist_id": dentistId,
            "accept_patient_requests": acceptRequests,
            "visible_to_patients": isVisible,
            "consultation_mode": consultationMode.rawValue
        ]
        
        APIService.saveDentistSettings(data: data) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(_):
                    // Show the nice animation overlay
                    withAnimation(.easeInOut(duration: 0.3)) {
                        self.showSuccessOverlay = true
                    }
                case .failure(let error):
                    self.errorMessage = "Failed to update: \(error.localizedDescription)"
                }
            }
        }
    }
}

// MARK: - Reusable Modifiers

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(20)
            .background(Color(UIColor.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.04), radius: 10, y: 4)
    }
}

// MARK: - Preview
struct DentistSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DentistSettingsView(dentistId: 1)
        }
    }
}
