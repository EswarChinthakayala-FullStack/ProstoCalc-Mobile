import SwiftUI
import Combine
import AVFoundation

struct TimerView: View {
    let exercise: Exercise
    let patientId: Int
    @Environment(\.dismiss) var dismiss
    @State private var timeLeft: Int
    @State private var isRunning = false
    @State private var showingSuccess = false
    @State private var timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    init(exercise: Exercise, patientId: Int) {
        self.exercise = exercise
        self.patientId = patientId
        _timeLeft = State(initialValue: exercise.durationSeconds)
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: isRunning)
            Color.white.opacity(0.4).ignoresSafeArea()
            
            if showingSuccess {
                SuccessAnimationView {
                    dismiss()
                }
            }else {
                normalTimerContent
            }
        }
        .onReceive(timer) { _ in
            guard isRunning else { return }
            if timeLeft > 0 {
                timeLeft -= 1
            } else {
                isRunning = false
                completeExercise()
            }
        }
        .onAppear {
            isRunning = true
        }
    }
    
    private var normalTimerContent: some View {
        VStack(spacing: 40) {
            // Header
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.primary)
                }
                Spacer()
                Text("Exercise in Progress")
                    .font(.system(size: 16, weight: .bold))
                Spacer()
                Spacer().frame(width: 20)
            }
            .padding()
            
            Text(exercise.name)
                .font(.system(size: 28, weight: .black))
            
            // Timer Circle
            ZStack {
                Circle()
                    .stroke(Color.blue.opacity(0.1), lineWidth: 15)
                
                Circle()
                    .trim(from: 0, to: CGFloat(timeLeft) / CGFloat(exercise.durationSeconds))
                    .stroke(Color.blue, style: StrokeStyle(lineWidth: 15, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 1.0), value: timeLeft)
                
                VStack(spacing: 5) {
                    Text("\(timeLeft)")
                        .font(.system(size: 80, weight: .black, design: .rounded))
                    Text("SECONDS")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 260, height: 260)
            
            VStack(spacing: 20) {
                Text("INSTRUCTION")
                    .font(.system(size: 12, weight: .black))
                    .foregroundColor(.blue)
                
                Text(exercise.instruction)
                    .font(.system(size: 18, weight: .medium))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            Spacer()
            
            // Controls
            HStack(spacing: 30) {
                Button(action: { isRunning.toggle() }) {
                    Image(systemName: isRunning ? "pause.fill" : "play.fill")
                        .font(.system(size: 30))
                        .foregroundColor(.white)
                        .frame(width: 80, height: 80)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .shadow(color: .blue.opacity(0.3), radius: 10)
                }
                
                Button(action: { dismiss() }) {
                    Text("Stop")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.red)
                        .frame(width: 120, height: 60)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(30)
                }
            }
            .padding(.bottom, 50)
        }
    }
    
    private func completeExercise() {
        Task {
            // Log to backend
            await ExerciseService.shared.logExerciseCompletion(
                userId: patientId,
                exerciseId: exercise.id,
                duration: exercise.durationSeconds,
                reps: exercise.reps
            )
            
            // Play success sound
            AudioServicesPlaySystemSound(1407) // System success sound
            
            withAnimation(.spring()) {
                showingSuccess = true
            }
        }
    }
}

struct SuccessAnimationView: View {
    var onDone: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            ZStack {
                Circle()
                    .fill(Color.green)
                    .frame(width: 120, height: 120)
                
                Image(systemName: "checkmark")
                    .font(.system(size: 60, weight: .bold))
                    .foregroundColor(.white)
            }
            .scaleEffect(1.0)
            
            Text("Clinical Protocol Met".uppercased())
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundColor(.green)
            
            Text("Great Job!")
                .font(.system(size: 32, weight: .black))
            
