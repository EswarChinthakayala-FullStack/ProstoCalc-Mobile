import SwiftUI

struct ConsistencyStreakCard: View {
    let streakCount: Int
    let longestStreak: Int
    let isDentist: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "bolt.fill")
                        .foregroundColor(isDentist ? .indigo : .blue)
                        .font(.system(size: 14))
                        .padding(8)
                        .background((isDentist ? Color.indigo : Color.blue).opacity(0.1))
                        .clipShape(Circle())
                    
                    Text(isDentist ? "ADHERENCE ANALYTICS" : "CONSISTENCY STREAK")
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.5)
                        .foregroundColor(isDentist ? .indigo : .blue)
                }
                
                Spacer()
                
                if !isDentist {
                    Text("\(streakCount) Days Active")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.secondary)
                }
            }
            
            HStack(alignment: .bottom, spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(streakCount)")
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    Text("Current Streak")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(longestStreak)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(.secondary.opacity(0.6))
                    Text("All-Time Record")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary.opacity(0.4))
                }
            }
            
            if !isDentist {
                Divider().padding(.vertical, 5)
                
                VStack(alignment: .leading, spacing: 8) {
                    Label(
                        title: { Text("Consistency improves treatment success rate").font(.system(size: 11, weight: .medium)) },
                        icon: { Image(systemName: "checkmark.seal.fill").foregroundColor(.blue).font(.system(size: 10)) }
                    )
                    
                    Label(
                        title: { Text("Reduces long-term dental cost escalation").font(.system(size: 11, weight: .medium)) },
                        icon: { Image(systemName: "checkmark.seal.fill").foregroundColor(.blue).font(.system(size: 10)) }
                    )
                }
                .foregroundColor(.dentalDarkBlue.opacity(0.8))
            } else {
                Text("This patient shows high clinical engagement and adherence to follow-up protocols.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(25)
        .background(
            RoundedRectangle(cornerRadius: 30)
                .fill(Color.white.opacity(0.9))
                .shadow(color: .black.opacity(0.05), radius: 20, x: 0, y: 10)
        )
    }
}

struct ConsistencyStreakCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            ConsistencyStreakCard(streakCount: 7, longestStreak: 12, isDentist: false)
                .padding()
            ConsistencyStreakCard(streakCount: 12, longestStreak: 15, isDentist: true)
                .padding()
        }
        .background(Color.gray.opacity(0.1))
    }
}
