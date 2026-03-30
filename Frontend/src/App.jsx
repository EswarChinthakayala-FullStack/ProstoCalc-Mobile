import './App.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import AppLayout from './layout/app-layout'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import { Toaster } from 'sonner'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import RoleSelectionPage from './pages/auth/RoleSelectionPage'
import PatientLoginPage from './pages/auth/PatientLoginPage'
import PatientSignupPage from './pages/auth/PatientSignupPage'
import ForgotPassword from './pages/auth/ForgotPassword'
import RequireAuth from './components/RequireAuth'
import ClinicianDashboard from './pages/dashboard/ClinicianDashboard'
import PatientDashboard from './pages/dashboard/PatientDashboard'
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import { NotificationProvider } from './context/NotificationContext'
import ClinicRadar from './pages/patient/ClinicRadar'
import AIChat from './pages/patient/AIChat'
import ClinicianAIChat from './pages/dashboard/ClinicianAIChat'
import PatientHub from './pages/patient/PatientHub'
import PatientConsultations from './pages/patient/PatientConsultations'
import PatientConsultationOverview from './pages/patient/PatientConsultationOverview'
import PatientSecureChat from './pages/patient/PatientSecureChat'
import HealthTrackers from './pages/patient/HealthTrackers'
import MouthOpeningTracker from './pages/patient/MouthOpeningTracker'
import ExerciseTraining from './pages/patient/ExerciseTraining'
import ClinicalJourney from './pages/patient/ClinicalJourney'
import MedicationSchedule from './pages/patient/MedicationSchedule'
import HabitRecoveryTracker from './pages/patient/HabitRecoveryTracker'
import MedicationDetailPage from './pages/patient/MedicationDetailPage'
import ProfilePage from './pages/patient/ProfilePage'
import ProfileEditPage from './pages/patient/ProfileEditPage'
import PatientClinicalTimeline from './pages/patient/PatientClinicalTimeline'
import PatientTreatmentPlan from './pages/patient/PatientTreatmentPlan'
import PatientMedicalNotes from './pages/patient/PatientMedicalNotes'
import DentistProfilePage from './pages/dentist/ProfilePage'
import DentistProfileEditPage from './pages/dentist/ProfileEditPage'
import RequestManagementPage from './pages/dentist/RequestManagementPage'
import ConsultationHub from './pages/dentist/ConsultationHub'
import SecureChat from './pages/dentist/consultation/SecureChat'
import TreatmentPlanBuilder from './pages/dentist/consultation/TreatmentPlanBuilder'
import ClinicalTimeline from './pages/dentist/consultation/ClinicalTimeline'
import MedicalNotes from './pages/dentist/consultation/MedicalNotes'
import HabitAnalyzer from './pages/dentist/consultation/HabitAnalyzer'
import TreatmentSetup from './pages/dentist/TreatmentSetup'
import PriceEstimatorPage from './pages/dentist/PriceEstimatorPage'
import DentistSchedulePage from './pages/dentist/DentistSchedulePage'
import ToothOdontogramPage from './pages/dentist/ToothOdontogramPage'
import DentistAnalyticsPage from './pages/dentist/DentistAnalyticsPage'
import ClinicalRegistry from './pages/dashboard/ClinicalRegistry'
import NotificationsPage from './pages/NotificationsPage'
import PatientPortfolioPage from './pages/dentist/PatientPortfolioPage'
import NotFound from './pages/NotFound'

const DashboardRedirect = () => {
  const { user } = useAuth()
  if (user?.role === 'dentist') return <Navigate to="/dashboard/clinician" replace />
  if (user?.role === 'patient') return <Navigate to="/dashboard/patient" replace />
  return <Navigate to="/" replace />
}

