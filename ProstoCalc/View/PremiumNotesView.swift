import SwiftUI

struct PremiumNotesView: View {
    let requestId: Int
    @Binding var notes: String
    @Environment(\.dismiss) var dismiss
    
    @State private var isSaving = false
    @FocusState private var isEditorFocused: Bool
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                // 1. Background Layer
                DentalBackgroundView(animate: true, isDentist: true)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 2. Fixed Professional Header
                    fixedHeader
                    
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            
                            // Editor Section
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Label("OBSERVATIONS", systemImage: "doc.text.magnifyingglass")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.secondary)
                                    
                                    Spacer()
                                    
                                    Text("\(notes.count) CHARACTERS")
                                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.teal.opacity(0.1))
                                        .foregroundColor(.teal)
                                        .cornerRadius(4)
                                }
                                
                                ZStack(alignment: .topLeading) {
                                    if notes.isEmpty {
                                        Text("Type or dictate clinical findings here...")
                                            .font(.system(size: 17))
                                            .foregroundColor(.gray.opacity(0.5))
                                            .padding(20)
                                            .padding(.top, 2)
                                    }
                                    
                                    TextEditor(text: $notes)
                                        .font(.system(size: 17, weight: .regular, design: .default))
                                        .lineSpacing(8)
                                        .focused($isEditorFocused)
                                        .scrollContentBackground(.hidden)
                                        .padding(15)
                                        .frame(minHeight: 450)
                                }
                                .background(Color.white.opacity(0.6))
                                .cornerRadius(20)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(isEditorFocused ? Color.teal.opacity(0.5) : Color.black.opacity(0.05), lineWidth: 1.5)
                                )
                                .shadow(color: .black.opacity(0.03), radius: 15, x: 0, y: 5)
                            }
                            
                            // Security Footer Badge
                            HStack(spacing: 14) {
                                Image(systemName: "lock.shield.fill")
                                    .symbolRenderingMode(.hierarchical)
                                    .foregroundColor(.teal)
                                    .font(.system(size: 24))
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("HIPAA COMPLIANT SECURE STORAGE")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.primary)
                                    
                                    Text("This entry will be timestamped and locked to Request #\(requestId).")
                                        .font(.system(size: 11))
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding(20)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white.opacity(0.4))
                            .cornerRadius(16)
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.5), lineWidth: 1)
                            )
                            
                            // Bottom padding for scroll
                            Color.clear.frame(height: 100)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    }
                }
                
                // 3. Bottom Action Button
                VStack {
                    Spacer()
                    actionButton
                }
            }
        }
    }
    
    // MARK: - Subviews
    
    private var fixedHeader: some View {
        VStack(spacing: 0) {
            
            HStack {
                
                // Back Button (Teal Chevron)
                BackButton {
                    dismiss()
                }
                
                Spacer()
                
                // Centered Title Block
                VStack(spacing: 4) {
                    Text("CLINICAL RECORD")
                        .font(.system(size: 10, weight: .black))
                        .tracking(1.5)
                        .foregroundColor(.teal)
                    
                    Text("Case #\(requestId)")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                }
                
                Spacer()
                
                // Invisible spacer for perfect centering
                Color.clear
                    .frame(width: 44, height: 44)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 14)
            
            Divider()
                .opacity(0.08)
        }
     
    }
    
    private var actionButton: some View {
        VStack(spacing: 0) {
            Divider().opacity(0.2)
            
            Button(action: saveNotes) {
                HStack(spacing: 12) {
                    if isSaving {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "tray.and.arrow.down.fill")
                        Text("SAVE TO CLINICAL RECORD")
                    }
                }
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(
                    LinearGradient(
                        colors: [Color.teal, Color(red: 0.0, green: 0.45, blue: 0.4)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .cornerRadius(16)
                .padding(.horizontal, 20)
                .padding(.top, 15)
                .padding(.bottom, 34) // Extra padding for home indicator
                .shadow(color: Color.teal.opacity(0.3), radius: 12, x: 0, y: 6)
            }
            .disabled(isSaving || notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .opacity(notes.isEmpty ? 0.5 : 1.0)
        }
        .background(
            Color.white.opacity(0.8)
                .blur(radius: 0.5)
                .ignoresSafeArea()
        )
    }
    
    // MARK: - Actions
    
    private func saveNotes() {
        isSaving = true
        isEditorFocused = false
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        
        APIService.savePlanNotes(requestId: requestId, notes: notes) { result in
            DispatchQueue.main.async {
                isSaving = false
                if case .success = result {
                    generator.notificationOccurred(.success)
                    dismiss()
                } else {
                    generator.notificationOccurred(.error)
                }
            }
        }
    }
}
