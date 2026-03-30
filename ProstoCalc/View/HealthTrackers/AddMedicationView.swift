import SwiftUI

struct AddMedicationView: View {
    @Environment(\.dismiss) var dismiss
    let patientId: Int
    let onAdd: () -> Void
    
    @State private var name: String = ""
    @State private var dosage: String = ""
    @State private var frequency: String = "Once a day"
    @State private var duration: Int = 7
    @State private var startDate = Date()
    @State private var scheduledTime = Date() // Combined with date or just time components
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var selectedColor: String = "#3B82F6"
    @State private var pickerColor: Color = .blue
    
    let colors = [
        ("#3B82F6", "Blue"),
        ("#10B981", "Green"),
        ("#EF4444", "Red"),
        ("#F59E0B", "Amber"),
        ("#8B5CF6", "Purple"),
        ("#EC4899", "Pink")
    ]
    
    let frequencies = ["Once a day", "Twice a day", "Thrice a day", "As needed"]
    
    var body: some View {
        ZStack {
            DentalBackgroundView(animate: true, isDentist: false).ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("New Prescription")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.dentalDarkBlue)
                    Spacer()
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.gray.opacity(0.5))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 20)
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Section: Core Info
                        VStack(alignment: .leading, spacing: 16) {
                            Text("MEDICATION DETAILS")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.secondary)
                                .tracking(1)
                            
                            CustomInputField(label: "Name", text: $name, placeholder: "e.g. Amoxicillin")
                            CustomInputField(label: "Dosage", text: $dosage, placeholder: "e.g. 500mg")
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(20)
                        
                        // Section: Schedule
                        VStack(alignment: .leading, spacing: 20) {
                            Text("INTAKE & DURATION")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.secondary)
                                .tracking(1)
                            
                            VStack(spacing: 15) {
                                HStack {
                                    Text("Frequency")
                                        .font(.system(size: 15, weight: .bold))
                                    Spacer()
                                    Picker("Frequency", selection: $frequency) {
                                        ForEach(frequencies, id: \.self) { freq in
                                            Text(freq).tag(freq)
                                        }
                                    }
                                    .pickerStyle(.menu)
                                }
                                
                                Divider()
                                
                                DatePicker("Intake Time", selection: $scheduledTime, displayedComponents: .hourAndMinute)
                                    .font(.system(size: 15, weight: .bold))
                                
                                Divider()
                                
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Course Duration")
                                        .font(.system(size: 15, weight: .bold))
                                    
                                    HStack(spacing: 10) {
                                        ForEach([7, 14, 30], id: \.self) { d in
                                            Button(action: { duration = d }) {
                                                Text("\(d) Days")
                                                    .font(.system(size: 12, weight: .bold))
                                                    .foregroundColor(duration == d ? .white : .blue)
                                                    .frame(maxWidth: .infinity)
                                                    .padding(.vertical, 10)
                                                    .background(duration == d ? Color.blue : Color.blue.opacity(0.1))
                                                    .cornerRadius(10)
                                            }
                                        }
                                    }
                                    
                                    Stepper(value: $duration, in: 1...365) {
                                        Text("Custom: \(duration) days")
                                            .font(.system(size: 14, weight: .medium))
                                    }
                                }
                            }
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(30)
                        
                        // Section: Color Tag
                        VStack(alignment: .leading, spacing: 16) {
                            Text("COLOR IDENTIFIER")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.secondary)
                                .tracking(1)
                            
                            HStack(spacing: 15) {
                                ForEach(colors, id: \.0) { color in
                                    Circle()
                                        .fill(Color(hex: color.0))
                                        .frame(width: 32, height: 32)
                                        .overlay(
                                            Circle()
                                                .stroke(Color.primary.opacity(0.3), lineWidth: selectedColor == color.0 ? 3 : 0)
                                        )
                                        .shadow(color: .black.opacity(0.1), radius: 4)
                                        .onTapGesture {
                                            selectedColor = color.0
                                            pickerColor = Color(hex: color.0)
                                        }
                                        .scaleEffect(selectedColor == color.0 ? 1.2 : 1.0)
                                }
                                
                                // Custom Color Picker
                                ColorPicker("", selection: $pickerColor)
                                    .labelsHidden()
                                    .frame(width: 32, height: 32)
                                    .onChange(of: pickerColor) { newColor in
                                        if let hex = newColor.toHex() {
                                            selectedColor = "#" + hex
                                        }
                                    }
                            }
                            .padding(.vertical, 5)
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(30)
                        
                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        
                        Button(action: addMedication) {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Save Prescription")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(name.isEmpty || dosage.isEmpty ? Color.gray : Color.blue)
                        .cornerRadius(16)
                        .disabled(name.isEmpty || dosage.isEmpty || isLoading)
                        .shadow(color: Color.blue.opacity(0.3), radius: 10, y: 5)
                    }
                    .padding(24)
                }
            }
        }
        .navigationBarHidden(true)
        .alert(isPresented: $showError) {
            Alert(title: Text("Error"), message: Text(errorMessage ?? "Unknown error"), dismissButton: .default(Text("OK")))
        }
    }
    
    func addMedication() {
        isLoading = true
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"
        let sTimeStr = timeFormatter.string(from: scheduledTime)
        
        // Calculate end date (strictly inclusive of duration)
        let endDate = calendar.date(byAdding: .day, value: max(0, duration - 1), to: startDate) ?? startDate
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let endDateStr = dateFormatter.string(from: endDate)
        
        HealthTrackerService.shared.addMedication(patientId: patientId, name: name, dosage: dosage, frequency: frequency, duration: duration, startDate: startDate, endDateStr: endDateStr, scheduledTime: sTimeStr, colorTag: selectedColor) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success:
                    ReminderManager.shared.scheduleMedicationReminder(name: name, time: sTimeStr)
                    onAdd()
                    dismiss()
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                }
            }
        }
    }
    
    private let calendar = Calendar.current
}

struct CustomInputField: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.dentalDarkBlue)
            TextField(placeholder, text: $text)
                .padding()
                .background(Color.white)
                .cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.1), lineWidth: 1))
        }
    }
}
