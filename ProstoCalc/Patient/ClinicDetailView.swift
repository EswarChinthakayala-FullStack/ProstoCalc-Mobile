import SwiftUI
import MapKit

struct ClinicDetailView: View {
    let clinic: Clinic
    @ObservedObject var viewModel: NearbyClinicsViewModel
    var patientId: Int = 0
    @AppStorage("patient_id") var storedPatientId: Int = 0
    @Environment(\.dismiss) var dismiss
    
    @State private var activeRequestStatus: String? = nil
    @State private var isLoadingStatus = false
    @State private var showRequestSheet = false
    
    private var effectivePatientId: Int {
        if patientId != 0 { return patientId }
        return storedPatientId
    }
    
    var body: some View {
        ZStack {
            // Futuristic Background
            DentalBackgroundView(animate: false)
              
            VStack(spacing: 0) {
                // MARK: - Premium Header
                HStack(spacing: 15) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                    }
                    
                    Spacer()
                    
                    Button(action: { /* Share logic */ }) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                
                ScrollView {
                    VStack(spacing: 25) {
                        // MARK: - Clinical Hero Card
                        VStack(spacing: 20) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [.blue.opacity(0.1), .cyan.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 100, height: 100)
                                
                                Image(systemName: "building.columns.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.blue)
                            }
                            .overlay(Circle().stroke(Color.white, lineWidth: 2))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                            
                            VStack(spacing: 6) {
                                Text(clinic.clinicName.uppercased())
                                    .font(.system(size: 24, weight: .black, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                    .multilineTextAlignment(.center)
                                
                                Text(clinic.dentistName)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.blue)
                                
                                if let spec = clinic.specialization {
                                    Text(spec.uppercased())
                                        .font(.system(size: 10, weight: .black))
                                        .tracking(1.5)
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(.top, 20)
                        
                        // MARK: - Clinical Stats Capsule
                        HStack(spacing: 15) {
                            CompactStatItem(label: "DISTANCE", value: viewModel.distance != nil ? String(format: "%.1f KM", viewModel.distance!) : "-- KM", icon: "location.fill")
                            CompactStatItem(label: "EST. TRAVEL", value: viewModel.travelTime != nil ? String(format: "%d MIN", Int(viewModel.travelTime!)) : "-- MIN", icon: "clock.fill")
                        }
                        .padding(.horizontal, 20)
                        
                        // MARK: - Location & Terminal Info
                        VStack(alignment: .leading, spacing: 20) {
                            ProfileSectionHeader(title: "PRACTICE LOCATION", icon: "mappin.and.ellipse", color: .blue)
                            
                            VStack(alignment: .leading, spacing: 12) {
                                Text(clinic.address + ", " + clinic.city)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundColor(.dentalDarkBlue.opacity(0.8))
                                
                                MapPreviewView(coordinate: clinic.coordinate)
                                    .frame(height: 180)
                                    .cornerRadius(24)
                                    .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white, lineWidth: 2))
                                    .shadow(color: .black.opacity(0.05), radius: 10, y:5)
                            }
                            
                            Button(action: {
                                let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: clinic.coordinate))
                                mapItem.name = clinic.clinicName
                                mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving])
                            }) {
                                HStack {
                                    Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                                    Text("OPEN NAVIGATION INTERFACE")
                                }
                                .font(.system(size: 12, weight: .black))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
                                .cornerRadius(16)
                                .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                            }
                        }
                        .padding(25)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(32)
                        .padding(.horizontal, 20)
                        
                        // MARK: - Communication Terminal
                        if let phone = clinic.phone, !phone.isEmpty {
                            VStack(alignment: .leading, spacing: 15) {
                                ProfileSectionHeader(title: "VOICE TERMINAL", icon: "phone.fill", color: .green)
                                
                                Button(action: {
                                    if let url = URL(string: "tel://\(phone.replacingOccurrences(of: " ", with: ""))") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("ESTABLISH AUDIO LINK")
                                                .font(.system(size: 10, weight: .black))
                                                .foregroundColor(.gray)
                                            Text(phone)
                                                .font(.system(size: 18, weight: .bold))
                                                .foregroundColor(.dentalDarkBlue)
                                        }
                                        Spacer()
                                        Image(systemName: "phone.circle.fill")
                                            .font(.system(size: 40))
                                            .foregroundColor(.green)
                                    }
                                    .padding(20)
                                    .background(Color.white.opacity(0.6))
                                    .cornerRadius(24)
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                        
                        // MARK: - Consultation Terminal
                        VStack(alignment: .leading, spacing: 15) {
                            ProfileSectionHeader(title: "CONSULTATION TERMINAL", icon: "message.and.waveform.fill", color: .blue)
                            
                            Button(action: { showRequestSheet = true }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(activeRequestStatus == nil ? "REQUEST CLINICAL CONSULTATION" : "CONSULTATION \(activeRequestStatus!)")
                                            .font(.system(size: 10, weight: .black))
                                            .foregroundColor(.white.opacity(0.8))
                                        Text(activeRequestStatus == nil ? "Send Profile & Start Chat" : "Request is being processed")
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundColor(.white)
                                    }
                                    Spacer()
                                    if isLoadingStatus {
                                        ProgressView().tint(.white)
                                    } else {
                                        Image(systemName: activeRequestStatus == nil ? "paperplane.circle.fill" : "checkmark.circle.fill")
                                            .font(.system(size: 40))
                                            .foregroundColor(.white)
                                    }
                                }
                                .padding(20)
                                .background(activeRequestStatus == nil ? 
                                    LinearGradient(colors: [.blue, .dentalDarkBlue], startPoint: .leading, endPoint: .trailing) :
                                    LinearGradient(colors: [.gray, .black.opacity(0.6)], startPoint: .leading, endPoint: .trailing))
                                .cornerRadius(24)
                                .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                            }
                            .disabled(activeRequestStatus != nil || isLoadingStatus)
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 50)
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            viewModel.calculateRoute(to: clinic)
            checkStatus()
        }
        .sheet(isPresented: $showRequestSheet, onDismiss: checkStatus) {
            ConsultationRequestSheet(patientId: effectivePatientId, dentistId: clinic.id, dentistName: clinic.dentistName)
        }
    }
    
    private func checkStatus() {
        let pId = effectivePatientId
        guard pId != 0 else { return }
        
        isLoadingStatus = true
        APIService.checkRequestStatus(patientId: pId, dentistId: clinic.id) { result in
            DispatchQueue.main.async {
                self.isLoadingStatus = false
                if case .success(let data) = result, let exists = data["exists"] as? Bool, exists {
                    self.activeRequestStatus = data["request_status"] as? String
                } else {
                    self.activeRequestStatus = nil
                }
            }
        }
    }
}

