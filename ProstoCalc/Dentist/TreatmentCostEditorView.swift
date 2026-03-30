import SwiftUI
import UIKit

// MARK: - DESIGN SYSTEM

/// Design system constants for consistent spacing, typography, and theming
private enum DesignSystem {
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
    }
    
    enum CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
        static let xl: CGFloat = 24
    }
    
    enum Animation {
        static let standard = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.7)
        static let quick = SwiftUI.Animation.easeInOut(duration: 0.2)
    }
}

// MARK: - VIEW MODIFIERS

/// Card style modifier for consistent Clinical Registry styling
extension View {
    func cardStyle(accentColor: Color = .teal, backgroundColor: Color = .white) -> some View {
        HStack(spacing: 0) {
            // 1. Signature Clinical Leading Accent
            Rectangle()
                .fill(accentColor)
                .frame(width: 5)
            
            self
                .padding(DesignSystem.Spacing.md)
        }
        .background(backgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.large))
        // High-end medical shadow: Very soft, wide spread
        .shadow(color: Color.black.opacity(0.04), radius: 15, x: 0, y: 8)
    }
}

/// Primary button style - Precision Clinical Gradient
extension View {
    func primaryButtonStyle() -> some View {
        self
            .font(.system(size: 14, weight: .black))
            .tracking(1.5) // Professional tracking
            .foregroundColor(.white)
            .padding(.vertical, DesignSystem.Spacing.md)
            .frame(maxWidth: .infinity)
            .background(
                ZStack {
                    LinearGradient(
                        colors: [Color.teal, Color(hex: "0D9488")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    // Inner glow for "glass-morphic" depth
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.medium)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                        .padding(1)
                }
            )
            .cornerRadius(DesignSystem.CornerRadius.medium)
            .shadow(color: Color.teal.opacity(0.25), radius: 12, x: 0, y: 6)
    }
}

/// Secondary button style - Hollowed Clinical Entry
extension View {
    func secondaryButtonStyle() -> some View {
        self
            .font(.system(size: 14, weight: .bold))
            .tracking(0.5)
            .foregroundColor(.teal)
            .padding(.vertical, DesignSystem.Spacing.sm)
            .padding(.horizontal, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.small)
                    .fill(Color.teal.opacity(0.04)) // "Hollowed" clinical feel
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.small)
                    .stroke(Color.teal.opacity(0.15), lineWidth: 1)
            )
    }
}
// MARK: - BACKGROUND ORBS COMPONENT

struct BackgroundOrbsTreatments: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.teal.opacity(0.3), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 200
                    )
                )
                .frame(width: 400, height: 400)
                .offset(x: -100, y: -200)
                .blur(radius: 60)
            
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.dentalCyan.opacity(0.25), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 150
                    )
                )
                .frame(width: 300, height: 300)
                .offset(x: 150, y: 100)
                .blur(radius: 50)
            
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.purple.opacity(0.15), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 120
                    )
                )
                .frame(width: 250, height: 250)
                .offset(x: -50, y: 300)
                .blur(radius: 40)
        }
        .ignoresSafeArea()
    }
}

// MARK: - TREATMENT MODEL

struct TreatmentItem: Identifiable, Equatable {
    var id: Int
    var name: String
    var category: String
    var defaultCost: Double
    var customCost: Double
    var isEnabled: Bool
    var colorTag: String
    
    static func == (lhs: TreatmentItem, rhs: TreatmentItem) -> Bool {
        lhs.id == rhs.id &&
        lhs.name == rhs.name &&
        lhs.category == rhs.category &&
        lhs.customCost == rhs.customCost &&
        lhs.isEnabled == rhs.isEnabled &&
        lhs.colorTag == rhs.colorTag
    }
}

// MARK: - MAIN VIEW

struct TreatmentCostEditorView: View {
    
    let dentistId: Int
    
    @State private var treatments: [TreatmentItem] = []
    @State private var originalTreatments: [TreatmentItem] = []
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var showAddSheet = false
    @State private var selectedCategory: String = "ALL"
    @State private var searchText: String = ""
    @State private var showSuccessToast = false
    @State private var successMessage = ""
    @State private var showDiscardAlert = false
    @State private var showCategorySheet = false
    @State private var newCategoryName = ""
    @State private var customCategories: [String] = []
    @State private var selectedTreatments: Set<Int> = []
    @State private var isReordering = false
    
    @Environment(\.dismiss) var dismiss
    @Environment(\.horizontalSizeClass) var sizeClass
    @Environment(\.colorScheme) var colorScheme
    
    // MARK: - DEFAULT CATEGORIES
    
    static let defaultCategories = ["GENERAL", "SURGERY", "ENDODONTICS", "PROSTHODONTICS", "ORTHODONTICS", "PERIODONTICS", "COSMETIC", "PREVENTIVE"]
    
    // MARK: - COMPUTED PROPERTIES
    
    private var hasChanges: Bool {
        treatments != originalTreatments
    }
    
    private var filteredTreatments: [TreatmentItem] {
        var result = treatments
        
        // Filter by category
        if selectedCategory != "ALL" {
            result = result.filter { $0.category == selectedCategory }
        }
        
        // Filter by search
        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.category.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return result
    }
    
    private var allCategories: [String] {
        var cats = ["ALL"]
        cats.append(contentsOf: Self.defaultCategories)
        cats.append(contentsOf: customCategories)
        return cats
    }
    
    private var enabledCount: Int {
        treatments.filter { $0.isEnabled }.count
    }
    
    private var disabledCount: Int {
        treatments.filter { !$0.isEnabled }.count
    }
    
    // MARK: - BODY
    
