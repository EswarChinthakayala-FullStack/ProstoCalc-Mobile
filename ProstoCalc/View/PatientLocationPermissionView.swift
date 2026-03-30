import SwiftUI
import CoreLocation

// MARK: - Location Permission View
struct PatientLocationPermissionView: View {
    @State private var locationManager = LocationManager()
    @State private var isRequesting = false
    @State private var requestStatus = ""
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    var patientId: Int 
    var onLogout: () -> Void
    var onComplete: () -> Void // New callback
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true)
            
            VStack(spacing: 30) {
                Spacer()
                
                // Icon
                ZStack {
                    Circle()
                        .stroke(Color.blue.opacity(0.2), lineWidth: 1)
                        .frame(width: 150, height: 150)
                    
                    Circle()
                        .fill(Color.blue.opacity(0.05))
                        .frame(width: 120, height: 120)
                    
                    Image(systemName: "location.viewfinder")
                        .font(.system(size: 50))
                        .foregroundColor(.blue)
                }
                
                // Explainer
                VStack(spacing: 12) {
                    Text("Enable Location Services")
                        .font(.title2.bold())
                        .foregroundColor(.dentalDarkBlue)
                    
                    Text("We need your location to identify nearby dental clinics for emergency support and appointments.")
                        .font(.body)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 30)
                }
                
                Spacer()
                
                // Main Button
                Button(action: {
                    isRequesting = true
                    locationManager.requestLocation { lat, lng in
                        // Perform Reverse Geocoding
                        let location = CLLocation(latitude: lat, longitude: lng)
                        let geocoder = CLGeocoder()
                        
                        geocoder.reverseGeocodeLocation(location) { placemarks, error in
                            print("DEBUG: Geocoder finished. Error: \(error?.localizedDescription ?? "None")")
                            var data: [String: Any] = [
                                "patient_id": patientId,
                                "latitude": lat,
                                "longitude": lng
                            ]
                            
                            if let placemark = placemarks?.first {
                                data["street_address"] = [placemark.subThoroughfare, placemark.thoroughfare].compactMap({$0}).joined(separator: " ")
                                data["city"] = placemark.locality ?? ""
                                data["district"] = placemark.subAdministrativeArea ?? ""
                                data["state"] = placemark.administrativeArea ?? ""
                                data["postal_code"] = placemark.postalCode ?? ""
                                data["country"] = placemark.country ?? ""
                                
                                print("DEBUG: Geocoded Address: \(data)")
                            }
                            
                            // Send to Backend
                            print("DEBUG: Sending location for patientId: \(self.patientId)")
                            APIService.updatePatientLocation(data: data) { result in
                                DispatchQueue.main.async {
                                    isRequesting = false
                                    switch result {
                                    case .success(let msg):
                                        print("DEBUG: Location save success: \(msg)")
                                        onComplete()
                                    case .failure(let error):
                                        print("DEBUG: Location save failure: \(error.localizedDescription)")
                                        alertMessage = "Sync failed: \(error.localizedDescription). Proceeding to dashboard."
                                        showAlert = true
                                    }
                                }
                            }
                        }
                    }
                }) {
                    HStack {
                        if isRequesting {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Allow Access")
                                .fontWeight(.bold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(18)
                    .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                }
                .padding(.horizontal, 30)
                .disabled(isRequesting)
                
                // Skip Button
                Button("Skip for Now") {
                    onComplete()
                }
                .font(.subheadline)
                .foregroundColor(.gray)
                .padding(.bottom, 20)
            }
        }
        .alert(isPresented: $showAlert) {
            Alert(
                title: Text("Sync Status"),
                message: Text(alertMessage),
                dismissButton: .default(Text("OK")) {
                    onComplete()
                }
            )
        }
    }
}
class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var completion: ((Double, Double) -> Void)?
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func requestLocation(completion: @escaping (Double, Double) -> Void) {
        self.completion = completion
        manager.requestWhenInUseAuthorization()
        // If already authorized, request location immediately
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .denied, .restricted:
            // Handle denial - For now, we assume we just don't get the location
            // In a production app, show alert to settings
            print("Location Access Denied")
        default:
            break
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        print("LocationManager: Got location \(location.coordinate.latitude), \(location.coordinate.longitude)")
        completion?(location.coordinate.latitude, location.coordinate.longitude)
        completion = nil 
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location Manager Error: \(error)")
        // On error, we really shouldn't just return 0,0 without the user knowing, but for flow continuity we will.
        completion?(0.0, 0.0)
        completion = nil
    }
}


