import SwiftUI

struct ExerciseTrainerView: View {
    @StateObject private var service = ExerciseService.shared
    @State private var selectedExercise: Exercise?
    @State private var showingTimer = false
    @State private var showingInsights = false
    @State private var showingSettings = false
    
    let patientId: Int
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Header & Settings
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Guided Recovery".uppercased())
                            .font(.system(size: 11, weight: .black))
                            .tracking(2)
                            .foregroundColor(.blue.opacity(0.6))
                        
                        Text("Therapy Session")
                            .font(.system(size: 30, weight: .black))
                            .foregroundStyle(
                                LinearGradient(colors: [.black, .gray], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                    }
                    Spacer()
                    Button(action: { showingSettings = true }) {
                        ZStack {
                            Circle().fill(.white).frame(width: 44, height: 44)
                            Image(systemName: "clock.badge.checkmark.fill")
                                .font(.system(size: 18))
                                .foregroundColor(.blue)
                        }
                        .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                    }
                }
                .padding(.horizontal, 25)
                .padding(.top, 20)
                
                // 1. Progress Ring
                if let progress = service.progress {
                    ProgressRingView(
                        progress: progress.completionRate,
                        label: "\(String(format: "%.1f", progress.currentOpening)) mm",
                        sublabel: "+\(String(format: "%.1f", progress.improvement)) mm",
                        patientId: patientId
                    )
                    .padding(.horizontal)
                }
                
                // 2. Streak Counter
                StreakView(count: service.progress?.streak ?? 0)
                    .padding(.horizontal)
                
                // 3. Mistral AI Progress Analysis
                MistralAIInsightView(patientId: patientId)
                    .padding(.horizontal, 25)
                
                // 4. Exercise List (Cards)
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        Text("TODAY'S PLAN")
                            .font(.system(size: 12, weight: .black))
                            .tracking(1)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(Int(service.progress?.completionRate ?? 0))% Done")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.blue)
                    }
                    .padding(.horizontal, 25)
                    
                    ForEach(service.exercises) { exercise in
                        ExerciseCard(
                            exercise: exercise,
                            isCompleted: service.progress?.completedIds.contains(exercise.id) ?? false
                        ) {
                            selectedExercise = exercise
                            showingTimer = true
                        }
                        .padding(.horizontal)
                    }
                }
                
                // 5. Daily Checklist
                DailyChecklistView(
                    exercises: service.exercises,
                    completedIds: service.progress?.completedIds ?? []
                )
                .padding(.horizontal)
                
                // 6. Weekly Compliance
                if !service.weeklyCompliance.isEmpty {
                    WeeklyChartView(data: service.weeklyCompliance)
                        .padding(.horizontal)
                }
                
                Spacer().frame(height: 50)
            }
            .padding(.top)
        }
        .background(
            ZStack {
                DentalBackgroundView(animate: true)
                Color.blue.opacity(0.02) // Subtle tint
            }
            .ignoresSafeArea()
        )
        .onAppear {
            Task {
                await service.fetchExercises()
                await service.fetchProgress(userId: patientId)
                await service.fetchWeeklyCompliance(userId: patientId)
                await service.fetchSettings(userId: patientId)
                await service.fetchAIHistory(userId: patientId)
                
                // Automatically schedule on-device notifications based on fetched settings
                ReminderManager.shared.scheduleTherapyReminders(settings: service.settings)
                
                if service.settings.smartReminders {
                    ReminderManager.shared.scheduleSmartNudge()
                }
            }
        }
        .fullScreenCover(item: $selectedExercise) { exercise in
            TimerView(exercise: exercise, patientId: patientId)
        }
        .sheet(isPresented: $showingSettings) {
            ExerciseSettingsSheet(patientId: patientId)
        }
        .refreshable {
            await service.fetchExercises()
            await service.fetchProgress(userId: patientId)
            await service.fetchWeeklyCompliance(userId: patientId)
            await service.fetchSettings(userId: patientId)
        }
    }
}

#Preview {
    ExerciseTrainerView(patientId: 1)
}