const router = createBrowserRouter([
  {
    element: <><Toaster position="top-right" /><AppLayout /><HelperBot /></>,
    children: [
      {
        path: '/',
        element: <LandingPage />
      },
      {
        path: '/about',
        element: <AboutPage />
      },
    ]
  },
  // Auth Routes (Protected from already logged-in users)
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: '/login',
        element: <><Toaster position="bottom-right" /><RoleSelectionPage /></>
      },
      {
        path: '/signup',
        element: <><Toaster position="bottom-right" /><RoleSelectionPage /></>
      },
      {
        path: '/login/clinician',
        element: <><Toaster position="bottom-right" /><LoginPage /></>
      },
      {
        path: '/signup/clinician',
        element: <><Toaster position="bottom-right" /><SignupPage /></>
      },
      {
        path: '/login/patient',
        element: <><Toaster position="bottom-right" /><PatientLoginPage /></>
      },
      {
        path: '/signup/patient',
        element: <><Toaster position="bottom-right" /><PatientSignupPage /></>
      },
      {
        path: '/forgot-password',
        element: <><Toaster position="bottom-right" /><ForgotPassword /></>
      },
    ]
  },
  
  // Dashboard Routes
  {
    path: '/dashboard',
    element: <><Toaster position="top-right" /><RequireAuth /><HelperBot /></>,
    children: [
        {
            index: true,
            element: <DashboardRedirect />
        }
    ]
  },
  
  // Clinician Routes (Protected)
  {
    element: <><Toaster position="top-right" /><RequireAuth allowedRoles={['dentist']} /><HelperBot /></>,
    children: [
        {
            path: '/dashboard/clinician',
            element: <ClinicianDashboard />
        },
        {
            path: '/dashboard/clinician/schedule',
            element: <DentistSchedulePage />
        },
        {
            path: '/dashboard/clinician/ai-chat/:sessionId?',
            element: <ClinicianAIChat />
        },
        {
            path: '/dashboard/clinician/requests',
            element: <RequestManagementPage />
        },
        {
            path: '/dashboard/clinician/consultation/:requestId',
            element: <ConsultationHub />
        },
        {
            path: '/dashboard/clinician/consultation/:requestId/chat',
            element: <SecureChat />
        },
        {
            path: '/dashboard/clinician/consultation/:requestId/plan',
            element: <TreatmentPlanBuilder />
        },
        {
            path: '/dashboard/clinician/consultation/:requestId/timeline',
            element: <ClinicalTimeline />
        },
        {
            path: '/dashboard/clinician/history',
            element: <ClinicalRegistry />
        },
        {
            path: '/dashboard/clinician/consultation/:requestId/notes',
            element: <MedicalNotes />
        },
        {
            path: '/dashboard/clinician/consultation/:requestId/analyzer',
            element: <HabitAnalyzer />
        },
        {
            path: '/dashboard/clinician/catalog',
            element: <TreatmentSetup />
        },
        {
            path: '/dashboard/clinician/estimator',
            element: <PriceEstimatorPage />
        },
        {
            path: '/dashboard/clinician/odontogram',
            element: <ToothOdontogramPage />
        },
        {
            path: '/dashboard/clinician/analytics',
            element: <DentistAnalyticsPage />
        },
        {
            path: '/dentist/profile',
            element: <DentistProfilePage />
        },
        {
            path: '/dentist/profile/edit',
            element: <DentistProfileEditPage />
        },
        {
            path: '/dashboard/clinician/notifications',
            element: <NotificationsPage />
        },
        {
            path: '/dashboard/clinician/patient/:patientId',
            element: <PatientPortfolioPage />
        }
    ]
  },

  // Patient Routes (Protected)
  {
    element: <><Toaster position="top-right" /><RequireAuth allowedRoles={['patient']} /><HelperBot /></>,
    children: [
        {
            path: '/dashboard/patient',
            element: <PatientDashboard />
        },
        {
            path: '/patient/radar',
            element: <ClinicRadar />
        },
        {
            path: '/patient/ai-chat/:sessionId?',
            element: <AIChat />
        },
        {
            path: '/patient/hub',
            element: <PatientHub />
        },
        {
            path: '/patient/consultations',
            element: <PatientConsultations />
        },
        {
            path: '/patient/consultation/:requestId',
            element: <PatientConsultationOverview />
        },
        {
            path: '/patient/consultation/:requestId/chat',
            element: <PatientSecureChat />
        },
        {
            path: '/patient/consultation/:requestId/timeline',
            element: <PatientClinicalTimeline />
        },
        {
            path: '/patient/consultation/:requestId/plan',
            element: <PatientTreatmentPlan />
        },
        {
            path: '/patient/consultation/:requestId/notes',
            element: <PatientMedicalNotes />
        },
        {
            path: '/patient/trackers',
            element: <HealthTrackers />
        },
        {
            path: '/patient/mouth-opening',
            element: <MouthOpeningTracker />
        },
        {
            path: '/patient/therapy',
            element: <ExerciseTraining />
        },
        {
            path: '/patient/journey',
            element: <ClinicalJourney />
        },
        {
            path: '/patient/medication',
            element: <MedicationSchedule />
        },
        {
            path: '/patient/habit-tracker',
            element: <HabitRecoveryTracker />
        },
        {
            path: '/patient/medication/:medId',
            element: <MedicationDetailPage />
        },
        {
            path: '/patient/profile',
            element: <ProfilePage />
        },
        {
            path: '/patient/profile/update',
            element: <ProfileEditPage />
        },
        {
            path: '/dashboard/patient/notifications',
            element: <NotificationsPage />
        }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
])

import HelperBot from './components/HelperBot'

import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <RouterProvider router={router} />
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App