import SwiftUI

struct Message: Identifiable {
    let id: Int
    let chatId: Int
    let senderRole: String
    let content: String
    let sentAt: String
}

// Helper to convert emoji to codepoint for URL
func emojiToCodepoint(_ emoji: String) -> String? {
    guard let scalar = emoji.unicodeScalars.first, scalar.isEmoji else { return nil }
    return String(scalar.value, radix: 16, uppercase: true)
}

struct SecureChatView: View {
    @State var chatId: Int
    let requestId: Int?
    let otherPartyName: String
    let myRole: String // "PATIENT" or "DENTIST"
    
    @State private var messages: [Message] = []
    @State private var newMessage = ""
    @State private var isLoading = false
    @State private var timer: Timer?
    @State private var internalRequestId: Int? = nil
    @State private var currentPlan: [String: Any]? = nil
    @State private var visitStatus: String? = nil
    @State private var showTimeline = false
    @State private var showEmojiPicker = false
    @FocusState private var isInputFocused: Bool
    
    // Emoji categories for WhatsApp-style picker
    private let emojiCategories: [(String, [String])] = [
        ("Smileys", ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"]),
        ("Gestures", ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃"]),
        ("Hearts", ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💋", "💌", "💒", "💑", "💏"]),
        ("Nature", ["🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀", "🎍", "🪴", "🎋", "🍃", "🍂", "🍁", "🍄", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎", "🌍", "🌏", "🪐", "⭐", "🌟", "💫", "✨", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "💧", "💦", "☔", "☂️", "🌊"]),
        ("Food", ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍡", "🍧", "🍨", "🍢", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "☕", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊"]),
        ("Activities", ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤽", "🤾", "🤺", "⛹️", "🏊", "🚣", "🧘", "🛀", "🛌", "🏇", "🧎", "🚶", "🧍", "🧑‍🦯", "👯", "🕴️", "💃", "🕺", "🪄", "🎭", "🩰", "🎪", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰"]),
        ("Objects", ["⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "🪦", "⚱️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹", "🪠", "🧺", "🧻", "🚽", "🚰", "🚿", "🛁", "🛀", "🧼", "🪥", "🪒", "🧽", "🪣", "🧴", "🛎️", "🔑", "🗝️", "🚪", "🪑", "🛋️", "🛏️", "🛌", "🧸", "🪆", "🖼️", "🪞", "🪟", "🛍️", "🛒", "🎁", "🎈", "🎏", "🎀", "🪄", "🎊", "🎉", "🎎", "🏮", "🎐", "🧧", "✉️", "📩", "📨", "📧", "💌", "📥", "📤", "📦", "🏷️", "🪧", "📪", "📫", "📬", "📭", "📮", "📯", "📜", "📃", "📄", "📑", "🧾", "📊", "📈", "📉", "🗒️", "🗓️", "📆", "📅", "🗑️", "📇", "🗃️", "🗳️", "🗄️", "📋", "📁", "📂", "🗂️", "🗞️", "📰", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "📚", "📖", "🔖", "🧷", "🔗", "📎", "🖇️", "📐", "📏", "🧮", "📌", "📍", "✂️", "🖊️", "🖋️", "✒️", "🖌️", "🖍️", "📝", "✏️", "🔍", "🔎", "🔏", "🔐", "🔒", "🔓", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔"]),
        ("Symbols", ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "🕎", "☯️", "☸️", "✡️", "🔯", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🛗", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "⚧", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "♾️", "💲", "💱", "™️", "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔝", "🔜", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊", "🔔", "🔕", "📣", "📢", "💬", "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴", "🀄"]),
        ("Flags", ["🏳️", "🏴", "🏴‍☠️", "🏁", "🚩", "🎌", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇺🇸", "🇬🇧", "🇮🇳", "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇯🇵", "🇰🇷", "🇨🇳", "🇧🇷", "🇲🇽", "🇷🇺", "🇿🇦"])
    ]
    
    @Environment(\.dismiss) var dismiss
    
    var isThreadLocked: Bool {
        visitStatus == "visited"
    }
    
    var body: some View {
        NavigationStack {
      
              
            
            VStack(spacing: 0) {
                // Professional Header Banner for Status
                if isThreadLocked {
                    HStack {
                        Image(systemName: "lock.fill")
                        Text("This clinical thread is archived (Treatment Completed)")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.green.opacity(0.1))
                    .foregroundColor(.green)
                } else if visitStatus == "postponed" {
                    HStack {
                        Image(systemName: "calendar.badge.clock")
                        Text("Session Postponed - Awaiting New Schedule")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.orange.opacity(0.1))
                    .foregroundColor(.orange)
                }

                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 24) {
                            if let plan = currentPlan {
                                TreatmentPlanCard(plan: plan, myRole: myRole)
                                    .padding(.top, 15)
                            }
                            
                            // Spacer for top content spacing
                            Color.clear.frame(height: 10)
                            
                            ForEach(messages) { msg in
                                ChatBubble(message: msg, 
                                          isFromMe: msg.senderRole == myRole,
                                          myRole: myRole)
                                    .id(msg.id)
                            }
                            
                            if isThreadLocked {
                                VStack(spacing: 12) {
                                    Divider().padding(.horizontal, 40)
                                    Text("Official treatment session concluded on \(currentPlan?["actual_end_time"] as? String ?? "Completion").")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.center)
                                        .padding(.horizontal, 40)
                                }
                                .padding(.top, 20)
                                .padding(.bottom, 40)
                            }
                        }
                        .padding(.horizontal)
                    }
                    .onChange(of: messages.count) { _ in
                        scrollToBottom(proxy: proxy)
                    }
                }
                
                // Input Area
                VStack(spacing: 0) {
                    Divider().opacity(0.1)
                    if !isThreadLocked {
                        HStack(spacing: 12) {
                            // Emoji Picker Button
                            Button(action: {
                                if showEmojiPicker {
                                    // If picker is open, close it and unfocus
                                    showEmojiPicker = false
                                    isInputFocused = false
                                } else {
                                    // Open emoji picker and unfocus text field
                                    isInputFocused = false
                                    showEmojiPicker = true
                                }
                            }) {
                                Image(systemName: showEmojiPicker ? "keyboard" : "face.smiling")
                                    .font(.system(size: 22, weight: .medium))
                                    .foregroundColor(showEmojiPicker ? (myRole == "DENTIST" ? .teal : .blue) : .gray)
                            }
                            
                            if #available(iOS 17.0, *) {
                                TextField("Write clinical message...", text: $newMessage)
                                    .font(.system(size: 15, weight: .medium))
                                    .padding(14)
                                    .background(Color.white.opacity(0.5))
                                    .cornerRadius(24)
                                    .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.black.opacity(0.05), lineWidth: 1))
                                    .focused($isInputFocused)
                                    .onChange(of: isInputFocused) { _, newValue in
                                        if newValue && showEmojiPicker {
                                            showEmojiPicker = false
                                        }
                                    }
                            } else {
                                // Fallback on earlier versions
                            }
                            
                            Button(action: sendMessage) {
                                ZStack {
                                    Circle()
                                        .fill(newMessage.trimmingCharacters(in: .whitespaces).isEmpty ? 
                                              Color.gray : 
                                              (myRole == "DENTIST" ? Color.teal : Color.blue))
                                        .frame(width: 48, height: 48)
                                        .shadow(color: (myRole == "DENTIST" ? Color.teal : Color.blue).opacity(0.2), radius: 8, y: 4)
                                    
                                    Image(systemName: "paperplane.fill")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                }
                            }
                            .disabled(newMessage.trimmingCharacters(in: .whitespaces).isEmpty)
                        }
                        .padding(15)
                        .background(.ultraThinMaterial)
                    } else {
                        HStack {
                            Spacer()
                            Text("Messaging is disabled for completed treatments.")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.secondary)
                            Spacer()
                        }
                        .padding(25)
                        .background(Color.gray.opacity(0.05))
                    }
                }
                
                // WhatsApp-style Emoji Picker
                if showEmojiPicker {
                    WhatsAppEmojiPicker(
                        categories: emojiCategories,
                        onEmojiSelected: { emoji in
                            newMessage += emoji
                        },
                        onDismiss: {
                            showEmojiPicker = false
                        },
                        accentColor: myRole == "DENTIST" ? .teal : .blue
                    )
                }
            }
            .background(
                        DentalBackgroundView(animate: true, isDentist: myRole == "DENTIST")
                            .ignoresSafeArea()
                    )
            .navigationTitle(otherPartyName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                
                    ToolbarItem(placement: .navigationBarLeading) {
                        BackButton {
                            dismiss()
                        }
                    }
                
                
                    
                        ToolbarItem(placement: .navigationBarTrailing) {
                            if internalRequestId ?? requestId != nil {
                                JourneyButton {
                                    showTimeline = true
                                }
                            }
                        }
                    
            }
            .onAppear {
                if chatId == 0, let reqId = requestId {
                    APIService.initChat(requestId: reqId) { result in
                        if case .success(let newChatId) = result {
                            self.chatId = newChatId
                            self.internalRequestId = reqId
                            loadMessages()
                            startTimer()
                            fetchRequestAndPlan()
                        }
                    }
                } else {
                    loadMessages()
                    startTimer()
                    fetchRequestAndPlan()
                }
            }
            .onDisappear {
                timer?.invalidate()
            }
            .fullScreenCover(isPresented: $showTimeline) {
                if let rId = internalRequestId ?? requestId {
                    TreatmentTimelineView(requestId: rId, isDentist: myRole == "DENTIST")
                }
            }
        }
    }
    
    
    private func scrollToBottom(proxy: ScrollViewProxy) {
        if let last = messages.last {
            withAnimation {
                proxy.scrollTo(last.id, anchor: .bottom)
            }
        }
    }
    
    private func fetchRequestAndPlan() {
        APIService.getChatDetails(chatId: chatId) { result in
            if case .success(let dict) = result, let rId = dict["request_id"] as? Int {
                DispatchQueue.main.async {
                    self.internalRequestId = rId
                    self.visitStatus = dict["visit_status"] as? String
                    
                    APIService.getTreatmentPlan(requestId: rId) { res in
                        if case .success(let plan) = res {
                            DispatchQueue.main.async { self.currentPlan = plan }
                        }
                    }
                }
            }
        }
    }
    
    private func loadMessages() {
        APIService.getMessages(chatId: chatId) { result in
            DispatchQueue.main.async {
                if case .success(let data) = result {
                    self.messages = data.compactMap { dict in
                        guard let id = dict["id"] as? Int,
                              let cId = dict["chat_id"] as? Int,
                              let role = dict["sender_role"] as? String,
                              let content = dict["message"] as? String,
                              let sentAt = dict["sent_at"] as? String else { return nil }
                        return Message(id: id, chatId: cId, senderRole: role, content: content, sentAt: sentAt)
                    }
                }
            }
        }
    }
    
    private func sendMessage() {
        let msgCopy = newMessage.trimmingCharacters(in: .whitespaces)
        guard !msgCopy.isEmpty else { return }
        newMessage = ""
        
        // Optimistic UI for smooth professional feel
        let tempId = Int.random(in: 100000...999999)
        let tempMsg = Message(id: tempId, chatId: chatId, senderRole: myRole, content: msgCopy, sentAt: "Just now")
        messages.append(tempMsg)
        
        let data: [String: Any] = [
            "chat_id": chatId,
            "sender_role": myRole,
            "message": msgCopy
        ]
        
        APIService.sendMessage(data: data) { result in
            if case .success = result {
                loadMessages()
            } else {
                // If failed, remove the temp message
                DispatchQueue.main.async {
                    self.messages.removeAll { $0.id == tempId }
                }
            }
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            loadMessages()
        }
    }
}

