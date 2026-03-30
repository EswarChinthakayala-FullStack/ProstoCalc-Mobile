import SwiftUI
import MapKit
import Combine

struct PatientUpdateProfileView: View {
    @Environment(\.dismiss) var dismiss
    let patientData: [String: Any]
    var onUpdate: () -> Void
    
    @StateObject private var mapSearch = MapSearch()
    @State private var region: MKCoordinateRegion
    @State private var selectedCoordinate: CLLocationCoordinate2D
    @State private var searchText = ""
    @State private var isUpdating = false
    @State private var errorMessage: String?
    
    // Demographic Fields
    @State private var age: String
    @State private var gender: String
    @State private var medicalHistory: String
    
    // Address Components
    @State private var streetAddress = ""
    @State private var city = ""
    @State private var district = ""
    @State private var state = ""
    @State private var postalCode = ""
    @State private var country = ""
    
    let genders = ["Male", "Female", "Other", "Prefer not to say"]
    
    init(patientData: [String: Any], onUpdate: @escaping () -> Void) {
        self.patientData = patientData
        self.onUpdate = onUpdate
        
        let lat = Double(String(describing: patientData["latitude"] ?? "0")) ?? 0.0
        let lng = Double(String(describing: patientData["longitude"] ?? "0")) ?? 0.0
        let initialCoord = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        
        _selectedCoordinate = State(initialValue: initialCoord)
        _region = State(initialValue: MKCoordinateRegion(
            center: initialCoord,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        ))
        
        _age = State(initialValue: String(describing: patientData["age"] ?? ""))
        _gender = State(initialValue: patientData["gender"] as? String ?? "Select Gender")
        _medicalHistory = State(initialValue: patientData["medical_history"] as? String ?? "")
        
        _streetAddress = State(initialValue: patientData["street_address"] as? String ?? "")
        _city = State(initialValue: patientData["city"] as? String ?? "")
        _district = State(initialValue: patientData["district"] as? String ?? "")
        _state = State(initialValue: patientData["state"] as? String ?? "")
        _postalCode = State(initialValue: patientData["postal_code"] as? String ?? "")
        _country = State(initialValue: patientData["country"] as? String ?? "")
    }
    