            Text("You've completed this exercise for today.")
                .font(.system(size: 18))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(action: onDone) {
                Text("Continue")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .background(Color.blue)
                    .cornerRadius(30)
            }
            .padding(.horizontal, 40)
            .padding(.top, 20)
        }
    }
}




// MARK: - Standalone Model
struct CheekPuffExercise {
    var id: Int = 2
    var name: String = "Cheek Puff & Shift"
    var durationSeconds: Int = 60
    var reps: Int = 3
}

struct CheekPuffAnimationView: View {
    let exercise: Exercise
    let patientId: Int
    var onComplete: () -> Void
    
    // Independent vectors for left and right cheek inflation (0.0 to 1.0)
    @State private var leftPuffAmount: CGFloat = 0.0
    @State private var rightPuffAmount: CGFloat = 0.0
    
    @State private var cycleCount = 0
    @State private var isRunning = false
    @State private var showingSuccess = false
    @State private var animationTask: Task<Void, Never>? = nil
    
    @State private var instructionText = "Puff both cheeks with air."
    @State private var subText = "Get ready..."
    
    // Brand Colors
    let bgColor = Color(red: 247/255, green: 244/255, blue: 239/255)
    let faceOutlineColor = Color(red: 200/255, green: 195/255, blue: 190/255)
    let lipColor = Color(red: 216/255, green: 61/255, blue: 61/255)
    let textColor = Color(red: 90/255, green: 90/255, blue: 90/255)
    
    var body: some View {
        ZStack {
            bgColor.ignoresSafeArea()
            
            if showingSuccess {
                // Placeholder for your SuccessAnimationView
                VStack {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.green)
                    Text("Exercise Complete!")
                        .font(.title).bold()
                }
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { onComplete() }
                }
            } else {
                VStack(spacing: 40) {
                    // MARK: - Header
                    HStack {
                        Button(action: { onComplete() }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 28))
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Text("Mouth Exercise")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(textColor)
                        Spacer()
                        Spacer().frame(width: 28)
                    }
                    .padding()
                    
                    Text(exercise.name)
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(textColor)
                    
                    Text(instructionText)
                        .font(.title3)
                        .fontWeight(.medium)
                        .foregroundColor(textColor)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 30)
                        .frame(height: 60)
                    
