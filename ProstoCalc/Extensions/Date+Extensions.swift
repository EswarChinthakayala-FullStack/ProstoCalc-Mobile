import Foundation

extension String {
    /// Formats a date string (YYYY-MM-DD or ISO8601) into "dd MMM yyyy"
    func formattedDate() -> String {
        let inputFormatter = DateFormatter()
        
        // Try SQL datetime first
        inputFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        if let date = inputFormatter.date(from: self) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM yyyy"
            return outputFormatter.string(from: date)
        }

        // Try simple date
        inputFormatter.dateFormat = "yyyy-MM-dd"
        if let date = inputFormatter.date(from: self) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM yyyy"
            return outputFormatter.string(from: date)
        }
        
        // Try ISO8601 variations
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: self) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM yyyy"
            return outputFormatter.string(from: date)
        }
        
        isoFormatter.formatOptions = [.withInternetDateTime]
        if let date = isoFormatter.date(from: self) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM yyyy"
            return outputFormatter.string(from: date)
        }
        
        return self
    }

    /// Formats a full date and time for chat messages
    func formattedDateTime() -> String {
        let inputFormatter = DateFormatter()
        
        // Try SQL datetime
        inputFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        var date: Date? = inputFormatter.date(from: self)
        
        if date == nil {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            date = isoFormatter.date(from: self)
            if date == nil {
                isoFormatter.formatOptions = [.withInternetDateTime]
                date = isoFormatter.date(from: self)
            }
        }
        
        if let actualDate = date {
            let outputFormatter = DateFormatter()
            if Calendar.current.isDateInToday(actualDate) {
                outputFormatter.dateFormat = "h:mm a"
                return "Today, " + outputFormatter.string(from: actualDate)
            } else {
                outputFormatter.dateFormat = "MMM d, h:mm a"
                return outputFormatter.string(from: actualDate)
            }
        }
        
        return self
    }
    
    /// Formats a time string (HH:mm:ss) into "HH:mm"
    func formattedTime() -> String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "HH:mm:ss"
        if let date = inputFormatter.date(from: self) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "HH:mm"
            return outputFormatter.string(from: date)
        }
        
        // Try HH:mm
        inputFormatter.dateFormat = "HH:mm"
        if let date = inputFormatter.date(from: self) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "HH:mm"
            return outputFormatter.string(from: date)
        }
        
        return self
    }
}
