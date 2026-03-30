import SwiftUI
import Charts

// MARK: - Light Animated Background (White & Blue)
struct HabitAnalyticsBackground: View {
    @State private var pulse: Bool = false
    
    var body: some View {
        ZStack {
            // Clean white base
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
                        Color(red: 0.55, green: 0.80, blue: 1.0).opacity(0.10),
                        Color.clear
                    ], center: .center, startRadius: 0, endRadius: 160)
                )
                .frame(width: 300, height: 300)
                .offset(x: pulse ? 90 : -40, y: pulse ? 250 : 400)
                .blur(radius: 50)
            
            Circle()
                .fill(
                    RadialGradient(colors: [
                        Color(red: 0.30, green: 0.55, blue: 0.95).opacity(0.08),
                        Color.clear
                    ], center: .center, startRadius: 0, endRadius: 120)
                )
                .frame(width: 240, height: 240)
                .offset(x: pulse ? 120 : 70, y: pulse ? -120 : -50)
                .blur(radius: 40)
            
            // Subtle floating dots
            ForEach(0..<10, id: \.self) { _ in
                Circle()
                    .fill(Color(red: 0.35, green: 0.55, blue: 0.9).opacity(Double.random(in: 0.03...0.07)))
                    .frame(width: CGFloat.random(in: 3...6))
                    .offset(
                        x: CGFloat.random(in: -180...180),
                        y: CGFloat.random(in: -400...400)
                    )
                    .blur(radius: 1)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 7).repeatForever(autoreverses: true)) {
                pulse.toggle()
            }
        }
    }
}

// MARK: - Light Card Modifier
struct LightCard: ViewModifier {
    var cornerRadius: CGFloat = 20
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(Color.white)
                    .shadow(color: Color(red: 0.35, green: 0.50, blue: 0.75).opacity(0.10), radius: 16, x: 0, y: 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
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
}

extension View {
    func lightCard(cornerRadius: CGFloat = 20) -> some View {
        self.modifier(LightCard(cornerRadius: cornerRadius))
    }
}

// MARK: - Color Constants
struct AppColors {
    static let primary = Color(red: 0.22, green: 0.47, blue: 0.95)       // Vibrant blue
    static let primaryLight = Color(red: 0.40, green: 0.62, blue: 1.0)
    static let primaryFaint = Color(red: 0.92, green: 0.95, blue: 1.0)
    static let textPrimary = Color(red: 0.12, green: 0.14, blue: 0.20)
    static let textSecondary = Color(red: 0.45, green: 0.48, blue: 0.55)
    static let textTertiary = Color(red: 0.62, green: 0.65, blue: 0.72)
    static let cardBorder = Color(red: 0.88, green: 0.91, blue: 0.96)
    static let red = Color(red: 0.92, green: 0.30, blue: 0.25)
    static let orange = Color(red: 0.95, green: 0.55, blue: 0.15)
    static let green = Color(red: 0.18, green: 0.75, blue: 0.45)
    static let purple = Color(red: 0.48, green: 0.35, blue: 0.85)
}

// MARK: - Custom Time Range Selector
struct TimeRangeSelector: View {
    @Binding var selected: Int
    let ranges = [(7, "7 Days"), (30, "30 Days"), (90, "90 Days")]
    @Namespace private var animation
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(ranges, id: \.0) { range in
                Button(action: {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                        selected = range.0
                    }
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                }) {
                    Text(range.1)
                        .font(.system(size: 13, weight: selected == range.0 ? .bold : .semibold))
                        .foregroundColor(selected == range.0 ? .white : AppColors.textSecondary)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 16)
                        .frame(maxWidth: .infinity)
                        .background {
                            if selected == range.0 {
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [AppColors.primary, AppColors.primaryLight],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .shadow(color: AppColors.primary.opacity(0.30), radius: 8, y: 3)
                                    .matchedGeometryEffect(id: "tab", in: animation)
                            }
                        }
                }
            }
        }
        .padding(4)
        .background(Capsule().fill(AppColors.primaryFaint))
    }
}

