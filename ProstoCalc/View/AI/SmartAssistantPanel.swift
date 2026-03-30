import SwiftUI

struct SmartAssistantPanel: View {
    let context: AssistantContext
    let isCloud: Bool
    var isDetailed: Bool = false
    var isDentist: Bool = false
    @Binding var assistantMessage: String
    
    @StateObject private var nanobot = NanobotService.shared
    @State private var hasGenerated = false
    @State private var isGeneratingCloud = false
    
    private var primaryColor: Color {
        isDentist ? Color.dentalCyan : Color.teal
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            // Header
            HStack {
                Image(systemName: isCloud ? "icloud.fill" : "cpu.fill")
                    .foregroundColor(primaryColor)
                Text(isCloud ? "PROSTOCALC SECURE CLOUD (MISTRAL)" : "NANOBOT ON-DEVICE AI (LLAMA)")
                    .font(.system(size: 10, weight: .black))
                    .tracking(1)
                    .foregroundColor(primaryColor)
                Spacer()
                
                if nanobot.isGenerating || isGeneratingCloud {
                    ProgressView()
                        .controlSize(.small)
                        .tint(primaryColor)
                }
            }
            
            if assistantMessage.isEmpty && !hasGenerated {
                VStack(spacing: 12) {
                    Text(isCloud ? "Ready for Cloud Synthesis" : "Ready for Clinical Assessment")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.dentalDarkBlue)
                    
                    Text(isCloud ? "Our high-performance Mistral engine will synthesize a professional clinical justification for this case." : "Our on-device SLM can analyze your treatment plan context to provide workflow and cost insights.")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button(action: generate) {
                        Text(isCloud ? "GENERATE CLOUD INSIGHT" : "ANALYZE CASE")
                            .font(.system(size: 11, weight: .black))
                            .padding(.vertical, 8)
                            .padding(.horizontal, 25)
                            .background(primaryColor)
                            .foregroundColor(.white)
                            .clipShape(Capsule())
                            .shadow(color: primaryColor.opacity(0.3), radius: 10, y: 5)
                    }
                    .disabled(nanobot.isGenerating || isGeneratingCloud)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    let cleanText = assistantMessage
                        .replacingOccurrences(of: "```markdown", with: "")
                        .replacingOccurrences(of: "```", with: "")
                        .replacingOccurrences(of: "### ", with: "")
                        .replacingOccurrences(of: "###", with: "")
                        .replacingOccurrences(of: "---", with: "")
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                    
                    Text(LocalizedStringKey(cleanText))
                        .font(.system(size: 13, weight: .medium))
                        .lineSpacing(4)
                        .padding(15)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(12)
                    
                    Button(action: { 
                        assistantMessage = ""
                        hasGenerated = false 
                     }) {
                        Label("Re-analyze", systemImage: "arrow.clockwise")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(primaryColor)
                    }
                }
            }
            
            // Fixed Disclaimer
            Text(isCloud ? "“Cloud insights are synthesized using Mistral AI over secure SSL.”" : "“This AI provides informational estimates only and does not replace professional clinical judgment.”")
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(.secondary.opacity(0.8))
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding(.top, 5)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(primaryColor.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(primaryColor.opacity(0.1), lineWidth: 1)
                )
        )
        .onAppear {
            if !assistantMessage.isEmpty {
                hasGenerated = true
            }
        }
    }
    
    private func generate() {
        if isCloud {
            isGeneratingCloud = true
            let prompt = """
            Task: Senior Dental Clinical Strategist.
            User: \(context.userName ?? "Patient")
            Role: \(context.userRole ?? "patient")
            
            [DATA]
            Procedures: \(context.treatmentName ?? "Unspecified")
            Teeth/Specifics: \(context.toothDetails ?? "General Assessment")
            Total Value: ₹\(context.estimatedCost ?? 0)
            
            [STRICT REQUIREMENTS]
            1. NO MARKDOWN (No **, no #, no -, no *).
            2. NO bold or italics.
            3. Plain text only.
            4. Address the user by name: \(context.userName ?? "Patient").
            5. Professional and unique clinical rationale for specific tooth numbers listed.
            6. Max 100 words.
            """
            
            APIService.getAICostExplanation(userPrompt: prompt) { result in
                DispatchQueue.main.async {
                    isGeneratingCloud = false
                    if case .success(let output) = result {
                        self.assistantMessage = output
                        self.hasGenerated = true
                    }
                }
            }
        } else {
            nanobot.generateSmartExplanation(context: context, isDetailed: isDetailed) { result in
                if case .success(let output) = result {
                    self.assistantMessage = output
                    self.hasGenerated = true
                }
            }
        }
    }
}

#Preview {
    SmartAssistantPanel(context: AssistantContext(
        treatmentName: "Root Canal",
        estimatedCost: 5000,
        numberOfVisits: 2,
        clinicType: "Premium",
        toothDetails: "Tooth 18: RCT"
    ), isCloud: false, isDetailed: true, assistantMessage: .constant("Test message"))
    .padding()
}
