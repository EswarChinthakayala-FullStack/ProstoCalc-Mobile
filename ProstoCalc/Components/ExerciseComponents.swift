import SwiftUI

// MARK: - 1. Progress Ring View
struct ProgressRingView: View {
    let progress: Double // 0 to 100
    let label: String
    let sublabel: String
    
    private var clinicalColor: Color {
        if progress >= 100 { return .green }
        if progress >= 40 { return .blue }
        return .orange
    }
    
    var body: some View {
        VStack(spacing: 25) {
            ZStack {
                // Outer subtle glow
                Circle()
                    .stroke(clinicalColor.opacity(0.05), lineWidth: 35)
                
                // Track
                Circle()
                    .stroke(clinicalColor.opacity(0.1), lineWidth: 20)
                
                // Progress with Gradient
                Circle()
                    .trim(from: 0, to: CGFloat(min(progress / 100, 1.0)))
                    .stroke(
                        LinearGradient(
                            colors: [clinicalColor, clinicalColor.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .shadow(color: clinicalColor.opacity(0.3), radius: 10, x: 0, y: 5)
                
                VStack(spacing: 4) {
                    Text("\(Int(progress))%")
                        .font(.system(size: 44, weight: .black, design: .rounded))
                    Text("DAILY TARGET")
                        .font(.system(size: 10, weight: .black))
                        .tracking(1)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 200, height: 200)
            
            HStack(spacing: 0) {
                VStack(spacing: 8) {
                    MetricItem(label: "CURRENT", value: label, icon: "mouth.fill")
                    
                    Button(action: { showingMeasurementSheet = true }) {
                        Text("UPDATE")
                            .font(.system(size: 9, weight: .black))
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.blue)
                            .cornerRadius(6)
                    }
                }
                
                Divider()
                    .frame(height: 30)
                    .padding(.horizontal, 25)
                
                MetricItem(label: "GROWTH", value: sublabel, icon: "chart.line.uptrend.xyaxis", color: .green)
            }
        }
        .padding(30)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 32)
                    .fill(Color.white.opacity(0.8))
                RoundedRectangle(cornerRadius: 32)
                    .stroke(Color.white.opacity(0.5), lineWidth: 1)
            }
        )
        .shadow(color: .black.opacity(0.05), radius: 20, y: 10)
        .sheet(isPresented: $showingMeasurementSheet) {
            MeasurementEntrySheet(patientId: patientId)
        }
    }
    
    @State private var showingMeasurementSheet = false
    let patientId: Int
}

struct MetricItem: View {
    let label: String
    let value: String
    let icon: String
    var color: Color = .blue
    
    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .bold))
                Text(label)
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundColor(.secondary)
            
            Text(value)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(color)
        }
    }
}

// MARK: - 2. Exercise Card View
struct ExerciseCard: View {
    let exercise: Exercise
    let isCompleted: Bool
    let onStart: () -> Void
    
    var body: some View {
        Button(action: { if !isCompleted { onStart() } }) {
            HStack(spacing: 20) {
                // Icon with medical container
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: isCompleted ? [.green.opacity(0.1), .green.opacity(0.05)] : [.blue.opacity(0.1), .blue.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 70, height: 70)
                    
                    Image(systemName: exercise.iconName)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(isCompleted ? .green : .blue)
                        .symbolRenderingMode(.hierarchical)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(exercise.name.uppercased())
                        .font(.system(size: 12, weight: .black))
                        .tracking(0.5)
                        .foregroundColor(.secondary)
                    
                    Text(isCompleted ? "Protocol Finished" : "Next Session")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.primary)
                    
                    HStack(spacing: 12) {
                        Label("\(exercise.durationSeconds)s", systemImage: "timer")
                        Label("\(exercise.reps) Reps", systemImage: "repeat")
                    }
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.blue.opacity(0.6))
                }
                
                Spacer()
                
