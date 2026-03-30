import SwiftUI
import CoreLocation

struct NominatimResult: Codable, Identifiable {
    let id = UUID()
    let display_name: String
    let lat: String
    let lon: String
    
    enum CodingKeys: String, CodingKey {
        case display_name, lat, lon
    }
}

struct ClinicSetupView: View {
    @Environment(\.dismiss) var dismiss
    var dentistId: Int
    var onComplete: () -> Void
    
    @State private var clinicName: String = ""
    @State private var clinicPhone: String = ""
    @State private var clinicAddress: String = ""
    @State private var clinicCity: String = ""
    @State private var isLoadingLocation = false
    @State private var isSaving = false
    @State private var latitude: Double = 0.0
    @State private var longitude: Double = 0.0
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    // Tab Navigation Support
    var isTabRoot: Bool = false
    var onBack: (() -> Void)? = nil
    
    // Search properties
    @State private var searchQuery: String = ""
    @State private var searchResults: [NominatimResult] = []
    @State private var isSearching = false
    
    let locationManager = CLLocationManager()
    
    var body: some View {
        ZStack {
            
            // Background
            DentalBackgroundView(animate: true, isDentist: true)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                // MARK: Fixed Header
                HStack {
                    Button(action: {
                        if let onBack = onBack {
                            onBack()
                        } else {
                            dismiss()
                        }
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color(hex: "2DD4BF"))
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white))
                            .shadow(color: .black.opacity(0.1), radius: 5, y: 2)
                    }
                    
                    Spacer()
                    
                    Text("Clinical Registry")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(Color(white: 0.2))
                    
                    Spacer()
                    
                    // symmetry spacer
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.clear)   // transparent header
                
                
                // MARK: Scroll Content
                ScrollView {
                    mainContent
                        .padding(.top, 10)
                }
            }
        }
        .navigationBarHidden(true)
        
        .alert(isPresented: $showAlert) {
            Alert(
                title: Text("Registry Status"),
                message: Text(alertMessage),
                dismissButton: .default(Text("OK"), action: {
                    if alertMessage.contains("Success") {
                        onComplete()
                    }
                })
            )
        }
    }

    private var mainContent: some View {
        VStack(spacing: 35) {
            headerSection
            registrationCard
            actionSection
        }
    }

    private var headerSection: some View {
        VStack(spacing: 16) {
         
            
            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: 90, height: 90)
                    .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                
                Image("AppLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 60, height: 60)
            }
            
            VStack(spacing: 8) {
                Text("Initialize Practice")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.dentalDarkBlue)
                
                Text("Complete your professional profile")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
                    .tracking(0.5)
            }
        }
        .padding(.top, 0)
    }

    private var registrationCard: some View {
        VStack(spacing: 25) {
            VStack(alignment: .leading, spacing: 15) {
                SectionHeader(title: "PRACTICE IDENTITY", icon: "person.text.rectangle.fill")
                DentalInputView(text: $clinicName, icon: "building.columns.fill", placeholder: "Official Clinic Name", isSecure: false)
                DentalInputView(text: $clinicPhone, icon: "phone.fill", placeholder: "Professional Contact No", isSecure: false, keyboardType: .phonePad)
            }
            
            Divider().padding(.vertical, 5)
            
            VStack(alignment: .leading, spacing: 15) {
                SectionHeader(title: "GEOSPATIAL LOCATION", icon: "mappin.and.ellipse")
                
                HStack(spacing: 12) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray.opacity(0.6))
                        TextField("Search address or hospital...", text: $searchQuery)
                            .font(.system(size: 15))
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.8))
                    .cornerRadius(14)
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.teal.opacity(0.2), lineWidth: 1))
                    
                    Button(action: searchAddress) {
                        if isSearching {
                            ProgressView().tint(.teal).frame(width: 48, height: 48)
                        } else {
                            Image(systemName: "arrow.right.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.teal)
                                .frame(width: 48, height: 48)
                        }
                    }
                    .disabled(isSearching || searchQuery.isEmpty)
                }
                
                if !searchResults.isEmpty {
                    searchResultsList
                }
            }
            
            VStack(alignment: .leading, spacing: 15) {
                SectionHeader(title: "SITE VERIFICATION", icon: "checkmark.seal.fill")
                DentalInputView(text: $clinicCity, icon: "building.2.fill", placeholder: "City / District", isSecure: false)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("FULL REGISTERED ADDRESS")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.gray.opacity(0.5))
                        .padding(.leading, 12)
                
                    TextEditor(text: $clinicAddress)
                        .font(.system(size: 14))
                        .frame(height: 90)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.6)))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.teal.opacity(0.2), lineWidth: 1))
                }
                
                gpsButton
            }
        }
        .padding(30)
        .background(
            HStack(spacing: 0) {
                Color(hex: "2DD4BF")
                    .frame(width: 4)
                Color.white.opacity(0.8)
            }
        )
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.black.opacity(0.05), lineWidth: 1))
        .padding(.horizontal, 20)
    }

    private var searchResultsList: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 8) {
                ForEach(searchResults) { result in
                    Button(action: { selectResult(result) }) {
                        HStack(spacing: 12) {
                            Image(systemName: "location.north.circle.fill").foregroundColor(.teal)
                            Text(result.display_name)
                                .font(.system(size: 13))
                                .multilineTextAlignment(.leading)
                                .foregroundColor(.dentalDarkBlue)
                            Spacer()
                        }
                        .padding(14)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(12)
                    }
                }
            }
        }
        .frame(maxHeight: 200)
        .padding(8)
        .background(Color.teal.opacity(0.05))
        .cornerRadius(16)
    }

    private var gpsButton: some View {
        Button(action: requestLocation) {
            HStack {
                if isLoadingLocation {
                    ProgressView().tint(.teal)
                } else {
                    Image(systemName: "location.viewfinder").font(.system(size: 20))
                    Text(latitude == 0 ? "Identify via GPS" : "GPS Lock: \(String(format: "%.4f", latitude)), \(String(format: "%.4f", longitude))")
                        .font(.system(size: 15, weight: .bold))
                }
            }
            .foregroundColor(.teal)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(Color.teal.opacity(0.1))
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.teal.opacity(0.3), lineWidth: 1))
        }
    }

    private var actionSection: some View {
        VStack(spacing: 15) {
            Button(action: saveClinicDetails) {
                if isSaving {
                    ProgressView().tint(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 60)
                        .background(Color.dentalDarkBlue)
                        .cornerRadius(18)
                } else {
                    Text("Finalize Registration")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 60)
                        .background(LinearGradient(colors: [.teal, .dentalDarkBlue], startPoint: .leading, endPoint: .trailing))
                        .cornerRadius(18)
                        .shadow(color: .teal.opacity(0.4), radius: 20, y: 10)
                }
            }
            .disabled(isSaving || clinicName.isEmpty || latitude == 0)
            
            Text("Protocol: Clinical-Core-v2 | 256-bit Encrypted")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.gray.opacity(0.4))
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 50)
    }
}

