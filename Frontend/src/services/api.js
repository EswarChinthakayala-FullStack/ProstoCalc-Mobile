import axios from 'axios'

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add Auth Token Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Clinician Auth ---

export const loginDentist = async (email, password) => {
  try {
    const response = await api.post('/login_dentist', { email, password })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const signupDentist = async (data) => {
  // data: { full_name, email, password, clinic_name?, license_number? }
  // Note: Backend currently only uses full_name, email, password
  try {
    const response = await api.post('/signup_dentist', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Patient Auth ---

export const loginPatient = async (email, password) => {
  try {
    const response = await api.post('/login_patient', { email, password })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const verifyLogin = async (email, role, otp, type = 'login') => {
  try {
    const response = await api.post('/login_verify', { email, role, otp, type })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const signupPatient = async (data) => {
  // data: { full_name, email, password, phone? }
  // Note: Backend currently only uses full_name, email, password
  try {
    const response = await api.post('/signup_patient', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getPatientDetails = async (patientId) => {
  try {
    const response = await api.get('/get_patient_details', { params: { patient_id: patientId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getDentistDetails = async (dentistId) => {
  try {
    const response = await api.get('/get_dentist_details', { params: { dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const saveDentistFullProfile = async (data) => {
  try {
    const response = await api.post('/save_dentist_full_profile', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getDentistSettings = async (dentistId) => {
  try {
    const response = await api.get('/get_dentist_settings', { params: { dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const saveDentistSettings = async (data) => {
  try {
    const response = await api.post('/save_dentist_settings', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const savePatientFullProfile = async (data) => {
  try {
    const response = await api.post('/save_patient_full_profile', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const forgotPassword = async (email, role) => {
  // role: 'dentist' | 'patient'
  try {
    const response = await api.post('/forgot_password', { email, role })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getNearbyClinics = async (lat, lng, radius = 5000) => {
  try {
    const response = await api.get('/get_nearby_clinics', { params: { lat, lng, radius } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const sendConsultationRequest = async (data) => {
  try {
    const response = await api.post('/send_consultation_request', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const checkRequestStatus = async (patientId, dentistId) => {
  try {
    const response = await api.get('/check_request_status', { params: { patient_id: patientId, dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getConsultationRequests = async (role, id) => {
  try {
    const response = await api.get('/get_consultation_requests', { params: { role, id } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getPatientPortfolio = async (patientId, dentistId) => {
  try {
    const response = await api.get('/web/get_patient_portfolio', { 
      params: { patient_id: patientId, dentist_id: dentistId } 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const respondToRequest = async (data) => {
  try {
    const response = await api.post('/respond_to_request', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getClinicianSummary = async (dentistId) => {
  try {
    const response = await api.get('/web/get_clinician_summary', { params: { dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getDentistAnalytics = async (dentistId, timeframe = '6months') => {
  try {
    const response = await api.get('/web/get_dentist_analytics', { params: { dentist_id: dentistId, timeframe } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Treatment Plan & Catalog ---

export const getTreatmentPlan = async (params) => {
  // params: { plan_id?, request_id? }
  try {
    const response = await api.get('/web/get_treatment_plan', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const createTreatmentPlan = async (data) => {
  try {
    const response = await api.post('/create_treatment_plan', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getTreatmentCatalog = async (dentistId) => {
  try {
    const response = await api.get('/get_treatment_catalog', { params: { dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updateTreatmentCosts = async (data) => {
  try {
    const response = await api.post('/update_treatment_costs', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updatePlanNotes = async (data) => {
  // data: { request_id, notes }
  try {
    const response = await api.post('/update_plan_notes', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updatePatientNotes = async (data) => {
  // data: { request_id, notes }
  try {
    const response = await api.post('/update_patient_notes', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Timeline & Milestones ---

export const getTimeline = async (requestId) => {
  try {
    const response = await api.get('/get_timeline', { params: { request_id: requestId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updateTimeline = async (data) => {
  // data: { request_id, status, notes }
  try {
    const response = await api.post('/update_timeline', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Human Chat ---

export const initChat = async (requestId) => {
  try {
    const response = await api.post('/init_chat', { request_id: requestId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getMessages = async (chatId) => {
  try {
    const response = await api.get('/get_messages', { params: { chat_id: chatId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const sendMessage = async (data) => {
  // data: { chat_id, sender_role, message }
  try {
    const response = await api.post('/send_message', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Habit Risk Analysis ---

export const analyzeHabitRisk = async (data) => {
  try {
    const response = await api.post('/analyze_habit_risk', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getHabitRiskHistory = async (patientId, dentistId) => {
  try {
    const response = await api.get('/get_habit_risk_history', { 
      params: { patient_id: patientId, dentist_id: dentistId } 
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- AI Cost Estimation ---

export const explainCostAI = async (userPrompt) => {
  try {
    const response = await api.post('/web/explain_cost_ai', { userPrompt })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const explainCostPuter = async (prompt) => {
  try {
    const response = await api.post('/web/puter/explain_cost', { prompt })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const analyzeTreatmentCostAI = async (data) => {
  // data: { treatment_type, dentist_id, complexity, material, teeth_count, sessions }
  try {
    const response = await api.post('/calculate_ai_cost', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const saveCostEstimation = async (data) => {
  try {
    const response = await api.post('/save_cost_estimation', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const archiveChat = async (chatId) => {
  try {
    const response = await api.post('/archive_chat', { chat_id: chatId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const unarchiveChat = async (chatId) => {
  try {
    const response = await api.post('/unarchive_chat', { chat_id: chatId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getDentistSchedule = async (dentistId, date) => {
  try {
    const response = await api.get('/get_dentist_schedule', { params: { dentist_id: dentistId, date } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const manageScheduleSlots = async (data) => {
  try {
    const response = await api.post('/manage_schedule_slots', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updateVisitStatus = async (data) => {
  try {
    const response = await api.post('/update_visit_status', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getCalendarEvents = async (role, userId, month, year) => {
  try {
    const response = await api.get('/get_calendar_events', { params: { role, user_id: userId, month, year } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Notifications ---

export const getNotifications = async (userId, userType) => {
  try {
    const response = await api.get('/get_notifications', { params: { user_id: userId, user_type: userType } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.post('/mark_notification_read', { notification_id: notificationId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Health Trackers ---

export const addMouthOpening = async (data) => {
  try {
    const response = await api.post('/web/add_mouth_opening', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getMouthOpeningHistory = async (patientId) => {
  try {
    const response = await api.get('/web/get_mouth_opening_history', { params: { patient_id: patientId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const logHabitEntry = async (data) => {
  try {
    const response = await api.post('/web/log_habit_entry', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getHabitAnalytics = async (patientId, range = 30) => {
  try {
    const response = await api.get('/web/get_habit_analytics', { params: { patient_id: patientId, range } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getStreakAnalytics = async (patientId, range = 30) => {
  try {
    const response = await api.get('/web/get_streak_analytics', { params: { patient_id: patientId, range } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getMedications = async (patientId) => {
  try {
    const response = await api.get('/web/get_medications', { params: { patient_id: patientId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const logMedication = async (data) => {
  try {
    const response = await api.post('/web/log_medication', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const addMedication = async (data) => {
  try {
    const response = await api.post('/add_medication', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updateMedication = async (data) => {
  try {
    const response = await api.post('/web/update_medication', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const deleteMedication = async (id) => {
  try {
    const response = await api.post('/delete_medication', { id })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Auth (Additional) ---

export const verifyOtp = async (email, role, otp) => {
  try {
    const response = await api.post('/verify_otp', { email, role, otp })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const resetPassword = async (data) => {
  // data: { email, role, password OR new_password, otp }
  try {
    const response = await api.post('/reset_password', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const savePatientLocation = async (data) => {
  // data: { patient_id, latitude, longitude, street_address?, city?, district?, state?, postal_code?, country? }
  try {
    const response = await api.post('/save_patient_location', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const savePatientProfile = async (data) => {
  // data: { patient_id, age, gender, medical_history }
  try {
    const response = await api.post('/save_patient_profile', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updatePatientLocation = async (data) => {
  // data: { patient_id, latitude, longitude }
  try {
    const response = await api.post('/update_patient_location', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Clinic (Additional) ---

export const saveClinicDetails = async (data) => {
  // data: { dentist_id, latitude, longitude, clinic_name, clinic_address, clinic_city, clinic_phone }
  try {
    const response = await api.post('/save_clinic_details', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const saveDentistProfile = async (data) => {
  // data: { dentist_id, full_name, bio, specialities, professional_id, experience_years }
  try {
    const response = await api.post('/save_dentist_profile', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getAllDentists = async () => {
  try {
    const response = await api.get('/get_all_dentists')
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Engagement (Additional) ---

export const updateConsistencyStreak = async (userId, userType) => {
  try {
    const response = await api.post('/update_consistency_streak', { user_id: userId, user_type: userType })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getUserEngagement = async (userId, userType) => {
  try {
    const response = await api.get('/get_user_engagement', { params: { user_id: userId, user_type: userType } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Chat (Additional) ---

export const getChatDetails = async (chatId) => {
  try {
    const response = await api.get('/get_chat_details', { params: { chat_id: chatId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getAiChatHistory = async (userId, role, sessionId) => {
  try {
    const params = { user_id: userId, role }
    if (sessionId) params.session_id = sessionId
    const response = await api.get('/ai_chat_history', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const postAiChatHistory = async (data) => {
  // data: { user_id, role, session_id, message, response }
  try {
    const response = await api.post('/ai_chat_history', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getAiSessions = async (userId, role) => {
  try {
    const response = await api.get('/ai_sessions', { params: { user_id: userId, role } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const createAiSession = async (userId, role, title) => {
  try {
    const response = await api.post('/ai_sessions', { user_id: userId, role, title })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updateSessionTitle = async (sessionId, title) => {
  try {
    const response = await api.post('/update_session_title', { session_id: sessionId, title })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const deleteSession = async (sessionId) => {
  try {
    const response = await api.post('/delete_session', { session_id: sessionId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Treatment (Additional) ---

export const updateColorTag = async (treatmentId, colorTag) => {
  try {
    const response = await api.post('/update_color_tag', { treatment_id: treatmentId, color_tag: colorTag })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getAiCostLogs = async (dentistId) => {
  try {
    const response = await api.get('/get_ai_cost_logs', { params: { dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const saveAiExplanation = async (estimationId, text) => {
  try {
    const response = await api.post('/save_ai_explanation', { estimation_id: estimationId, text })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Habit Risk (Additional) ---

export const getPatientHabitSummary = async (patientId) => {
  try {
    const response = await api.get('/get_patient_habit_summary', { params: { patient_id: patientId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getAllHabitRiskHistory = async (dentistId) => {
  try {
    const response = await api.get('/get_all_habit_risk_history', { params: { dentist_id: dentistId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Health Trackers (Additional) ---

export const setBehaviorBaseline = async (data) => {
  // data: { patient_id, tobacco_baseline, areca_baseline }
  try {
    const response = await api.post('/web/set_habit_baseline', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const logStreakDay = async (data) => {
  // data: { patient_id, streak_type, log_date?, is_completed? }
  try {
    const response = await api.post('/log_streak_day', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getStreaks = async (patientId) => {
  try {
    const response = await api.get('/get_streaks', { params: { patient_id: patientId } })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- Exercise Endpoints ---

export const getExercises = async () => {
  try {
    const response = await api.get('/exercises')
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getExerciseProgress = async (userId) => {
  try {
    const response = await api.get(`/exercise-progress/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getExerciseSettings = async (userId) => {
  try {
    const response = await api.get(`/exercise-settings/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const updateExerciseSettings = async (data) => {
  // data: { userId OR user_id, morningReminder, eveningReminder, smartReminders, morningTime, eveningTime }
  try {
    const response = await api.post('/exercise-settings', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const logExercise = async (data) => {
  // data: { userId OR user_id, exerciseId OR exercise_id, duration, reps, status }
  try {
    const response = await api.post('/log-exercise', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getWeeklyCompliance = async (userId) => {
  try {
    const response = await api.get(`/weekly-compliance/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const logMeasurement = async (data) => {
  // data: { userId OR user_id OR patient_id, measurement }
  try {
    const response = await api.post('/log-measurement', data)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const resetProgress = async (userId) => {
  try {
    const response = await api.post('/reset-progress', { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const analyzeProgress = async (userId) => {
  try {
    const response = await api.post('/analyze-progress', { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export const getAiInsightHistory = async (userId) => {
  try {
    const response = await api.get(`/ai-insight-history/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

// --- PDF Export ---

export const exportTreatmentPdf = async (requestId) => {
  try {
    const response = await api.get('/web/export_treatment_pdf', {
      params: { request_id: requestId },
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { status: 'error', message: error.message }
  }
}

export default api;