                    // MARK: - Realistic Vector Animation
                    ZStack {
                        // 1. Jawline & Expanding Cheeks
                        FaceContourShape(leftPuff: leftPuffAmount, rightPuff: rightPuffAmount)
                            .stroke(faceOutlineColor, style: StrokeStyle(lineWidth: 6, lineCap: .round, lineJoin: .round))
                            .frame(width: 200, height: 220)
                        
                        // 2. Left Air Pressure Indicator (Subtle Red Glow)
                        Circle()
                            .fill(RadialGradient(gradient: Gradient(colors: [Color.red.opacity(0.15), Color.clear]), center: .center, startRadius: 10, endRadius: 50))
                            .frame(width: 100, height: 100)
                            .offset(x: -80 - (leftPuffAmount * 20), y: 30)
                            .opacity(Double(leftPuffAmount))
                        
                        // 3. Right Air Pressure Indicator (Subtle Red Glow)
                        Circle()
                            .fill(RadialGradient(gradient: Gradient(colors: [Color.red.opacity(0.15), Color.clear]), center: .center, startRadius: 10, endRadius: 50))
                            .frame(width: 100, height: 100)
                            .offset(x: 80 + (rightPuffAmount * 20), y: 30)
                            .opacity(Double(rightPuffAmount))
                        
                        // 4. Closed Puckered Lips
                        // Pucker amount is derived from whichever cheek has air
                        let puckerAmount = max(leftPuffAmount, rightPuffAmount)
                        
                        ZStack {
                            ClosedUpperLipShape(pucker: puckerAmount)
                                .fill(lipColor)
                                .shadow(color: .black.opacity(0.1), radius: 2, y: 1)
                            
                            ClosedLowerLipShape(pucker: puckerAmount)
                                .fill(lipColor)
                                .shadow(color: .black.opacity(0.15), radius: 3, y: -2)
                            
                            // Center Lip Crease
                            ClosedLipCreaseShape(pucker: puckerAmount)
                                .stroke(Color.black.opacity(0.3), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                        }
                        .frame(width: 180, height: 80)
                        .offset(y: 45) // Position lips on the lower face
                    }
                    .frame(height: 250)
                    .padding(.vertical, 20)
                    
                    // MARK: - Status Text
                    Text(subText)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundColor(leftPuffAmount > 0 || rightPuffAmount > 0 ? .orange : .gray)
                    
                    Spacer()
                    
                    // MARK: - Controls
                    HStack(spacing: 30) {
                        Button(action: {
                            isRunning.toggle()
                            if isRunning { startExerciseCycle() }
                        }) {
                            Image(systemName: isRunning ? "pause.fill" : "play.fill")
                                .font(.system(size: 30))
                                .foregroundColor(.white)
                                .frame(width: 80, height: 80)
                                .background(Color.blue)
                                .clipShape(Circle())
                                .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                        }
                        
                        Button(action: { onComplete() }) {
                            Text("Stop")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.red)
                                .frame(width: 120, height: 60)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(30)
                        }
                    }
                    .padding(.bottom, 50)
                }
            }
        }
        .onAppear {
            isRunning = true
            startExerciseCycle()
        }
        .onDisappear {
            animationTask?.cancel()
        }
    }
    
    // MARK: - Complex Animation Sequence
    private func startExerciseCycle() {
        guard isRunning else { return }
        animationTask?.cancel()
        
        animationTask = Task { @MainActor in
            while !Task.isCancelled {
                
                // 1. PUFF BOTH CHEEKS
                instructionText = "Puff both cheeks with air."
                subText = "Puffing..."
                withAnimation(.easeInOut(duration: 2.0)) {
                    leftPuffAmount = 1.0
                    rightPuffAmount = 1.0
                }
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                if Task.isCancelled || !isRunning { break }
                
                subText = "Hold for 3 seconds"
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                if Task.isCancelled || !isRunning { break }
                
                // 2. SHIFT AIR LEFT
                instructionText = "Shift air to the LEFT cheek."
                subText = "Shifting..."
                withAnimation(.easeInOut(duration: 1.5)) {
                    leftPuffAmount = 1.0
                    rightPuffAmount = 0.0 // Deflate right
                }
                try? await Task.sleep(nanoseconds: 1_500_000_000)
                if Task.isCancelled || !isRunning { break }
                
                subText = "Hold Left for 3 seconds"
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                if Task.isCancelled || !isRunning { break }
                
                // 3. SHIFT AIR RIGHT
                instructionText = "Shift air to the RIGHT cheek."
                subText = "Shifting..."
                withAnimation(.easeInOut(duration: 1.5)) {
                    leftPuffAmount = 0.0 // Deflate left
                    rightPuffAmount = 1.0
                }
                try? await Task.sleep(nanoseconds: 1_500_000_000)
                if Task.isCancelled || !isRunning { break }
                
                subText = "Hold Right for 3 seconds"
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                if Task.isCancelled || !isRunning { break }
                
                // 4. RESET & REST
                instructionText = "Release the air and relax."
                subText = "Releasing..."
                withAnimation(.easeInOut(duration: 2.0)) {
                    leftPuffAmount = 0.0
                    rightPuffAmount = 0.0
                }
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                if Task.isCancelled || !isRunning { break }
                
                subText = "Rest..."
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                if Task.isCancelled || !isRunning { break }
                
                // End Cycle Logic
                cycleCount += 1
                if cycleCount >= exercise.reps {
                    completeExercise()
                    break
                }
            }
        }
    }
    
    private func completeExercise() {
        Task {
            AudioServicesPlaySystemSound(1407)
            withAnimation(.spring()) {
                showingSuccess = true
            }
        }
    }
}

