import SwiftUI

enum TimelineStatus: String, CaseIterable {
    case CONSULTATION_APPROVED = "Consultation Approved"
    case DIAGNOSIS_COMPLETED = "Diagnosis Completed"
    case TREATMENT_PLANNED = "Treatment Planned"
    case TREATMENT_STARTED = "Treatment Started"
    case IN_PROGRESS = "In Progress"
    case FOLLOW_UP = "Follow Up"
    case COMPLETED = "Completed"
    
    var icon: String {
        switch self {
        case .CONSULTATION_APPROVED: return "checkmark.seal.fill"
        case .DIAGNOSIS_COMPLETED: return "doc.text.magnifyingglass"
        case .TREATMENT_PLANNED: return "list.bullet.clipboard.fill"
        case .TREATMENT_STARTED: return "play.fill"
        case .IN_PROGRESS: return "hammer.fill"
        case .FOLLOW_UP: return "clock.arrow.2.circlepath"
        case .COMPLETED: return "star.fill"
        }
    }
}

struct TreatmentTimelineView: View {
    let requestId: Int
    let isDentist: Bool
    
    @State private var timelineHistory: [[String: Any]] = []
    @State private var isLoading = true
    @State private var showStatusPicker = false
    @State private var selectedStatusForUpdate: TimelineStatus? = nil
    @State private var updateNote: String = ""
    @State private var showNoteEditor = false
    @Environment(\.dismiss) var dismiss
    
    private var currentStatus: TimelineStatus {
        if let last = timelineHistory.last, let statStr = last["status"] as? String {
            let mapped = statStr.replacingOccurrences(of: "_", with: " ").replacingOccurrences(of: "-", with: " ")
            return TimelineStatus.allCases.first(where: { $0.rawValue.uppercased() == mapped.uppercased() }) ?? .CONSULTATION_APPROVED
        }
        return .CONSULTATION_APPROVED
    }
    
    private var themeColor: Color { isDentist ? .teal : .blue }

