import SwiftUI

struct BriefDetailPage: View {
    @Environment(\.dismiss) var dismiss
    var profileData: [String: Any]
    var isDentist: Bool
    var isTabRoot: Bool = false
    var onUpdate: () -> Void
    var onLogout: () -> Void
    var onBack: (() -> Void)? = nil
    @ObservedObject var exerciseService = ExerciseService.shared
    
    @State private var selectedTab = 0
    
    init(profileData: [String: Any], isDentist: Bool, isTabRoot: Bool = false, onBack: (() -> Void)? = nil, onLogout: @escaping () -> Void, onUpdate: @escaping () -> Void) {
        self.profileData = profileData
        self.isDentist = isDentist
        self.isTabRoot = isTabRoot
        self.onBack = onBack
        self.onLogout = onLogout
        self.onUpdate = onUpdate
    }
    
    var body: some View {
            ZStack {
                DentalBackgroundView(animate: true, isDentist: isDentist)
                
                VStack(spacing: 0) {
                    // Custom Header
                    HStack {
                     
                        
                        Spacer()
                        
                        Text("Clinical Hub")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                        
                        Spacer()
                        
                        // Placeholder for symmetry
                        Color.clear.frame(width: 44, height: 44)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    
                    ScrollView {
                        VStack(spacing: 25) {
                            // Profile Brief Card
                            NavigationLink(destination: ProfileDetailView(data: profileData, isDentist: isDentist, onLogout: onLogout, onUpdate: onUpdate)) {
                                HubCard(
                                    title: "Professional Profile",
                                    icon: "person.text.rectangle.fill",
                                    isDentist: isDentist
                                )
                            }
                            
                            // Recovery evolution history (Patient only)
                            if !isDentist {
                                NavigationLink(destination: AnalysisHistoryView(history: ExerciseService.shared.aiHistory)) {
                                    HubCard(
                                        title: "Recovery Evolution",
                                        icon: "chart.line.uptrend.xyaxis",
                                        isDentist: isDentist
                                    )
                                }
                            }
                            
                            // Clinic Registry Card (for Dentists)
                            if isDentist {
                                NavigationLink(destination: ClinicSetupView(dentistId: profileData["id"] as? Int ?? 1, onComplete: { onUpdate() })) {
                                    HubCard(
                                        title: "Clinic Registry & Location",
                                        icon: "building.2.fill",
                                        isDentist: isDentist
                                    )
                                }
                            }
                            
                            // Tooth Theory Card
                            NavigationLink(destination: ToothTheoryView(isDentist: isDentist)) {
                                HubCard(
                                    title: "Clinical Theory",
                                    icon: "book.closed.fill",
                                    isDentist: isDentist
                                )
                            }
                            
                            // 32 Teeth Catalog Card
                            NavigationLink(destination: TeethCatalogView()) {
                                HubCard(
                                    title: "32 Teeth Catalog",
                                    icon: "square.grid.3x3.fill",
                                    isDentist: isDentist
                                )
                            }
                            
                            // AI Insight Logs
                            if isDentist {
                                NavigationLink(destination: AILogHistoryView(dentistId: profileData["id"] as? Int ?? 1)) {
                                    HubCard(
                                        title: "AI Clinical Logs",
                                        icon: "brain.head.profile",
                                        isDentist: isDentist
                                    )
                                }
                            }
                            
                            // Clinical Note Section
                            VStack(alignment: .leading, spacing: 14) {
                                HStack(spacing: 8) {
                                    Image(systemName: "info.circle.fill")
                                        .font(.system(size: 14, weight: .bold))
                                    Text("CLINICAL ADVISORY")
                                        .font(.system(size: 11, weight: .black))
                                        .tracking(1.2)
                                }
                                .foregroundColor(isDentist ? Color.dentalCyan : Color.blue)
                                
                                Text(ToothStore.shared.dentition.dentition_metadata.clinical_note)
                                    .font(.system(size: 15, weight: .medium, design: .serif))
                                    .foregroundColor(.dentalDarkBlue.opacity(0.8))
                                    .lineSpacing(5)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(25)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 24)
                                    .fill(Color.white.opacity(0.9))
                                    .shadow(color: (isDentist ? Color.dentalCyan : Color.blue).opacity(0.03), radius: 20, x: 0, y: 10)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 24)
                                    .stroke(LinearGradient(colors: [(isDentist ? Color.dentalCyan : Color.blue).opacity(0.1), .clear], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.5)
                            )
                            .padding(.horizontal, 20)
                        }
                        .padding(.top, 20)
                        .padding(.bottom, 50)
                    }
                }
            }
            .navigationBarHidden(true)
        .onAppear {
            if !isDentist, let pid = profileData["id"] as? Int {
                Task {
                    await ExerciseService.shared.fetchAIHistory(userId: pid)
                }
            }
        }
    }
}