                if isCompleted {
                    ZStack {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 32, height: 32)
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .black))
                            .foregroundColor(.white)
                    }
                } else {
                    Image(systemName: "play.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(.blue)
                        .symbolRenderingMode(.hierarchical)
                }
            }
            .padding(18)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.white.opacity(0.8))
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(isCompleted ? Color.green.opacity(0.1) : Color.blue.opacity(0.1), lineWidth: 1)
                }
            )
            .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isCompleted ? 0.98 : 1.0)
        .opacity(isCompleted ? 0.8 : 1.0)
    }
}

// MARK: - 3. Weekly Compliance Chart
// MARK: - 3. Weekly Compliance Chart (Area Graph Version)
struct WeeklyChartView: View {
    let data: [ComplianceDay]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 25) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("ANALYTICS")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.blue)
                        .tracking(1)
                    Text("Weekly Progress")
                        .font(.system(size: 20, weight: .bold))
                }
                Spacer()
                Image(systemName: "chart.xyaxis.line")
                    .foregroundColor(.blue.opacity(0.3))
            }
            
            if data.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.system(size: 30))
                            .foregroundColor(.blue.opacity(0.1))
                        Text("No Data Collected Yet")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                .frame(height: 150)
            } else {
                ClinicalAreaGraph(data: data)
                    .frame(height: 150)
            }
            
            let avg = data.isEmpty ? 0 : Int(data.map({$0.percentage}).reduce(0, +) / Double(data.count))
            
            HStack {
                Label("Avg Compliance: \(avg)%", systemImage: "checkmark.shield.fill")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.blue)
                Spacer()
                if avg >= 80 {
                    Text("OPTIMAL RECOVERY 🚀")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.green)
                }
            }
            .padding(.top, 10)
        }
        .padding(25)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 32)
                    .fill(Color.white.opacity(0.8))
                RoundedRectangle(cornerRadius: 32)
                    .stroke(Color.white.opacity(0.4), lineWidth: 1)
            }
        )
    }
}

struct ClinicalAreaGraph: View {
    let data: [ComplianceDay]
    
    var body: some View {
        GeometryReader { geo in
            let points = data.enumerated().map { (index, day) -> CGPoint in
                let x = geo.size.width * CGFloat(index) / CGFloat(max(data.count - 1, 1))
                let y = geo.size.height * (1 - CGFloat(day.percentage / 100))
                return CGPoint(x: x, y: y)
            }
            
            ZStack {
                // Horizontal Grid Lines
                VStack {
                    ForEach(0..<5) { i in
                        Divider().background(Color.blue.opacity(0.05))
                        Spacer()
                    }
                }
                
                // Area fill
                Path { path in
                    path.move(to: CGPoint(x: 0, y: geo.size.height))
                    for point in points {
                        path.addLine(to: point)
                    }
                    path.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [.blue.opacity(0.2), .blue.opacity(0.01)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                
                // Connection Line
                Path { path in
                    path.move(to: points.first ?? .zero)
                    for point in points {
                        path.addLine(to: point)
                    }
                }
                .stroke(
                    LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing),
                    style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round)
                )
                
                // Data Points
                ForEach(0..<points.count, id: \.self) { i in
                    Circle()
                        .fill(.white)
                        .frame(width: 10, height: 10)
                        .shadow(radius: 2)
                        .overlay(Circle().stroke(Color.blue, lineWidth: 2))
                        .position(points[i])
                }
            }
        }
    }
}

// MARK: - 4. Streak & AI Insights
struct StreakView: View {
    let count: Int
    
    var body: some View {
        HStack {
            if #available(iOS 18.0, *) {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                    .font(.system(size: 24))
                    .symbolEffect(.bounce, options: .repeating)
            } else {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                    .font(.system(size: 24))
            }
            
            VStack(alignment: .leading) {
                Text("\(count) Day Streak")
                    .font(.system(size: 18, weight: .black))
                Text("Keep up the great work!")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.orange.opacity(0.1))
        )
    }
}

