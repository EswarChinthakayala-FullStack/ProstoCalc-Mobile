import SwiftUI
import WebKit

struct PuterChatView: View {
    @Environment(\.dismiss) var dismiss
    var userId: String
    var role: String
    var userName: String
    var isTabRoot: Bool = false
    var onBack: (() -> Void)? = nil
    
    // Optional Treatment Context
    var treatmentName: String? = nil
    var estimatedCost: Double? = nil
    var numberOfVisits: Int? = nil
    
    var body: some View {
        NativeAssistantView(
            userId: userId, 
            role: role, 
            userName: userName, 
            showBackButton: !isTabRoot,
            onBack: onBack,
            treatmentName: treatmentName,
            estimatedCost: estimatedCost,
            numberOfVisits: numberOfVisits
        )
            .navigationTitle("Prosto Assistant")
            .navigationBarTitleDisplayMode(.inline)
    }
}


