import SwiftUI

struct NotificationItem: Identifiable, Codable {
    let id: Int
    let title: String
    let message: String
    let is_read: Int
    let created_at: String
    let related_id: Int?
    
    var isRead: Bool { is_read == 1 }
}

struct NotificationsView: View {
    @Environment(\.dismiss) var dismiss
    let userId: Int
    let userType: String // "PATIENT" or "DENTIST"
    
    @State private var notifications: [NotificationItem] = []
    @State private var isLoading = true
    
    // Theme Helper
    private var themeColor: Color {
        userType == "DENTIST" ? .teal : Color(red: 0.2, green: 0.45, blue: 0.9) // Clinical Teal vs Patient Blue
    }
    
    var body: some View {
        ZStack(alignment: .top) {
            // 1. Adaptive Dental Grid Background
            DentalBackgroundView(animate: true, isDentist: userType == "DENTIST")
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // 2. Fixed Professional Header
                headerSection
                
                if isLoading {
                    Spacer()
                    ProgressView().tint(themeColor)
                    Spacer()
                } else if notifications.isEmpty {
                    emptyStateView
                } else {
                    // 3. Clinical Log List
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 16) {
                            // Section Descriptor
                            HStack {
                                Text("RECENT ACTIVITY")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .kerning(1.5)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(notifications.filter({!$0.isRead}).count) UNREAD")
                                    .font(.system(size: 9, weight: .heavy))
                                    .foregroundColor(themeColor)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(themeColor.opacity(0.1))
                                    .cornerRadius(4)
                            }
                            .padding(.horizontal, 4)
                            .padding(.top, 12)

                            ForEach(notifications) { notif in
                                notificationCard(notif)
                            }
                        }
                        .padding(20)
                        .padding(.bottom, 30)
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear(perform: loadNotifications)
    }
    
    // MARK: - Header
    private var headerSection: some View {
        HStack {
            Button(action: { dismiss() }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(themeColor)
                    .frame(width: 38, height: 38)
                    .background(Color.white)
                    .clipShape(Circle())
                    .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
            }
            
            Spacer()
            
            VStack(spacing: 2) {
                Text("NOTIFICATIONS")
                    .font(.system(size: 12, weight: .black))
                    .tracking(2)
                    .foregroundColor(.secondary)

            }
            
            Spacer()
            
            // Branding circle
            ZStack {
                Circle()
                    .fill(themeColor.opacity(0.1))
                    .frame(width: 38, height: 38)
                Image(systemName: "bell.badge.fill")
                    .font(.system(size: 14))
                    .foregroundColor(themeColor)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        
    }
    
    private func notificationCard(_ notif: NotificationItem) -> some View {
        Button(action: {
            if !notif.isRead { markAsRead(notif.id) }
        }) {
            HStack(spacing: 0) {
                // Signature Vertical Status Bar
                Rectangle()
                    .fill(notif.isRead ? Color.gray.opacity(0.2) : themeColor)
                    .frame(width: 4.5)
                
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(notif.title.uppercased())
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .kerning(0.5)
                                .foregroundColor(notif.isRead ? .secondary : .primary)
                            
                            // Relative Time Label (e.g., "4 MINS AGO")
                            Text(formatRelativeDate(notif.created_at))
                                .font(.system(size: 9, weight: .heavy))
                                .foregroundColor(notif.isRead ? .secondary.opacity(0.5) : themeColor)
                        }
                        
                        Spacer()
                        
                        if !notif.isRead {
                            Circle()
                                .fill(themeColor)
                                .frame(width: 6, height: 6)
                                .shadow(color: themeColor.opacity(0.5), radius: 3)
                        }
                    }
                    
                    Text(notif.message)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(notif.isRead ? .secondary : .primary.opacity(0.8))
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 20)
            }
            .background(notif.isRead ? Color.white.opacity(0.6) : Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(notif.isRead ? Color.clear : themeColor.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(notif.isRead ? 0.01 : 0.04), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Relative Date Formatter
    private func formatRelativeDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        // Match your DB format (adjust if your API returns ISO8601)
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.timeZone = TimeZone.current
        
        var date: Date? = formatter.date(from: dateStr)
        
        // Fallback for different ISO formats
        if date == nil {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            date = isoFormatter.date(from: dateStr)
        }
        
        guard let actualDate = date else { return dateStr.uppercased() }
        
        let relativeFormatter = RelativeDateTimeFormatter()
        relativeFormatter.unitsStyle = .full // Results in "4 minutes ago", "yesterday", etc.
        relativeFormatter.dateTimeStyle = .named // Uses "yesterday" instead of "1 day ago"
        
        let relativeString = relativeFormatter.localizedString(for: actualDate, relativeTo: Date())
        return relativeString.uppercased()
    }
    
    private var emptyStateView: some View {
        VStack {
            Spacer()
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.5))
                        .frame(width: 100, height: 100)
                    Image(systemName: "tray.and.arrow.down")
                        .font(.system(size: 40))
                        .foregroundColor(themeColor.opacity(0.3))
                }
                Text("No notifications yet")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }
    
    // MARK: - Logic Helpers
    private func formatDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        
        var date: Date? = formatter.date(from: dateStr)
        
        if date == nil {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            date = isoFormatter.date(from: dateStr) ?? isoFormatter.date(from: dateStr)
        }
        
        if let actualDate = date {
            let relativeFormatter = RelativeDateTimeFormatter()
            relativeFormatter.unitsStyle = .full
            return relativeFormatter.localizedString(for: actualDate, relativeTo: Date()).uppercased()
        }
        return dateStr
    }
    
    private func loadNotifications() {
        APIService.getNotifications(userId: userId, userType: userType) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let data) = result {
                    self.notifications = data
                }
            }
        }
    }
    
    private func markAsRead(_ id: Int) {
        APIService.markNotificationAsRead(notificationId: id) { _ in
            loadNotifications()
        }
    }
}