// MARK: - 5. Daily Checklist View
struct DailyChecklistView: View {
    let exercises: [Exercise]
    let completedIds: [Int]
    
    private var completionPercentage: Int {
        guard !exercises.isEmpty else { return 0 }
        return Int(Double(completedIds.count) / Double(exercises.count) * 100)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CLINICAL CHECKLIST")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.blue)
                        .tracking(1)
                    Text("Session Status")
                        .font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Text("\(completionPercentage)%")
                    .font(.system(size: 14, weight: .black))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
            }
            
            VStack(spacing: 12) {
                ForEach(exercises) { exercise in
                    HStack(spacing: 15) {
                        Image(systemName: completedIds.contains(exercise.id) ? "checkmark.seal.fill" : "circle.dotted")
                            .foregroundColor(completedIds.contains(exercise.id) ? .green : .blue.opacity(0.3))
                            .font(.system(size: 20))
                        
                        Text(exercise.name)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(completedIds.contains(exercise.id) ? .primary : .secondary)
                        
                        Spacer()
                        
                        if completedIds.contains(exercise.id) {
                            Text("DONE")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.green)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(4)
                        }
                    }
                    .padding(14)
                    .background(Color.white.opacity(0.5))
                    .cornerRadius(16)
                }
            }
        }
        .padding(24)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.white.opacity(0.6))
                RoundedRectangle(cornerRadius: 24)
                    .stroke(Color.white.opacity(0.5), lineWidth: 1)
            }
        )
    }
}

// MARK: - 6. Exercise Settings Sheet
struct ExerciseSettingsSheet: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var service = ExerciseService.shared
    let patientId: Int
    @State private var showingResetAlert = false
    
    // Helper for date picking
    private var morningTimeBinding: Binding<Date> {
        Binding(
            get: { stringToDate(service.settings.morningTime) },
            set: { service.settings.morningTime = dateToString($0) }
        )
    }
    
    private var eveningTimeBinding: Binding<Date> {
        Binding(
            get: { stringToDate(service.settings.eveningTime) },
            set: { service.settings.eveningTime = dateToString($0) }
        )
    }
    
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("TREATMENT REMINDERS").font(.system(size: 11, weight: .black))) {
                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $service.settings.morningReminder) {
                            Label("Morning Routine", systemImage: "sun.max.fill")
                                .foregroundColor(.orange)
                        }
                        .onChange(of: service.settings.morningReminder) { _ in save() }
                        
                        if service.settings.morningReminder {
                            DatePicker("Schedule Time", selection: morningTimeBinding, displayedComponents: .hourAndMinute)
                                .datePickerStyle(.compact)
                                .onChange(of: service.settings.morningTime) { _ in save() }
                        }
                    }
                    .padding(.vertical, 4)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $service.settings.eveningReminder) {
                            Label("Evening Routine", systemImage: "moon.stars.fill")
                                .foregroundColor(.blue)
                        }
                        .onChange(of: service.settings.eveningReminder) { _ in save() }
                        
                        if service.settings.eveningReminder {
                            DatePicker("Schedule Time", selection: eveningTimeBinding, displayedComponents: .hourAndMinute)
                                .datePickerStyle(.compact)
                                .onChange(of: service.settings.eveningTime) { _ in save() }
                        }
                    }
                    .padding(.vertical, 4)
                }
                
                Section(header: Text("AI SMART FEATURES").font(.system(size: 11, weight: .black))) {
                    Toggle(isOn: $service.settings.smartReminders) {
                        Label("Smart Compliance Bot", systemImage: "sparkles")
                            .foregroundColor(.purple)
                    }
                    .onChange(of: service.settings.smartReminders) { _ in save() }
                }
                
                Section {
                    Button(role: .destructive, action: { showingResetAlert = true }) {
                        HStack {
                            Text("Reset Progress Data")
                            Spacer()
                            Image(systemName: "trash")
                        }
                    }
                }
            }
            .navigationTitle("Therapy Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .fontWeight(.bold)
                }
            }
            .alert("Reset Progress?", isPresented: $showingResetAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Reset All", role: .destructive) { resetProgress() }
            } message: {
                Text("All your exercise logs will be cleared. Settings will be kept.")
            }
        }
    }
    
    private func save() {
        Task {
            await service.saveSettings()
            ReminderManager.shared.scheduleTherapyReminders(settings: service.settings)
        }
    }
    
    private func resetProgress() {
        Task {
            await service.resetProgress(userId: patientId)
        }
    }
    
    private func stringToDate(_ time: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.date(from: time) ?? formatter.date(from: "09:00:00")!
    }
    
    private func dateToString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }
}