// MARK: - Custom Vector Shapes

/// Draws the jawline that expands outwards symmetrically or asymmetrically.
struct FaceContourShape: Shape {
    var leftPuff: CGFloat
    var rightPuff: CGFloat
    
    // AnimatablePair allows SwiftUI to interpolate both cheek values simultaneously
    var animatableData: AnimatablePair<CGFloat, CGFloat> {
        get { AnimatablePair(leftPuff, rightPuff) }
        set {
            leftPuff = newValue.first
            rightPuff = newValue.second
        }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        let topLeft = CGPoint(x: rect.minX + 30, y: rect.minY)
        let topRight = CGPoint(x: rect.maxX - 30, y: rect.minY)
        let chin = CGPoint(x: rect.midX, y: rect.maxY)
        
        path.move(to: topLeft)
        
        // Left Jaw / Cheek
        let leftExpansion = leftPuff * 65.0
        path.addCurve(to: chin,
                      control1: CGPoint(x: rect.minX - leftExpansion, y: rect.midY - 20),
                      control2: CGPoint(x: rect.minX + 20 - leftExpansion, y: rect.maxY - 10))
        
        // Right Jaw / Cheek
        let rightExpansion = rightPuff * 65.0
        path.addCurve(to: topRight,
                      control1: CGPoint(x: rect.maxX - 20 + rightExpansion, y: rect.maxY - 10),
                      control2: CGPoint(x: rect.maxX + rightExpansion, y: rect.midY - 20))
        
        return path
    }
}

/// The stationary closed upper lip that slightly narrows horizontally when puckered.
struct ClosedUpperLipShape: Shape {
    var pucker: CGFloat
    var animatableData: CGFloat {
        get { pucker }
        set { pucker = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let shrink = pucker * 25.0 // Lips squeeze inward when cheeks puff
        
        let left = CGPoint(x: rect.minX + shrink, y: rect.midY)
        let right = CGPoint(x: rect.maxX - shrink, y: rect.midY)
        let topCenter = CGPoint(x: rect.midX, y: rect.midY - 30 - (pucker * 5))
        
        path.move(to: left)
        // Center crease line
        path.addCurve(to: right,
                      control1: CGPoint(x: rect.width * 0.3, y: rect.midY + 5),
                      control2: CGPoint(x: rect.width * 0.7, y: rect.midY + 5))
        
        // Top edge (Cupid's bow)
        path.addCurve(to: topCenter,
                      control1: CGPoint(x: rect.width * 0.85 - shrink, y: rect.midY - 35),
                      control2: CGPoint(x: rect.width * 0.65, y: rect.midY - 35))
        path.addCurve(to: left,
                      control1: CGPoint(x: rect.width * 0.35, y: rect.midY - 35),
                      control2: CGPoint(x: rect.width * 0.15 + shrink, y: rect.midY - 35))
        
        return path
    }
}

/// The stationary closed lower lip that slightly narrows when puckered.
struct ClosedLowerLipShape: Shape {
    var pucker: CGFloat
    var animatableData: CGFloat {
        get { pucker }
        set { pucker = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let shrink = pucker * 25.0
        
        let left = CGPoint(x: rect.minX + shrink, y: rect.midY)
        let right = CGPoint(x: rect.maxX - shrink, y: rect.midY)
        
        path.move(to: left)
        // Center crease line
        path.addCurve(to: right,
                      control1: CGPoint(x: rect.width * 0.3, y: rect.midY + 5),
                      control2: CGPoint(x: rect.width * 0.7, y: rect.midY + 5))
        
        // Bottom edge
        path.addCurve(to: left,
                      control1: CGPoint(x: rect.width * 0.8 - shrink, y: rect.midY + 35 + (pucker * 8)),
                      control2: CGPoint(x: rect.width * 0.2 + shrink, y: rect.midY + 35 + (pucker * 8)))
        
        return path
    }
}

/// Draws a subtle dark line separating the upper and lower lip for depth.
struct ClosedLipCreaseShape: Shape {
    var pucker: CGFloat
    var animatableData: CGFloat {
        get { pucker }
        set { pucker = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let shrink = pucker * 25.0
        
        let left = CGPoint(x: rect.minX + shrink + 2, y: rect.midY)
        let right = CGPoint(x: rect.maxX - shrink - 2, y: rect.midY)
        
        path.move(to: left)
        path.addCurve(to: right,
                      control1: CGPoint(x: rect.width * 0.3, y: rect.midY + 5),
                      control2: CGPoint(x: rect.width * 0.7, y: rect.midY + 5))
        return path
    }
}



// MARK: - Mouth Exercise Animation View



struct MouthExerciseAnimationView: View {
    let exercise: Exercise
    let patientId: Int
    var onComplete: () -> Void
    
