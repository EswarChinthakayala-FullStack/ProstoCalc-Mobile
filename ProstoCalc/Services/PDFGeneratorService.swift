import Foundation
import UIKit
import PDFKit

struct PDFReportContent {
    let patientName: String
    let toothDetails: String
    let treatmentName: String
    let totalCost: String
    let visits: String
    let urgency: String
    let healthScore: Int
    let escalationRisk: Int
    let aiExplanation: String
    let tips: [String]
}

class PDFGeneratorService {
    static let shared = PDFGeneratorService()
    
    func generateClinicalReport(content: PDFReportContent) -> URL? {
        let pdfMetaData = [
            kCGPDFContextCreator: "ProstoAI Clinical Engine",
            kCGPDFContextAuthor: "Dr. Prosto",
            kCGPDFContextTitle: "Clinical Treatment Analysis"
        ]
        
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]
        
        // A4 Page size (8.27 x 11.69 inches)
        let pageWidth = 8.27 * 72.0
        let pageHeight = 11.69 * 72.0
        let pageRect = CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight)
        
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("ProstoReport_\(UUID().uuidString).pdf")
        
        do {
            try renderer.writePDF(to: url) { context in
                context.beginPage()
                
                let margin: CGFloat = 50
                var currentY: CGFloat = margin
                
                // 1. Header (Clinic Identity)
                let headerFont = UIFont.systemFont(ofSize: 24, weight: .black)
                let headerAttr: [NSAttributedString.Key: Any] = [.font: headerFont, .foregroundColor: UIColor(red: 0.08, green: 0.57, blue: 0.7, alpha: 1.0)]
                "PROSTO CLINICAL REPORT".draw(at: CGPoint(x: margin, y: currentY), withAttributes: headerAttr)
                currentY += 40
                
                // 2. Metadata
                let metaFont = UIFont.systemFont(ofSize: 10, weight: .bold)
                let dateStr = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short)
                "ISSUED: \(dateStr.uppercased())".draw(at: CGPoint(x: margin, y: currentY), withAttributes: [.font: metaFont, .foregroundColor: UIColor.gray])
                currentY += 30
                
                // 3. Separator
                let linePath = UIBezierPath()
                linePath.move(to: CGPoint(x: margin, y: currentY))
                linePath.addLine(to: CGPoint(x: pageWidth - margin, y: currentY))
                linePath.lineWidth = 1
                UIColor.lightGray.withAlphaComponent(0.3).setStroke()
                linePath.stroke()
                currentY += 30
                
                // 4. Patient Information Block
                drawSectionHeader(text: "PATIENT CASE DATA", y: &currentY, margin: margin)
                drawKeyValue(key: "Patient Name:", value: content.patientName, y: &currentY, margin: margin)
                drawKeyValue(key: "Tooth Specifics:", value: content.toothDetails, y: &currentY, margin: margin)
                drawKeyValue(key: "Primary Procedure:", value: content.treatmentName, y: &currentY, margin: margin)
                drawKeyValue(key: "Estimated Investment:", value: "₹\(content.totalCost)", y: &currentY, margin: margin)
                drawKeyValue(key: "Planned Sessions:", value: content.visits, y: &currentY, margin: margin)
                currentY += 20
                
                // 5. AI Clinical Metrics
                drawSectionHeader(text: "AI CLINICAL METRICS (PROSTOAI)", y: &currentY, margin: margin)
                drawKeyValue(key: "Health Integrity Score:", value: "\(content.healthScore)/100", y: &currentY, margin: margin)
                drawKeyValue(key: "Cost Escalation Risk:", value: "\(content.escalationRisk)%", y: &currentY, margin: margin)
                currentY += 20
                
                // 6. Detailed AI Explanation
                drawSectionHeader(text: "CLINICAL RATIONALE & ANALYSIS", y: &currentY, margin: margin)
                let explanationFont = UIFont.systemFont(ofSize: 12, weight: .medium)
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.lineSpacing = 4
                let explanationAttr: [NSAttributedString.Key: Any] = [
                    .font: explanationFont,
                    .foregroundColor: UIColor.darkGray,
                    .paragraphStyle: paragraphStyle
                ]
                
                let explanationWidth = pageWidth - (2 * margin)
                let explanationSize = content.aiExplanation.boundingRect(
                    with: CGSize(width: explanationWidth, height: CGFloat.greatestFiniteMagnitude),
                    options: .usesLineFragmentOrigin,
                    attributes: explanationAttr, 
                    context: nil
                ).size
                
                let explanationRect = CGRect(origin: CGPoint(x: margin, y: currentY), size: explanationSize)
                content.aiExplanation.draw(in: explanationRect, withAttributes: explanationAttr)
                currentY += explanationSize.height + 30
                
                // 7. Strategy Tips
                drawSectionHeader(text: "RESTORATIVE STRATEGY TIPS", y: &currentY, margin: margin)
                for tip in content.tips {
                    "• \(tip)".draw(at: CGPoint(x: margin + 10, y: currentY), withAttributes: [.font: explanationFont, .foregroundColor: UIColor.black])
                    currentY += 20
                }
                
                // 8. Footer (Disclaimer)
                let footerRect = CGRect(x: margin, y: pageHeight - 100, width: pageWidth - (2 * margin), height: 60)
                let footerAttr: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 8, weight: .bold),
                    .foregroundColor: UIColor.gray.withAlphaComponent(0.6)
                ]
                "DISCLAIMER: This report is synthesized by ProstoAI using on-device clinical logic. It provides initial estimations for informational purposes and is not a substitute for a comprehensive clinical diagnosis. Biological outcomes and final costs are determined by the treating clinician.".draw(in: footerRect, withAttributes: footerAttr)
            }
            return url
        } catch {
            print("PDF Error: \(error)")
            return nil
        }
    }
    
    private func drawSectionHeader(text: String, y: inout CGFloat, margin: CGFloat) {
        let font = UIFont.systemFont(ofSize: 10, weight: .black)
        let attr: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.darkGray]
        text.draw(at: CGPoint(x: margin, y: y), withAttributes: attr)
        y += 20
    }
    
    private func drawKeyValue(key: String, value: String, y: inout CGFloat, margin: CGFloat) {
        let keyFont = UIFont.systemFont(ofSize: 12, weight: .bold)
        let valFont = UIFont.systemFont(ofSize: 12, weight: .regular)
        
        key.draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: keyFont])
        value.draw(at: CGPoint(x: margin + 140, y: y), withAttributes: [.font: valFont])
        y += 20
    }
}
