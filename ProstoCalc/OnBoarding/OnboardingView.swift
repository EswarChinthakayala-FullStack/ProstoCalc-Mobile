import SwiftUI

struct OnboardingView: View {
    
    @State private var currentIndex = 0
    
    let steps: [OnboardingStep] = [
        OnboardingStep(
            icon: "dollarsign.circle.fill",
            title: "Smart Cost Estimation",
            description: "Get AI-powered dental treatment cost predictions before visiting the clinic."
        ),
        OnboardingStep(
            icon: "map.fill",
            title: "Find Nearby Dentists",
            description: "Locate trusted dental clinics near you with routes, distance, and time."
        ),
        OnboardingStep(
            icon: "brain.head.profile",
            title: "AI Treatment Guidance",
            description: "Understand procedures, pricing, and care plans with intelligent assistance."
        ),
        OnboardingStep(
            icon: "timeline.selection",
            title: "Track Your Dental Care",
            description: "Follow your treatment timeline and manage visits seamlessly."
        )
    ]
    
    var body: some View {
        VStack {
            
            Spacer()
            
            TabView(selection: $currentIndex) {
                ForEach(0..<steps.count, id: \.self) { index in
                    OnboardingCard(step: steps[index])
                        .tag(index)
                }
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .always))
            .animation(.easeInOut, value: currentIndex)
            
            Spacer()
            
            // MARK: - Bottom Button
            Button(action: {
                if currentIndex < steps.count - 1 {
                    currentIndex += 1
                }
            }) {
                Text(currentIndex == steps.count - 1 ? "Get Started" : "Next")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [.blue, .cyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(14)
            }
            .padding(.horizontal)
            .padding(.bottom, 30)
            .navigationDestination(isPresented: .constant(currentIndex == steps.count - 1)) {
                RoleSelectionView()
            }
        }
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.94, green: 0.97, blue: 1),
                    Color(red: 0.86, green: 0.92, blue: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        )
    }
}
