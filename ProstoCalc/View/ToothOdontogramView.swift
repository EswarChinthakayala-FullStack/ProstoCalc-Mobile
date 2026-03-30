import SwiftUI

struct ToothOdontogramView: View {
    let teeth = ToothStore.shared.dentition.individual_tooth_data
    @Binding var selectedTooth: Tooth?
    
    var body: some View {
        VStack(spacing: 0) {
            // Upper Arch (Maxillary) - 1 to 16
            VStack(spacing: 15) {
                HStack {
                    Text("Upper Arch")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.gray.opacity(0.4))
                        .tracking(2)
                    Capsule().fill(Color.gray.opacity(0.1)).frame(height: 1)
                    Text("MAXILLARY")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(2)
                }
                .padding(.horizontal, 40)
                
                ZStack {
                    ForEach(0..<16) { index in
                        ToothView(tooth: teeth[index], isSelected: selectedTooth?.id == teeth[index].id) {
                            selectedTooth = teeth[index]
                        }
                        .offset(calculateOffset(index: index, isUpper: true))
                    }
                }
                .frame(height: 150)
            }
            
            // Lower Arch (Mandibular) - 17 to 32
            VStack(spacing: 15) {
                HStack {
                    Text("Lower Arch")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.gray.opacity(0.4))
                        .tracking(2)
                    Capsule().fill(Color.gray.opacity(0.1)).frame(height: 1)
                    Text("MANDIBULAR")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(2)
                }
                .padding(.horizontal, 40)
                
                ZStack {
                    ForEach(0..<16) { index in
                        let toothIndex = 16 + index
                        ToothView(tooth: teeth[toothIndex], isSelected: selectedTooth?.id == teeth[toothIndex].id) {
                            selectedTooth = teeth[toothIndex]
                        }
                        .offset(calculateOffset(index: index, isUpper: false))
                    }
                }
                .frame(height: 150)
            }
        }
    }
    
    private func calculateOffset(index: Int, isUpper: Bool) -> CGSize {
        let mid = 7.5
        let xDist = 18.5
        let yDepth = 55.0
        
        let normalizedIndex = Double(index)
        let _: Double
        
        if isUpper {
            // Upper: 1 (index 0) is Left-most in chart (angle PI), 16 (index 15) is Right-most (angle 0)
            _ = .pi - (normalizedIndex / 15.0) * .pi
        } else {
            // Lower: 17 (index 0) is Right-most in chart (angle 0), 32 (index 15) is Left-most (angle PI)
            _ = (normalizedIndex / 15.0) * .pi
        }
        
        let archFactor = pow(Double(index) - mid, 2)
        let y: Double
        if isUpper {
            y = (archFactor * 1.5) - yDepth
        } else {
            y = -(archFactor * 1.5) + yDepth
        }
        
        let centeringOffset = isUpper ? -5.0 : 5.0
        
        // Final X position based on linear distribution with slight curve
        let finalX = (Double(index) - mid) * xDist
        
        return CGSize(width: finalX, height: y + centeringOffset)
    }
}

struct ToothView: View {
    let tooth: Tooth
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack(alignment: .center) {
                // Number Circle (External as per image)
                NumberBubble(id: tooth.id, isSelected: isSelected, color: quadrantColor)
                    .offset(calculateBubbleOffset())
                
                // Realistic Tooth Node
                RealisticToothNode(type: tooth.type, isSelected: isSelected, color: quadrantColor)
                    .scaleEffect(isSelected ? 1.2 : 1.0)
            }
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isSelected)
    }
    
    private var quadrantColor: Color {
        switch tooth.id {
        case 1...8: return Color(hex: "EAB308") // Deep Yellow (UR)
        case 9...16: return Color(hex: "14B8A6") // Deep Teal (UL)
        case 17...24: return Color(hex: "6366F1") // Indigo/Purple (LR)
        case 25...32: return Color(hex: "EC4899") // Pink (LL)
        default: return .blue
        }
    }
    
    private func calculateBubbleOffset() -> CGSize {
        // Position bubbles outside the arch symmetrically
        let dist = 38.0
        let isUpper = tooth.id <= 16
        
        // Offset Y away from center
        let y = isUpper ? -dist : dist
        
        // If it's a front tooth, move bubbles slightly more vertical
        // If it's a back tooth, move them horizontally
        let toothInArch = Double((tooth.id - 1) % 16)
        let xOffset = (toothInArch - 7.5) * 1.5
        
        return CGSize(width: xOffset, height: y)
    }
}

