import SwiftUI

// MARK: - Main Splash Screen (Light Futuristic Redesign)
struct SplashView: View {
    // Navigation & State
    @State private var path = NavigationPath()
    
    // Animation Phases
    @State private var phase1_background = false    // Clinical light BG
    @State private var phase2_logo = false          // Logo reveal
    @State private var phase3_rings = false         // Orbital rings
    @State private var phase4_text = false          // Title text
    @State private var phase5_loader = false        // Progress loader
    @State private var phase6_data = false          // Data fragments
    
    // Progress
    @State private var scanProgress: CGFloat = 0.0
    @State private var statusText = ""
    @State private var statusIndex = 0
    @State private var showCursor = true
    
    // Scanning
    @State private var showScanLine = false
    @State private var logoGlow: CGFloat = 0.0
    
    let statusSteps = [
        "INITIALIZING CORE ENGINE...",
        "CONNECTING TO NEURAL NETWORK...",
        "SYNCING CLINICAL PROTOCOLS...",
        "CALIBRATING 3D DENTAL MODELS...",
        "OPTIMIZING AI WORKSPACE...",
        "PROSTOCALC READY ✓"
    ]
    
    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                // 1. Clinical Light Background
                SplashBackgroundView(animate: phase1_background)
                    .ignoresSafeArea()
                    
                // 2. Floating Clinical Particles
                HolographicParticleField()
                    .opacity(phase1_background ? 1 : 0)
                    .ignoresSafeArea()
                
