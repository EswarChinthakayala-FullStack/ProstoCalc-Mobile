import Foundation
import CoreLocation
import MapKit
import Combine

class NearbyClinicsViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var clinics: [Clinic] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var userLocation: CLLocation?
    
    // Map related
    @Published var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 0, longitude: 0),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )
    
    // For route calculation
    @Published var selectedClinic: Clinic?
    @Published var route: MKRoute?
    @Published var travelTime: Double? // in minutes
    @Published var distance: Double? // in km
    
    private let locationManager = CLLocationManager()
    private var hasSetInitialRegion = false
    private var patientData: [String: Any]?
    
    init(patientData: [String: Any]? = nil) {
        self.patientData = patientData
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        
        // Use robust parsing for coordinates
        let latStr = String(describing: patientData?["latitude"] ?? "")
        let lngStr = String(describing: patientData?["longitude"] ?? "")
        
        if let lat = Double(latStr), let lng = Double(lngStr), lat != 0, lng != 0 {
            let loc = CLLocation(latitude: lat, longitude: lng)
            self.userLocation = loc
            self.region = MKCoordinateRegion(
                center: loc.coordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
            )
            self.hasSetInitialRegion = true // Lock to profile location
            self.fetchClinics()
        }
        
        if CLLocationManager.locationServicesEnabled() {
            let status = locationManager.authorizationStatus
            if status == .notDetermined {
                locationManager.requestWhenInUseAuthorization()
            } else if status == .authorizedWhenInUse || status == .authorizedAlways {
                // We start updating to show the blue dot on map, 
                // but didUpdateLocations won't override search center if locked
                locationManager.startUpdatingLocation()
            }
        }
    }
    
    func updateWithProfileData(_ data: [String: Any]?) {
        self.patientData = data
        
        // Use robust parsing for coordinates (String, Double, or Int)
        let latStr = String(describing: data?["latitude"] ?? "")
        let lngStr = String(describing: data?["longitude"] ?? "")
        
        if let lat = Double(latStr), let lng = Double(lngStr), lat != 0, lng != 0 {
            let newLoc = CLLocation(latitude: lat, longitude: lng)
            
            if userLocation == nil || userLocation!.distance(from: newLoc) > 100 { 
                print("DEBUG: Updating user location from profile sync: \(lat), \(lng)")
                self.userLocation = newLoc
                self.region.center = newLoc.coordinate
                self.fetchClinics()
            } else {
                self.fetchClinics()
            }
        }
    }
    
    func fetchClinics() {
        guard let location = userLocation else { return }
        
        isLoading = true
        errorMessage = nil
        
        APIService.getNearbyClinics(lat: location.coordinate.latitude, lng: location.coordinate.longitude) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(var fetchedClinics):
                    // Calculate basic distance for list view
                    for i in 0..<fetchedClinics.count {
                        let clinicLoc = CLLocation(latitude: fetchedClinics[i].latitude, longitude: fetchedClinics[i].longitude)
                        fetchedClinics[i].distance = location.distance(from: clinicLoc) / 1000.0 // km
                    }
                    self?.clinics = fetchedClinics
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func calculateRoute(to clinic: Clinic) {
        guard let userLoc = userLocation else { return }
        
        selectedClinic = clinic
        
        let request = MKDirections.Request()
        request.source = MKMapItem(placemark: MKPlacemark(coordinate: userLoc.coordinate))
        request.destination = MKMapItem(placemark: MKPlacemark(coordinate: clinic.coordinate))
        request.transportType = .automobile
        
        let directions = MKDirections(request: request)
        directions.calculate { [weak self] response, error in
            DispatchQueue.main.async {
                if let route = response?.routes.first {
                    self?.route = route
                    self?.travelTime = route.expectedTravelTime / 60.0 // minutes
                    self?.distance = route.distance / 1000.0 // km
                    
                    // Update the clinic in our list with the precise distance/time
                    if let index = self?.clinics.firstIndex(where: { $0.id == clinic.id }) {
                        self?.clinics[index].travelTime = self?.travelTime
                        self?.clinics[index].distance = self?.distance
                    }
                }
            }
        }
    }
    
    // CLLocationManagerDelegate
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        // If we haven't locked to a profile location yet, use GPS
        if !hasSetInitialRegion {
            print("DEBUG: No profile location found. Using GPS for clinical search.")
            userLocation = location
            region = MKCoordinateRegion(
                center: location.coordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            )
            hasSetInitialRegion = true
            fetchClinics()
        }
        // If we are already locked to profile, we don't update userLocation 
        // to keep search results pinned to the saved address.
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status == .authorizedWhenInUse || status == .authorizedAlways {
            locationManager.startUpdatingLocation()
        } else if status == .denied || status == .restricted {
            // Only show message if we don't have profile data as fallback
            if userLocation == nil {
                self.errorMessage = "Location services are restricted. Please verify permissions in System Settings to discover nearby clinical nodes."
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location Manager Error: \(error.localizedDescription)")
    }
}
