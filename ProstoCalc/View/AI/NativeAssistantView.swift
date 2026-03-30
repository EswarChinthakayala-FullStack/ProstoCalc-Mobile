import SwiftUI

struct AIMessage: Identifiable {
    let id = UUID()
    let text: String
    let isUser: Bool
    let timestamp: Date = Date()
}

struct ChatSession: Identifiable, Hashable {
    let id: Int
    let title: String
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: ChatSession, rhs: ChatSession) -> Bool {
        lhs.id == rhs.id
    }
}

struct NativeAssistantView: View {
    @StateObject private var nanobot = NanobotService.shared
    @State private var messages: [AIMessage] = []
    @State private var inputText: String = ""
    @Environment(\.dismiss) var dismiss
    
    // Sessions
    @State private var sessions: [ChatSession] = []
    @State private var currentSessionId: Int? = nil
    @State private var showingSessions = false
    @State private var isRenaming = false
    @State private var renameText = ""
    @State private var sessionToRename: Int? = nil
    @State private var isCreatingSession = false
    
    var userId: String
    var role: String
    var userName: String
    var showBackButton: Bool = true
    var onBack: (() -> Void)? = nil
    
    // Active Treatment Context
    var treatmentName: String? = nil
    var estimatedCost: Double? = nil
    var numberOfVisits: Int? = nil
    var toothDetails: String? = nil
    var urgencyRating: Int? = nil
    var patientAge: Int? = nil
    
    private var isDentist: Bool {
        role.lowercased() == "dentist"
    }
    