    var body: some View {
        NavigationStack {
            ZStack {
                
                // Background
                DentalBackgroundView(animate: false, isDentist: true)
                
                LinearGradient(
                    colors: [
                        Color.dentalDarkBlue.opacity(0.05),
                        Color.teal.opacity(0.03),
                        Color(.systemGray6)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                if isLoading {
                    loadingView
                } else {
                    VStack(spacing: 0) {
                        
                        headerSection
                        
                        searchBar
                        
                        categoryFilter
                        
                        bulkActionsBar
                        
                        treatmentList
                        
                        bottomSaveBar
                    }
                    .frame(maxWidth: sizeClass == .regular ? 800 : .infinity)
                    .padding(.horizontal, sizeClass == .regular ? 40 : 0)
                }
                
                // Success Toast
                if showSuccessToast {
                    VStack {
                        Spacer()
                        
                        successToastView
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                    .padding(.bottom, 100)
                }
            }
            
            // Navigation Title
            .navigationTitle("Treatment Pricing")
            .navigationBarTitleDisplayMode(.inline)
            
            // Transparent Navigation Bar
            .toolbarBackground(.hidden, for: .navigationBar)
            
            // Toolbar
            .toolbar {
                
                // MARK: Close Button
                ToolbarItem(placement: .navigationBarLeading) {
                    CloseButton {
                        if hasChanges {
                            showDiscardAlert = true
                        } else {
                            dismiss()
                        }
                    }
                }
                
                // MARK: Menu Button
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        
                        Button {
                            showAddSheet = true
                        } label: {
                            Label("Add Treatment", systemImage: "plus")
                        }
                        
                        Button {
                            showCategorySheet = true
                        } label: {
                            Label("Add Category", systemImage: "folder.badge.plus")
                        }
                        
                        Divider()
                        
                        Button {
                            withAnimation {
                                isReordering.toggle()
                            }
                        } label: {
                            Label(
                                isReordering ? "Done Reordering" : "Reorder",
                                systemImage: isReordering ? "checkmark" : "line.3.horizontal"
                            )
                        }
                        
                    } label: {
                        
                        Image(systemName: "ellipsis")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.cyan)
                            .frame(width: 36, height: 36)
                            .background(
                                Circle().fill(Color.white)
                            )
                    }
                }
            }
            
            // MARK: Add Treatment Sheet
            .fullScreenCover(isPresented: $showAddSheet) {
                AddTreatmentView(
                    categories: allCategories.filter { $0 != "ALL" }
                ) { newTreatment in
                    
                    var newItem = newTreatment
                    newItem.id = 0
                    
                    treatments.append(newItem)
                }
            }
            
            // MARK: Add Category Sheet
            .fullScreenCover(isPresented: $showCategorySheet) {
                AddCategoryView { categoryName in
                    if !customCategories.contains(categoryName) {
                        customCategories.append(categoryName)
                    }
                }
            }
            
            // MARK: Discard Alert
            .alert("Discard Changes?", isPresented: $showDiscardAlert) {
                
                Button("Save & Exit") {
                    saveAll()
                }
                
                Button("Discard", role: .destructive) {
                    dismiss()
                }
                
                Button("Cancel", role: .cancel) {}
                
            } message: {
                Text("You have unsaved changes. Do you want to save them before closing?")
            }
            
            // MARK: Lifecycle
            .onAppear {
                loadTreatments()
            }
            
            .onChange(of: hasChanges) { newValue in
                // Track changes
            }
        }
    }
    
    // MARK: - LOADING VIEW
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading treatments...")
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - HEADER
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    // 1. Signature Registry Accent & Subtitle
                    HStack(spacing: 8) {
                        Capsule()
                            .fill(Color.teal)
                            .frame(width: 20, height: 4)
                        
                        Text("INVENTORY & LOGISTICS")
                            .font(.system(size: 10, weight: .black))
                            .tracking(2)
                            .foregroundColor(.teal.opacity(0.8))
                    }
                    
