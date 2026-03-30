import SwiftUI

struct DentistProfileCompletionView: View {
    @Environment(\.dismiss) var dismiss
    var dentistId: Int
    var onComplete: () -> Void
    
    @State private var specialization = ""
    @State private var experience = ""
    @State private var fee = ""
    @State private var isSaving = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: true)
            
            ScrollView {
                VStack(spacing: 35) {
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: [.teal.opacity(0.1), .teal.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 90, height: 90)
                            
                            Image(systemName: "person.text.rectangle.fill")
                                .font(.system(size: 36))
                                .foregroundColor(.teal)
                                .shadow(color: .teal.opacity(0.3), radius: 10, y: 5)
                        }
                        
                        VStack(spacing: 8) {
                            Text("Complete Profile")
                                .font(.system(size: 32, weight: .bold, design: .rounded))
                                .foregroundColor(.dentalDarkBlue)
                            
                            Text("Tell us about your professional expertise")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.top, 50)
                    
                    VStack(spacing: 25) {
                        VStack(alignment: .leading, spacing: 15) {
                            SectionHeader(title: "EXPERTISE", icon: "star.fill")
                            DentalInputView(text: $specialization, icon: "briefcase.fill", placeholder: "Specialization (e.g. Orthodontist)", isSecure: false)
                            DentalInputView(text: $experience, icon: "clock.fill", placeholder: "Years of Experience", isSecure: false, keyboardType: .numberPad)
                            DentalInputView(text: $fee, icon: "indianrupeesign.circle.fill", placeholder: "Consultation Fee", isSecure: false, keyboardType: .decimalPad)
                        }
                    }
                    .padding(30)
                    .background(Color.white.opacity(0.7).background(.ultraThinMaterial))
                    .cornerRadius(35)
                    .overlay(RoundedRectangle(cornerRadius: 35).stroke(Color.white, lineWidth: 1.5))
                    .padding(.horizontal, 20)
                    
                    Button(action: saveProfile) {
                        if isSaving {
                            ProgressView().tint(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(Color.dentalDarkBlue)
                                .cornerRadius(20)
                        } else {
                            Text("Save Professional Profile")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(LinearGradient(colors: [.teal, .dentalDarkBlue], startPoint: .leading, endPoint: .trailing))
                                .cornerRadius(20)
                                .shadow(color: .teal.opacity(0.3), radius: 15, y: 8)
                        }
                    }
                    .disabled(isSaving || specialization.isEmpty || experience.isEmpty)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 50)
                }
            }
        }
        .navigationBarHidden(true)
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Profile Registry"), message: Text(alertMessage), dismissButton: .default(Text("OK"), action: {
                if alertMessage.contains("Success") {
                    onComplete()
                }
            }))
        }
    }
    
    private func saveProfile() {
        isSaving = true
        let data: [String: Any] = [
            "dentist_id": dentistId,
            "specialization": specialization,
            "experience_years": Int(experience) ?? 0,
            "consultation_fee": Double(fee) ?? 0.0
        ]
        
        APIService.saveDentistProfile(data: data) { result in
            DispatchQueue.main.async {
                isSaving = false
                switch result {
                case .success:
                    alertMessage = "Success! Your profile is now live."
                    showAlert = true
                case .failure(let error):
                    alertMessage = "Failed: \(error.localizedDescription)"
                    showAlert = true
                }
            }
        }
    }
}