    private var primaryColor: Color {
        isDentist ? Color.dentalCyan : Color.blue
    }
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: isDentist)
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Professional Header with Integrity Status
                // Professional Header with Back + Integrity Status
                HStack(spacing: 12) {
                    
                    // Back Button
                    if showBackButton {
                        Button(action: {
                            if let onBack = onBack {
                                onBack()
                            } else {
                                dismiss()
                            }
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.teal)
                                .frame(width: 42, height: 42)
                                .background(
                                    Circle()
                                        .fill(Color.white.opacity(0.9))
                                )
                                .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 3)
                        }
                    }
                    
                    // Title + Status
                    VStack(alignment: .leading, spacing: 2) {
                        Text(currentSessionId != nil ? "PROSTO DENTAL AI" : "PROSTO DENTAL AI")
                            .font(.system(size: 10, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(primaryColor)
                        
                        HStack(spacing: 6) {
                            Circle()
                                .fill(currentSessionId != nil ? Color.green : Color.orange)
                                .frame(width: 6, height: 6)
                            
                            Text(currentSessionId != nil ? getSessionTitle() : "Ready to help you!")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    if messages.count >= 20 {
                        Text("Limit Reached")
                            .font(.system(size: 8, weight: .black))
                            .foregroundColor(.red)
                            .padding(6)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(6)
                    }
                    
                    // Session Switcher
                    Button(action: { showingSessions.toggle() }) {
                        Image(systemName: "line.3.horizontal")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(primaryColor)
                            .padding(10)
                            .background(primaryColor.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(.ultraThinMaterial)
                
                // Chat History
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 20) {
                            ForEach(messages) { message in
                                AIChatBubble(message: message, isDentist: isDentist)
                            }
                            
                            if nanobot.isGenerating {
                                HStack {
                                    AITypingIndicator(role: role)
                                    Spacer()
                                }
                                .padding(.horizontal)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _ in
                        if let lastId = messages.last?.id {
                            withAnimation {
                                proxy.scrollTo(lastId, anchor: .bottom)
                            }
                        }
                    }
                }
                
                VStack(spacing: 0) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            QuickActionChip(title: "Cost Details", icon: "indianrupeesign.circle.fill", isDentist: isDentist) {
                                let contextStr = treatmentName != nil ? "for my \(treatmentName!) plan (about ₹\(Int(estimatedCost ?? 0)))" : "for my dental treatment"
                                sendQuickQuery("Can you help me understand the cost breakdown \(contextStr)? I'm curious about what's included.")
                            }
                            .disabled(messages.count >= 20)
                            .opacity(messages.count >= 20 ? 0.5 : 1.0)
                            
                            QuickActionChip(title: "Treatment Plan", icon: "calendar.badge.clock", isDentist: isDentist) {
                                let contextStr = treatmentName != nil ? "for my \(treatmentName!) treatment" : "for my dental care"
                                sendQuickQuery("What does the treatment timeline look like \(contextStr)? How many visits will I need?")
                            }
                            .disabled(messages.count >= 20)
                            .opacity(messages.count >= 20 ? 0.5 : 1.0)
                            
                            QuickActionChip(title: "About Procedure", icon: "shield.lefthalf.filled", isDentist: isDentist) {
                                let contextStr = treatmentName != nil ? "about my \(treatmentName!) procedure" : "about my dental treatment"
                                sendQuickQuery("Can you explain what \(contextStr) involves? I want to know what to expect.")
                            }
                            .disabled(messages.count >= 20)
                            .opacity(messages.count >= 20 ? 0.5 : 1.0)
                            
                            QuickActionChip(title: "Ask Anything", icon: "questionmark.circle.fill", isDentist: isDentist) {
                                sendQuickQuery("I have a question about my dental health. Can you help me understand better?")
                            }
                            .disabled(messages.count >= 20)
                            .opacity(messages.count >= 20 ? 0.5 : 1.0)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                    }
                    .background(Color.white.opacity(0.8))
                    
                    Divider()
                    
                    // Input Area
                    VStack(spacing: 12) {
                        HStack(spacing: 12) {
                            TextField(messages.count >= 20 ? "Chat limit reached..." : "Ask me anything about your dental treatment...", text: $inputText)
                                .padding(14)
                                .background(Color.white)
                                .cornerRadius(25)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 25)
                                        .stroke(primaryColor.opacity(0.1), lineWidth: 1)
                                )
                                .onSubmit(sendMessage)
                                .disabled(messages.count >= 20 || currentSessionId == nil)
                            
                            Button(action: sendMessage) {
                                ZStack {
                                    Circle()
                                        .fill(inputText.isEmpty || messages.count >= 20 || currentSessionId == nil ? Color.gray.opacity(0.1) : primaryColor)
                                        .frame(width: 44, height: 44)
                                    Image(systemName: "paperplane.fill")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(inputText.isEmpty ? .gray : .white)
                                }
                            }
                            .disabled(inputText.isEmpty || nanobot.isGenerating || messages.count >= 20 || currentSessionId == nil)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 12)
                        
                        Text(messages.count >= 20 ? "Chat limit reached. Please start a new session." : "ProstoCalc AI: Your friendly dental companion 💙")
                            .font(.system(size: 9, weight: .bold))
                            .tracking(0.5)
                            .foregroundColor(messages.count >= 20 ? .red : .gray.opacity(0.6))
                            .padding(.bottom, 12)
                    }
                    .background(.ultraThinMaterial)
                }
            }
        }
        .onAppear(perform: initialLoad)
        .sheet(isPresented: $showingSessions) {
            SessionListView(
                sessions: $sessions,
                currentSessionId: $currentSessionId,
                isDentist: isDentist,
                onSelect: { id in
                    currentSessionId = id
                    loadHistory(for: id)
                    showingSessions = false
                },
                onNew: startNewSession,
                onRename: { id, title in
                    sessionToRename = id
                    renameText = title
                    isRenaming = true
                },
                onDelete: deleteSession
            )
            .presentationDetents([.medium, .large])
        }
        .alert("Rename Session", isPresented: $isRenaming) {
            TextField("Session Name", text: $renameText)
            Button("Cancel", role: .cancel) { isRenaming = false }
            Button("Save") {
                if let id = sessionToRename {
                    updateSessionTitle(id: id, newTitle: renameText)
                }
            }
        }
    }
    
    private func getSessionTitle() -> String {
        if let currentSessionId = currentSessionId,
           let session = sessions.first(where: { $0.id == currentSessionId }) {
            return session.title.uppercased()
        }
        return "General Chat"
    }
    
    private func initialLoad() {
        fetchSessions {
            if currentSessionId == nil, let first = sessions.first?.id {
                currentSessionId = first
                loadHistory(for: first)
            } else if sessions.isEmpty {
                startNewSession()
            }
        }
    }
    
    private func fetchSessions(completion: (() -> Void)? = nil) {
        APIService.getAISessions(userId: userId, role: role.lowercased()) { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    self.sessions = items.compactMap { item in
                        guard let id = item["id"] as? Int,
                              let title = item["title"] as? String else { return nil }
                        return ChatSession(id: id, title: title)
                    }
                    completion?()
                }
            }
        }
    }
    
    private func startNewSession() {
        guard !isCreatingSession else { return }
        guard sessions.count < 15 else { return }
        
        // Prevent creating a new session if the current one is already empty/new
        if let currentId = currentSessionId, 
           let current = sessions.first(where: { $0.id == currentId }),
           current.title.contains("New Case"),
           messages.count <= 1 { // Only greeting message exists
            showingSessions = false
            return 
        }

        isCreatingSession = true
        let newTitle = "New Case \(sessions.count + 1)"
        APIService.createAISession(userId: userId, role: role.lowercased(), title: newTitle) { result in
            DispatchQueue.main.async {
                self.isCreatingSession = false
                if case .success(let id) = result {
                    currentSessionId = id
                    messages = [AIMessage(text: "Hello \(userName)! 👋 Welcome to Prosto! I'm your friendly dental assistant. Feel free to ask me anything about your treatment - I'm here to help you understand your dental care better! 😊", isUser: false)]
                    fetchSessions()
                    showingSessions = false
                }
            }
        }
    }
    
    private func loadHistory(for sessionId: Int) {
        messages = []
        APIService.getAIChatHistory(userId: userId, role: role.lowercased(), sessionId: sessionId) { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    if items.isEmpty {
                        messages.append(AIMessage(text: "Great to see you! I'm ready to help you understand your dental treatment better. What would you like to know? 😊", isUser: false))
                    } else {
                        self.messages = items.flatMap { item -> [AIMessage] in
                            let userMsg = AIMessage(text: item["message"] as? String ?? "", isUser: true)
                            let aiMsg = AIMessage(text: item["response"] as? String ?? "", isUser: false)
                            return [userMsg, aiMsg]
                        }
                    }
                }
            }
        }
    }
    
    private func updateSessionTitle(id: Int, newTitle: String) {
        APIService.updateSessionTitle(sessionId: id, title: newTitle) { _ in
            fetchSessions()
        }
    }
    
    private func deleteSession(id: Int) {
        APIService.deleteSession(sessionId: id) { _ in
            if currentSessionId == id {
                currentSessionId = nil
                messages = []
            }
            fetchSessions()
        }
    }
    
    private func sendQuickQuery(_ query: String) {
        inputText = query
        sendMessage()
    }
    
    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard messages.count < 20 else { return } // STRICT LIMIT CHECK
        guard !text.isEmpty, let sId = currentSessionId else { return }
        
        let userMessage = AIMessage(text: text, isUser: true)
        messages.append(userMessage)
        
        // Build full conversation history for context (user + AI messages)
        var previousMessages: [(role: String, content: String)] = []
        for msg in messages {
            if msg.isUser {
                previousMessages.append((role: "user", content: msg.text))
            } else {
                previousMessages.append((role: "assistant", content: msg.text))
            }
        }
        
        // Context setup (synced with treatment plan data)
        let context = AssistantContext(
            treatmentName: treatmentName ?? text,
            estimatedCost: estimatedCost,
            numberOfVisits: numberOfVisits,
            clinicType: nil,
            toothDetails: toothDetails,
            userName: userName,
            userRole: role.lowercased(),
            patientAge: patientAge,
            urgencyRating: urgencyRating
        )
        
        inputText = ""
        
        nanobot.generateSmartExplanation(context: context, isDetailed: false, previousMessages: previousMessages) { result in
            if case .success(let response) = result {
                DispatchQueue.main.async {
                    messages.append(AIMessage(text: response, isUser: false))
                    APIService.saveAIChat(userId: userId, role: role.lowercased(), sessionId: sId, message: text, response: response) { _ in }
                }
            }
        }
    }
}