                    Text("Treatment Pricing")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(.primary.opacity(0.85))
                }
                
                Spacer()
                
                // 2. High-End Status Indicator for unsaved changes
                if hasChanges {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.orange)
                            .frame(width: 8, height: 8)
                            .shadow(color: .orange.opacity(0.4), radius: 4)
                        
                        Text("PENDING SYNC")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundColor(.orange)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.orange.opacity(0.1))
                    .clipShape(Capsule())
                    .transition(.scale.combined(with: .opacity))
                }
            }
            
            // 3. Clinical Metrics Bar
            HStack(spacing: 16) {
                metricBadge(label: "TOTAL", count: treatments.count, icon: "archivebox.fill", color: .secondary)
                metricBadge(label: "ACTIVE", count: enabledCount, icon: "checkmark.shield.fill", color: .green)
                metricBadge(label: "INACTIVE", count: disabledCount, icon: "exclamationmark.octagon.fill", color: .red)
            }
        }
        .padding(.horizontal, sizeClass == .regular ? 24 : 16)
        .padding(.bottom, 20)
        .padding(.top, 10)
    }

    // Minimalist Metric Component
    private func metricBadge(label: String, count: Int, icon: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 9, weight: .bold))
            
            Text("\(count)")
                .font(.system(size: 12, weight: .black, design: .rounded))
            
            Text(label)
                .font(.system(size: 8, weight: .heavy))
                .opacity(0.7)
        }
        .foregroundColor(color)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    
    // MARK: - SEARCH BAR
    
    private var searchBar: some View {
        HStack(spacing: 12) {
            // 1. Clinical Search Icon
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(searchText.isEmpty ? .secondary.opacity(0.6) : .teal)
            
            // 2. Specialized TextField
            TextField("Search clinical treatments...", text: $searchText)
                .textFieldStyle(.plain)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .autocorrectionDisabled()
                .submitLabel(.search)
            
            if !searchText.isEmpty {
                Button {
                    withAnimation(.spring()) {
                        searchText = ""
                    }
                    HapticManager.shared.selection()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.secondary.opacity(0.5))
                }
                .accessibilityLabel("Clear search")
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, sizeClass == .regular ? 14 : 12)
        .background(
            ZStack {
                // Glassmorphic base
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.secondary.opacity(0.04))
                
                // Focus highlight
                if !searchText.isEmpty {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.teal.opacity(0.3), lineWidth: 1.5)
                } else {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.secondary.opacity(0.1), lineWidth: 1)
                }
            }
        )
        .padding(.horizontal, sizeClass == .regular ? 24 : 16)
        .padding(.bottom, 16)
    }
    
    // MARK: - CATEGORY FILTER
    
    private var categoryFilter: some View {
        VStack(alignment: .leading, spacing: 10) {
            // 1. Section Sub-Label for Clinical Organization
            Text("TREATMENT CLASSIFICATION")
                .font(.system(size: 9, weight: .black))
                .tracking(1.5)
                .foregroundColor(.secondary.opacity(0.7))
                .padding(.horizontal, sizeClass == .regular ? 24 : 16)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: sizeClass == .regular ? 14 : 10) {
                    ForEach(allCategories, id: \.self) { category in
                        // 2. Leveraging our refined FilterChip architecture
                        FilterChip(
                            title: category == "ALL" ? "All Procedures" : category,
                            isSelected: selectedCategory == category,
                            color: categoryColor(for: category)
                        ) {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                                HapticManager.shared.selection()
                                selectedCategory = category
                            }
                        }
                    }
                }
                .padding(.horizontal, sizeClass == .regular ? 24 : 16)
                .padding(.vertical, 4) // Space for shadow spread
            }
        }
        .padding(.bottom, 16)
    }
    private func categoryColor(for category: String) -> Color {
        switch category {
        case "GENERAL": return .blue
        case "SURGERY": return .red
        case "ENDODONTICS": return .purple
        case "PROSTHODONTICS": return .cyan
        case "ORTHODONTICS": return .mint
        case "PERIODONTICS": return .orange
        case "COSMETIC": return .pink
        case "PREVENTIVE": return .green
        default: return .gray
        }
    }
    
    // MARK: - BULK ACTIONS BAR
    private var bulkActionsBar: some View {
        Group {
            if !selectedTreatments.isEmpty {
                VStack(alignment: .leading, spacing: 18) {
                    
                    // 1. Selection Status Header
                    HStack {
                        HStack(spacing: 8) {
                            Image(systemName: "checklist.checked")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.teal)
                            
                            Text("\(selectedTreatments.count)")
                                .font(.system(size: 16, weight: .black, design: .rounded))
                            
                            Text("PROCEDURES SELECTED")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.5)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        // Compact Close Action
                        Button {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                selectedTreatments.removeAll()
                            }
                            HapticManager.shared.selection()
                        } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.secondary)
                                .frame(width: 24, height: 24)
                                .background(Color.secondary.opacity(0.1))
                                .clipShape(Circle())
                        }
                    }
                    
                    // 2. Action Grid
                    HStack(spacing: 12) {
                        // Bulk Enable Action
                        Button {
                            bulkEnable(true)
                            HapticManager.shared.success()
                        } label: {
                            Label {
                                Text("ENABLE ALL")
                                    .font(.system(size: 11, weight: .black))
                                    .tracking(1)
                            } icon: {
                                Image(systemName: "checkmark.shield.fill")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.green.opacity(0.08))
                            .foregroundColor(.green)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.green.opacity(0.2), lineWidth: 1)
                            )
                        }
                        
                        // Bulk Disable Action
                        Button {
                            bulkEnable(false)
                            HapticManager.shared.warning()
                        } label: {
                            Label {
                                Text("DISABLE ALL")
                                    .font(.system(size: 11, weight: .black))
                                    .tracking(1)
                            } icon: {
                                Image(systemName: "xmark.shield.fill")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.red.opacity(0.08))
                            .foregroundColor(.red)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.red.opacity(0.2), lineWidth: 1)
                            )
                        }
                    }
                }
                // Applying our custom Clinical Card Style
                .cardStyle(accentColor: .teal)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .transition(.asymmetric(
                    insertion: .move(edge: .top).combined(with: .opacity),
                    removal: .opacity.combined(with: .scale(scale: 0.95))
                ))
            }
        }
    }
    // MARK: - TREATMENT LIST
    
    private var treatmentList: some View {
        ScrollView {
            VStack(spacing: 0) {
                if isReordering {
                    // MARK: - Reorder Mode (Elevated Registry Cards)
                    LazyVStack(spacing: 12) {
                        ForEach(filteredTreatments) { treatment in
                            TreatmentReorderRow(treatment: treatment)
                                .cardStyle(accentColor: .teal.opacity(0.5)) // Subtle accent for reordering
                        }
                        .onMove(perform: moveTreatment)
                    }
                    .padding(.horizontal, sizeClass == .regular ? 24 : 16)
                    .padding(.top, 16)
                    
                } else {
                    // MARK: - Standard Mode (Clean Clinical List)
                    LazyVStack(spacing: 0) {
                        ForEach(filteredTreatments) { treatment in
                            TreatmentRowView(
                                treatment: Binding(
                                    get: { treatments.first { $0.id == treatment.id }! },
                                    set: { newValue in
                                        if let index = treatments.firstIndex(where: { $0.id == treatment.id }) {
                                            treatments[index] = newValue
                                        }
                                    }
                                ),
                                isSelected: selectedTreatments.contains(treatment.id),
                                onToggleSelection: {
                                    // Clinical Feedback
                                    HapticManager.shared.selection()
                                    
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                        if selectedTreatments.contains(treatment.id) {
                                            selectedTreatments.remove(treatment.id)
                                        } else {
                                            selectedTreatments.insert(treatment.id)
                                        }
                                    }
                                }
                            )
                            
                            // Refined Divider with Clinical Spacing
                            Divider()
                                .padding(.leading, sizeClass == .regular ? 80 : 64)
                                .opacity(0.5)
                        }
                    }
                    .padding(.top, 10)
                }
                
                // MARK: - Empty State
                if filteredTreatments.isEmpty {
                    emptyStateView
                        .padding(.top, 60)
                        .transition(.opacity.combined(with: .scale(scale: 0.9)))
                }
            }
            .padding(.bottom, 100) // Extra space for the Bulk Actions Bar / Bottom Tabs
        }
    }
    
    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 24) {
            // 1. Clinical "Ghost" Icon
            ZStack {
                Circle()
                    .fill(Color.teal.opacity(0.04))
                    .frame(width: 100, height: 100)
                
                Image(systemName: searchText.isEmpty ? "doc.text.magnifyingglass" : "magnifyingglass.circle")
                    .font(.system(size: 42, weight: .light))
                    .foregroundColor(.teal.opacity(0.4))
            }
            
            VStack(spacing: 8) {
                Text(searchText.isEmpty ? "No Clinical Data Found" : "No Results for \"\(searchText)\"")
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundColor(.primary.opacity(0.7))
                
                Text(searchText.isEmpty ? "Select a different category or add a new treatment to your registry." : "Check your spelling or try searching for a more general term.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            // 2. Action Button using your theme's Secondary Style
            if !searchText.isEmpty {
                Button {
                    withAnimation(.spring()) {
                        searchText = ""
                    }
                    HapticManager.shared.selection()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.uturn.backward")
                            .font(.system(size: 12, weight: .bold))
                        Text("CLEAR FILTERS")
                    }
                }
                .secondaryButtonStyle() // Using your newly updated theme modifier
            } else {
                // Option to add a new treatment if the list is just empty
                Button {
                    // Action for adding new treatment
                    HapticManager.shared.impact(.light)
                } label: {
                    Label("ADD NEW TREATMENT", systemImage: "plus")
                }
                .secondaryButtonStyle()
            }
        }
        .padding(.vertical, 80)
        .frame(maxWidth: .infinity)
    }
    // MARK: - SAVE BAR
    // MARK: - Bottom Save Bar
    private var bottomSaveBar: some View {
        VStack(spacing: 0) {
            // 1. Subtle Clinical Divider
            Divider()
                .opacity(0.15)
            
            HStack(spacing: 16) {
                // 2. Status Indicator for Unsaved Clinical Data
                if hasChanges {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.orange)
                            .frame(width: 6, height: 6)
                            .shadow(color: .orange.opacity(0.3), radius: 3)
                        
                        Text("UNSAVED MODIFICATIONS")
                            .font(.system(size: 9, weight: .black))
                            .tracking(1.2)
                            .foregroundColor(.orange)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.orange.opacity(0.06))
                    .clipShape(Capsule())
                    .transition(.move(edge: .leading).combined(with: .opacity))
                }
                
                Spacer()
                
                // 3. The "Save Changes" Primary Action
                Button(action: {
                    HapticManager.shared.impact(.medium)
                    saveAll()
                }) {
                    Group {
                        if isSaving {
                            ProgressView()
                                .tint(.white)
                                .controlSize(.small)
                        } else {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.up.doc.fill")
                                    .font(.system(size: 12))
                                Text("SAVE CHANGES")
                            }
                        }
                    }
                    // Applying your theme's Primary Style
                    .primaryButtonStyle()
                    .frame(width: sizeClass == .regular ? 200 : 160)
                    .opacity(!hasChanges || isSaving ? 0.5 : 1.0)
                }
                .disabled(isSaving || !hasChanges)
                .animation(.spring(response: 0.3, dampingFraction: 0.7), value: hasChanges)
                .animation(.easeInOut, value: isSaving)
            }
            .padding(.horizontal, sizeClass == .regular ? 32 : 16)
            .padding(.vertical, 16)
            .padding(.bottom, 8) // Accommodate home indicator
        }
        .background(.ultraThinMaterial) // Modern glassmorphic effect
        .shadow(color: Color.black.opacity(0.03), radius: 10, y: -5) // Soft upward shadow
    }
    // MARK: - SUCCESS TOAST
    
    // MARK: - Clinical Success Toast
    private var successToastView: some View {
        HStack(spacing: 12) {
            // 1. High-Contrast Success Icon
            ZStack {
                Circle()
                    .fill(Color.teal.opacity(0.12))
                    .frame(width: 28, height: 28)
                
                Image(systemName: "checkmark.seal.fill") // Professional "Verified" seal
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.teal)
            }
            
            // 2. Verified Message
            Text(successMessage.uppercased())
                .font(.system(size: 11, weight: .black))
                .tracking(1.2)
                .foregroundColor(.primary.opacity(0.8))
        }
        .padding(.leading, 8)
        .padding(.trailing, 20)
        .padding(.vertical, 8)
        .background(
            ZStack {
                // High-end Material Background
                Capsule()
                    .fill(Color(.systemBackground))
                    .shadow(color: Color.black.opacity(0.08), radius: 12, x: 0, y: 8)
                
                // Subtle Clinical Border
                Capsule()
                    .stroke(Color.teal.opacity(0.15), lineWidth: 1)
            }
        )
        .transition(.asymmetric(
            insertion: .move(edge: .top).combined(with: .opacity).combined(with: .scale(scale: 0.9)),
            removal: .opacity.combined(with: .scale(scale: 0.8))
        ))
        .onAppear {
            // Clinical success haptic trigger
            HapticManager.shared.notification(.success)
        }
    }
    
    // MARK: - ACTIONS
    
    private func bulkEnable(_ enabled: Bool) {
        for id in selectedTreatments {
            if let index = treatments.firstIndex(where: { $0.id == id }) {
                treatments[index].isEnabled = enabled
            }
        }
        selectedTreatments.removeAll()
    }
    
    private func moveTreatment(from source: IndexSet, to destination: Int) {
        let filtered = filteredTreatments
        var filteredCopy = filtered
        
        filteredCopy.move(fromOffsets: source, toOffset: destination)
        
        // Update original order based on filtered order
        for (newIndex, item) in filteredCopy.enumerated() {
            if let originalIndex = treatments.firstIndex(where: { $0.id == item.id }) {
                let movedItem = treatments.remove(at: originalIndex)
                treatments.insert(movedItem, at: newIndex)
            }
        }
    }
    
    // MARK: - DATA OPERATIONS
    
    private func loadTreatments() {
        APIService.getTreatmentCatalog(dentistId: dentistId) { result in
            DispatchQueue.main.async {
                isLoading = false
                if case .success(let data) = result {
                    self.treatments = data.compactMap { t -> TreatmentItem? in
                        guard let name = t["name"] as? String else { return nil }
                        return TreatmentItem(
                            id: t["id"] as? Int ?? 0,
                            name: name,
                            category: t["category"] as? String ?? "GENERAL",
                            defaultCost: t["default_cost"] as? Double ?? 0,
                            customCost: t["custom_cost"] as? Double ?? t["default_cost"] as? Double ?? 0,
                            isEnabled: (t["is_enabled"] as? Int ?? 1) == 1,
                            colorTag: t["color_tag"] as? String ?? "808080"
                        )
                    }
                    self.originalTreatments = treatments
                    
                    // Extract custom categories from treatments
                    let categories = Set(treatments.map { $0.category })
                    self.customCategories = categories.filter { !Self.defaultCategories.contains($0) }
                }
            }
        }
    }
    
    private func saveAll() {
        HapticManager.shared.impact(.medium)
        isSaving = true
        HapticManager.shared.impact(.medium)
        
        let payload: [String: Any] = [
            "dentist_id": dentistId,
            "treatments": treatments.map { t in
                [
                    "treatment_id": t.id,
                    "name": t.name,
                    "category": t.category,
                    "default_cost": t.defaultCost,
                    "custom_cost": t.customCost,
                    "is_enabled": t.isEnabled ? 1 : 0,
                    "color_tag": t.colorTag
                ]
            }
        ]
        
        APIService.updateTreatmentCosts(data: payload) { result in
            DispatchQueue.main.async {
                isSaving = false
                if case .success = result {
                    HapticManager.shared.notification(.success)
                    self.originalTreatments = self.treatments
                    successMessage = "Treatment costs saved successfully!"
                    withAnimation {
                        showSuccessToast = true
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        withAnimation {
                            showSuccessToast = false
                        }
                        dismiss()
                    }
                } else {
                    HapticManager.shared.notification(.error)
                    successMessage = "Failed to save changes"
                    withAnimation {
                        showSuccessToast = true
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        withAnimation {
                            showSuccessToast = false
                        }
                    }
                }
            }
        }
    }
}