    var body: some View {
        ZStack {
            // Standard App Background
            DentalBackgroundView(animate: true)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // MARK: - Header
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.dentalDarkBlue)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.8)))
                    }
                    
                    Spacer()
                    
                    Text("PROFILE SYNC")
                        .font(.system(size: 16, weight: .black))
                        .tracking(2)
                        .foregroundColor(.blue)
                    
                    Spacer()
                    
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                
                ScrollView {
                    VStack(spacing: 25) {
                        // MARK: - Demographic Section
                        VStack(alignment: .leading, spacing: 20) {
                            ProfileSectionHeader(title: "DEMOGRAPHIC DATA", icon: "person.text.rectangle.fill")
                            
                            DentalInputView(text: $age, icon: "calendar", placeholder: "Clinical Age", isSecure: false, keyboardType: .numberPad)
                            
                            genderMenu
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("MEDICAL RECORD NOTES")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.gray.opacity(0.6))
                                
                                TextEditor(text: $medicalHistory)
                                    .frame(height: 100)
                                    .padding(12)
                                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.6)))
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.blue.opacity(0.1), lineWidth: 1))
                            }
                        }
                        .padding(25)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(32)
                        .padding(.horizontal, 20)
                        
                        // MARK: - Search Terminal
                        VStack(spacing: 15) {
                            ProfileSectionHeader(title: "LOCATION SEARCH", icon: "magnifyingglass")
                            
                            HStack {
                                TextField("Find Clinical Node...", text: $searchText)
                                    .foregroundColor(.dentalDarkBlue)
                                    .onChange(of: searchText) { newValue in
                                        mapSearch.searchTerm = newValue
                                    }
                                
                                if !searchText.isEmpty {
                                    Button(action: { searchText = "" }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                            .padding(16)
                            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.8)))
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.blue.opacity(0.1), lineWidth: 1))
                            
                            if !mapSearch.results.isEmpty && !searchText.isEmpty {
                                VStack(spacing: 0) {
                                    ForEach(mapSearch.results, id: \.self) { result in
                                        Button(action: { selectLocation(result) }) {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(result.title).font(.system(size: 14, weight: .bold)).foregroundColor(.dentalDarkBlue)
                                                Text(result.subtitle).font(.system(size: 11)).foregroundColor(.gray)
                                            }
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .padding(.vertical, 12)
                                            .padding(.horizontal, 16)
                                        }
                                        Divider().padding(.horizontal, 16)
                                    }
                                }
                                .background(Color.white.opacity(0.9))
                                .cornerRadius(16)
                                .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                            }
                        }
                        .padding(.horizontal, 20)
                        
                        // MARK: - Map Component
                        ZStack {
                            Map(coordinateRegion: $region, annotationItems: [MapLocationPin(coordinate: selectedCoordinate)]) { pin in
                                MapAnnotation(coordinate: pin.coordinate) {
                                    Image(systemName: "mappin.circle.fill")
                                        .font(.system(size: 30))
                                        .foregroundColor(.blue)
                                        .background(Circle().fill(.white))
                                }
                            }
                            .frame(height: 200)
                            .cornerRadius(24)
                            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white, lineWidth: 2))
                            
                            Image(systemName: "plus")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.blue.opacity(0.3))
                        }
                        .padding(.horizontal, 20)
                        
                        // MARK: - Commit Action
                        Button(action: updateFullProfile) {
                            HStack {
                                if isUpdating {
                                    ProgressView().tint(.white).padding(.trailing, 10)
                                }
                                Text("SYNCHRONIZE ALL DATA")
                            }
                            .font(.system(size: 14, weight: .black))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(20)
                            .shadow(color: .blue.opacity(0.3), radius: 15, y: 5)
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 50)
                    }
                    .padding(.top, 10)
                }
            }
            
            if let error = errorMessage {
                VStack {
                    Spacer()
                    Text(error)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.red.opacity(0.8))
                        .cornerRadius(12)
                        .padding(.bottom, 120)
                }
            }
        }
        .navigationBarHidden(true)
        .onChange(of: region.center.latitude) { _ in
            selectedCoordinate = region.center
            reverseGeocode(region.center)
        }
    }
    
    private var genderMenu: some View {
        Menu {
            ForEach(genders, id: \.self) { g in
                Button(g) { gender = g }
            }
        } label: {
            HStack {
                Image(systemName: "person.and.arrow.left.and.arrow.right")
                    .foregroundColor(.blue.opacity(0.7))
                    .frame(width: 24)
                Text(gender)
                    .foregroundColor(gender == "Select Gender" ? .gray : .dentalDarkBlue)
                    .font(.system(size: 15, weight: .bold))
                Spacer()
                Image(systemName: "chevron.down").font(.system(size: 12)).foregroundColor(.gray)
            }
            .padding()
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.8)))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.blue.opacity(0.1), lineWidth: 1))
        }
    }
    
    private func selectLocation(_ result: MKLocalSearchCompletion) {
        let searchRequest = MKLocalSearch.Request(completion: result)
        let search = MKLocalSearch(request: searchRequest)
        search.start { response, error in
            guard let placemark = response?.mapItems.first?.placemark else { return }
            let coordinate = placemark.coordinate
            
            withAnimation(.spring()) {
                selectedCoordinate = coordinate
                region = MKCoordinateRegion(center: coordinate, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
                searchText = ""
                mapSearch.results = []
                
                // Update address components from search result
                updateAddress(from: placemark)
            }
        }
    }
    
    private func reverseGeocode(_ coordinate: CLLocationCoordinate2D) {
        let geocoder = CLGeocoder()
        let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        geocoder.reverseGeocodeLocation(location) { placemarks, error in
            if let placemark = placemarks?.first {
                updateAddress(from: MKPlacemark(placemark: placemark))
            }
        }
    }
    
    private func updateAddress(from placemark: CLPlacemark) {
        self.streetAddress = [placemark.subThoroughfare, placemark.thoroughfare].compactMap { $0 }.joined(separator: " ")
        self.city = placemark.locality ?? ""
        self.district = placemark.subLocality ?? ""
        self.state = placemark.administrativeArea ?? ""
        self.postalCode = placemark.postalCode ?? ""
        self.country = placemark.country ?? ""
    }
    
    private func updateFullProfile() {
        isUpdating = true
        errorMessage = nil
        
        let idStr = String(describing: patientData["id"] ?? "")
        guard let id = Int(idStr) else {
            errorMessage = "Invalid Identity Token: \(idStr)"
            isUpdating = false
            return
        }
        
        let data: [String: Any] = [
            "patient_id": id,
            "age": Int(age) ?? 0,
            "gender": gender,
            "medical_history": medicalHistory,
            "latitude": selectedCoordinate.latitude,
            "longitude": selectedCoordinate.longitude,
            "street_address": streetAddress,
            "city": city,
            "district": district,
            "state": state,
            "postal_code": postalCode,
            "country": country
        ]
        
        APIService.savePatientFullProfile(data: data) { result in
            DispatchQueue.main.async {
                isUpdating = false
                switch result {
                case .success:
                    onUpdate()
                    dismiss()
                case .failure(let error):
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}

class MapSearch: NSObject, ObservableObject, MKLocalSearchCompleterDelegate {
    @Published var searchTerm = ""
    @Published var results: [MKLocalSearchCompletion] = []
    
    private var completer = MKLocalSearchCompleter()
    private var cancellable: AnyCancellable?
    
    override init() {
        super.init()
        completer.delegate = self
        completer.resultTypes = .address
        
        cancellable = $searchTerm
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] term in
                self?.completer.queryFragment = term
            }
    }
    
    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        self.results = completer.results
    }
}