                // Content
                VStack(spacing: 0) {
                    Spacer()
                    
                    // 3. Logo with Orbital Rings
                    ZStack {
                        // Outer glow pulse (Subtle Blue Glow on White)
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        Color.dentalLightBlue.opacity(logoGlow * 0.15),
                                        Color.dentalLightBlue.opacity(logoGlow * 0.05),
                                        Color.clear
                                    ],
                                    center: .center,
                                    startRadius: 80,
                                    endRadius: 220
                                )
                            )
                            .frame(width: 400, height: 400)
                        
                        // Orbital rings
                        if phase3_rings {
                            OrbitalRingsView()
                        }
                        
                        // Clean medical container
                        ZStack {
                            // White Background Circle
                            Circle()
                                .fill(Color.white)
                                .frame(width: 170, height: 170)
                                .shadow(color: .dentalDarkBlue.opacity(0.08), radius: 25, x: 0, y: 15)
                            
                            // Frosted glass overlay (very subtle)
                            Circle()
                                .fill(
                                    .ultraThinMaterial.opacity(0.4)
                                )
                                .frame(width: 170, height: 170)
                                .overlay(
                                    Circle()
                                        .stroke(
                                            LinearGradient(
                                                colors: [
                                                    .white,
                                                    .dentalLightBlue.opacity(0.3),
                                                    .dentalCyan.opacity(0.2),
                                                    .white.opacity(0.5)
                                                ],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ),
                                            lineWidth: 1.5
                                        )
                                )
                            
                            // App logo
                            Image("AppLogo")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 100, height: 100)
                            
                            // Scanning line over logo
                            if showScanLine {
                                HolographicScanLine()
                                    .frame(width: 150, height: 150)
                                    .clipShape(Circle())
                            }
                        }
                        .scaleEffect(phase2_logo ? 1 : 0.4)
                        .opacity(phase2_logo ? 1 : 0)
                    }
                    
                    Spacer().frame(height: 52)
                    
                    // 4. Title with premium gradient
                    VStack(spacing: 12) {
                        Text("ProstoCalc")
                            .font(.system(size: 48, weight: .black, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [
                                        .dentalDarkBlue,
                                        .dentalLightBlue
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .shadow(color: .dentalLightBlue.opacity(0.2), radius: 8, y: 4)
                        
                        // Subtitle with animated separator lines
                        HStack(spacing: 16) {
                            AnimatedLine()
                            
                            Text("ADVANCED DENTAL ARCHITECTURE")
                                .font(.system(size: 9, weight: .bold))
                                .tracking(4)
                                .foregroundStyle(Color.dentalDarkBlue.opacity(0.5))
                            
                            AnimatedLine()
                        }
                        
                        // Environment status
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color.dentalCyan)
                                .frame(width: 5, height: 5)
                            
                            Text("CLINICAL SECURE NODE: ACTIVE")
                                .font(.system(size: 8, weight: .bold, design: .monospaced))
                                .foregroundColor(.dentalLightBlue.opacity(0.6))
                        }
                        .padding(.top, 4)
                    }
                    .offset(y: phase4_text ? 0 : 30)
                    .opacity(phase4_text ? 1 : 0)
                    
                    Spacer()
                    
                    // 5. Futuristic Clinical Loader
                    VStack(spacing: 20) {
                        FuturisticProgressBar(progress: scanProgress, status: statusText, showCursor: showCursor)
                            .frame(width: 300)
                        
                        // Intelligence metrics row
                        HStack(spacing: 0) {
                            IntelligenceDataFragment(icon: "waveform.path.ecg", label: "CPU", value: "0.2ms")
                            
                            Rectangle()
                                .fill(Color.dentalLightBlue.opacity(0.2))
                                .frame(width: 1, height: 26)
                            
                            IntelligenceDataFragment(icon: "shield.text.resistor", label: "MODEL", value: "V4.2.1")
                            
                            Rectangle()
                                .fill(Color.dentalLightBlue.opacity(0.2))
                                .frame(width: 1, height: 26)
                            
                            IntelligenceDataFragment(icon: "checkmark.shield.fill", label: "SECURE", value: "256-BIT")
                        }
                        .opacity(phase6_data ? 0.7 : 0)
                    }
                    .opacity(phase5_loader ? 1 : 0)
                    .padding(.bottom, 65)
                }
            }
            .background(Color.white)
            .preferredColorScheme(.light)
            .onAppear {
                startCinematicSequence()
            }
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .onboarding:
                    OnboardingView()
                        .navigationBarBackButtonHidden(true)
                }
            }
        }
    }
    
    // MARK: - Sequence Control
    private func startCinematicSequence() {
        withAnimation(.easeOut(duration: 1.2)) {
            phase1_background = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.spring(response: 0.9, dampingFraction: 0.7)) {
                phase2_logo = true
            }
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                logoGlow = 1.0
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
            withAnimation(.spring(response: 1.1, dampingFraction: 0.8)) {
                phase3_rings = true
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) {
            withAnimation(.spring(response: 0.9, dampingFraction: 0.8)) {
                phase4_text = true
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
            showScanLine = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
            withAnimation(.easeOut(duration: 0.6)) {
                phase5_loader = true
            }
            withAnimation(.easeInOut(duration: 4.2)) {
                scanProgress = 1.0
            }
            typewriterStatus()
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.9) {
            withAnimation(.easeOut(duration: 0.8)) {
                phase6_data = true
            }
        }
        
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { timer in
            showCursor.toggle()
            if scanProgress >= 1.0 {
                timer.invalidate()
                showCursor = false
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.5) {
            path.append(Route.onboarding)
        }
    }
    
    private func typewriterStatus() {
        for (index, step) in statusSteps.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * 0.7) {
                statusText = ""
                animateTyping(text: step)
            }
        }
    }
    
    private func animateTyping(text: String) {
        for (i, char) in text.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.025) {
                statusText += String(char)
            }
        }
    }
}


// MARK: - Clinical Light Background
struct SplashBackgroundView: View {
    var animate: Bool
    @State private var gridShift: CGFloat = 0
    @State private var pulse1: CGFloat = 0.05
    @State private var pulse2: CGFloat = 0.08
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.white
                
