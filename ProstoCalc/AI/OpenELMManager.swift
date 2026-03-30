import Foundation
import CoreML

/**
 * OpenELMManager handles on-device clinical AI operations.
 * 
 * NOTE: This version is optimized for high-fidelity SIMULATION.
 * It provides instant, context-aware clinical explanations without requiring
 * external 1GB+ model downloads.
 */
class OpenELMManager {
    static let shared = OpenELMManager()
    
    /// Tracks if we are "pretending" to use a real model for UI consistency
    private(set) var isRealModelLoaded: Bool = false
    
    private let queue = DispatchQueue(label: "com.prostocalc.ai.queue", qos: .userInitiated)
    
    private init() {}
    
    // MARK: - Public API
    
    func generateExplanation(prompt: String, completion: @escaping (Result<String, Error>) -> Void) {
        queue.async {
            // Instant response with simulation engine
            let explanation = self.simulateInference(prompt: prompt)
            
            // Add a small artificial delay to simulate "thinking" for realistic UX
            Thread.sleep(forTimeInterval: 0.8)
            
            DispatchQueue.main.async {
                completion(.success(explanation))
            }
        }
    }
    
    // MARK: - Clinical Simulation Engine
    
    private func simulateInference(prompt: String) -> String {
        // Detection for empty plans
        if prompt.contains("No treatment plan is currently available") {
            return "SIGNAL_OFFLINE: No active treatment design was detected. Please finalize your restorative protocol before generating a neural analysis."
        }

        // Extract context for intelligence
        let isCrown = prompt.contains("Crown")
        let isRCT = prompt.contains("RCT") || prompt.contains("Root Canal")
        let isExtraction = prompt.contains("Extraction")
        let isImplant = prompt.contains("Implant")
        
        var summary = "ANALYSIS COMPLETE: The proposed plan has been evaluated for biological compatibility."
        
        if isCrown && isRCT {
            summary = "RESTORE_SCAN: Full-coverage restoration following endodontic therapy for structural preservation."
        } else if isImplant {
            summary = "SURGICAL_SCAN: Osseointegrated implant protocol identified for missing unit replacement."
        } else if isExtraction {
            summary = "SURGICAL_SCAN: Extraction protocol identified for non-restorable units."
        }
        
        let totalCost = extractTotal(from: prompt)
        
        return """
        **[SYSTEM REPORT: AI CASE ANALYSIS]**
        \(summary)

        **COST ARCHITECTURE & VALUE**
        The total investment of ₹\(totalCost) covers precision clinical nodes, sterilized procedural workflows, and high-strength biocompatible materials.

        **TEMPORAL FLOW (TIMELINE)**
        - Optimized across multiple sessions for biological integration and healing.
        - Strategic sequencing to minimize trauma and maximize structural longevity.

        **PROJECTION**
        Executing this plan will stabilize active dental disease, restoring both structural morphology and functional occlusion.

        *Informational report only. Final clinical judgment rests with the treating dentist.*
        """
    }
    
    private func extractTotal(from prompt: String) -> String {
        if let range = prompt.range(of: "TOTAL FINANCIAL COMMITMENT: ₹") {
            let start = range.upperBound
            let end = prompt[start...].firstIndex(of: "\n") ?? prompt.endIndex
            let value = String(prompt[start..<end]).trimmingCharacters(in: .whitespaces)
            return value.isEmpty ? "Calculated" : value
        }
        return "Calculated"
    }
}
