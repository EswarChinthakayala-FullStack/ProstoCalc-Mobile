import SwiftUI
import MapKit
import CoreLocation

// Unified Radar View with Toggle
struct ClinicRadarView: View {
    @StateObject private var viewModel: NearbyClinicsViewModel
    @State private var selectedTab = 1 // Default to Map/Radar
    var patientData: [String: Any]?
    var patientId: Int = 0
    var isTabRoot: Bool = false
    var onBack: (() -> Void)? = nil
    @Namespace private var animation
    @Environment(\.dismiss) var dismiss
    
    // Consultation Request State
    @State private var selectedClinicForRequest: Clinic?
    
    init(patientId: Int = 0, patientData: [String: Any]? = nil, isTabRoot: Bool = false, onBack: (() -> Void)? = nil) {
        self.patientId = patientId
        self.patientData = patientData
        self.isTabRoot = isTabRoot
        self.onBack = onBack
        _viewModel = StateObject(wrappedValue: NearbyClinicsViewModel(patientData: patientData))
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack(spacing: 15) {
                    if !isTabRoot {
                        Button(action: { onBack?() ?? dismiss() }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.teal)
                                .frame(width: 44, height: 44)
                                .background(Circle().fill(Color.white.opacity(0.8)))
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("CLINICAL RADAR")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(.blue)
                        Text("Nearby Nodes")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                    
                    Button(action: { viewModel.fetchClinics() }) {
                        ZStack {
                            Circle()
                                .fill(Color.white.opacity(0.8))
                                .frame(width: 44, height: 44)
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.teal)
                                .rotationEffect(.degrees(viewModel.isLoading ? 360 : 0))
                                .animation(viewModel.isLoading ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: viewModel.isLoading)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 20)
                
                // THE TOGGLE (User requested this specifically)
                HStack(spacing: 0) {
                    RadarTabButton(title: "Discovery List", icon: "list.bullet.indent", isSelected: selectedTab == 0, namespace: animation) {
                        withAnimation(.spring()) { selectedTab = 0 }
                    }
                    RadarTabButton(title: "Clinical Map", icon: "map.fill", isSelected: selectedTab == 1, namespace: animation) {
                        withAnimation(.spring()) { selectedTab = 1 }
                    }
                }
                .padding(6)
                .background(Capsule().fill(Color.white.opacity(0.5)).background(Capsule().stroke(Color.white.opacity(0.5), lineWidth: 1)))
                .padding(.horizontal, 25)
                .padding(.bottom, 20)
                
                // Content
                ZStack {
                    if selectedTab == 0 {
                        RadarListView(viewModel: viewModel, onConsult: { clinic in
                            selectedClinicForRequest = clinic
                        })
                        .transition(.move(edge: .leading).combined(with: .opacity))
                    } else {
                        RadarMapView(viewModel: viewModel, patientId: patientId)
                            .transition(.move(edge: .trailing).combined(with: .opacity))
                    }
                    
                    if viewModel.isLoading {
                        ProgressView("Scanning Neural Nodes...")
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(.ultraThinMaterial.opacity(0.3))
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear { viewModel.updateWithProfileData(patientData) }
        .fullScreenCover(item: $selectedClinicForRequest) { clinic in
            ConsultationRequestSheet(patientId: patientId, dentistId: clinic.id, dentistName: clinic.dentistName)
        }
    }
}

// Sub-components
struct RadarTabButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    var namespace: Namespace.ID
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 14, weight: .bold))
                if isSelected { Text(title).font(.system(size: 14, weight: .bold, design: .rounded)) }
            }
            .foregroundColor(isSelected ? .white : .dentalDarkBlue.opacity(0.6))
            .padding(.vertical, 12)
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
            .background(ZStack {
                if isSelected {
                    Capsule()
                        .fill(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .shadow(color: .blue.opacity(0.3), radius: 8, y: 4)
                        .matchedGeometryEffect(id: "tab", in: namespace)
                }
            })
        }
    }
}

struct RadarListView: View {
    @ObservedObject var viewModel: NearbyClinicsViewModel
    var onConsult: (Clinic) -> Void
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 18) {
                if viewModel.clinics.isEmpty && !viewModel.isLoading {
                    VStack(spacing: 20) {
                        Image(systemName: "satellite.transmission").font(.largeTitle).foregroundColor(.gray)
                        Text("NO NODES IN RANGE").font(.caption).bold().foregroundColor(.gray)
                    }.padding(.top, 100)
                } else {
                    ForEach(viewModel.clinics) { clinic in
                        RadarDiscoveryCard(clinic: clinic, onConsult: { onConsult(clinic) })
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 30)
        }
    }
}

struct RadarDiscoveryCard: View {
    let clinic: Clinic
    var onConsult: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 16) {
                ZStack {
                    Circle().fill(LinearGradient(colors: [.blue.opacity(0.1), .blue.opacity(0.02)], startPoint: .topLeading, endPoint: .bottomTrailing)).frame(width: 60, height: 60)
                    Image(systemName: "cross.case.fill").foregroundColor(.blue).font(.system(size: 20))
                }
                .overlay(Circle().stroke(Color.white.opacity(0.5), lineWidth: 1))
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(clinic.clinicName.uppercased()).font(.system(size: 15, weight: .black, design: .rounded)).foregroundColor(.dentalDarkBlue)
                    Text("LED by \(clinic.dentistName)").font(.system(size: 12, weight: .bold)).foregroundColor(.gray)
                    HStack(spacing: 10) {
                        Label(clinic.city, systemImage: "mappin").font(.system(size: 10, weight: .black)).foregroundColor(.blue.opacity(0.6))
                        if let dist = clinic.distance {
                            Label(String(format: "%.1f KM", dist), systemImage: "antenna.radiowaves.left.and.right").font(.system(size: 10, weight: .black)).foregroundColor(.blue.opacity(0.6))
                        }
                    }
                }
                Spacer()
                Button(action: onConsult) {
                    Text("CONSULT")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.white)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 16)
                        .background(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
                        .cornerRadius(12)
                }
            }
            .padding(20)
        }
        .background(RoundedRectangle(cornerRadius: 24).fill(Color.white).shadow(color: .black.opacity(0.03), radius: 10, y: 5))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white, lineWidth: 1))
    }
}

struct RadarMapView: View {
    @ObservedObject var viewModel: NearbyClinicsViewModel
    var patientId: Int = 0
    @State private var selectedClinic: Clinic?
    
    var body: some View {
        Map(coordinateRegion: $viewModel.region, showsUserLocation: true, annotationItems: viewModel.clinics) { clinic in
            MapAnnotation(coordinate: clinic.coordinate) {
                Button(action: { selectedClinic = clinic }) {
                    VStack(spacing: 4) {
                        ZStack {
                            Circle().fill(.white).frame(width: 36, height: 36).shadow(radius: 2)
                            Image(systemName: "cross.case.fill").foregroundColor(.blue).font(.system(size: 16))
                        }
                        Text(clinic.clinicName).font(.system(size: 8, weight: .black)).padding(4).background(Color.white).cornerRadius(6).shadow(radius: 1)
                    }
                }
            }
        }
        .cornerRadius(28)
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .ignoresSafeArea(edges: .bottom)
        .fullScreenCover(item: $selectedClinic) { clinic in
            NavigationView { ClinicDetailView(clinic: clinic, viewModel: viewModel, patientId: patientId) }
        }
    }
}