    // We use a CGFloat (0.0 to 1.0) instead of a Bool to drive realistic vector interpolation
    @State private var openAmount: CGFloat = 0.0
    
    @State private var cycleCount = 0
    @State private var isHolding = false
    @State private var isRunning = true
    @State private var showingSuccess = false
    @State private var animationTask: Task<Void, Never>? = nil
    
    // Exact colors from the reference image
    let cavityColor = Color(red: 42/255, green: 50/255, blue: 56/255)
    let lipColor = Color(red: 216/255, green: 61/255, blue: 61/255)
    let lipHighlightColor = Color(red: 235/255, green: 115/255, blue: 115/255)
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: isRunning)
            Color(red: 247/255, green: 244/255, blue: 239/255).opacity(0.95).ignoresSafeArea()
            
            if showingSuccess {
                SuccessAnimationView {
                    onComplete()
                }
            } else {
                VStack(spacing: 40) {
                    // MARK: - Header
                    HStack {
                        Button(action: { onComplete() }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 28))
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Text("Mouth Exercise")
                            .font(.system(size: 16, weight: .bold))
                        Spacer()
                        Spacer().frame(width: 28)
                    }
                    .padding()
                    
                    Text(exercise.name)
                        .font(.system(size: 28, weight: .black, design: .rounded))
                    
                    Text("Slowly open your mouth as wide as possible without pain.")
                        .font(.title3)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // MARK: - Realistic Vector Mouth Animation
                    ZStack {
                        // 1. Dark Inner Cavity
                        MouthCavityShape(openAmount: openAmount)
                            .fill(cavityColor)
                        
                        // 2. Teeth (Clipped directly to the cavity bounds)
                        ZStack {
                            // Upper Teeth (Stationary)
                            UpperTeethShape()
                                .fill(Color.white)
                                .offset(y: -5)
                            
                            // Lower Teeth (Moves down with the lower lip)
                            LowerTeethShape()
                                .fill(Color.white)
                                // Drops proportionally with the jaw
                                .offset(y: openAmount * 115 + 10)
                        }
                        .clipShape(MouthCavityShape(openAmount: openAmount))
                        
                        // 3. Lips
                        UpperLipShape()
                            .fill(lipColor)
                        
                        LowerLipShape(openAmount: openAmount)
                            .fill(lipColor)
                        
                        // 4. Glossy Highlights
                        LipHighlightsShape(openAmount: openAmount)
                            .stroke(lipHighlightColor, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    }
                    .frame(width: 260, height: 180)
                    .padding(.vertical, 30)
                    
                    // MARK: - Status Text
                    if isHolding {
                        Text("Hold for 5 seconds")
                            .font(.headline)
                            .foregroundColor(.blue)
                    } else if openAmount > 0 {
                        Text("Opening...")
                            .font(.headline)
                            .foregroundColor(.orange)
                    } else {
                        Text("Close and rest")
                            .font(.headline)
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // MARK: - Controls
                    HStack(spacing: 30) {
                        Button(action: {
                            isRunning.toggle()
                            if isRunning { startExerciseCycle() }
                        }) {
                            Image(systemName: isRunning ? "pause.fill" : "play.fill")
                                .font(.system(size: 30))
                                .foregroundColor(.white)
                                .frame(width: 80, height: 80)
                                .background(Color.blue)
                                .clipShape(Circle())
                                .shadow(color: .blue.opacity(0.3), radius: 10, y: 5)
                        }
                        
                        Button(action: { onComplete() }) {
                            Text("Stop")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.red)
                                .frame(width: 120, height: 60)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(30)
                        }
                    }
                    .padding(.bottom, 50)
                }
            }
        }
        .onAppear {
            startExerciseCycle()
        }
        .onDisappear {
            animationTask?.cancel()
        }
    }
    