struct NumberBubble: View {
    let id: Int
    let isSelected: Bool
    let color: Color
    
    var body: some View {
        Text("\(id)")
            .font(.system(size: 8, weight: .bold))
            .foregroundColor(isSelected ? .white : .dentalDarkBlue)
            .frame(width: 16, height: 16)
            .background(
                Circle()
                    .fill(isSelected ? color : color.opacity(0.2))
                    .overlay(Circle().stroke(color.opacity(0.3), lineWidth: 1))
            )
            .shadow(color: isSelected ? color.opacity(0.5) : .clear, radius: 4)
    }
}

struct RealisticToothNode: View {
    let type: String
    let isSelected: Bool
    let color: Color
    
    var body: some View {
        ZStack {
            // Shadow
            AnatomicToothShape(type: type)
                .fill(Color.black.opacity(0.05))
                .offset(y: 2)
                .blur(radius: 2)
            
            // Base Enamel
            AnatomicToothShape(type: type)
                .fill(
                    LinearGradient(
                        colors: isSelected ? [color, color.opacity(0.6)] : [Color.white, Color(hex: "F8FAFC")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    AnatomicToothShape(type: type)
                        .stroke(isSelected ? color.opacity(0.5) : Color.blue.opacity(0.05), lineWidth: 1)
                )
            
            // Occlusal/Surface Details (Realistic fissuring)
            OcclusalDetails(type: type, isSelected: isSelected)
                .opacity(0.4)
            
            if isSelected {
                AnatomicToothShape(type: type)
                    .stroke(color.opacity(0.4), lineWidth: 4)
                    .blur(radius: 4)
            }
        }
        .frame(width: widthForType, height: heightForType)
    }
    
    private var widthForType: CGFloat {
        switch type {
        case "Molar": return 26
        case "Bicuspid": return 22
        case "Cuspid": return 20
        default: return 18
        }
    }
    
    private var heightForType: CGFloat {
        switch type {
        case "Molar": return 24
        case "Bicuspid": return 22
        case "Cuspid": return 24
        default: return 22
        }
    }
}

struct AnatomicToothShape: Shape {
    let type: String
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        
        switch type {
        case "Molar":
            // Squarish with rounded corners (Occlusal view)
            path.addRoundedRect(in: rect, cornerSize: CGSize(width: 6, height: 6))
        case "Bicuspid":
            // Oval
            path.addEllipse(in: rect)
        case "Cuspid":
            // Slightly triangular/pointed
            path.move(to: CGPoint(x: w/2, y: 0))
            path.addCurve(to: CGPoint(x: w, y: h), control1: CGPoint(x: w, y: h*0.2), control2: CGPoint(x: w*0.9, y: h*0.8))
            path.addLine(to: CGPoint(x: 0, y: h))
            path.addCurve(to: CGPoint(x: w/2, y: 0), control1: CGPoint(x: w*0.1, y: h*0.8), control2: CGPoint(x: 0, y: h*0.2))
        default: // Incisor
            // Rectangular/Chisel
            path.addRoundedRect(in: rect.insetBy(dx: 2, dy: 0), cornerSize: CGSize(width: 2, height: 2))
        }
        
        return path
    }
}

struct OcclusalDetails: View {
    let type: String
    let isSelected: Bool
    
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            
            if type == "Molar" || type == "Bicuspid" {
                // The "X" or "H" fissure pattern
                Path { path in
                    path.move(to: CGPoint(x: w * 0.2, y: h * 0.3))
                    path.addLine(to: CGPoint(x: w * 0.8, y: h * 0.7))
                    
                    path.move(to: CGPoint(x: w * 0.8, y: h * 0.3))
                    path.addLine(to: CGPoint(x: w * 0.2, y: h * 0.7))
                    
                    if type == "Molar" {
                        path.move(to: CGPoint(x: w * 0.5, y: h * 0.2))
                        path.addLine(to: CGPoint(x: w * 0.5, y: h * 0.8))
                    }
                }
                .stroke(isSelected ? Color.white.opacity(0.8) : Color.gray.opacity(0.5), lineWidth: 1)
            } else if type == "Cuspid" {
                // A single focal point for the cusp
                Circle()
                    .fill(isSelected ? .white.opacity(0.5) : .gray.opacity(0.2))
                    .frame(width: 4, height: 4)
                    .position(x: w/2, y: h/2)
            }
        }
    }
}
