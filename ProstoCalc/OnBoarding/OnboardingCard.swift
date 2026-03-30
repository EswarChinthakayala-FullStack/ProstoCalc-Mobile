import SwiftUI

struct OnboardingCard: View {
    
    let step: OnboardingStep
    
    var body: some View {
        VStack(spacing: 24) {
            
            Spacer()
            
            // Icon
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 140, height: 140)
                    .shadow(radius: 10)
                
                Image(systemName: step.icon)
                    .font(.system(size: 52))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.blue, .cyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
            
            // Title
            Text(step.title)
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            // Description
            Text(step.description)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
            
            Spacer()
        }
    }
}
