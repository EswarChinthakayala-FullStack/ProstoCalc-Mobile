import SwiftUI

struct CostExplanationView: View {
    let explanation: String
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                DentalBackgroundView(animate: false, isDentist: false)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 25) {
                        HStack {
                            ZStack {
                                Circle().fill(Color.blue.opacity(0.1)).frame(width: 50, height: 50)
                                Image(systemName: "sparkles.rectangle.stack.fill").foregroundColor(.blue)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("NEURAL COST ANALYSIS")
                                    .font(.system(size: 10, weight: .black))
                                    .tracking(2)
                                    .foregroundColor(.blue)
                                Text("Clinical Integrity Report")
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                            }
                        }
                        .padding(.top, 20)
                        
                        Divider().background(Color.blue.opacity(0.1))
                        
                        Text(LocalizedStringKey(explanation))
                            .font(.system(size: 15, weight: .medium))
                            .lineSpacing(6)
                            .foregroundColor(.dentalDarkBlue)
                        
                        SmartAssistantPanel(context: AssistantContext(
                            treatmentName: "Current Treatment Plan",
                            estimatedCost: nil,
                            numberOfVisits: nil,
                            clinicType: nil,
                            toothDetails: nil
                        ), isCloud: false, assistantMessage: .constant(explanation))
                        
                        // Professional Disclaimer
                        VStack(alignment: .leading, spacing: 12) {
                            Label("REGULATORY NOTICE", systemImage: "shield.lefthalf.filled")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.gray)
                            
                            Text("This explanation is AI-generated using on-device SLM (LLaMA) processing for informational purposes only. It does not replace clinical diagnosis. Actual treatment costs and biological outcomes are determined solely by your attending clinician.")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.gray.opacity(0.6))
                                .lineSpacing(4)
                        }
                        .padding(20)
                        .background(Color.gray.opacity(0.05))
                        .cornerRadius(18)
                        
                        Button(action: { dismiss() }) {
                            Text("Acknowledge & Close")
                                .font(.system(size: 14, weight: .black))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(Color.dentalDarkBlue)
                                .cornerRadius(15)
                        }
                        .padding(.top, 10)
                    }
                    .padding(25)
                }
            }
            .navigationBarHidden(true)
        }
    }
}