    // MARK: - Animation Timing
    private func startExerciseCycle() {
        guard isRunning else { return }
        animationTask?.cancel()
        
        animationTask = Task { @MainActor in
            // OPEN
            withAnimation(.easeInOut(duration: 3)) {
                openAmount = 1.0
            }
            
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard isRunning, !Task.isCancelled else { return }
            
            // HOLD
            isHolding = true
            
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            guard isRunning, !Task.isCancelled else { return }
            
            isHolding = false
            
            // CLOSE
            withAnimation(.easeInOut(duration: 3)) {
                openAmount = 0.0
            }
            
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard isRunning, !Task.isCancelled else { return }
            
            cycleCount += 1
            
            if cycleCount >= exercise.reps {
                completeExercise()
            } else {
                try? await Task.sleep(nanoseconds: 1_500_000_000)
                guard isRunning, !Task.isCancelled else { return }
                startExerciseCycle()
            }
        }
    }
    
    private func completeExercise() {
        Task {
            await ExerciseService.shared.logExerciseCompletion(
                userId: patientId,
                exerciseId: exercise.id,
                duration: exercise.durationSeconds,
                reps: exercise.reps
            )
            AudioServicesPlaySystemSound(1407)
            withAnimation(.spring()) {
                showingSuccess = true
            }
        }
    }
}

// MARK: - Realistic Custom Shapes (Updated for Image Match)

/// The dark background of the open mouth
struct MouthCavityShape: Shape {
    var openAmount: CGFloat
    var animatableData: CGFloat {
        get { openAmount }
        set { openAmount = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let left = CGPoint(x: rect.minX, y: rect.midY)
        let right = CGPoint(x: rect.maxX, y: rect.midY)
        let maxDrop = openAmount * 120.0
        
        path.move(to: left)
        path.addCurve(to: right,
                      control1: CGPoint(x: rect.width * 0.25, y: rect.midY - 25),
                      control2: CGPoint(x: rect.width * 0.75, y: rect.midY - 25))
        path.addCurve(to: left,
                      control1: CGPoint(x: rect.width * 0.75, y: rect.midY + maxDrop),
                      control2: CGPoint(x: rect.width * 0.25, y: rect.midY + maxDrop))
        return path
    }
}

/// The stationary upper lip with a Cupid's bow
struct UpperLipShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let left = CGPoint(x: rect.minX, y: rect.midY)
        let right = CGPoint(x: rect.maxX, y: rect.midY)
        let topCenter = CGPoint(x: rect.midX, y: rect.midY - 45)
        
        path.move(to: left)
        path.addCurve(to: right,
                      control1: CGPoint(x: rect.width * 0.25, y: rect.midY - 25),
                      control2: CGPoint(x: rect.width * 0.75, y: rect.midY - 25))
        
        path.addCurve(to: topCenter,
                      control1: CGPoint(x: rect.width * 0.85, y: rect.midY - 50),
                      control2: CGPoint(x: rect.width * 0.65, y: rect.midY - 55))
        path.addCurve(to: left,
                      control1: CGPoint(x: rect.width * 0.35, y: rect.midY - 55),
                      control2: CGPoint(x: rect.width * 0.15, y: rect.midY - 50))
        return path
    }
}

