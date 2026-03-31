import SwiftUI

enum ToastType {
    case success, error, info
    
    var color: Color {
        switch self {
        case .success: return .emerald
        case .error: return .red
        case .info: return .blue
        }
    }
    
    var icon: String {
        switch self {
        case .success: return "checkmark.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

struct Toast {
    var message: String
    var type: ToastType = .info
}

struct ToastModifier: ViewModifier {
    @Binding var toast: Toast?
    @State private var workItem: DispatchWorkItem?
    
    func body(content: Content) -> some View {
        ZStack {
            content
            
            VStack {
                Spacer()
                if let toast = toast {
                    HStack(spacing: 12) {
                        Image(systemName: toast.type.icon)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(toast.type.color)
                        
                        Text(toast.message)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.primary)
                            .multilineTextAlignment(.leading)
                    }
                    .padding(.vertical, 12)
                    .padding(.horizontal, 20)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 15)
                                .fill(.ultraThinMaterial)
                            
                            RoundedRectangle(cornerRadius: 15)
                                .stroke(toast.type.color.opacity(0.3), lineWidth: 1)
                        }
                    )
                    .shadow(color: Color.black.opacity(0.1), radius: 10, y: 5)
                    .padding(.bottom, 60)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .onTapGesture {
                        dismissToast()
                    }
                }
            }
            .animation(.spring(response: 0.35, dampingFraction: 0.8), value: toast != nil)
        }
        .onChange(of: toast?.message) { _ in
            showToast()
        }
    }
    
    private func showToast() {
        guard let _ = toast else { return }
        
        workItem?.cancel()
        
        let task = DispatchWorkItem {
            dismissToast()
        }
        
        workItem = task
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5, execute: task)
    }
    
    private func dismissToast() {
        withAnimation {
            toast = nil
        }
        workItem?.cancel()
        workItem = nil
    }
}

extension View {
    func toastView(toast: Binding<Toast?>) -> some View {
        self.modifier(ToastModifier(toast: toast))
    }
}

// Utility colors if needed
extension Color {
    static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255)
}