    var body: some View {
        NavigationStack {
            ZStack {
                // Background Layer
                DentalBackgroundView(animate: true)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    if isLoading {
                        Spacer()
                        ProgressView()
                            .tint(themeColor)
                            .scaleEffect(1.5)
                        Spacer()
                    } else {
                        VStack(spacing: 0) {
                            // Fixed Header
                            header
                                
                            ScrollView {
                                VStack(alignment: .leading, spacing: 0) {
                                    ForEach(TimelineStatus.allCases, id: \.self) { status in
                                        timelineRow(status: status)
                                    }
                                }
                                .padding(25)
                            }
                        }
                    }
                    
                    if isDentist {
                        dentistControls
                    }
                }
                .blur(radius: showNoteEditor ? 3 : 0)
                
                // Custom Premium Dialog Overlay
                if showNoteEditor {
                    Color.black.opacity(0.4)
                        .ignoresSafeArea()
                        .transition(.opacity)
                        .onTapGesture {
                            withAnimation { showNoteEditor = false }
                        }
                    
                    noteEditorDialog
                        .transition(.asymmetric(
                            insertion: .scale(scale: 0.9).combined(with: .opacity),
                            removal: .opacity
                        ))
                        .zIndex(1)
                }
            }
        }
        .onAppear(perform: loadTimeline)
    }
    
    private var header: some View {
        VStack(spacing: 0) {
            HStack {
                // Back Button
                BackButton {
                    dismiss()
                }
                
                Spacer()
                
                // Centered Title Block
                VStack(spacing: 6) {
            
                    
                    Text("Clinical Logic Flow")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                }
                .frame(maxWidth: .infinity)
                
                Spacer()
                
                // Role Icon
                Image(systemName: isDentist ? "stethoscope" : "person.text.rectangle.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(themeColor.opacity(0.6))
                    .frame(width: 44, height: 44)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 16)
            
            Divider()
                .opacity(0.08)
        }
    }
    private func timelineRow(status: TimelineStatus) -> some View {
        let entry = timelineHistory.first(where: {
            ($0["status"] as? String ?? "") == status.rawValue.uppercased().replacingOccurrences(of: " ", with: "_")
        })
        let isReached = entry != nil
        let isCurrent = currentStatus == status
        
        return HStack(alignment: .top, spacing: 24) {
            // Icon & Timeline Line
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(isReached ? (isCurrent ? themeColor : themeColor.opacity(0.1)) : Color.gray.opacity(0.05))
                        .frame(width: 48, height: 48)
                        .shadow(color: isCurrent ? themeColor.opacity(0.3) : .clear, radius: 12)
                    
                    Image(systemName: status.icon)
                        .font(.system(size: 18, weight: .black))
                        .foregroundColor(isCurrent ? .white : (isReached ? themeColor : .gray.opacity(0.3)))
                }
                
                if status != TimelineStatus.allCases.last {
                    Rectangle()
                        .fill(LinearGradient(
                            colors: [
                                isReached ? themeColor.opacity(0.5) : Color.gray.opacity(0.1),
                                isReached ? themeColor.opacity(0.1) : Color.gray.opacity(0.05)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        ))
                        .frame(width: 2, height: 80)
                }
            }
            
            // Content Card
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(status.rawValue.uppercased())
                            .font(.system(size: 14, weight: .black))
                            .tracking(1)
                            .foregroundColor(isReached ? .primary : .gray.opacity(0.4))
                        
                        if isCurrent {
                            Text("ACTIVE PHASE")
                                .font(.system(size: 8, weight: .black))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(themeColor)
                                .clipShape(Capsule())
                        }
                    }
                    
                    Spacer()
                    
                    if isReached {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(themeColor)
                            .font(.system(size: 16))
                    }
                }
                
                if let e = entry {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            Label(formatDateOnly(e["updated_at"] as? String ?? ""), systemImage: "calendar")
                            Divider().frame(height: 10)
                            Label(formatTimeOnly(e["updated_at"] as? String ?? ""), systemImage: "clock.fill")
                        }
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(themeColor.opacity(0.8))
                        
                        if let note = e["notes"] as? String, !note.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "quote.opening")
                                        .font(.system(size: 10))
                                        .foregroundColor(themeColor)
                                    Text("PHYSICIAN NOTE")
                                        .font(.system(size: 8, weight: .black))
                                        .foregroundColor(themeColor)
                                }
                                
                                Text(note)
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .lineSpacing(4)
                                    .foregroundColor(.primary.opacity(0.8))
                                    .padding(14)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.white.opacity(0.6))
                                    .cornerRadius(16)
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(themeColor.opacity(0.1), lineWidth: 1))
                            }
                        }
                    }
                } else {
                    Text("PENDING CLINICAL ACTION")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray.opacity(0.3))
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 30)
        }
    }
    
    private var dentistControls: some View {
        VStack {
            Divider()
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CURRENT PHASE")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.secondary)
                    Text(currentStatus.rawValue)
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundColor(themeColor)
                }
                Spacer()
                Button(action: { showStatusPicker = true }) {
                    HStack {
                        Image(systemName: "arrow.up.circle.fill")
                        Text("ADVANCE STAGE")
                    }
                    .font(.system(size: 12, weight: .black))
                    .padding(.vertical, 14)
                    .padding(.horizontal, 24)
                    .background(LinearGradient(colors: [themeColor, themeColor.opacity(0.8)], startPoint: .leading, endPoint: .trailing))
                    .foregroundColor(.white)
                    .cornerRadius(16)
                    .shadow(color: themeColor.opacity(0.3), radius: 10, y: 5)
                }
            }
            .padding(20)
        
        }
        .confirmationDialog("Update Treatment Stage", isPresented: $showStatusPicker, titleVisibility: .visible) {
            ForEach(TimelineStatus.allCases.filter { $0 != currentStatus }, id: \.self) { status in
                Button(status.rawValue) {
                    selectedStatusForUpdate = status
                    updateNote = ""
                    withAnimation { showNoteEditor = true }
                }
            }
        }
    }
    
    private var noteEditorDialog: some View {
        VStack(spacing: 25) {
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(themeColor.opacity(0.1))
                        .frame(width: 60, height: 60)
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 24))
                        .foregroundColor(themeColor)
                }
                
                VStack(spacing: 4) {
                    Text("Clinical Note")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                    Text("Updating to \(selectedStatusForUpdate?.rawValue ?? "")")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("OBSERVATION DETAILS")
                    .font(.system(size: 9, weight: .black))
                    .tracking(1)
                    .foregroundColor(.secondary)
                
                TextEditor(text: $updateNote)
                    .font(.system(size: 14, weight: .medium))
                    .frame(height: 120)
                    .padding(12)
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.gray.opacity(0.1), lineWidth: 1))
            }
            
            VStack(spacing: 12) {
                Button(action: {
                    if let status = selectedStatusForUpdate {
                        updateStatus(status, note: updateNote)
                    }
                    withAnimation { showNoteEditor = false }
                }) {
                    Text("CONFIRM PHASE SHIFT")
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(themeColor)
                        .cornerRadius(16)
                        .shadow(color: themeColor.opacity(0.2), radius: 8, y: 4)
                }
                
                Button("Discard Observation") {
                    if let status = selectedStatusForUpdate {
                        updateStatus(status, note: "")
                    }
                    withAnimation { showNoteEditor = false }
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.secondary)
                .padding(.top, 10)
            }
        }
        .padding(30)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(32)
        .padding(.horizontal, 30)
        .shadow(color: .black.opacity(0.15), radius: 30, y: 20)
    }
    
    // MARK: - Helpers & API Logic
    
    private func loadTimeline() {
        APIService.getTimeline(requestId: requestId) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let data) = result {
                    self.timelineHistory = data
                }
            }
        }
    }
    
    private func updateStatus(_ status: TimelineStatus, note: String) {
        let dbStatus = status.rawValue.uppercased().replacingOccurrences(of: " ", with: "_")
        APIService.updateTimeline(data: ["request_id": requestId, "status": dbStatus, "notes": note]) { result in
            DispatchQueue.main.async {
                loadTimeline()
            }
        }
    }
    
    private func parseDate(_ iso: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = formatter.date(from: iso) { return date }
        
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: iso) { return date }
        
        isoFormatter.formatOptions = [.withInternetDateTime]
        return isoFormatter.date(from: iso)
    }

    private func formatDateOnly(_ iso: String) -> String {
        guard let date = parseDate(iso) else { return iso }
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: date).uppercased()
    }
    
    private func formatTimeOnly(_ iso: String) -> String {
        guard let date = parseDate(iso) else { return iso }
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date).uppercased()
    }
}