// WhatsApp-style Emoji Picker
struct WhatsAppEmojiPicker: View {
    let categories: [(String, [String])]
    let onEmojiSelected: (String) -> Void
    let onDismiss: () -> Void
    let accentColor: Color
    
    @State private var selectedCategory = 0
    @State private var recentEmojis: [String] = ["👍", "❤️", "😊", "😂", "🙏", "😢", "😮", "😡"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Emoji")
                    .font(.system(size: 16, weight: .semibold))
                Spacer()
                Button(action: onDismiss) {
                    Text("Done")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(accentColor)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
            
            // Category tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    // Recent emojis
                    CategoryButton(emoji: "🕐", isSelected: selectedCategory == -1) {
                        selectedCategory = -1
                    }
                    
                    ForEach(categories.indices, id: \.self) { index in
                        CategoryButton(
                            emoji: getCategoryEmoji(for: index),
                            isSelected: selectedCategory == index
                        ) {
                            selectedCategory = index
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
            .background(Color(.systemGray6))
            
            // Emoji grid
            ScrollView {
                if selectedCategory == -1 {
                    // Recent emojis
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 8) {
                        ForEach(recentEmojis, id: \.self) { emoji in
                            EmojiButton(emoji: emoji) {
                                onEmojiSelected(emoji)
                            }
                        }
                    }
                } else {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 8) {
                        ForEach(categories[selectedCategory].1, id: \.self) { emoji in
                            EmojiButton(emoji: emoji) {
                                onEmojiSelected(emoji)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 8)
        }
        .frame(height: 320)
        .background(Color(.systemBackground))
    }
    
    private func getCategoryEmoji(for index: Int) -> String {
        switch index {
        case 0: return "😀"
        case 1: return "👋"
        case 2: return "❤️"
        case 3: return "🌿"
        case 4: return "🍔"
        case 5: return "⚽"
        case 6: return "💡"
        case 7: return "♻️"
        case 8: return "🏳️"
        default: return "😀"
        }
    }
}

struct CategoryButton: View {
    let emoji: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(emoji)
                .font(.system(size: 24))
                .frame(width: 44, height: 36)
                .background(isSelected ? Color.gray.opacity(0.3) : Color.clear)
                .cornerRadius(8)
        }
    }
}

struct EmojiButton: View {
    let emoji: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(emoji)
                .font(.system(size: 28))
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(EmojiButtonStyle())
    }
}

struct EmojiButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 1.2 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

struct ChatBubble: View {
    let message: Message
    let isFromMe: Bool
    let myRole: String // "PATIENT" or "DENTIST"
    