// MARK: - 7. Mistral AI Clinical Insights
struct MistralAIInsightView: View {
    @ObservedObject var service = ExerciseService.shared
    let patientId: Int
    @State private var isAnalyzing = false
    @State private var showingHistory = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.orange, .red.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 40, height: 40)
                    Image(systemName: "sparkles")
                        .foregroundColor(.white)
                        .font(.system(size: 18, weight: .bold))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("AI CLINICAL INTEL")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.orange)
                        .tracking(1.5)
                    Text("Smart Progress Analysis")
                        .font(.system(size: 16, weight: .bold))
                }
                
                Spacer()
                
                if isAnalyzing {
                    ProgressView()
                        .tint(.orange)
                } else {
                    Button(action: { analyze() }) {
                        Circle()
                            .fill(.white)
                            .frame(width: 32, height: 32)
                            .shadow(color: .black.opacity(0.05), radius: 5)
                            .overlay(
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.orange)
                            )
                    }
                }
            }
            
            if let insight = service.latestAIInsight {
                VStack(spacing: 16) {
                    // Main Explanation Card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "doc.text.magnifyingglass")
                                .foregroundColor(.blue)
                            Text("CLINICAL SYNTHESIS")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.blue.opacity(0.7))
                        }
                        
                        Text(insight.analysis)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.primary.opacity(0.85))
                            .lineSpacing(6)
                            .fixedSize(horizontal: false, vertical: false)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
                    
                    // Row-wise Action Cards
                    VStack(spacing: 12) {
                        // Improvement Card
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .font(.system(size: 12))
                                Text("UPGRADE PROTOCOL")
                                    .font(.system(size: 9, weight: .black))
                            }
                            .foregroundColor(.green)
                            
                            Text(insight.improvement)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.primary.opacity(0.8))
                                .lineSpacing(4)
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.green.opacity(0.05))
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.green.opacity(0.1), lineWidth: 1)
                        )
                        
                        // Precautions Card
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: "shield.lefthalf.filled")
                                    .font(.system(size: 12))
                                Text("CLINICAL ADVISORY")
                                    .font(.system(size: 9, weight: .black))
                            }
                            .foregroundColor(.red)
                            
                            Text(insight.precautions)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.primary.opacity(0.8))
                                .lineSpacing(4)
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.05))
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.red.opacity(0.1), lineWidth: 1)
                        )
                    }
                    
                }
            } else {
                VStack(spacing: 15) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 40))
                        .foregroundColor(.orange.opacity(0.3))
                    
                    Text("Baseline Analysis Required")
                        .font(.system(size: 14, weight: .bold))
                    
                    Text("Complete a few sessions to generate clinical-grade AI insights specifically for your recovery path.")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    Button(action: { analyze() }) {
                        Text("Initialize Analysis")
                            .font(.system(size: 12, weight: .black))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color.orange)
                            .cornerRadius(12)
                    }
                    .padding(.top, 5)
                }
                .padding(.vertical, 20)
                .frame(maxWidth: .infinity)
            }
        }
        .padding(20)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 32)
                    .fill(Color.orange.opacity(0.03))
                RoundedRectangle(cornerRadius: 32)
                    .stroke(Color.orange.opacity(0.1), lineWidth: 1)
                
                // Top-right blurred accent
                Circle()
                    .fill(Color.orange.opacity(0.05))
                    .frame(width: 150, height: 150)
                    .blur(radius: 40)
                    .offset(x: 150, y: -100)
            }
        )
        .fullScreenCover(isPresented: $showingHistory) {
            AnalysisHistoryView(history: service.aiHistory, isPresented: $showingHistory)
        }
    }
    
    private func analyze() {
        isAnalyzing = true
        Task {
            await service.runAIAnalysis(userId: patientId)
            isAnalyzing = false
        }
    }
}