// MARK: - CATEGORY CHIP

// MARK: - Category Chip (Clinical Registry Style)
struct CategoryChip: View {
    let title: String
    let isSelected: Bool
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            // Precise haptic feedback for clinical selection
            HapticManager.shared.selection()
            action()
        }) {
            Text(title.uppercased()) // Professional data-labeling style
                .font(.system(size: 10, weight: .black))
                .tracking(1.5) // High-end "Airy" typography
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .foregroundColor(isSelected ? .white : color.opacity(0.8))
                .background(
                    ZStack {
                        if isSelected {
                            // Professional Clinical Gradient
                            RoundedRectangle(cornerRadius: 12) // Matches your card/registry system
                                .fill(
                                    LinearGradient(
                                        colors: [color, color.opacity(0.85)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .shadow(color: color.opacity(0.2), radius: 6, x: 0, y: 3)
                        } else {
                            // "Hollowed" Clinical Entry state
                            RoundedRectangle(cornerRadius: 12)
                                .fill(color.opacity(0.04))
                        }
                    }
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isSelected ? Color.white.opacity(0.2) : color.opacity(0.15), lineWidth: 1)
                )
        }
        // Swiftier spring animation for a "physical" interface feel
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: isSelected)
    }
}

// MARK: - TREATMENT ROW

