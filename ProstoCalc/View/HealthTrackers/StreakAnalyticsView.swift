import SwiftUI
import Charts

// MARK: - Streak Analytics View (Production)
struct StreakAnalyticsView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    @StateObject private var viewModel = StreakAnalyticsViewModel()
    @State private var selectedRange = 30
    @State private var showContent = false
    
    // Clinical color palette
    private let primary = Color(red: 0.20, green: 0.45, blue: 0.90)
    private let primaryFaint = Color(red: 0.93, green: 0.95, blue: 1.0)
    private let textPrimary = Color(red: 0.10, green: 0.12, blue: 0.18)
    private let textSecondary = Color(red: 0.42, green: 0.45, blue: 0.52)
    private let textTertiary = Color(red: 0.60, green: 0.63, blue: 0.68)
    private let cardBorder = Color(red: 0.90, green: 0.92, blue: 0.95)
    private let green = Color(red: 0.16, green: 0.72, blue: 0.42)
    private let red = Color(red: 0.88, green: 0.28, blue: 0.22)
    private let orange = Color(red: 0.92, green: 0.55, blue: 0.12)
    @State private var pulse = false
    
    var body: some View {
        ZStack {
            // White & Blue animated background
            ZStack {
                Color.white.ignoresSafeArea()
                
                // Soft blue gradient at top
                LinearGradient(
                    colors: [
                        Color(red: 0.90, green: 0.94, blue: 1.0),
                        Color.white
                    ],
                    startPoint: .top,
                    endPoint: .center
                )
                .ignoresSafeArea()
                
                // Animated floating blue orbs
                Circle()
                    .fill(
                        RadialGradient(colors: [
                            Color(red: 0.40, green: 0.65, blue: 1.0).opacity(0.12),
                            Color.clear
                        ], center: .center, startRadius: 0, endRadius: 180)
                    )
                    .frame(width: 360, height: 360)
                    .offset(x: pulse ? -50 : 50, y: pulse ? -80 : 40)
                    .blur(radius: 60)
                
                Circle()
                    .fill(
                        RadialGradient(colors: [
                            Color(red: 0.30, green: 0.55, blue: 0.95).opacity(0.08),
                            Color.clear
                        ], center: .center, startRadius: 0, endRadius: 140)
                    )
                    .frame(width: 280, height: 280)
                    .offset(x: pulse ? 60 : -40, y: pulse ? 120 : 200)
                    .blur(radius: 50)
                
                // Soft scattered dots
                ForEach(0..<6, id: \.self) { i in
                    Circle()
                        .fill(Color(red: 0.40, green: 0.60, blue: 1.0).opacity(0.06))
                        .frame(width: CGFloat.random(in: 6...14), height: CGFloat.random(in: 6...14))
                        .offset(
                            x: CGFloat.random(in: -160...160),
                            y: CGFloat.random(in: -300...300)
                        )
                        .blur(radius: 2)
                }
            }
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.easeInOut(duration: 7).repeatForever(autoreverses: true)) {
                    pulse.toggle()
                }
            }
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Header
                    headerSection
                    
                    // Content
                    VStack(spacing: 16) {
                        // Time Range
                        segmentedControl
                        
                        // Daily Check-in Card
                        dailyCheckInCard
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 12)
                        
                        // Tobacco-Free Card
                        tobaccoFreeCard
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 12)
                        
                        // Physiotherapy Card
                        physioCard
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 12)
                        
                        // Behavioral Stability
                        stabilityChart
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 12)
                        
                        // Relapse Risk
                        relapseRiskSection
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 12)
                        
                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            viewModel.fetchAnalytics(patientId: patientId)
            withAnimation(.easeOut(duration: 0.5).delay(0.15)) {
                showContent = true
            }
        }
        .onChange(of: selectedRange) { newValue in
            viewModel.selectedRange = newValue
            viewModel.fetchAnalytics(patientId: patientId)
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.teal)
                }
                Spacer()
            }
            .padding(.bottom, 6)
            
            Text("Your Progress")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(textPrimary)
            Text("Behavioral Recovery Metrics")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(textTertiary)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 16)
    }
    
    // MARK: - Segmented Control
    private var segmentedControl: some View {
        HStack(spacing: 0) {
            ForEach([(7, "7D"), (30, "30D"), (90, "90D")], id: \.0) { range in
                Button(action: {
                    withAnimation(.spring(response: 0.3)) {
                        selectedRange = range.0
                    }
                }) {
                    Text(range.1)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(selectedRange == range.0 ? .white : textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            selectedRange == range.0
                            ? AnyView(
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [primary, Color(red: 0.40, green: 0.62, blue: 1.0)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .shadow(color: primary.opacity(0.30), radius: 8, y: 3)
                              )
                            : AnyView(Color.clear)
                        )
                }
            }
        }
        .padding(4)
        .background(Capsule().fill(primaryFaint))
    }
    
    // MARK: - Daily Check-in
    @State private var tobaccoChecked = false
    @State private var physioChecked = false
    
    private var dailyCheckInCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 14))
                    .foregroundColor(primary)
                Text("Today's Check-in")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(textPrimary)
                Spacer()
                Text(Date(), format: .dateTime.day().month(.abbreviated))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(textTertiary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(primaryFaint))
            }
            
            Divider()
            
            HStack(spacing: 12) {
                // Tobacco-Free Toggle
                Button(action: {
                    tobaccoChecked.toggle()
                    viewModel.logStreakDay(patientId: patientId, streakType: "tobacco_free", completed: tobaccoChecked)
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: tobaccoChecked ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 18))
                            .foregroundColor(tobaccoChecked ? green : textTertiary)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Tobacco-Free")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(textPrimary)
                            Text("No tobacco today")
                                .font(.system(size: 10))
                                .foregroundColor(textTertiary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(tobaccoChecked ? green.opacity(0.06) : Color(UIColor.tertiarySystemFill))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(tobaccoChecked ? green.opacity(0.3) : Color.clear, lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(.plain)
                
                // Physio Toggle
                Button(action: {
                    physioChecked.toggle()
                    viewModel.logStreakDay(patientId: patientId, streakType: "physio", completed: physioChecked)
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: physioChecked ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 18))
                            .foregroundColor(physioChecked ? primary : textTertiary)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Physio Done")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(textPrimary)
                            Text("Exercises completed")
                                .font(.system(size: 10))
                                .foregroundColor(textTertiary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(physioChecked ? primary.opacity(0.06) : Color(UIColor.tertiarySystemFill))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(physioChecked ? primary.opacity(0.3) : Color.clear, lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color(red: 0.35, green: 0.50, blue: 0.75).opacity(0.10), radius: 16, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color(red: 0.80, green: 0.88, blue: 1.0).opacity(0.6), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
    
    // MARK: - Tobacco-Free Card
    private var tobaccoFreeCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Title
            HStack(spacing: 6) {
                Image(systemName: "lungs.fill")
                    .font(.system(size: 14))
                    .foregroundColor(green)
                Text("Tobacco-Free")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(textPrimary)
                Spacer()
                StreakStatusBadge(
                    text: viewModel.tobaccoFree.streakStatus == "active" ? "Active" : "Broken",
                    color: viewModel.tobaccoFree.streakStatus == "active" ? green : red
                )
            }
            
            Divider()
            
            // Metrics Grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 3), spacing: 14) {
                StreakMetricCell(label: "Current", value: "\(viewModel.tobaccoFree.currentStreak)", unit: "days", color: primary)
                StreakMetricCell(label: "Longest", value: "\(viewModel.tobaccoFree.longestStreak)", unit: "days", color: textPrimary)
                StreakMetricCell(label: "Completion", value: "\(viewModel.tobaccoFree.completionRate)", unit: "%", color: green)
                StreakMetricCell(label: "Consistency", value: "\(viewModel.tobaccoFree.consistencyScore)", unit: "/100", color: primary)
                StreakMetricCell(label: "Velocity", value: velocityString(viewModel.tobaccoFree.streakVelocity), unit: "vs prev", color: viewModel.tobaccoFree.streakVelocity >= 0 ? green : red)
                StreakMetricCell(label: "Last 7d", value: "\(viewModel.tobaccoFree.recent7Completed)", unit: "/7", color: textSecondary)
            }
            
            // Chart
            if !viewModel.tobaccoFree.dailyChart.isEmpty {
                Divider()
                streakLineChart(data: viewModel.tobaccoFree.dailyChart, accentColor: green)
                    .frame(height: 160)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color(red: 0.35, green: 0.50, blue: 0.75).opacity(0.10), radius: 16, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color(red: 0.80, green: 0.88, blue: 1.0).opacity(0.6), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
    
    // MARK: - Physiotherapy Card
    private var physioCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 6) {
                Image(systemName: "figure.walk")
                    .font(.system(size: 14))
                    .foregroundColor(primary)
                Text("Physiotherapy")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(textPrimary)
                Spacer()
                if viewModel.physio.missedThisWeek > 0 {
                    Text("\(viewModel.physio.missedThisWeek) missed this week")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(red)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(red.opacity(0.08)))
                }
            }
            
            Divider()
            
            HStack(spacing: 0) {
                StreakMetricCell(label: "Completion", value: "\(viewModel.physio.completionRate)", unit: "%", color: primary)
                Rectangle().fill(cardBorder).frame(width: 1, height: 38)
                StreakMetricCell(label: "Current", value: "\(viewModel.physio.currentStreak)", unit: "days", color: green)
                Rectangle().fill(cardBorder).frame(width: 1, height: 38)
                StreakMetricCell(label: "Missed/wk", value: "\(viewModel.physio.missedThisWeek)", unit: "", color: red)
            }
            
            // Bar Chart
            if !viewModel.physio.dailyChart.isEmpty {
                Divider()
                physioBarChart(data: viewModel.physio.dailyChart)
                    .frame(height: 140)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color(red: 0.35, green: 0.50, blue: 0.75).opacity(0.10), radius: 16, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color(red: 0.80, green: 0.88, blue: 1.0).opacity(0.6), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
    
    // MARK: - Behavioral Stability Area Chart
    private var stabilityChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 14))
                    .foregroundColor(orange)
                Text("Behavioral Stability")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(textPrimary)
            }
            
            Divider()
            
            if !viewModel.tobaccoFree.dailyChart.isEmpty {
                Chart {
                    ForEach(viewModel.tobaccoFree.dailyChart) { log in
                        AreaMark(
                            x: .value("Date", log.date, unit: .day),
                            y: .value("Status", log.completed ? 1 : -1)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    log.completed ? green.opacity(0.4) : red.opacity(0.3),
                                    log.completed ? green.opacity(0.05) : red.opacity(0.05)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.stepCenter)
                        
                        LineMark(
                            x: .value("Date", log.date, unit: .day),
                            y: .value("Status", log.completed ? 1 : -1)
                        )
                        .foregroundStyle(log.completed ? green : red)
                        .lineStyle(StrokeStyle(lineWidth: 1.5))
                        .interpolationMethod(.stepCenter)
                    }
                    
                    RuleMark(y: .value("Zero", 0))
                        .lineStyle(StrokeStyle(lineWidth: 0.5, dash: [4, 3]))
                        .foregroundStyle(textTertiary.opacity(0.3))
                }
                .chartYAxis {
                    AxisMarks(values: [-1, 0, 1]) { value in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3)).foregroundStyle(cardBorder)
                        AxisValueLabel {
                            if let v = value.as(Int.self) {
                                Text(v == 1 ? "Done" : v == -1 ? "Missed" : "")
                                    .font(.system(size: 9))
                                    .foregroundColor(textTertiary)
                            }
                        }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3)).foregroundStyle(cardBorder)
                        AxisValueLabel().foregroundStyle(textTertiary).font(.system(size: 9))
                    }
                }
                .frame(height: 120)
            } else {
                Text("No behavioral data available")
                    .font(.system(size: 13))
                    .foregroundColor(textTertiary)
                    .frame(height: 100)
                    .frame(maxWidth: .infinity)
            }
            
            // Legend
            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(green).frame(width: 12, height: 8)
                    Text("Completed").font(.system(size: 10, weight: .medium)).foregroundColor(textTertiary)
                }
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(red).frame(width: 12, height: 8)
                    Text("Missed").font(.system(size: 10, weight: .medium)).foregroundColor(textTertiary)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color(red: 0.35, green: 0.50, blue: 0.75).opacity(0.10), radius: 16, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color(red: 0.80, green: 0.88, blue: 1.0).opacity(0.6), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
    
    // MARK: - Relapse Risk Section
    private var relapseRiskSection: some View {
        let score = viewModel.tobaccoFree.riskScore
        let level = viewModel.tobaccoFree.riskLevel
        let riskColor: Color = {
            switch level {
            case "Low": return green
            case "Moderate": return orange
            case "High": return red
            default: return textTertiary
            }
        }()
        
        return VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.shield.fill")
                    .font(.system(size: 14))
                    .foregroundColor(riskColor)
                Text("Relapse Risk Assessment")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(textPrimary)
                Spacer()
                Text("\(score)")
                    .font(.system(size: 22, weight: .bold, design: .monospaced))
                    .foregroundColor(riskColor)
                Text("/100")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(textTertiary)
            }
            
            Divider()
            
            // Risk Gauge
            VStack(spacing: 8) {
                GeometryReader { geo in
                    let w = geo.size.width
                    ZStack(alignment: .leading) {
                        HStack(spacing: 2) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(green.opacity(0.5))
                                .frame(width: w * 0.3)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(orange.opacity(0.5))
                                .frame(width: w * 0.3)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(red.opacity(0.5))
                                .frame(width: w * 0.4)
                        }
                        .frame(height: 8)
                        
                        let pos = min(w * CGFloat(score) / 100.0, w - 7)
                        Circle()
                            .fill(Color.white)
                            .frame(width: 14, height: 14)
                            .shadow(color: riskColor.opacity(0.4), radius: 4, y: 1)
                            .overlay(Circle().fill(riskColor).frame(width: 8, height: 8))
                            .offset(x: pos - 7)
                    }
                }
                .frame(height: 14)
                
                HStack {
                    Text("Low").font(.system(size: 10, weight: .medium)).foregroundColor(green)
                    Spacer()
                    Text("Moderate").font(.system(size: 10, weight: .medium)).foregroundColor(orange)
                    Spacer()
                    Text("High").font(.system(size: 10, weight: .medium)).foregroundColor(red)
                }
            }
            
            // Classification
            HStack(spacing: 8) {
                Image(systemName: level == "Low" ? "checkmark.circle.fill" : level == "Moderate" ? "exclamationmark.triangle.fill" : "xmark.octagon.fill")
                    .font(.system(size: 13))
                    .foregroundColor(riskColor)
                Text(riskExplanation(level: level, score: score))
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 10).fill(riskColor.opacity(0.05)))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color(red: 0.35, green: 0.50, blue: 0.75).opacity(0.10), radius: 16, x: 0, y: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color(red: 0.80, green: 0.88, blue: 1.0).opacity(0.6), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
    
    // MARK: - Chart Builders
    
    private func streakLineChart(data: [StreakDayLog], accentColor: Color) -> some View {
        Chart {
            ForEach(data) { log in
                LineMark(
                    x: .value("Date", log.date, unit: .day),
                    y: .value("Status", log.completed ? 1 : 0)
                )
                .foregroundStyle(accentColor)
                .lineStyle(StrokeStyle(lineWidth: 2))
                .interpolationMethod(.stepCenter)
                
                PointMark(
                    x: .value("Date", log.date, unit: .day),
                    y: .value("Status", log.completed ? 1 : 0)
                )
                .foregroundStyle(log.completed ? accentColor : red)
                .symbolSize(log.completed ? 30 : 50)
                .symbol(log.completed ? .circle : .cross)
            }
            
            // Target line
            RuleMark(y: .value("Target", 1))
                .lineStyle(StrokeStyle(lineWidth: 0.8, dash: [5, 4]))
                .foregroundStyle(textTertiary.opacity(0.25))
                .annotation(position: .trailing) {
                    Text("Target")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(textTertiary)
                }
        }
        .chartYAxis {
            AxisMarks(values: [0, 1]) { value in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3)).foregroundStyle(cardBorder)
                AxisValueLabel {
                    if let v = value.as(Int.self) {
                        Text(v == 1 ? "✓" : "✗")
                            .font(.system(size: 10))
                            .foregroundColor(v == 1 ? accentColor : red)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { _ in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3)).foregroundStyle(cardBorder)
                AxisValueLabel().foregroundStyle(textTertiary).font(.system(size: 9))
            }
        }
    }
    
    private func physioBarChart(data: [StreakDayLog]) -> some View {
        Chart {
            ForEach(data) { log in
                BarMark(
                    x: .value("Date", log.date, unit: .day),
                    y: .value("Status", log.completed ? 1 : 0)
                )
                .foregroundStyle(log.completed ? primary.opacity(0.7) : red.opacity(0.2))
                .cornerRadius(3)
            }
            
            // Prescribed frequency line
            RuleMark(y: .value("Prescribed", 1))
                .lineStyle(StrokeStyle(lineWidth: 0.8, dash: [5, 4]))
                .foregroundStyle(textTertiary.opacity(0.3))
        }
        .chartYAxis {
            AxisMarks(values: [0, 1]) { value in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3)).foregroundStyle(cardBorder)
                AxisValueLabel {
                    if let v = value.as(Int.self) {
                        Text(v == 1 ? "Done" : "")
                            .font(.system(size: 9))
                            .foregroundColor(textTertiary)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { _ in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3)).foregroundStyle(cardBorder)
                AxisValueLabel().foregroundStyle(textTertiary).font(.system(size: 9))
            }
        }
    }
    
    // MARK: - Helpers
    
    private func velocityString(_ v: Int) -> String {
        if v > 0 { return "+\(v)" }
        return "\(v)"
    }
    
    private func riskExplanation(level: String, score: Int) -> String {
        switch level {
        case "Low": return "Risk score \(score)/100. Current behavioral trajectory indicates sustained compliance. Continue current recovery protocol."
        case "Moderate": return "Risk score \(score)/100. Intermittent adherence gaps detected. Recommend increased monitoring of evening triggers and session attendance."
        case "High": return "Risk score \(score)/100. Elevated relapse probability. Immediate clinical intervention recommended. Consider adjusting treatment frequency."
        default: return "Insufficient longitudinal data for risk classification."
        }
    }
}

// MARK: - Streak Metric Cell
struct StreakMetricCell: View {
    let label: String
    let value: String
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(Color(red: 0.60, green: 0.63, blue: 0.68))
                .tracking(0.5)
            HStack(alignment: .lastTextBaseline, spacing: 1) {
                Text(value)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundColor(color)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(red: 0.60, green: 0.63, blue: 0.68))
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Streak Status Badge
struct StreakStatusBadge: View {
    let text: String
    let color: Color
    
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Capsule().fill(color.opacity(0.08)).overlay(Capsule().stroke(color.opacity(0.15), lineWidth: 0.5)))
    }
}