                // Breathable Orbs
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.dentalLightBlue.opacity(pulse1), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 350
                        )
                    )
                    .frame(width: 700, height: 700)
                    .offset(x: animate ? -100 : -160, y: animate ? -250 : -350)
                    .blur(radius: 80)
                
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.dentalCyan.opacity(pulse2), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 300
                        )
                    )
                    .frame(width: 600, height: 600)
                    .offset(x: animate ? 150 : 220, y: animate ? 250 : 350)
                    .blur(radius: 90)
                
                // Perspective Grid
                Path { path in
                    let step: CGFloat = 55
                    for i in 0...Int(geo.size.width / step) + 1 {
                        let x = CGFloat(i) * step
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: geo.size.height))
                    }
                    for i in 0...Int(geo.size.height / step) + 1 {
                        let y = CGFloat(i) * step
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: geo.size.width, y: y))
                    }
                }
                .stroke(Color.dentalLightBlue.opacity(0.12), lineWidth: 0.8)
                .offset(x: -gridShift, y: -gridShift)
                
                // Subtle medical cross patterns
                MedicalGridPattern()
                    .opacity(0.04)
                
                // Vignette
                RadialGradient(
                    colors: [.clear, .dentalLightBlue.opacity(0.05)],
                    center: .center,
                    startRadius: geo.size.height * 0.4,
                    endRadius: geo.size.height * 0.8
                )
            }
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.linear(duration: 20).repeatForever(autoreverses: false)) {
                gridShift = 55
            }
            withAnimation(.easeInOut(duration: 5).repeatForever(autoreverses: true)) {
                pulse1 = 0.12
            }
            withAnimation(.easeInOut(duration: 6).repeatForever(autoreverses: true)) {
                pulse2 = 0.15
            }
        }
    }
}

struct MedicalGridPattern: View {
    var body: some View {
        Canvas { context, size in
            let spacing: CGFloat = 80
            for x in stride(from: 0, to: size.width, by: spacing) {
                for y in stride(from: 0, to: size.height, by: spacing) {
                    // Draw tiny cross
                    context.stroke(Path { p in
                        p.move(to: CGPoint(x: x - 4, y: y))
                        p.addLine(to: CGPoint(x: x + 4, y: y))
                        p.move(to: CGPoint(x: x, y: y - 4))
                        p.addLine(to: CGPoint(x: x, y: y + 4))
                    }, with: .color(.dentalLightBlue), lineWidth: 0.5)
                }
            }
        }
        .ignoresSafeArea()
    }
}


// MARK: - Clinical Particle Field
struct HolographicParticleField: View {
    var body: some View {
        GeometryReader { geo in
            ForEach(0..<30) { i in
                HoloParticle(
                    geoSize: geo.size,
                    index: i
                )
            }
        }
        .ignoresSafeArea()
    }
}

struct HoloParticle: View {
    let geoSize: CGSize
    let index: Int
    
    @State private var position: CGPoint = .zero
    @State private var opacity: Double = 0
    @State private var particleScale: CGFloat = 1.0
    
    var body: some View {
        Circle()
            .fill(index % 2 == 0 ? Color.dentalLightBlue : Color.dentalCyan)
            .frame(width: CGFloat.random(in: 2...5), height: CGFloat.random(in: 2...5))
            .scaleEffect(particleScale)
            .opacity(opacity)
            .position(position)
            .onAppear {
                position = CGPoint(
                    x: CGFloat.random(in: 0...geoSize.width),
                    y: CGFloat.random(in: 0...geoSize.height)
                )
                DispatchQueue.main.asyncAfter(deadline: .now() + Double.random(in: 0...2)) {
                    withAnimation(.easeInOut(duration: 2)) {
                        opacity = Double.random(in: 0.1...0.3)
                    }
                    withAnimation(.easeInOut(duration: Double.random(in: 8...15)).repeatForever(autoreverses: true)) {
                        position.x += CGFloat.random(in: -50...50)
                        position.y += CGFloat.random(in: -50...50)
                    }
                }
            }
    }
}


// MARK: - Orbital Rings (Adjusted for Light Mode)
struct OrbitalRingsView: View {
    @State private var rotation1: Double = 0
    @State private var rotation2: Double = 0
    