struct SessionListView: View {
    @Binding var sessions: [ChatSession]
    @Binding var currentSessionId: Int?
    var isDentist: Bool
    var onSelect: (Int) -> Void
    var onNew: () -> Void
    var onRename: (Int, String) -> Void
    var onDelete: (Int) -> Void
    
    private var primaryColor: Color {
        isDentist ? Color.dentalCyan : Color.blue
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Premium Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Clinical Dossiers")
                        .font(.system(size: 20, weight: .black))
                        .foregroundColor(.primary)
                    Text("MANAGE YOUR ACTIVE CASELOAD")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary)
                        .tracking(0.5)
                }
                Spacer()
                Button(action: onNew) {
                    Label("New Case", systemImage: "plus.app.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 14)
                        .background(primaryColor)
                        .cornerRadius(10)
                        .shadow(color: primaryColor.opacity(0.3), radius: 5, y: 3)
                }
                .disabled(sessions.count >= 15)
                .opacity(sessions.count >= 15 ? 0.5 : 1.0)
            }
            .padding(25)
            
            if sessions.isEmpty {
                Spacer()
                VStack(spacing: 15) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 40))
                        .foregroundColor(primaryColor.opacity(0.2))
                    Text("No clinical histories found.")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(sessions) { session in
                            SessionRow(
                                session: session,
                                isSelected: currentSessionId == session.id,
                                primaryColor: primaryColor,
                                onSelect: { onSelect(session.id) },
                                onRename: { onRename(session.id, session.title) },
                                onDelete: { onDelete(session.id) }
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
            
            Divider()
            
            HStack {
                Text("\(sessions.count) of 15 Sessions Active")
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(.secondary)
                Spacer()
                Circle()
                    .fill(sessions.count >= 15 ? Color.red : Color.green)
                    .frame(width: 8, height: 8)
            }
            .padding(20)
            .background(Color.gray.opacity(0.05))
        }
        .background(Color(UIColor.systemGroupedBackground))
    }
}

