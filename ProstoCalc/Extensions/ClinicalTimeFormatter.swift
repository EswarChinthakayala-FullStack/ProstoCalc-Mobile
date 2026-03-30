import Foundation

struct ClinicalTimeFormatter {
    static func format(_ timeStr: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        
        let formats = [
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "HH:mm:ss",
            "HH:mm"
        ]
        
        for format in formats {
            formatter.dateFormat = format
            if let date = formatter.date(from: timeStr) {
                let out = DateFormatter()
                out.dateFormat = "HH:mm"
                return out.string(from: date)
            }
        }
        
        // Final fallback: try to extract anything that looks like HH:mm
        let components = timeStr.components(separatedBy: CharacterSet(charactersIn: " T"))
        for component in components {
            if component.contains(":") {
                let parts = component.components(separatedBy: ":")
                if parts.count >= 2 {
                    let hh = parts[0].suffix(2)
                    let mm = parts[1].prefix(2)
                    if hh.count == 2 && mm.count == 2 {
                        return "\(hh):\(mm)"
                    }
                }
            }
        }
        
        return timeStr
    }
}