    var body: some View {
        ZStack {
            // Ring 1
            Circle()
                .stroke(
                    Color.dentalLightBlue.opacity(0.15),
                    style: StrokeStyle(lineWidth: 1, dash: [8, 12])
                )
                .frame(width: 250, height: 250)
                .rotationEffect(.degrees(rotation1))
                .rotation3DEffect(.degrees(70), axis: (x: 1, y: 0.2, z: 0))
            
            // Ring 2
            Circle()
                .stroke(
                    Color.dentalCyan.opacity(0.12),
                    style: StrokeStyle(lineWidth: 1, dash: [4, 16])
                )
                .frame(width: 280, height: 280)
                .rotationEffect(.degrees(rotation2))
                .rotation3DEffect(.degrees(65), axis: (x: -0.2, y: 1, z: 0.1))
            
            // Orbiting Dot
            Circle()
                .fill(Color.dentalLightBlue)
                .frame(width: 4, height: 4)
                .offset(x: 125)
                .rotationEffect(.degrees(rotation1))
                .rotation3DEffect(.degrees(70), axis: (x: 1, y: 0.2, z: 0))
                .shadow(color: .dentalLightBlue, radius: 4)
        }
        .onAppear {
            withAnimation(.linear(duration: 10).repeatForever(autoreverses: false)) {
                rotation1 = 360
            }
            withAnimation(.linear(duration: 14).repeatForever(autoreverses: false)) {
                rotation2 = -360
            }
        }
    }
}


// MARK: - Scan Line (Clinical)
struct HolographicScanLine: View {
    @State private var scanY: CGFloat = -1.0
    
    var body: some View {
        ZStack {
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [.clear, .dentalLightBlue.opacity(0.05), .dentalLightBlue.opacity(0.2), .clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(height: 30)
                .offset(y: scanY * 75)
            
            Rectangle()
                .fill(Color.dentalLightBlue.opacity(0.5))
                .frame(height: 1.5)
                .offset(y: scanY * 75)
                .shadow(color: .dentalLightBlue.opacity(0.3), radius: 3)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                scanY = 1.0
            }
        }
    }
}


// MARK: - Animated Separator
struct AnimatedLine: View {
    @State private var width: CGFloat = 0
    
    var body: some View {
        Rectangle()
            .fill(Color.dentalLightBlue.opacity(0.3))
            .frame(width: width, height: 1)
            .onAppear {
                withAnimation(.easeOut(duration: 1.2).delay(1.5)) {
                    width = 25
                }
            }
    }
}


// MARK: - Futuristic Progress Bar (Light)
struct FuturisticProgressBar: View {
    var progress: CGFloat
    var status: String
    var showCursor: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(spacing: 8) {
                Text("PROCESS: \(status)")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundColor(.dentalDarkBlue.opacity(0.6))
                
                Text(showCursor ? "▊" : " ")
                    .font(.system(size: 9))
                    .foregroundColor(.dentalLightBlue)
                
                Spacer()
                
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundColor(.dentalDarkBlue)
            }
            
            // Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.dentalLightBlue.opacity(0.08))
                        .frame(height: 6)
                        .overlay(
                            RoundedRectangle(cornerRadius: 3)
                                .stroke(Color.dentalLightBlue.opacity(0.1), lineWidth: 0.5)
                        )
                    
                    RoundedRectangle(cornerRadius: 3)
                        .fill(
                            LinearGradient(
                                colors: [.dentalDarkBlue, .dentalLightBlue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * progress, height: 6)
                        .shadow(color: .dentalLightBlue.opacity(0.3), radius: 4)
                }
            }
            .frame(height: 6)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.dentalLightBlue.opacity(0.03))
                .shadow(color: .black.opacity(0.02), radius: 5, y: 3)
        )
    }
}


// MARK: - Data Fragment (Light)
struct IntelligenceDataFragment: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        VStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(.dentalLightBlue)
            
            Text(label)
                .font(.system(size: 7, weight: .black))
                .foregroundColor(.dentalDarkBlue.opacity(0.4))
            
            Text(value)
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundColor(.dentalDarkBlue.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Navigation Route
enum Route: Hashable {
    case onboarding
}

#Preview {
    SplashView()
}