struct SessionRow: View {
    let session: ChatSession
    let isSelected: Bool
    let primaryColor: Color
    let onSelect: () -> Void
    let onRename: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: 15) {
            // Icon Badge
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? primaryColor : Color.white)
                    .frame(width: 44, height: 44)
                    .shadow(color: isSelected ? primaryColor.opacity(0.3) : Color.black.opacity(0.05), radius: 5, y: 2)
                
                Image(systemName: isSelected ? "checkmark.circle.fill" : "doc.text.fill")
                    .foregroundColor(isSelected ? .white : primaryColor.opacity(0.6))
                    .font(.system(size: 18))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(session.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(isSelected ? .primary : .primary.opacity(0.8))
                
                Text(isSelected ? "Active Review" : "Stored Clinical History")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Action Menu
            HStack(spacing: 8) {
                Button(action: onRename) {
                    Image(systemName: "pencil.circle.fill")
                        .font(.system(size: 22))
                        .foregroundColor(.orange.opacity(0.8))
                }
                
                Button(action: onDelete) {
                    Image(systemName: "trash.circle.fill")
                        .font(.system(size: 22))
                        .foregroundColor(.red.opacity(0.8))
                }
            }
        }
        .padding(12)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isSelected ? primaryColor.opacity(0.3) : Color.clear, lineWidth: 2)
        )
        .onTapGesture(perform: onSelect)
        .shadow(color: Color.black.opacity(0.03), radius: 10, y: 5)
        .contextMenu {
            Button(action: onRename) {
                Label("Change Case Name", systemImage: "pencil")
            }
            Button(role: .destructive, action: onDelete) {
                Label("Archive and Delete", systemImage: "trash")
            }
        }
    }
}

struct AIChatBubble: View {
    let message: AIMessage
    var isDentist: Bool = false
    
    private var primaryColor: Color {
        isDentist ? Color.dentalCyan : Color.blue
    }
    
    private var primaryDarkColor: Color {
        isDentist ? Color(hex: "0891B2") : Color(hex: "1D4ED8")
    }
    
    var body: some View {
        HStack {
            if message.isUser { Spacer() }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                let cleanText = message.text
                    .replacingOccurrences(of: "```markdown", with: "")
                    .replacingOccurrences(of: "```", with: "")
                    .replacingOccurrences(of: "### ", with: "")
                    .replacingOccurrences(of: "###", with: "")
                    .replacingOccurrences(of: "---", with: "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                
                Text(LocalizedStringKey(cleanText))
                    .padding(14)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .background(
                        message.isUser ? 
                        LinearGradient(colors: [primaryColor, primaryDarkColor], startPoint: .topLeading, endPoint: .bottomTrailing) : 
                        LinearGradient(colors: [Color.white.opacity(0.9), Color.white.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .foregroundColor(message.isUser ? .white : .dentalDarkBlue)
                    .aicornerRadius(20, corners: message.isUser ? [.topLeft, .topRight, .bottomLeft] : [.topLeft, .topRight, .bottomRight])
                    .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                
                Text(formatTime(message.timestamp))
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.gray.opacity(0.5))
                    .padding(message.isUser ? .trailing : .leading, 8)
            }
            .frame(maxWidth: 300, alignment: message.isUser ? .trailing : .leading)
            
            if !message.isUser { Spacer() }
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date).uppercased()
    }
}

struct AITypingIndicator: View {
    var role: String
    @State private var anim = false
    
    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<3) { i in
                Circle()
                    .fill((role.lowercased() == "dentist" ? Color.dentalCyan : Color.blue).opacity(0.6))
                    .frame(width: 5, height: 5)
                    .scaleEffect(anim ? 1.0 : 0.4)
                    .animation(.easeInOut(duration: 0.6).repeatForever().delay(Double(i) * 0.15), value: anim)
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 18)
        .background(Color.white.opacity(0.8))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.03), radius: 5)
        .onAppear { anim = true }
    }
}

extension View {
    func aicornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(AIRoundedCorner(radius: radius, corners: corners))
    }
}

struct AIRoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

struct QuickActionChip: View {
    let title: String
    let icon: String
    var isDentist: Bool = false
    let action: () -> Void
    
    private var primaryColor: Color {
        isDentist ? Color.dentalCyan : Color.blue
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                Text(title)
                    .font(.system(size: 11, weight: .black))
                    .tracking(0.5)
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 16)
            .background(Color.white)
            .foregroundColor(primaryColor)
            .cornerRadius(12)
            .shadow(color: primaryColor.opacity(0.1), radius: 5, y: 3)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(primaryColor.opacity(0.1), lineWidth: 1)
            )
        }
    }
}