    private var bubbleColor: Color {
        if isFromMe {
            // My message
            return myRole == "DENTIST" ? .teal : .blue
        } else {
            // Other person's message
            return myRole == "DENTIST" ? .blue : .teal
        }
    }
    
    // Check if content is a single emoji (for large animated display)
    private var isSingleEmoji: Bool {
        let trimmed = message.content.trimmingCharacters(in: .whitespaces)
        // Check if it's exactly one emoji character
        if trimmed.isEmpty { return false }
        let emojiCount = trimmed.unicodeScalars.filter { $0.isEmoji }.count
        return emojiCount == 1 && trimmed.unicodeScalars.count <= 2
    }
    
    // Check if content contains multiple emojis
    private var containsMultipleEmojis: Bool {
        let trimmed = message.content.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty { return false }
        let emojiCount = trimmed.unicodeScalars.filter { $0.isEmoji }.count
        return emojiCount > 1
    }
    
    var body: some View {
        HStack {
            if isFromMe { Spacer() }
            
            VStack(alignment: isFromMe ? .trailing : .leading, spacing: 4) {
                // Single emoji - load animated GIF from Google Noto
                if isSingleEmoji {
                    AnimatedEmojiGIFView(emoji: message.content, isFromMe: isFromMe, bubbleColor: bubbleColor)
                } 
                // Multiple emojis - normal display
                else if containsMultipleEmojis {
                    Text(message.content)
                        .font(.system(size: 28))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background {
                            if isFromMe {
                                LinearGradient(colors: [bubbleColor, bubbleColor.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
                            } else {
                                Color.clear.background(.ultraThinMaterial)
                            }
                        }
                        .foregroundColor(isFromMe ? .white : .primary)
                        .cornerRadius(22)
                        .overlay(
                            RoundedRectangle(cornerRadius: 22)
                                .stroke(Color.white.opacity(isFromMe ? 0.0 : 0.5), lineWidth: 1)
                        )
                        .shadow(color: (isFromMe ? bubbleColor : Color.black).opacity(0.05), radius: 5, y: 2)
                }
                // Normal text message
                else {
                    Text(message.content)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .background {
                            if isFromMe {
                                LinearGradient(colors: [bubbleColor, bubbleColor.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
                            } else {
                                Color.clear.background(.ultraThinMaterial)
                            }
                        }
                        .foregroundColor(isFromMe ? .white : .primary)
                        .cornerRadius(22)
                        .overlay(
                            RoundedRectangle(cornerRadius: 22)
                                .stroke(Color.white.opacity(isFromMe ? 0.0 : 0.5), lineWidth: 1)
                        )
                        .shadow(color: (isFromMe ? bubbleColor : Color.black).opacity(0.05), radius: 5, y: 2)
                }
                
                Text(message.sentAt.formattedDateTime())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary.opacity(0.6))
                    .padding(isFromMe ? .trailing : .leading, 8)
            }
            .frame(maxWidth: 300, alignment: isFromMe ? .trailing : .leading)
            
            if !isFromMe { Spacer() }
        }
    }
}

// Animated GIF Emoji View using Google Noto Emoji
struct AnimatedEmojiGIFView: View {
    let emoji: String
    let isFromMe: Bool
    let bubbleColor: Color
    
    // Generate the animated GIF URL from Google Noto Emoji
    private var gifURL: URL? {
        guard let codepoint = emojiToCodepoint(emoji) else { return nil }
        return URL(string: "https://fonts.gstatic.com/s/e/notoemoji/latest/\(codepoint)/512.gif")
    }
    
    private var webpURL: URL? {
        guard let codepoint = emojiToCodepoint(emoji) else { return nil }
        return URL(string: "https://fonts.gstatic.com/s/e/notoemoji/latest/\(codepoint)/512.webp")
    }
    
    var body: some View {
        VStack(spacing: 4) {
            // Try to load animated GIF
            if let url = gifURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 80, height: 80)
                    case .failure:
                        // Fallback to static emoji if GIF fails
                        fallbackView
                    case .empty:
                        // Show loading state
                        ProgressView()
                            .frame(width: 80, height: 80)
                    @unknown default:
                        fallbackView
                    }
                }
            } else {
                fallbackView
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background {
            if isFromMe {
                LinearGradient(colors: [bubbleColor, bubbleColor.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
            } else {
                Color.clear.background(.ultraThinMaterial)
            }
        }
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(isFromMe ? 0.0 : 0.5), lineWidth: 1)
        )
        .shadow(color: (isFromMe ? bubbleColor : Color.black).opacity(0.1), radius: 8, y: 4)
    }
    
    private var fallbackView: some View {
        Text(emoji)
            .font(.system(size: 64))
    }
}

// UnicodeScalar extension to detect emojis
extension UnicodeScalar {
    var isEmoji: Bool {
        // Check for emoji code points
        switch value {
        case 0x1F600...0x1F64F, // Emoticons
             0x1F300...0x1F5FF, // Misc Symbols and Pictographs
             0x1F680...0x1F6FF, // Transport and Map Symbols
             0x1F700...0x1F77F, // Alchemical Symbols
             0x1F780...0x1F7FF, // Geometric Shapes Extended
             0x1F800...0x1F8FF, // Supplemental Arrows-C
             0x1F900...0x1F9FF, // Supplemental Symbols and Pictographs
             0x1FA00...0x1FA6F, // Chess Symbols
             0x1FA70...0x1FAFF, // Symbols and Pictographs Extended-A
             0x2600...0x26FF,   // Misc Symbols
             0x2700...0x27BF,   // Dingbats
             0xFE00...0xFE0F,   // Variation Selectors
             0x1F1E6...0x1F1FF: // Regional Indicator Symbols (flags)
            return true
        default:
            return false
        }
    }
}

struct TreatmentPlanCard: View {
    let plan: [String: Any]
    let myRole: String
    @State private var isExpanded = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Premium Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TREATMENT DOSSIER ACTIVE")
                        .font(.system(size: 8, weight: .black))
                        .tracking(1)
                        .foregroundColor(.white.opacity(0.8))
                    Text("Clinical Analysis Sync")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                }
                Spacer()
                Image(systemName: "checkmark.shield.fill")
                    .foregroundColor(.white)
            }
            .padding(18)
            .background(LinearGradient(colors: [.teal, Color(hex: "0D9488")], startPoint: .topLeading, endPoint: .bottomTrailing))
            
