import SwiftUI

struct BackgroundOrbs: View {
    var animateProp: Bool = true
    @State private var animate = false
    
    var body: some View {
        ZStack {
            // Main Clinical Blue Orb
            Circle()
                .fill(Color.blue.opacity(0.15))
                .frame(width: 350, height: 350)
                .blur(radius: 70)
                .offset(x: animate ? -120 : -160, y: animate ? -220 : -280)
            
            // Sky Blue (Cyan) Accented Orb
            Circle()
                .fill(Color.cyan.opacity(0.12))
                .frame(width: 400, height: 400)
                .blur(radius: 90)
                .offset(x: animate ? 160 : 200, y: animate ? -120 : -180)
            
            // Secondary Blue Orb
            Circle()
                .fill(Color.blue.opacity(0.10))
                .frame(width: 380, height: 380)
                .blur(radius: 85)
                .offset(x: animate ? -100 : -140, y: animate ? 240 : 300)
            
            // Secondary Sky Blue Orb
            Circle()
                .fill(Color.cyan.opacity(0.08))
                .frame(width: 320, height: 320)
                .blur(radius: 75)
                .offset(x: animate ? 180 : 220, y: animate ? 260 : 320)
        }
        .ignoresSafeArea()
        .onAppear {
            if animateProp {
                withAnimation(.easeInOut(duration: 12).repeatForever(autoreverses: true)) {
                    animate = true
                }
            }
        }
    }
}

#Preview {
    ZStack {
        Color.white.ignoresSafeArea()
        BackgroundOrbs()
    }
}
