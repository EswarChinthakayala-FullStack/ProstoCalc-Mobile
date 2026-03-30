import SwiftUI
import CoreLocation

// MARK: - Reusable Profile Components

struct ProfileSectionHeader: View {
    let title: String
    let icon: String
    var color: Color = .blue
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 10, weight: .bold))
            Text(title)
                .font(.system(size: 10, weight: .black))
                .tracking(1.2)
        }
        .foregroundColor(color)
        .padding(.bottom, 2)
    }
}

struct CompactInfoItem: View {
    let label: String
    let value: String
    let icon: String
    var color: Color = .blue
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.05))
                    .frame(width: 32, height: 32)
                
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(.gray.opacity(0.6))
                
                Text(value)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Color(red: 0.05, green: 0.15, blue: 0.35)) // dentalDarkBlue
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .bold))
                Text(label)
                    .font(.system(size: 10, weight: .black))
                    .tracking(0.5)
            }
            .foregroundColor(color)
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Unified Identifiable Pin for Maps
struct MapLocationPin: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
}