            // Core Details
            VStack(alignment: .leading, spacing: 15) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TOTAL INVESTMENT")
                            .font(.system(size: 9, weight: .black))
                            .foregroundColor(.secondary)
                        let totalVal = Double(String(describing: plan["total_cost"] ?? "0")) ?? 0.0
                        Text("₹\(totalVal, specifier: "%.0f")")
                            .font(.system(size: 20, weight: .black, design: .rounded))
                            .foregroundColor(.dentalDarkBlue)
                    }
                    Spacer()
                    
                    if let sessions = (plan["items"] as? [[String: Any]])?.count {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("SESSIONS")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.secondary)
                            Text("\(sessions)")
                                .font(.system(size: 20, weight: .black, design: .rounded))
                                .foregroundColor(.teal)
                        }
                    }
                }
                
                if let aiEx = plan["ai_explanation"] as? String, (plan["share_ai_explanation"] as? Int ?? 1) == 1 || myRole == "DENTIST" {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Label("AI CASE INSIGHT", systemImage: "sparkles")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.indigo)
                            Spacer()
                            Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                                .font(.system(size: 10))
                                .foregroundColor(.indigo)
                        }
                        
                        Text(LocalizedStringKey(aiEx))
                            .font(.system(size: 12, weight: .medium))
                            .lineSpacing(3)
                            .foregroundColor(.secondary)
                            .lineLimit(isExpanded ? nil : 2)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.indigo.opacity(0.05))
                    .cornerRadius(12)
                    .onTapGesture { withAnimation { isExpanded.toggle() } }
                }
                
                if (plan["share_cost_details"] as? Int ?? 1) == 1 || myRole == "DENTIST" {
                    if let items = plan["items"] as? [[String: Any]] {
                        Divider()
                        Text("PROCEDURE NODES")
                            .font(.system(size: 9, weight: .black))
                            .foregroundColor(.secondary)
                        
                        ForEach(items.indices, id: \.self) { index in
                            let item = items[index]
                            HStack {
                                Text(item["treatment_name"] as? String ?? "")
                                    .font(.system(size: 12, weight: .bold))
                                if let tooth = item["tooth_number"] as? String, !tooth.isEmpty {
                                    Text("(#\(tooth))")
                                        .font(.system(size: 10))
                                        .foregroundColor(.secondary)
                                    }
                                Spacer()
                                let itemCost = Double(String(describing: item["cost_override"] ?? "0")) ?? 0.0
                                Text("₹\(itemCost, specifier: "%.0f")")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundColor(.dentalDarkBlue)
                            }
                        }
                    }
                }
            }
            .padding(18)
            .background(.ultraThinMaterial)
        }
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white.opacity(0.3), lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 20, y: 10)
        .padding(.horizontal)
    }
}

struct JourneyButton: View {
    var action: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: "clock.badge.checkmark.fill")
                    .font(.system(size: 13, weight: .semibold))
                
                Text("JOURNEY")
                    .font(.system(size: 11, weight: .black))
                    .tracking(0.5)
            }
            .foregroundColor(.cyan)
            .padding(.vertical, 10)
            .padding(.horizontal, 18)
            .background(
                Capsule()
                    .fill(Color.white)
            )
            .scaleEffect(isPressed ? 0.9 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}
