import Foundation
import UserNotifications

class ReminderManager {
    static let shared = ReminderManager()
    
    private init() {}
    
    func scheduleTherapyReminders(settings: ExerciseSettings) {
        // Cancel existing therapy reminders to avoid duplicates
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["therapy_morning", "therapy_evening"])
        
        if settings.morningReminder {
            let (hour, minute) = parseTime(settings.morningTime)
            scheduleNotification(
                id: "therapy_morning",
                title: "Morning Therapy Session",
                body: "Time for your morning mouth exercises to maintain flexibility. ☀️",
                hour: hour,
                minute: minute
            )
        }
        
        if settings.eveningReminder {
            let (hour, minute) = parseTime(settings.eveningTime)
            scheduleNotification(
                id: "therapy_evening",
                title: "Evening Therapy Session",
                body: "Don't forget your evening stretches before bed. 🌙",
                hour: hour,
                minute: minute
            )
        }
    }
    
    private func parseTime(_ time: String) -> (Int, Int) {
        // Expects HH:mm:ss or HH:mm
        let components = time.split(separator: ":")
        if components.count >= 2 {
            let hour = Int(components[0]) ?? 9
            let minute = Int(components[1]) ?? 0
            return (hour, minute)
        }
        return (9, 0)
    }
    
    private func scheduleNotification(id: String, title: String, body: String, hour: Int, minute: Int) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Error scheduling notification \(id): \(error.localizedDescription)")
            } else {
                print("✅ Scheduled notification \(id) for \(hour):\(minute)")
            }
        }
    }
    
    func scheduleSmartNudge() {
        let content = UNMutableNotificationContent()
        content.title = "Smart Recovery Nudge"
        content.body = "Our AI suggests a quick stretch now to optimize your recovery trajectory. ✨"
        content.sound = .default
        
        // Schedule for 2 hours from now as a "smart" interval
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 7200, repeats: false)
        let request = UNNotificationRequest(identifier: "smart_nudge", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }

    func scheduleMedicationReminder(name: String, time: String) {
        let parts = time.split(separator: ":")
        guard parts.count >= 2, let hour = Int(parts[0]), let minute = Int(parts[1]) else { return }
        
        let id = "med_\(name)"
        scheduleNotification(
            id: id,
            title: "💊 Medication Reminder",
            body: "Time to take your \(name). Stay consistent!",
            hour: hour,
            minute: minute
        )
    }
    
    func cancelMedicationReminder(name: String) {
        let id = "med_\(name)"
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
        print("✅ Cancelled notification for \(name)")
    }
}