struct AnalysisHistoryView: View {
    let history: [AIInsight]
    var isPresented: Binding<Bool>? = nil
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ZStack {
            
            DentalBackgroundView(animate: true, isDentist: false)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                // MARK: Custom Header
                HStack {
                    
                    if let isPresented = isPresented {
                        CloseButton {
                            isPresented.wrappedValue = false
                        }
                    } else {
                        BackButton {
                            dismiss()
                        }
                    }
                    
                    Spacer()
                    
                    Text("Clinical Evolution")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    // symmetry spacer
                    Color.clear
                        .frame(width: 36, height: 36)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                
                
                // MARK: Content
                if history.isEmpty {
                    
                    VStack(spacing: 20) {
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 60))
                            .foregroundColor(.orange.opacity(0.3))
                        
                        Text("No insights generated yet.")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    .frame(maxHeight: .infinity)
                    
                } else {
                    
                    ScrollView {
                        VStack(spacing: 20) {
                            
                            ForEach(history) { insight in
                                
                                NavigationLink(destination: AnalysisDetailView(insight: insight)) {
                                    
                                    VStack(alignment: .leading, spacing: 15) {
                                        
                                        HStack {
                                            ZStack {
                                                Circle()
                                                    .fill(Color.orange.opacity(0.1))
                                                    .frame(width: 36, height: 36)
                                                
                                                Image(systemName: "sparkles")
                                                    .foregroundColor(.orange)
                                                    .font(.system(size: 14))
                                            }
                                            
                                            VStack(alignment: .leading, spacing: 2) {
                                                
                                                Text("CLINICAL SYNTHESIS")
                                                    .font(.system(size: 9, weight: .black))
                                                    .foregroundColor(.orange)
                                                    .tracking(1)
                                                
                                                Text(formatDate(insight.createdAt ?? ""))
                                                    .font(.system(size: 13, weight: .bold))
                                                    .foregroundColor(.primary)
                                            }
                                            
                                            Spacer()
                                            
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(.gray.opacity(0.4))
                                        }
                                        
                                        Text(insight.analysis)
                                            .font(.system(size: 14))
                                            .foregroundColor(.secondary)
                                            .lineLimit(2)
                                            .multilineTextAlignment(.leading)
                                        
                                        Divider()
                                            .background(Color.orange.opacity(0.1))
                                        
                                        HStack {
                                            Label("View Detail", systemImage: "doc.text.magnifyingglass")
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundColor(.blue)
                                            
                                            Spacer()
                                        }
                                    }
                                    .padding(20)
                                    .background(Color.white.opacity(0.9))
                                    .cornerRadius(24)
                                    .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(25)
                    }
                }
            }
        }
        .navigationBarHidden(true)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter8601 = ISO8601DateFormatter()
        formatter8601.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        let rawDateString = dateString.replacingOccurrences(of: " ", with: "T")
        
        guard let date = formatter8601.date(from: rawDateString) ?? ISO8601DateFormatter().date(from: rawDateString) else {
            return dateString
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM d, h:mm a"
        return formatter.string(from: date)
    }
}

struct AnalysisDetailView: View {
    let insight: AIInsight
    
    var body: some View {
        ScrollView {
            ZStack {
                DentalBackgroundView(animate: false, isDentist: false)
                    .ignoresSafeArea()
                
                VStack(spacing: 25) {
                    // Header Date Card
                    VStack(spacing: 12) {
                        Text(formatDate(insight.createdAt ?? ""))
                            .font(.system(size: 11, weight: .black))
                            .tracking(2)
                            .foregroundColor(.orange)
                        
                        Text("Session Clinical Report")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    .padding(.top, 20)
                    
                    // Main Analysis Card
                    VStack(alignment: .leading, spacing: 20) {
                        HStack {
                            Image(systemName: "text.alignleft")
                            Text("AI EXPLANATION")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                        }
                        .foregroundColor(.blue)
                        
                        Text(insight.analysis)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.primary.opacity(0.8))
                            .lineSpacing(8)
                    }
                    .padding(30)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(32)
                    .shadow(color: .black.opacity(0.05), radius: 20, y: 10)
                    
                    // Recommendations Row
                    VStack(spacing: 15) {
                        // Improvement
                        VStack(alignment: .leading, spacing: 12) {
                            Label("IMPROVEMENT PROTOCOL", systemImage: "chart.line.uptrend.xyaxis")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.green)
                            
                            Text(insight.improvement)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.primary.opacity(0.7))
                                .lineSpacing(4)
                        }
                        .padding(25)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.green.opacity(0.05))
                        .cornerRadius(24)
                        
                        // Precautions
                        VStack(alignment: .leading, spacing: 12) {
                            Label("CLINICAL ADVISORY", systemImage: "shield.lefthalf.filled")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.red)
                            
                            Text(insight.precautions)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.primary.opacity(0.7))
                                .lineSpacing(4)
                        }
                        .padding(25)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.05))
                        .cornerRadius(24)
                    }
                    
                    Spacer().frame(height: 50)
                }
                .padding(.horizontal, 25)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .background(Color.blue.opacity(0.02))
    }
    
    private func formatDate(_ dateString: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: dateString.replacingOccurrences(of: " ", with: "T")) else {
            return dateString
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d @ h:mm a"
        return formatter.string(from: date)
    }
}
// MARK: - 9. Measurement Entry Sheet
struct MeasurementEntrySheet: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var service = ExerciseService.shared
    let patientId: Int
    
    @State private var measurement: String = ""
    @State private var isSaving = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 30) {
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(Color.blue.opacity(0.1))
                            .frame(width: 80, height: 80)
                        Image(systemName: "mouth.fill")
                            .font(.system(size: 30))
                            .foregroundColor(.blue)
                    }
                    
                    Text("Mouth Opening")
                        .font(.system(size: 24, weight: .black))
                    Text("Enter your current maximum opening in millimeters.")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                .padding(.top, 40)
                
                HStack(alignment: .lastTextBaseline, spacing: 10) {
                    TextField("0.0", text: $measurement)
                        .font(.system(size: 60, weight: .black, design: .rounded))
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.center)
                        .frame(width: 150)
                    
                    Text("mm")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 20)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.gray.opacity(0.05))
                )
                
                Spacer()
                
                Button(action: { save() }) {
                    HStack {
                        if isSaving {
                            ProgressView().tint(.white)
                        } else {
                            Text("SAVE MEASUREMENT")
                                .font(.system(size: 14, weight: .black))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(measurement.isEmpty ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(16)
                    .padding(.horizontal, 25)
                }
                .disabled(measurement.isEmpty || isSaving)
                .padding(.bottom, 30)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                if let current = service.progress?.currentOpening {
                    measurement = String(format: "%.1f", current)
                }
            }
        }
    }
    
    private func save() {
        guard let val = Double(measurement) else { return }
        isSaving = true
        Task {
            await service.logMeasurement(userId: patientId, measurement: val)
            isSaving = false
            dismiss()
        }
    }
}