struct TreatmentRowView: View {
    @Binding var treatment: TreatmentItem
    let isSelected: Bool
    let onToggleSelection: () -> Void
    
    @State private var costText: String = ""
    
    private var color: Color {
        Color(hex: treatment.colorTag)
    }
    
    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            
            // MARK: - COLUMN 1 (Selection)
            Button(action: {
                HapticManager.shared.selection()
                onToggleSelection()
            }) {
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.teal : Color.secondary.opacity(0.3), lineWidth: 1.5)
                        .frame(width: 22, height: 22)
                    
                    if isSelected {
                        Circle()
                            .fill(Color.teal)
                            .frame(width: 14, height: 14)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            // MARK: - COLUMN 2 (Clinical Info)
            VStack(alignment: .leading, spacing: 4) {
                Text(treatment.name)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundColor(treatment.isEnabled ? .primary : .secondary)
                    .lineLimit(2)
                
                HStack(spacing: 8) {
                    // Category Badge
                    Text(treatment.category.uppercased())
                        .font(.system(size: 8, weight: .black))
                        .tracking(1)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(color.opacity(0.1))
                        .foregroundColor(color)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                    
                    if treatment.customCost != treatment.defaultCost {
                        Label("MODIFIED", systemImage: "pencil.line")
                            .font(.system(size: 8, weight: .heavy))
                            .foregroundColor(.orange)
                    }
                    
                    if !treatment.isEnabled {
                        Text("DISABLED")
                            .font(.system(size: 8, weight: .heavy))
                            .foregroundColor(.secondary.opacity(0.6))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            // MARK: - COLUMN 3 (Price Input)
            VStack(alignment: .trailing, spacing: 8) {
                HStack(spacing: 4) {
                    Text("₹")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(treatment.isEnabled ? .teal : .secondary)
                    
                    TextField("0", text: $costText)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .font(.system(size: 16, weight: .black, design: .monospaced))
                        .foregroundColor(treatment.isEnabled ? .primary : .secondary)
                        .frame(width: 70)
                        .onAppear {
                            costText = String(format: "%.0f", treatment.customCost)
                        }
                        .onChange(of: costText) { newValue in
                            if let cost = Double(newValue) {
                                treatment.customCost = cost
                            }
                        }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(treatment.isEnabled ? Color.teal.opacity(0.04) : Color.secondary.opacity(0.04))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(treatment.isEnabled ? Color.teal.opacity(0.15) : Color.clear, lineWidth: 1)
                )
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .background(
            ZStack {
                if isSelected {
                    Color.teal.opacity(0.04)
                } else {
                    Color.clear
                }
            }
        )
        // Leading Accent logic from your theme
        .overlay(
            Rectangle()
                .fill(isSelected ? Color.teal : color.opacity(0.3))
                .frame(width: 4)
                .cornerRadius(2),
            alignment: .leading
        )
        .contentShape(Rectangle())
        .onTapGesture {
            // Optional: tapping the row toggles selection
            onToggleSelection()
        }
    }
}
// MARK: - REORDER ROW

struct TreatmentReorderRow: View {
    let treatment: TreatmentItem
    
    private var color: Color {
        Color(hex: treatment.colorTag)
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // 1. Clinical Grabber Handle
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 14, weight: .black))
                .foregroundColor(.secondary.opacity(0.4))
                .frame(width: 24)
            
            // 2. Treatment Identity
            VStack(alignment: .leading, spacing: 4) {
                Text(treatment.name)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(.primary.opacity(0.8))
                    .lineLimit(1)
                
                Text(treatment.category.uppercased())
                    .font(.system(size: 8, weight: .black))
                    .tracking(1)
                    .foregroundColor(color)
            }
            
            Spacer()
            
            // 3. Static Price Reference
            Text("₹\(Int(treatment.customCost))")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundColor(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.secondary.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        // Utilizing your theme's card logic for the "Elevated" reorder look
        .cardStyle(accentColor: color)
        .contentShape(Rectangle())
    }
}

// MARK: - ADD TREATMENT VIEW


struct AddTreatmentView: View {
    
    let categories: [String]
    var onAdd: (TreatmentItem) -> Void
    
    @Environment(\.dismiss) var dismiss
    @Environment(\.horizontalSizeClass) var sizeClass
    
    @State private var name = ""
    @State private var category = "GENERAL"
    @State private var cost = 0.0
    @State private var pickerColor: Color = .blue
    @State private var isEnabled = true
    
    private var themeColor: Color {
        pickerColor
    }
    
    var body: some View {
        
        ZStack {
            
            // MARK: - Dental Background
            DentalBackgroundView(animate: true)
                .ignoresSafeArea()
            
            // Optional soft overlay for readability
            LinearGradient(
                colors: [
                    Color.black.opacity(0.03),
                    Color.black.opacity(0.06)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                headerSection
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 28) {
                        
                        treatmentInfoCard
                        pricingCard
                        appearanceCard
                        statusCard
                        addButton
                        
                    }
                    .padding(sizeClass == .regular ? 40 : 20)
                    .frame(maxWidth: sizeClass == .regular ? 650 : .infinity)
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }
}




private extension AddTreatmentView {
    
    var headerSection: some View {
        
        VStack(spacing: 20) {
            
            // MARK: - Navigation Row (Premium Balanced)
            HStack {
                
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.teal)
                        .frame(width: 40, height: 40)
                        .background(
                            Circle()
                                .fill(.ultraThinMaterial)
                        )
                        .overlay(
                            Circle()
                                .stroke(Color.teal.opacity(0.15), lineWidth: 1)
                        )
                }
                
                Spacer()
                
                Text("REGISTRY EXPANSION")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(2)
                    .foregroundColor(.teal.opacity(0.85))
                
                Spacer()
                
                // Symmetry button (future filter or settings)
                Circle()
                    .fill(Color.clear)
                    .frame(width: 40, height: 40)
            }
            .padding(.horizontal, 24)
            
            
            // MARK: - Title Section
            HStack(spacing: 16) {
                
                // Icon Capsule
                ZStack {
                    
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.teal.opacity(0.25),
                                    Color.teal.opacity(0.08)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                    
                    Circle()
                        .stroke(Color.teal.opacity(0.2), lineWidth: 1)
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: "plus.viewfinder")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(.teal)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    
                    Text("Create New Procedure")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    
                    Text("Configure pricing, category & identifiers")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity)
    }
    
    var treatmentInfoCard: some View {
        cardContainer { // Assuming your cardContainer handles the white background & shadow
            VStack(alignment: .leading, spacing: 20) {
                
                // MARK: - Treatment Name Section
                VStack(alignment: .leading, spacing: 10) {
                    clinicalFieldLabel("TREATMENT NOMENCLATURE", icon: "pencil.and.outline")
                    
                    TextField("e.g., Zirconia Crown - Layered", text: $name)
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .padding()
                        .background(Color.teal.opacity(0.03)) // Hollowed feel
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.teal.opacity(0.12), lineWidth: 1)
                        )
                }
                
                // MARK: - Category Section
                VStack(alignment: .leading, spacing: 10) {
                    clinicalFieldLabel("PROCEDURAL CATEGORY", icon: "tag.fill")
                    
                    Menu {
                        ForEach(categories, id: \.self) { cat in
                            Button {
                                HapticManager.shared.selection()
                                category = cat
                            } label: {
                                HStack {
                                    Text(cat.uppercased())
                                    if category == cat { Image(systemName: "checkmark") }
                                }
                            }
                        }
                    } label: {
                        HStack {
                            Text(category.uppercased())
                                .font(.system(size: 14, weight: .black))
                                .tracking(1.2)
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            Image(systemName: "chevron.up.chevron.down") // More "Tooled" icon
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.teal)
                        }
                        .padding()
                        .background(Color.teal.opacity(0.03))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.teal.opacity(0.12), lineWidth: 1)
                        )
                    }
                }
            }
            .padding(.vertical, 8)
        }
    }

    // MARK: - Clinical Field Label (Themed)
    private func clinicalFieldLabel(_ title: String, icon: String) -> some View {
        HStack(spacing: 10) {
            // 1. Terminal Accent Line
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.teal.opacity(0.4))
                .frame(width: 2, height: 12)
            
            // 2. Icon & Label Group
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 9, weight: .black)) // Smaller, punchier icon
                    .foregroundColor(.teal)
                    .imageScale(.small)
                
                Text(title.uppercased())
                    .font(.system(size: 9, weight: .black))
                    .tracking(2.2) // Increased tracking for professional "Airy" look
                    .foregroundColor(.primary.opacity(0.6))
            }
        }
        .padding(.leading, 2)
        .padding(.bottom, 2) // Creates slight breathing room from the input field
    }
    
    var pricingCard: some View {
        cardContainer {
            VStack(alignment: .leading, spacing: 16) {
                // MARK: - Clinical Header
                clinicalFieldLabel("CLINICAL VALUATION", icon: "indianrupeesign.circle.fill")
                
                // MARK: - Financial Input Cluster
                HStack(spacing: 0) {
                    // 1. Static Currency Anchor
                    Text("₹")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundColor(.teal)
                        .frame(width: 50, height: 60)
                        .background(Color.teal.opacity(0.1))
                    
                    // 2. High-Precision Input Field
                    VStack(alignment: .leading, spacing: 2) {
                        TextField("0", value: $cost, format: .number)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 28, weight: .black, design: .monospaced)) // Prevents jumping digits
                            .foregroundColor(.primary)
                        
                        Text("BASE FEE PER UNIT")
                            .font(.system(size: 8, weight: .heavy))
                            .tracking(1)
                            .foregroundColor(.secondary.opacity(0.6))
                    }
                    .padding(.leading, 16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(Color.teal.opacity(0.03))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.teal.opacity(0.15), lineWidth: 1)
                )
            }
            .padding(.vertical, 8)
        }
    }
    
    var appearanceCard: some View {
        cardContainer {
            VStack(alignment: .leading, spacing: 18) {
                
                // MARK: - Section Label
                Text("APPEARANCE")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(1.8)
                    .foregroundColor(.teal.opacity(0.85))
                
                VStack(alignment: .leading, spacing: 8) {
                    
                    Text("Color Tag")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 14) {
                        
                        // Selected Color Preview
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            pickerColor.opacity(0.9),
                                            pickerColor.opacity(0.6)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 36, height: 36)
                            
                            Circle()
                                .stroke(Color.white.opacity(0.6), lineWidth: 1)
                                .frame(width: 36, height: 36)
                        }
                        
                        // Styled Color Picker
                        ColorPicker("", selection: $pickerColor, supportsOpacity: false)
                            .labelsHidden()
                        
                        Text("Select Accent Color")
                            .font(.system(size: 14, weight: .medium))
                        
                        Spacer()
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.teal.opacity(0.15), lineWidth: 1)
                    )
                }
            }
        }
    }
    
    var statusCard: some View {
        cardContainer {
            VStack(alignment: .leading, spacing: 18) {
                
                // MARK: - Section Header
                Text("STATUS")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(1.8)
                    .foregroundColor(.teal.opacity(0.85))
                
                HStack(spacing: 14) {
                    
                    // Status Indicator Icon
                    ZStack {
                        Circle()
                            .fill(
                                isEnabled
                                ? Color.green.opacity(0.15)
                                : Color.red.opacity(0.15)
                            )
                            .frame(width: 42, height: 42)
                        
                        Image(systemName: isEnabled ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(isEnabled ? .green : .red)
                            .font(.system(size: 18, weight: .semibold))
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        
                        Text("Enable Treatment")
                            .font(.system(size: 16, weight: .semibold))
                        
                        Text("Disabled treatments won’t appear in booking")
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Toggle("", isOn: $isEnabled)
                        .labelsHidden()
                        .toggleStyle(SwitchToggleStyle(tint: .teal))
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.teal.opacity(0.15), lineWidth: 1)
                )
            }
        }
    }
    var addButton: some View {
        Button(action: addTreatment) {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text("Add Treatment")
            }
            .font(.system(size: 17, weight: .semibold))
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                LinearGradient(
                    colors: name.isEmpty
                    ? [Color.gray.opacity(0.4), Color.gray.opacity(0.4)]
                    : [Color.teal, Color.blue],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(14)
            .shadow(color: name.isEmpty ? .clear : .blue.opacity(0.3),
                    radius: 10, y: 6)
        }
        .disabled(name.isEmpty)
        .padding(.top, 10)
    }
    
    func cardContainer<Content: View>(
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack {
            content()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(18)
        .shadow(color: Color.black.opacity(0.05), radius: 8, y: 4)
    }
}



private extension AddTreatmentView {
    
    func addTreatment() {
        let new = TreatmentItem(
            id: 0,
            name: name,
            category: category,
            defaultCost: cost,
            customCost: cost,
            isEnabled: isEnabled,
            colorTag: pickerColor.toHex() ?? "808080"
        )
        
        onAdd(new)
        dismiss()
    }
}

// MARK: - ADD CATEGORY VIEW

struct AddCategoryView: View {
    
    var onAdd: (String) -> Void
    
    @Environment(\.dismiss) var dismiss
    @Environment(\.horizontalSizeClass) var sizeClass
    
    @State private var categoryName = ""
    @State private var selectedColor: Color = .blue
    
    @State private var showColorPicker = false
    @State private var customColor: Color = .teal
    
    private let colorOptions: [Color] = [
        .blue, .indigo, .purple, .pink,
        .red, .orange, .mint, .green,
        .cyan, .gray
    ]
    
    var body: some View {
        
        NavigationStack {
            ZStack {
                
                // MARK: - Background
                DentalBackgroundView(animate: false)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    
                    // MARK: - Fixed Header
                    headerSection
                    
                    // MARK: - Scrollable Content
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 28) {
                            
                            nameCard
                            colorCard
                            previewCard
                            addButton
                        }
                        .padding(sizeClass == .regular ? 40 : 20)
                        .frame(maxWidth: sizeClass == .regular ? 600 : .infinity)
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}



private extension AddCategoryView {
    
    private var headerSection: some View {
        
        VStack(spacing: 0) {
            
            // MARK: - Safe Area Top Background
            Rectangle()
                .fill(.ultraThinMaterial)
                .frame(height: 0)
                .background(.ultraThinMaterial)
                .ignoresSafeArea(edges: .top)
            
            
            VStack(spacing: 16) {
                
                // MARK: - Navigation Row
                HStack {
                    
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.teal)
                            .frame(width: 36, height: 36)
                            .background(
                                Circle()
                                    .fill(Color.teal.opacity(0.12))
                            )
                    }
                    
                    Spacer()
                    
                    Text("REGISTRY STRUCTURE")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(2)
                        .foregroundColor(.teal.opacity(0.9))
                    
                    Spacer()
                    
                    // Balance view
                    Color.clear
                        .frame(width: 36, height: 36)
                }
                
              
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 18)
        }
        .background(
            Color(.clear)
                
        )
        .overlay(
            Divider(),
            alignment: .bottom
        )
    }
    
    var nameCard: some View {
        cardContainer {
            VStack(alignment: .leading, spacing: 18) {
                
                // MARK: - Section Header
                Text("CATEGORY DETAILS")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(1.8)
                    .foregroundColor(.teal.opacity(0.85))
                
                VStack(alignment: .leading, spacing: 8) {
                    
                    Text("Category Name")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Image(systemName: "folder")
                            .foregroundColor(.teal.opacity(0.8))
                        
                        TextField("Enter category name", text: $categoryName)
                            .font(.system(size: 16, weight: .medium))
                        
                        Spacer()
                    }
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(
                                categoryName.isEmpty
                                ? Color.gray.opacity(0.15)
                                : Color.teal.opacity(0.35),
                                lineWidth: 1
                            )
                    )
                }
            }
        }
    }
    
    var colorCard: some View {
        cardContainer {
            VStack(alignment: .leading, spacing: 18) {
                
                // MARK: - Section Label
                Text("APPEARANCE")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(1.8)
                    .foregroundColor(.teal.opacity(0.85))
                
                Text("Select Color")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                
                LazyVGrid(
                    columns: Array(
                        repeating: GridItem(.flexible(), spacing: 16),
                        count: sizeClass == .regular ? 8 : 5
                    ),
                    spacing: 16
                ) {
                    
                    // MARK: - Preset Colors
                    ForEach(colorOptions, id: \.self) { color in
                        
                        colorCircle(color: color, isSelected: selectedColor == color)
                            .onTapGesture {
                                selectedColor = color
                            }
                    }
                    
                    // MARK: - Custom Color Tile
                    ZStack {
                        Circle()
                            .fill(customColor)
                            .frame(width: 48, height: 48)
                        
                        Circle()
                            .stroke(
                                selectedColor == customColor
                                ? Color.primary
                                : Color.gray.opacity(0.2),
                                lineWidth: 2
                            )
                            .frame(width: 48, height: 48)
                        
                        Image(systemName: "plus")
                            .foregroundColor(.white)
                            .font(.system(size: 16, weight: .bold))
                    }
                    .shadow(radius: selectedColor == customColor ? 8 : 0)
                    .scaleEffect(selectedColor == customColor ? 1.1 : 1.0)
                    .animation(.easeInOut(duration: 0.2), value: selectedColor)
                    .onTapGesture {
                        showColorPicker = true
                    }
                }
            }
        }
        .sheet(isPresented: $showColorPicker) {
            VStack(spacing: 24) {
                
                Text("Choose Custom Color")
                    .font(.system(size: 18, weight: .bold))
                
                ColorPicker(
                    "",
                    selection: $customColor,
                    supportsOpacity: false
                )
                .labelsHidden()
                .scaleEffect(1.4)
                
                Button("Apply Color") {
                    selectedColor = customColor
                    showColorPicker = false
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.teal)
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .padding(30)
            .presentationDetents([.medium])
        }
    }
    
    private func colorCircle(color: Color, isSelected: Bool) -> some View {
        Circle()
            .fill(color)
            .frame(width: 48, height: 48)
            .overlay(
                Circle()
                    .stroke(
                        isSelected ? Color.primary : Color.clear,
                        lineWidth: 3
                    )
            )
            .shadow(
                color: isSelected ? color.opacity(0.4) : .clear,
                radius: 8
            )
            .scaleEffect(isSelected ? 1.1 : 1.0)
            .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
    
    var previewCard: some View {
        Group {
            if !categoryName.isEmpty {
                cardContainer {
                    HStack(spacing: 0) {
                        // Vertical Accent Bar using the selected category color
                        Rectangle()
                            .fill(selectedColor)
                            .frame(width: 4)
                        
                        VStack(alignment: .leading, spacing: 12) {
                            // Header Label matching the "f(x) ESTIMATION LOG" style
                            HStack(spacing: 4) {
                                Image(systemName: "sparkles") // "AI Generated" style icon
                                    .font(.system(size: 10))
                                Text("LIVE PREVIEW")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .kerning(1.2)
                            }
                            .foregroundColor(selectedColor)
                            
                            HStack(alignment: .center) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(categoryName)
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.primary)
                                    
                                    // Metadata row (Date and Source)
                                    HStack(spacing: 12) {
                                        Label("Today", systemImage: "calendar")
                                        Label("Auto", systemImage: "bolt.fill")
                                    }
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                // Value Display mimicking the "₹1430" style
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("₹0")
                                        .font(.system(size: 20, weight: .bold))
                                        .foregroundColor(Color(red: 0.1, green: 0.7, blue: 0.7))
                                    
                                    Text("TOTAL VALUE")
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Divider()
                                .padding(.top, 4)
                            
                            HStack {
                                Text("CLINICAL ANALYSIS")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.secondary)
                                Spacer()
                                HStack(spacing: 4) {
                                    Text("Review")
                                    Image(systemName: "arrow.right.circle.fill")
                                }
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.1, green: 0.7, blue: 0.7))
                            }
                        }
                        .padding(.vertical, 16)
                        .padding(.horizontal, 16)
                    }
                    // Background matches the light clinical theme
                    .background(Color(red: 0.96, green: 0.99, blue: 1.0))
                }
                .transition(.asymmetric(insertion: .opacity.combined(with: .scale(scale: 0.95)),
                                        removal: .opacity))
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: categoryName)
            }
        }
    }
    
    var addButton: some View {
        Button(action: saveCategory) {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text("Add Category")
            }
            .font(.system(size: 17, weight: .semibold))
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                LinearGradient(
                    colors: categoryName.isEmpty
                    ? [Color.gray.opacity(0.4), Color.gray.opacity(0.4)]
                    : [Color.teal, Color.blue],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(14)
            .shadow(
                color: categoryName.isEmpty
                ? .clear
                : Color.blue.opacity(0.3),
                radius: 10,
                y: 6
            )
        }
        .disabled(categoryName.isEmpty)
        .padding(.top, 8)
    }
    
    func cardContainer<Content: View>(
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack {
            content()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(18)
        .shadow(color: Color.black.opacity(0.05), radius: 8, y: 4)
    }
}



private extension AddCategoryView {
    
    func saveCategory() {
        onAdd(categoryName.uppercased())
        dismiss()
    }
}
