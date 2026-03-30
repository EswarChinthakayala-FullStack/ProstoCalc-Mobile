import SwiftUI

struct DentistDiscoveryView: View {
    @AppStorage("patient_id") var patientId: Int = 0
    @State private var dentists: [[String: Any]] = []
    @State private var isLoading = false
    @State private var selectedDentist: [String: Any]?
    @State private var requestMessage = ""
    @State private var showRequestSheet = false
    @State private var alertMessage = ""
    @State private var showAlert = false
    
    var body: some View {
        List {
            if isLoading {
                ProgressView("Searching for dentists...")
            } else {
                ForEach(dentists.indices, id: \.self) { index in
                    let dentist = dentists[index]
                    HStack {
                        VStack(alignment: .leading) {
                            Text(dentist["full_name"] as? String ?? "Unknown Dentist")
                                .font(.headline)
                            Text(dentist["clinic_name"] as? String ?? "Private Clinic")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        
                        if dentist["accept_patient_requests"] as? Bool ?? false {
                            Button("Request") {
                                selectedDentist = dentist
                                showRequestSheet = true
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.blue)
                        } else {
                            Text("Fully Booked")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("Find a Dentist")
        .onAppear(perform: loadDentists)
        .sheet(isPresented: $showRequestSheet) {
            requestSheet
        }
        .alert("Request Status", isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private var requestSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Message to Dentist")) {
                    TextEditor(text: $requestMessage)
                        .frame(height: 100)
                }
                
                Section {
                    Button(action: sendRequest) {
                        Text("Send Consultation Request")
                            .frame(maxWidth: .infinity)
                            .bold()
                    }
                    .disabled(requestMessage.isEmpty)
                }
            }
            .navigationTitle("New Request")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showRequestSheet = false }
                }
            }
        }
    }
    
    private func loadDentists() {
        isLoading = true
        APIService.getAllDentists { result in
            DispatchQueue.main.async {
                isLoading = false
                switch result {
                case .success(let data):
                    self.dentists = data
                case .failure(let error):
                    print("Error loading dentists: \(error)")
                }
            }
        }
    }
    
    private func sendRequest() {
        guard let dID = selectedDentist?["id"] as? Int else { return }
        
        let data: [String: Any] = [
            "patient_id": patientId,
            "dentist_id": dID,
            "message": requestMessage
        ]
        
        APIService.sendConsultationRequest(data: data) { result in
            DispatchQueue.main.async {
                showRequestSheet = false
                switch result {
                case .success(let msg):
                    alertMessage = msg
                case .failure(let error):
                    alertMessage = "Error: \(error.localizedDescription)"
                }
                showAlert = true
            }
        }
    }
}
