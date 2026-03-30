import SwiftUI

// MARK: - Shared Futuristic Background (Used across the App)
struct DentalBackgroundView: View {
    var animate: Bool
    var isDentist: Bool = false
    @State private var gridShift: CGFloat = 0
    @State private var pulseOpacity: Double = 0.3
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background Orbs for Premium feel
                BackgroundOrbs(animateProp: animate)
                
                // Clinical Base
                Color.white.opacity(0.4)
                
                // Perspective Grid
                Path { path in
                    let step: CGFloat = 50
                    for i in 0...Int(geometry.size.width / step) + 1 {
                        let x = CGFloat(i) * step
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: geometry.size.height))
                    }
                    for i in 0...Int(geometry.size.height / step) + 1 {
                        let y = CGFloat(i) * step
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: geometry.size.width, y: y))
                    }
                }
                .stroke(isDentist ? Color.teal.opacity(0.12) : Color.blue.opacity(0.12), lineWidth: 0.8)
                .offset(x: -gridShift, y: -gridShift)
                
                // Central Medical Glow
                Circle()
                    .fill(isDentist ? Color.dentalCyan.opacity(0.12) : Color.dentalLightBlue.opacity(0.12))
                    .frame(width: 500, height: 500)
                    .blur(radius: 120)
                    .opacity(pulseOpacity)
                
                // Floating Clean Atoms
                if animate {
                    ForEach(0..<25) { i in
                        SharedParticleView(geometry: geometry)
                    }
                    
                    // Refractive Rays for Depth
                    SharedRefractiveRays()
                        .opacity(0.1)
                }
                
                // Subtle Premium Grain
                SharedGrainView()
                    .opacity(0.04)
                    .blendMode(.multiply)
            }
        }
        .ignoresSafeArea()
        .onAppear {
            if animate {
                withAnimation(.linear(duration: 15).repeatForever(autoreverses: false)) {
                    gridShift = 50
                }
                withAnimation(.easeInOut(duration: 4).repeatForever(autoreverses: true)) {
                    pulseOpacity = 0.5
                }
            }
        }
    }
}

struct SharedParticleView: View {
    let geometry: GeometryProxy
    @State private var pos = CGPoint.zero
    @State private var opacity = Double.random(in: 0.05...0.2)
    @State private var scale = Double.random(in: 0.5...1.2)
    
    var body: some View {
        Circle()
            .fill(Color.dentalCyan.opacity(opacity))
            .frame(width: 4, height: 4)
            .scaleEffect(scale)
            .position(pos)
            .onAppear {
                setRandomPos()
                withAnimation(.easeInOut(duration: Double.random(in: 5...10)).repeatForever(autoreverses: true)) {
                    pos.x += CGFloat.random(in: -40...40)
                    pos.y += CGFloat.random(in: -40...40)
                }
            }
    }
    
    private func setRandomPos() {
        pos = CGPoint(
            x: CGFloat.random(in: 0...geometry.size.width),
            y: CGFloat.random(in: 0...geometry.size.height)
        )
    }
}


struct SharedGrainView: View {
    var body: some View {
        Canvas { context, size in
            for _ in 0...1500 {
                let x = CGFloat.random(in: 0...size.width)
                let y = CGFloat.random(in: 0...size.height)
                context.fill(Path(CGRect(x: x, y: y, width: 1.2, height: 1.2)), with: .color(.gray.opacity(0.15)))
            }
        }
        .ignoresSafeArea()
    }
}

struct SharedRefractiveRays: View {
    @State private var anim: CGFloat = 0
    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(0..<3) { i in
                    Capsule()
                        .fill(LinearGradient(colors: [.blue.opacity(0.3), .clear], startPoint: .top, endPoint: .bottom))
                        .frame(width: 150, height: geo.size.height * 1.5)
                        .rotationEffect(.degrees(30))
                        .offset(x: -geo.size.width * 0.5 + CGFloat(i) * geo.size.width * 0.4 + anim)
                        .blur(radius: 60)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 20).repeatForever(autoreverses: true)) {
                anim = 100
            }
        }
    }
}