// MARK: - Main Analytics View
struct HabitTrackingAnalyticsView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    @StateObject private var viewModel = HabitTrackingViewModel()
    @State private var selectedTimeRange = 30
    @State private var showContent = false
    
    var body: some View {
        ZStack {
            HabitAnalyticsBackground()
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    headerSection
                    
                    TimeRangeSelector(selected: $selectedTimeRange)
                        .padding(.horizontal, 20)
                        .onChange(of: selectedTimeRange) { newValue in
                            viewModel.selectedRange = newValue
                            viewModel.fetchAnalytics(patientId: patientId)
                        }
                    
                    todayIntakeCard
                        .opacity(showContent ? 1 : 0)
                        .offset(y: showContent ? 0 : 20)
                    
                    trendChartCard
                        .opacity(showContent ? 1 : 0)
                        .offset(y: showContent ? 0 : 20)
                    
                    timeOfDayCard
                        .opacity(showContent ? 1 : 0)
                        .offset(y: showContent ? 0 : 20)
                    
                    if let stats = viewModel.stats {
                        relapseRiskCard(score: stats.riskScore, level: stats.riskLevel)
                            .opacity(showContent ? 1 : 0)
                            .offset(y: showContent ? 0 : 20)
                    }
                    
                    Spacer(minLength: 60)
                }
                .padding(.top, 10)
            }
        }
        .onAppear {
            viewModel.fetchAnalytics(patientId: patientId)
            withAnimation(.easeOut(duration: 0.6).delay(0.2)) {
                showContent = true
            }
        }
        .alert(item: Binding<AlertItem?>(
            get: { viewModel.errorMessage.map { AlertItem(message: $0) } },
            set: { _ in viewModel.errorMessage = nil }
        )) { item in
            Alert(title: Text("Error"), message: Text(item.message), dismissButton: .default(Text("OK")))
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Habit Reduction")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(AppColors.textPrimary)
                Text("Behavioral Consumption Analytics")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(AppColors.textTertiary)
            }
            Spacer()
            Button(action: { dismiss() }) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(AppColors.textSecondary)
                    .frame(width: 34, height: 34)
                    .background(
                        Circle()
                            .fill(AppColors.primaryFaint)
                            .shadow(color: AppColors.primary.opacity(0.1), radius: 4, y: 2)
                    )
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }
    
    // MARK: - Today's Intake Card
    private var todayIntakeCard: some View {
        VStack(spacing: 16) {
            HStack {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(AppColors.primary.opacity(0.1))
                            .frame(width: 32, height: 32)
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 16))
                            .foregroundColor(AppColors.primary)
                    }
                    Text("Log Intake")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(AppColors.textPrimary)
                }
                Spacer()
                Text(Date(), format: .dateTime.day().month(.abbreviated).year())
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppColors.textTertiary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(AppColors.primaryFaint))
            }
            
            Rectangle()
                .fill(AppColors.cardBorder)
                .frame(height: 1)
            
            PremiumStepper(label: "Tobacco", icon: "smoke.fill", count: $viewModel.tobaccoCount, accentColor: AppColors.red)
            PremiumStepper(label: "Areca Nut", icon: "leaf.fill", count: $viewModel.arecaCount, accentColor: AppColors.orange)
            
            if viewModel.todayTotalTobacco > 0 || viewModel.todayTotalAreca > 0 {
                HStack(spacing: 10) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(AppColors.green)
                        .font(.system(size: 14))
                    Text("Today:")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(AppColors.textTertiary)
                    if viewModel.todayTotalTobacco > 0 {
                        HStack(spacing: 4) {
                            Circle().fill(AppColors.red).frame(width: 6, height: 6)
                            Text("\(viewModel.todayTotalTobacco) Tobacco")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(AppColors.red)
                        }
                    }
                    if viewModel.todayTotalAreca > 0 {
                        HStack(spacing: 4) {
                            Circle().fill(AppColors.orange).frame(width: 6, height: 6)
                            Text("\(viewModel.todayTotalAreca) Areca")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(AppColors.orange)
                        }
                    }
                    Spacer()
                }
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 10).fill(AppColors.green.opacity(0.06)))
            }
            
            Button(action: {
                viewModel.logTodayEntry(patientId: patientId)
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.up.doc.fill")
                        .font(.system(size: 14))
                    Text("Save Entry")
                        .font(.system(size: 15, weight: .bold))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryLight],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(14)
                .shadow(color: AppColors.primary.opacity(0.30), radius: 12, y: 4)
            }
        }
        .padding(20)
        .lightCard()
        .padding(.horizontal, 20)
    }
    
    // MARK: - Trend Chart Card
    private var trendChartCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(AppColors.green.opacity(0.1))
                            .frame(width: 30, height: 30)
                        Image(systemName: "chart.xyaxis.line")
                            .font(.system(size: 14))
                            .foregroundColor(AppColors.green)
                    }
                    Text("\(selectedTimeRange)-Day Trend")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(AppColors.textPrimary)
                }
                Spacer()
                if let stats = viewModel.stats {
                    Text(String(format: "%.1f/day", stats.currentAvg))
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(AppColors.primary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Capsule().fill(AppColors.primaryFaint))
                }
            }
            
            if viewModel.dailyLogs.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "chart.line.downtrend.xyaxis")
                        .font(.system(size: 36))
                        .foregroundColor(AppColors.cardBorder)
                    Text("No data for this range")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppColors.textTertiary)
                }
                .frame(height: 200)
                .frame(maxWidth: .infinity)
            } else {
                Chart {
                    ForEach(viewModel.dailyLogs) { log in
                        AreaMark(
                            x: .value("Date", log.date),
                            y: .value("Count", log.total)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    AppColors.primary.opacity(0.20),
                                    AppColors.primary.opacity(0.02)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                        
                        LineMark(
                            x: .value("Date", log.date),
                            y: .value("Count", log.total)
                        )
                        .foregroundStyle(AppColors.primary)
                        .lineStyle(StrokeStyle(lineWidth: 2.5))
                        .interpolationMethod(.catmullRom)
                        
                        PointMark(
                            x: .value("Date", log.date),
                            y: .value("Count", log.total)
                        )
                        .foregroundStyle(AppColors.primary)
                        .symbolSize(44)
                        .annotation(position: .top, spacing: 6) {
                            Text("\(log.total)")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(AppColors.primary)
                        }
                    }
                    
                    let baseline = viewModel.baseline.tobacco + viewModel.baseline.areca
                    if baseline > 0 {
                        RuleMark(y: .value("Baseline", baseline))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [6, 4]))
                            .foregroundStyle(AppColors.red.opacity(0.4))
                            .annotation(position: .top, alignment: .trailing) {
                                Text("Baseline: \(baseline)")
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundColor(AppColors.red.opacity(0.6))
                            }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)).foregroundStyle(AppColors.cardBorder)
                        AxisValueLabel().foregroundStyle(AppColors.textTertiary).font(.system(size: 9))
                    }
                }
                .chartYAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)).foregroundStyle(AppColors.cardBorder)
                        AxisValueLabel().foregroundStyle(AppColors.textTertiary).font(.system(size: 10))
                    }
                }
                .frame(height: 220)
            }
            
            // Stats Row
            HStack(spacing: 0) {
                StatPill(title: "Baseline", value: "\(viewModel.baseline.tobacco + viewModel.baseline.areca)", unit: "/day", color: AppColors.primary)
                
                Rectangle().fill(AppColors.cardBorder).frame(width: 1, height: 40)
                
                StatPill(title: "Current Avg", value: String(format: "%.1f", viewModel.stats?.currentAvg ?? 0), unit: "/day", color: AppColors.green)
                
                Rectangle().fill(AppColors.cardBorder).frame(width: 1, height: 40)
                
                StatPill(title: "Reduction", value: String(format: "%.0f%%", viewModel.stats?.reductionPercent ?? 0), unit: "", color: reductionColor)
            }
            .padding(.vertical, 10)
            .background(RoundedRectangle(cornerRadius: 14).fill(AppColors.primaryFaint.opacity(0.5)))
        }
        .padding(20)
        .lightCard()
        .padding(.horizontal, 20)
    }
    
    private var reductionColor: Color {
        let pct = viewModel.stats?.reductionPercent ?? 0
        if pct > 0 { return AppColors.green }
        else if pct < 0 { return AppColors.red }
        return AppColors.textTertiary
    }
    
    // MARK: - Time of Day Card
    private var timeOfDayCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(AppColors.orange.opacity(0.1))
                        .frame(width: 30, height: 30)
                    Image(systemName: "clock.fill")
                        .font(.system(size: 14))
                        .foregroundColor(AppColors.orange)
                }
                Text("Time-of-Day Pattern")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(AppColors.textPrimary)
            }
            
            let maxCount = viewModel.timeOfDayData.map(\.count).max() ?? 1
            
            HStack(alignment: .bottom, spacing: 12) {
                ForEach(viewModel.timeOfDayData) { item in
                    VStack(spacing: 8) {
                        Text("\(item.count)")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundColor(barColor(for: item.name))
                        
                        RoundedRectangle(cornerRadius: 10)
                            .fill(barGradient(for: item.name))
                            .frame(height: max(10, CGFloat(item.count) / CGFloat(max(maxCount, 1)) * 120))
                            .shadow(color: barColor(for: item.name).opacity(0.20), radius: 6, y: 3)
                        
                        VStack(spacing: 3) {
                            Image(systemName: iconForTime(item.name))
                                .font(.system(size: 14))
                                .foregroundColor(barColor(for: item.name).opacity(0.6))
                            Text(item.name)
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(AppColors.textTertiary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.top, 8)
            .frame(height: 200)
            
            HStack(spacing: 6) {
                Image(systemName: "lightbulb.fill")
                    .font(.system(size: 10))
                    .foregroundColor(AppColors.orange.opacity(0.5))
                Text("Identify high-risk times to plan alternate coping activities")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(AppColors.textTertiary)
            }
        }
        .padding(20)
        .lightCard()
        .padding(.horizontal, 20)
    }
    
    private func barGradient(for name: String) -> LinearGradient {
        switch name {
        case "Morning": return LinearGradient(colors: [Color(red: 1.0, green: 0.78, blue: 0.28), Color(red: 1.0, green: 0.60, blue: 0.15)], startPoint: .top, endPoint: .bottom)
        case "Afternoon": return LinearGradient(colors: [Color(red: 0.25, green: 0.78, blue: 0.50), Color(red: 0.15, green: 0.60, blue: 0.38)], startPoint: .top, endPoint: .bottom)
        case "Evening": return LinearGradient(colors: [Color(red: 0.52, green: 0.42, blue: 0.92), Color(red: 0.38, green: 0.28, blue: 0.78)], startPoint: .top, endPoint: .bottom)
        default: return LinearGradient(colors: [Color(red: 0.35, green: 0.55, blue: 0.90), Color(red: 0.22, green: 0.42, blue: 0.78)], startPoint: .top, endPoint: .bottom)
        }
    }
    
    private func barColor(for name: String) -> Color {
        switch name {
        case "Morning": return AppColors.orange
        case "Afternoon": return AppColors.green
        case "Evening": return AppColors.purple
        default: return AppColors.primary
        }
    }
    
    private func iconForTime(_ name: String) -> String {
        switch name {
        case "Morning": return "sunrise.fill"
        case "Afternoon": return "sun.max.fill"
        case "Evening": return "sunset.fill"
        default: return "moon.fill"
        }
    }
    
    // MARK: - Relapse Risk Card
    private func relapseRiskCard(score: Int, level: String) -> some View {
        let riskColor: Color = {
            switch level {
            case "Low": return AppColors.green
            case "Moderate": return AppColors.orange
            case "High": return AppColors.red
            default: return Color.gray
            }
        }()
        
        let riskMessage: String = {
            switch level {
            case "Low": return "Behavioral stabilization improving. Keep up the consistency."
            case "Moderate": return "Moderate relapse probability detected. Monitor evening cravings closely."
            case "High": return "High relapse risk predicted. Recommend using coping interventions immediately."
            default: return "Insufficient data for analysis."
            }
        }()
        
        let riskIcon: String = {
            switch level {
            case "Low": return "checkmark.shield.fill"
            case "Moderate": return "exclamationmark.triangle.fill"
            case "High": return "exclamationmark.octagon.fill"
            default: return "questionmark.circle"
            }
        }()
        
        return VStack(alignment: .leading, spacing: 20) {
            HStack {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(riskColor.opacity(0.1))
                            .frame(width: 30, height: 30)
                        Image(systemName: "waveform.path.ecg")
                            .font(.system(size: 14))
                            .foregroundColor(riskColor)
                    }
                    Text("Relapse Risk")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(AppColors.textPrimary)
                }
                Spacer()
                HStack(spacing: 5) {
                    Image(systemName: riskIcon)
                        .font(.system(size: 11))
                    Text("\(score)%")
                        .font(.system(size: 15, weight: .bold, design: .monospaced))
                }
                .foregroundColor(riskColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(riskColor.opacity(0.10))
                        .overlay(Capsule().stroke(riskColor.opacity(0.20), lineWidth: 1))
                )
            }
            
            // Risk Gauge
            VStack(spacing: 10) {
                GeometryReader { geo in
                    let width = geo.size.width
                    ZStack(alignment: .leading) {
                        HStack(spacing: 3) {
                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    LinearGradient(colors: [
                                        Color(red: 0.20, green: 0.80, blue: 0.48),
                                        Color(red: 0.35, green: 0.85, blue: 0.55)
                                    ], startPoint: .leading, endPoint: .trailing)
                                )
                                .frame(width: width * 0.33)
                            
                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    LinearGradient(colors: [
                                        Color(red: 0.95, green: 0.72, blue: 0.18),
                                        Color(red: 1.0, green: 0.58, blue: 0.18)
                                    ], startPoint: .leading, endPoint: .trailing)
                                )
                                .frame(width: width * 0.34)
                            
                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    LinearGradient(colors: [
                                        Color(red: 1.0, green: 0.42, blue: 0.32),
                                        Color(red: 0.90, green: 0.22, blue: 0.18)
                                    ], startPoint: .leading, endPoint: .trailing)
                                )
                                .frame(width: width * 0.33)
                        }
                        .frame(height: 12)
                        
                        let indicatorX = min(width * CGFloat(score) / 100, width - 12)
                        Circle()
                            .fill(Color.white)
                            .frame(width: 18, height: 18)
                            .shadow(color: riskColor.opacity(0.40), radius: 6, y: 2)
                            .overlay(Circle().fill(riskColor).frame(width: 10, height: 10))
                            .offset(x: indicatorX - 9)
                    }
                }
                .frame(height: 18)
                
                HStack {
                    Text("Low")
                        .foregroundColor(AppColors.green)
                    Spacer()
                    Text("Moderate")
                        .foregroundColor(AppColors.orange)
                    Spacer()
                    Text("High")
                        .foregroundColor(AppColors.red)
                }
                .font(.system(size: 10, weight: .semibold))
            }
            
            // Message
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: riskIcon)
                    .font(.system(size: 14))
                    .foregroundColor(riskColor)
                    .frame(width: 24)
                Text(riskMessage)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppColors.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 12).fill(riskColor.opacity(0.06)))
        }
        .padding(20)
        .lightCard()
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
    }
}

// MARK: - Premium Stepper
struct PremiumStepper: View {
    let label: String
    let icon: String
    @Binding var count: Int
    let accentColor: Color
    
    var body: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundColor(accentColor)
                Text(label)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
            }
            Spacer()
            
            HStack(spacing: 0) {
                Button(action: {
                    if count > 0 { count -= 1 }
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                }) {
                    Image(systemName: "minus")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(accentColor)
                        .frame(width: 36, height: 36)
                        .background(accentColor.opacity(0.08))
                        .cornerRadius(10)
                }
                
                Text("\(count)")
                    .font(.system(size: 20, weight: .bold, design: .monospaced))
                    .foregroundColor(AppColors.textPrimary)
                    .frame(minWidth: 44)
                
                Button(action: {
                    count += 1
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                }) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(accentColor)
                        .cornerRadius(10)
                }
            }
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Stat Pill
struct StatPill: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(AppColors.textTertiary)
                .textCase(.uppercase)
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(color)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(AppColors.textTertiary)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Alert Item
struct AlertItem: Identifiable {
    var id = UUID()
    var message: String
}