struct ConsultationRequestSheet: View {
    @Environment(\.dismiss) var dismiss
    @AppStorage("patient_id") var storedPatientId: Int = 0
    var patientId: Int = 0 
    
    let dentistId: Int
    let dentistName: String
    
    @State private var message: String = "I would like to request a consultation regarding my dental record."
    @State private var isSending = false
    @State private var errorMessage: String?
    
    init(patientId: Int = 0, dentistId: Int, dentistName: String) {
        self.patientId = patientId
        self.dentistId = dentistId
        self.dentistName = dentistName
    }
    
    private var effectivePatientId: Int {
        if patientId != 0 { return patientId }
        return storedPatientId
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: false, isDentist: false)
                .ignoresSafeArea()
            
            VStack(spacing: 25) {
                // MARK: - Custom Premium Header
                HStack {
                    Button(action: { dismiss() }) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark.circle.fill")
                            Text("CLOSE")
                        }
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.secondary)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 12)
                        .background(Capsule().fill(Color.gray.opacity(0.1)))
                    }
                    
                    Spacer()
                    
                    Text("CONSULTATION HUB")
                        .font(.system(size: 10, weight: .black))
                        .tracking(2)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    // Balanced placeholder
                    Rectangle()
                        .fill(Color.clear)
                        .frame(width: 60, height: 10)
                }
                .padding(.horizontal)
                .padding(.top, 20)
                
                ScrollView {
                    VStack(spacing: 25) {
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Color.blue.opacity(0.1))
                                    .frame(width: 80, height: 80)
                                Image(systemName: "message.and.waveform.fill")
                                    .font(.system(size: 30))
                                    .foregroundColor(.blue)
                            }
                            
                            Text("Requesting Consultation with \n\(dentistName.lowercased().hasPrefix("dr") ? "" : "Dr. ")\(dentistName)")
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .multilineTextAlignment(.center)
                                .foregroundColor(.dentalDarkBlue)
                        }
                        .padding(.top, 10)
                        
                        VStack(alignment: .leading, spacing: 10) {
                            Text("CONSULTATION MESSAGE")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.5)
                                .foregroundColor(.secondary)
                                .padding(.leading, 5)
                            
                            TextEditor(text: $message)
                                .font(.system(size: 15, weight: .medium))
                                .frame(height: 140)
                                .padding(12)
                                .background(Color.white.opacity(0.8))
                                .cornerRadius(24)
                                .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.blue.opacity(0.1), lineWidth: 1))
                        }
                        .padding(.horizontal)
                        
                        if let error = errorMessage {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                                Text(error)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(.red)
                            }
                            .padding(15)
                            .background(Color.red.opacity(0.05))
                            .cornerRadius(12)
                            .padding(.horizontal)
                        }
                        
                        Button(action: sendRequest) {
                            HStack {
                                if isSending {
                                    ProgressView().tint(.white)
                                } else {
                                    Image(systemName: "paperplane.fill")
                                    Text("ESTABLISH CONNECTION")
                                }
                            }
                            .font(.system(size: 14, weight: .black))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(LinearGradient(colors: [.blue, .dentalDarkBlue], startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(18)
                            .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                        }
                        .disabled(isSending || message.isEmpty)
                        .padding(.horizontal)
                    }
                    .padding(.bottom, 30)
                }
            }
        }
    }
    
    private func sendRequest() {
        let finalId = effectivePatientId
        
        if finalId == 0 {
            errorMessage = "Authentication required. Please log in again."
            return
        }
        
        isSending = true
        errorMessage = nil
        
        APIService.sendConsultationRequest(patientId: finalId, dentistId: dentistId, message: message) { result in
            DispatchQueue.main.async {
                isSending = false
                switch result {
                case .success:
                    dismiss()
                case .failure(let error):
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}

struct MapPreviewView: UIViewRepresentable {
    let coordinate: CLLocationCoordinate2D
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.isUserInteractionEnabled = false
        mapView.setRegion(MKCoordinateRegion(center: coordinate, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)), animated: false)
        
        let annotation = MKPointAnnotation()
        annotation.coordinate = coordinate
        mapView.addAnnotation(annotation)
        
        return mapView
    }
    
    func updateUIView(_ uiView: MKMapView, context: Context) {}
}

struct CompactStatItem: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.blue)
            
            Text(value)
                .font(.system(size: 16, weight: .black, design: .rounded))
                .foregroundColor(.dentalDarkBlue)
            
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.7))
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white, lineWidth: 1))
    }
}