struct SectionHeader: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.teal)
            Text(title)
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.gray.opacity(0.7))
                .tracking(1.5)
        }
        .padding(.leading, 8)
    }
}

extension ClinicSetupView {
    private func searchAddress() {
        guard !searchQuery.isEmpty else { return }
        isSearching = true
        searchResults = []
        
        let urlString = "https://nominatim.openstreetmap.org/search?format=json&q=\(searchQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")&limit=5"
        
        guard let url = URL(string: urlString) else {
            isSearching = false
            return
        }
        
        var request = URLRequest(url: url)
        request.setValue("ProstoCalc/1.0", forHTTPHeaderField: "User-Agent")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isSearching = false
                if let data = data {
                    do {
                        let decoder = JSONDecoder()
                        self.searchResults = try decoder.decode([NominatimResult].self, from: data)
                    } catch {
                        print("Search error: \(error)")
                    }
                }
            }
        }.resume()
    }
    
    private func selectResult(_ result: NominatimResult) {
        self.latitude = Double(result.lat) ?? 0.0
        self.longitude = Double(result.lon) ?? 0.0
        self.clinicAddress = result.display_name
        self.searchResults = []
        self.searchQuery = ""
        
        // Try to extract city from display_name if possible (simplistic)
        let parts = result.display_name.split(separator: ",")
        if parts.count > 1 {
            self.clinicCity = String(parts[1]).trimmingCharacters(in: .whitespaces)
        }
    }
    
    private func requestLocation() {
        isLoadingLocation = true
        let coordinator = LocationManagerCoordinator { lat, lon in
            self.latitude = lat
            self.longitude = lon
            self.isLoadingLocation = false
            
            // Reverse geocode if we have coordinates
            let geocoder = CLGeocoder()
            geocoder.reverseGeocodeLocation(CLLocation(latitude: lat, longitude: lon)) { placemarks, error in
                if let placemark = placemarks?.first {
                    self.clinicCity = placemark.locality ?? ""
                    self.clinicAddress = [placemark.subThoroughfare, placemark.thoroughfare, placemark.locality, placemark.administrativeArea].compactMap { $0 }.joined(separator: ", ")
                }
            }
        }
        
        locationManager.delegate = coordinator
        locationManager.requestWhenInUseAuthorization()
        locationManager.requestLocation()
        
        objc_setAssociatedObject(locationManager, "coordinator", coordinator, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
    
    private func saveClinicDetails() {
        isSaving = true
        let data: [String: Any] = [
            "dentist_id": dentistId,
            "clinic_name": clinicName,
            "latitude": latitude,
            "longitude": longitude,
            "clinic_address": clinicAddress,
            "clinic_city": clinicCity,
            "clinic_phone": clinicPhone
        ]
        
        APIService.updateClinicDetails(data: data) { result in
            DispatchQueue.main.async {
                isSaving = false
                switch result {
                case .success(let msg):
                    alertMessage = "Successfully updated: \(msg)"
                    showAlert = true
                case .failure(let error):
                    alertMessage = "Update failed: \(error.localizedDescription)"
                    showAlert = true
                }
            }
        }
    }
}

class LocationManagerCoordinator: NSObject, CLLocationManagerDelegate {
    var completion: ((Double, Double) -> Void)?
    
    init(completion: @escaping (Double, Double) -> Void) {
        self.completion = completion
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let loc = locations.last {
            completion?(loc.coordinate.latitude, loc.coordinate.longitude)
            completion = nil
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location Error: \(error)")
        completion?(0, 0)
        completion = nil
    }
}

#Preview {
    ClinicSetupView(dentistId: 1, onComplete: {})
}
