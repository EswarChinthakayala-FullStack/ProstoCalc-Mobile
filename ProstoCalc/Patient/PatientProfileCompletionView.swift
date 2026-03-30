import SwiftUI

struct PatientProfileCompletionView: View {
    @Environment(\.dismiss) var dismiss
    var patientId: Int
    var onComplete: () -> Void
    
    @State private var age = ""
    @State private var gender = "Select Gender"
    @State private var medicalHistory = ""
    @State private var isSaving = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    let genders = ["Male", "Female", "Other", "Prefer not to say"]
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true)
            ScrollView {
                mainContent
            }
        }
        .navigationBarHidden(true)
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Health Card"), message: Text(alertMessage), dismissButton: .default(Text("OK"), action: {
                if alertMessage.contains("Success") {
                    onComplete()
                }
            }))
        }
    }

    private var mainContent: some View {
        VStack(spacing: 35) {
            headerSection
            demographicCard
            actionButton
        }
    }

    private var headerSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .blue.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 90, height: 90)
                
                Image(systemName: "person.text.rectangle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.blue)
                    .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
            }
            
            VStack(spacing: 8) {
                Text("Setup Profile")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.dentalDarkBlue)
                
                Text("Provide basic health details for better care")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.top, 50)
    }

    private var demographicCard: some View {
        VStack(spacing: 25) {
            VStack(alignment: .leading, spacing: 15) {
                SectionHeader(title: "DEMOGRAPHICS", icon: "person.fill")
                DentalInputView(text: $age, icon: "calendar", placeholder: "Your Age", isSecure: false, keyboardType: .numberPad)
                genderMenu
                
                SectionHeader(title: "MEDICAL BACKGROUND", icon: "cross.case.fill")
                medicalHistoryEditor
            }
        }
        .padding(30)
        .background(Color.white.opacity(0.7).background(.ultraThinMaterial))
        .cornerRadius(35)
        .overlay(RoundedRectangle(cornerRadius: 35).stroke(Color.white, lineWidth: 1.5))
        .padding(.horizontal, 20)
    }

    private var genderMenu: some View {
        Menu {
            ForEach(genders, id: \.self) { g in
                Button(g) { gender = g }
            }
        } label: {
            HStack {
                Image(systemName: "person.and.arrow.left.and.arrow.right")
                    .foregroundColor(.gray.opacity(0.7))
                    .frame(width: 24)
                Text(gender)
                    .foregroundColor(gender == "Select Gender" ? .gray.opacity(0.6) : .dentalDarkBlue)
                Spacer()
                Image(systemName: "chevron.down").font(.system(size: 12)).foregroundColor(.gray)
            }
            .padding()
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.5)))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.blue.opacity(0.15), lineWidth: 1))
        }
    }

    private var medicalHistoryEditor: some View {
        TextEditor(text: $medicalHistory)
            .font(.system(size: 14))
            .frame(height: 120)
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.6)))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.blue.opacity(0.15), lineWidth: 1))
            .overlay(
                Group {
                    if medicalHistory.isEmpty {
                        Text("Mention allergies, previous surgeries, or current medications...")
                            .font(.system(size: 14))
                            .foregroundColor(.gray.opacity(0.5))
                            .padding(.top, 20).padding(.leading, 18)
                    }
                }, alignment: .topLeading
            )
    }

    private var actionButton: some View {
        Button(action: saveProfile) {
            if isSaving {
                ProgressView().tint(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .background(Color.dentalDarkBlue)
                    .cornerRadius(20)
            } else {
                Text("Complete Patient Profile")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .background(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
                    .cornerRadius(20)
                    .shadow(color: .blue.opacity(0.3), radius: 15, y: 8)
            }
        }
        .disabled(isSaving || age.isEmpty || gender == "Select Gender")
        .padding(.horizontal, 24)
        .padding(.bottom, 50)
    }
    
    private func saveProfile() {
        isSaving = true
        let data: [String: Any] = [
            "patient_id": patientId,
            "age": Int(age) ?? 0,
            "gender": gender,
            "medical_history": medicalHistory
        ]
        
        APIService.savePatientProfile(data: data) { result in
            DispatchQueue.main.async {
                isSaving = false
                switch result {
                case .success:
                    alertMessage = "Success! Your health card is updated."
                    showAlert = true
                case .failure(let error):
                    alertMessage = "Sync failed: \(error.localizedDescription)"
                    showAlert = true
                }
            }
        }
    }
}