struct HubCard: View {
    let title: String
    let icon: String
    var isDentist: Bool = false
    
    private var primaryColor: Color {
        isDentist ? .dentalCyan : .blue
    }
    
    var body: some View {
        HStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [primaryColor.opacity(0.12), primaryColor.opacity(0.04)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 52, height: 52)
                
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(primaryColor)
            }
            
            Text(title)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundColor(.dentalDarkBlue)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(primaryColor.opacity(0.3))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.white.opacity(0.95))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white, lineWidth: 1.5)
        )
        .padding(.horizontal, 20)
    }
}

// MARK: - Placeholder Subviews (To be implemented)

struct ProfileDetailView: View {
    var data: [String: Any]
    var isDentist: Bool
    var onLogout: () -> Void
    var onUpdate: () -> Void
    
    var body: some View {
        if isDentist {
            DentistProfileView(dentistData: data, onLogout: onLogout)
                .navigationBarHidden(true)
        } else {
            PatientProfileView(patientData: data, onLogout: onLogout, onUpdate: onUpdate)
                .navigationBarHidden(true)
        }
    }
}

struct ToothTheoryView: View {
    @Environment(\.dismiss) var dismiss
    let meta = ToothStore.shared.dentition.dentition_metadata
    var isDentist: Bool = false
    
    var body: some View {
        ZStack(alignment: .top) {
            // 1. Background Grid Pattern
            DentalBackgroundView(animate: true, isDentist: isDentist)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // 2. Fixed Professional Header
                customHeader
                
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 24) {
                        
                        // Main Title Section (Matches AI Insights History style)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("AI CLINICAL THEORY")
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                .kerning(1.2)
                                .foregroundColor(.teal)
                            
                            Text("Theory of Dentition")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(Color(red: 0.1, green: 0.1, blue: 0.2))
                        }
                        .padding(.top, 10)
                        
                        // 3. Stat Cards Row (Horizontal scroll or Grid)
                        VStack(spacing: 16) {
                            TheoryCard(title: "DENTITION TYPE", value: meta.type, icon: "sparkles", isDentist: isDentist)
                            TheoryCard(title: "TOTAL TEETH COUNT", value: "\(meta.total_teeth) Permanent", icon: "number", isDentist: isDentist)
                            TheoryCard(title: "NUMBERING SYSTEM", value: meta.system, icon: "list.number", isDentist: isDentist)
                        }
                        
                        // 4. Clinical Protocol Section (Record Card Style)
                        clinicalProtocolCard
                    }
                    .padding(25)
                }
            }
        }
        .navigationBarHidden(true)
    }

    // MARK: - Subviews

    private var customHeader: some View {
        HStack {
            BackButton{
                dismiss()
            }
            
            Spacer()
            
            Text("Clinical Theory")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Spacer()
            
            Color.clear.frame(width: 40, height: 40)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    private var clinicalProtocolCard: some View {
        HStack(spacing: 0) {
            // Vertical Accent Bar
            Rectangle()
                .fill(Color.teal)
                .frame(width: 4)
            
            VStack(alignment: .leading, spacing: 15) {
                HStack {
                    Text("GENERAL CARE PROTOCOL")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .kerning(1.2)
                        .foregroundColor(.teal)
                    Spacer()
                    Image(systemName: "shield.checkerboard")
                        .foregroundColor(.teal.opacity(0.5))
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    protocolRow(num: "1", title: "Mechanical Debridement", desc: "Twice daily brushing with fluoride paste.")
                    protocolRow(num: "2", title: "Chemical Control", desc: "pH neutral mouthwash.")
                    protocolRow(num: "3", title: "Nutritional Balance", desc: "High calcium, low refined glucose.")
                }
            }
            .padding(20)
        }
        .background(Color.white)
        .cornerRadius(18)
        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
    }

    private func protocolRow(num: String, title: String, desc: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(num)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 22, height: 22)
                .background(Circle().fill(Color.teal.opacity(0.8)))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                Text(desc)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct TheoryCard: View {
    let title: String
    let value: String
    let icon: String
    var isDentist: Bool = false
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .foregroundColor(isDentist ? .dentalCyan : .blue)
                .font(.system(size: 20))
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(.gray)
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.dentalDarkBlue)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.5))
        .cornerRadius(18)
    }
}

