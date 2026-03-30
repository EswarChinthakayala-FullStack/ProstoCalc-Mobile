import SwiftUI

struct DentalInputView: View {
    @Binding var text: String
    var icon: String
    var placeholder: String
    var isSecure: Bool
    var showFaceID: Bool = false
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    
    // Password visibility state
    @State private var isPasswordVisible: Bool = false
    
    var body: some View {
        HStack(spacing: 15) {
            // Leading Icon
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.gray.opacity(0.7))
                .frame(width: 24)
            
            // Input Area
            Group {
                if isSecure && !isPasswordVisible {
                    SecureField(placeholder, text: $text)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                } else {
                    TextField(placeholder, text: $text)
                        .keyboardType(keyboardType)
                        .textInputAutocapitalization(isSecure ? .never : autocapitalization)
                        .autocorrectionDisabled(isSecure)
                }
            }
            .font(.system(size: 16))
            .foregroundColor(.dentalDarkBlue)
            
            // Trailing Icons
            HStack(spacing: 12) {
                // Password Toggle
                if isSecure {
                    Button(action: { isPasswordVisible.toggle() }) {
                        Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                            .font(.system(size: 16))
                            .foregroundColor(.blue.opacity(0.5))
                    }
                }
                
                // FaceID Icon (Optional)
                if showFaceID {
                    Image(systemName: "faceid")
                        .font(.system(size: 22, weight: .light))
                        .foregroundColor(.blue.opacity(0.6))
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.5))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.blue.opacity(0.15), lineWidth: 1)
        )
    }
}

// MARK: - Helper UI Components
struct PasswordRequirementRow: View {
    var isMet: Bool
    var text: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: isMet ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(isMet ? .green : .gray.opacity(0.4))
                .frame(width: 14)
            
            Text(text)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(isMet ? .dentalDarkBlue : .secondary)
            
            Spacer()
        }
    }
}