/// The animatable lower lip
struct LowerLipShape: Shape {
    var openAmount: CGFloat
    var animatableData: CGFloat {
        get { openAmount }
        set { openAmount = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let left = CGPoint(x: rect.minX, y: rect.midY)
        let right = CGPoint(x: rect.maxX, y: rect.midY)
        
        let topDrop = openAmount * 120.0
        let bottomDrop = topDrop + 45.0
        
        path.move(to: left)
        path.addCurve(to: right,
                      control1: CGPoint(x: rect.width * 0.25, y: rect.midY + topDrop),
                      control2: CGPoint(x: rect.width * 0.75, y: rect.midY + topDrop))
        
        path.addCurve(to: left,
                      control1: CGPoint(x: rect.width * 0.8, y: rect.midY + bottomDrop),
                      control2: CGPoint(x: rect.width * 0.2, y: rect.midY + bottomDrop))
        return path
    }
}

/// Glossy light-red highlights on the lips
struct LipHighlightsShape: Shape {
    var openAmount: CGFloat
    var animatableData: CGFloat {
        get { openAmount }
        set { openAmount = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        // Upper left highlight
        path.move(to: CGPoint(x: rect.width * 0.35, y: rect.midY - 38))
        path.addQuadCurve(to: CGPoint(x: rect.width * 0.45, y: rect.midY - 45),
                          control: CGPoint(x: rect.width * 0.4, y: rect.midY - 43))
        
        // Upper right highlight
        path.move(to: CGPoint(x: rect.width * 0.55, y: rect.midY - 45))
        path.addQuadCurve(to: CGPoint(x: rect.width * 0.65, y: rect.midY - 38),
                          control: CGPoint(x: rect.width * 0.6, y: rect.midY - 43))
        
        // Lower center highlight (drops dynamically)
        let bottomDrop = (openAmount * 120.0) + 30.0
        path.move(to: CGPoint(x: rect.width * 0.4, y: rect.midY + bottomDrop))
        path.addQuadCurve(to: CGPoint(x: rect.width * 0.6, y: rect.midY + bottomDrop),
                          control: CGPoint(x: rect.width * 0.5, y: rect.midY + bottomDrop + 5))
        
        return path
    }
}

/// Wavy upper teeth
struct UpperTeethShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.width * 0.65
        let startX = (rect.width - width) / 2
        
        let box = CGRect(x: startX, y: rect.midY - 20, width: width, height: 35)
        
        path.move(to: CGPoint(x: box.minX, y: box.minY))
        path.addLine(to: CGPoint(x: box.maxX, y: box.minY))
        path.addLine(to: CGPoint(x: box.maxX, y: box.maxY - 10))
        
        path.addCurve(to: CGPoint(x: box.minX, y: box.maxY - 10),
                      control1: CGPoint(x: box.maxX - (width * 0.3), y: box.maxY + 5),
                      control2: CGPoint(x: box.minX + (width * 0.3), y: box.maxY + 5))
        
        path.closeSubpath()
        return path
    }
}

/// Gently curved lower teeth
struct LowerTeethShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.width * 0.55
        let startX = (rect.width - width) / 2
        
        let box = CGRect(x: startX, y: rect.midY - 5, width: width, height: 25)
        
        path.move(to: CGPoint(x: box.minX, y: box.maxY))
        path.addLine(to: CGPoint(x: box.maxX, y: box.maxY))
        path.addLine(to: CGPoint(x: box.maxX, y: box.minY + 5))
        
        path.addCurve(to: CGPoint(x: box.minX, y: box.minY + 5),
                      control1: CGPoint(x: box.maxX - (width * 0.3), y: box.minY - 5),
                      control2: CGPoint(x: box.minX + (width * 0.3), y: box.minY - 5))
        
        path.closeSubpath()
        return path
    }
}