struct TeethCatalogView: View {
    @Environment(\.dismiss) var dismiss
    @State private var selectedTooth: Tooth? = nil
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true)
                .ignoresSafeArea()
            
            VStack {
                // Header info
                VStack(spacing: 8) {
                    Text("Interactive Odontogram")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    Text("Select a tooth to view clinical details")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)
                
                Spacer()
                
                // The actual Odontogram
                ToothOdontogramView(selectedTooth: $selectedTooth)
                    .scaleEffect(1.1)
                
                Spacer()
                
                // Quick Hint
                HStack(spacing: 12) {
                    Image(systemName: "hand.tap.fill")
                        .foregroundColor(Color(hex: "2DD4BF"))
                    Text("Pinch to zoom or tap on any tooth")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 30)
            }
        }
        .navigationTitle("Interactive Odontogram")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.teal)
                }
            }
        }
        // Changed to fullScreenCover to utilize the entire screen smoothly
        .fullScreenCover(item: $selectedTooth) { tooth in
            ToothDetailSheet(tooth: tooth)
        }
    }
}

struct ToothDetailSheet: View {
    let tooth: Tooth
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ZStack {
            // Background
            DentalBackgroundView(animate: true)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                // MARK: - Custom Header
                HStack {
                    Button(action: {
                        dismiss()
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.teal)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.9)))
                            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 3)
                    }
                    
                    Spacer()
                    
                    Text("Tooth Detail")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    
                    Spacer()
                    
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                
                // MARK: - Scroll Content
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 25) {
                        
                        // MARK: - Premium Tooth Header
                        HStack(spacing: 20) {
                            
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color(hex: "2F80ED"), Color(hex: "2DD4BF")],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 90, height: 90)
                                    .shadow(color: Color(hex: "2F80ED").opacity(0.3), radius: 15, x: 0, y: 8)
                                
                                Text("\(tooth.id)")
                                    .font(.system(size: 34, weight: .black, design: .rounded))
                                    .foregroundColor(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text(tooth.name)
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                                    .fixedSize(horizontal: false, vertical: true)
                                
                                Text(tooth.type.uppercased())
                                    .font(.system(size: 12, weight: .black))
                                    .tracking(1.2)
                                    .foregroundColor(Color(hex: "2DD4BF"))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color(hex: "2DD4BF").opacity(0.15))
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(.top, 20)
                        
                        // MARK: - Clinical Sections
                        VStack(spacing: 16) {
                            DetailSection(title: "DESCRIPTION", content: tooth.description, icon: "info.circle.fill", color: Color(hex: "2F80ED"))
                            DetailSection(title: "FUNCTION", content: tooth.function, icon: "gearshape.fill", color: Color(hex: "2DD4BF"))
                            DetailSection(title: "PRECAUTIONS", content: tooth.precautions, icon: "exclamationmark.triangle.fill", color: .orange)
                            DetailSection(title: "BRUSHING PROTOCOL", content: tooth.brushing_protocol, icon: "hand.raised.fill", color: .blue)
                            DetailSection(title: "DIETARY ADVICE", content: tooth.dietary_advice, icon: "leaf.fill", color: .green)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                }
            }
        }
    }
}

struct CloseButton: View {
    var action: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: action) {
            Image(systemName: "chevron.left")   // ← Changed from xmark
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.teal)
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(Color.white.opacity(0.95))
                )
                .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 3)
                .scaleEffect(isPressed ? 0.9 : 1.0)
                .animation(.easeInOut(duration: 0.15), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct DetailSection: View {
    let title: String
    let content: String
    let icon: String
    var color: Color = Color(red: 0/255, green: 190/255, blue: 210/255) // The Clinical Teal
    
    var body: some View {
        HStack(spacing: 0) {
            // 1. Signature Vertical Accent Bar
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [color, color.opacity(0.7)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: 5)
            
            VStack(alignment: .leading, spacing: 14) {
                // 2. Header with Icon and Bold Clinical Label
                HStack(spacing: 8) {
                    Image(systemName: icon)
                        .font(.system(size: 12, weight: .bold))
                    
                    Text(title.uppercased())
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.5)
                }
                .foregroundColor(color)
                
                // 3. Main Clinical Analysis Content
                Text(content)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundColor(.black.opacity(0.8))
                    .lineSpacing(6)
                    .fixedSize(horizontal: false, vertical: true)
                
                // 4. Monochrome Footer Divider (Matching the "Clinical Analysis" look)
                VStack(alignment: .leading, spacing: 10) {
                    Divider().opacity(0.5)
                    
                    Text("PROSTOCALC")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.gray.opacity(0.5))
                        .tracking(1)
                }
                .padding(.top, 4)
            }
            .padding(20)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 6)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}
