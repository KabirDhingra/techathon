import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { I18nProvider } from '@/contexts/I18nContext'
import AppShell from '@/components/layout/AppShell'
import OfflinePage from '@/routes/offline'
import PrivacyPage from '@/routes/privacy'
import HelpPage from '@/routes/help'
import AuthPage from '@/routes/auth'
import HomePage from '@/routes/home'
import RecyclersPage from '@/routes/recyclers'
import AiPage from '@/routes/ai'
import SafetyPage from '@/routes/safety'
import ScannerPage from '@/routes/scanner'
import ChecklistPage from '@/routes/checklist'
import TrainingPage from '@/routes/training'
import GuidePage from '@/routes/guide'
import IncidentPage from '@/routes/incident'
import SosPage from '@/routes/sos'
import CollectPage from '@/routes/collect'
import HistoryPage from '@/routes/history'
import ProgressPage from '@/routes/progress'
import IdPage from '@/routes/id'
import VerifyPage from '@/routes/verify'
import ProfilePage from '@/routes/profile'
import BenefitsPage from '@/routes/benefits'
import HealthPage from '@/routes/health'
import CommunityPage from '@/routes/community'
import MunicipalPage from '@/routes/municipal'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <AppShell>{children}</AppShell>
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (user?.role !== 'admin') return <Navigate to="/home" replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />
          <Route path="/otp" element={<Navigate to="/auth" replace />} />
          {/* Public verification — no login required so QR scans work for anyone */}
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/onboard" element={<Navigate to="/profile" replace />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <AuthGate>
                <HomePage />
              </AuthGate>
            }
          />
          <Route
            path="/recyclers"
            element={
              <AuthGate>
                <RecyclersPage />
              </AuthGate>
            }
          />
          <Route
            path="/ai"
            element={
              <AuthGate>
                <AiPage />
              </AuthGate>
            }
          />
          <Route
            path="/safety"
            element={
              <AuthGate>
                <SafetyPage />
              </AuthGate>
            }
          />
          <Route
            path="/scanner"
            element={
              <AuthGate>
                <ScannerPage />
              </AuthGate>
            }
          />
          <Route
            path="/check"
            element={
              <AuthGate>
                <ChecklistPage />
              </AuthGate>
            }
          />
          <Route
            path="/checklist"
            element={
              <AuthGate>
                <ChecklistPage />
              </AuthGate>
            }
          />
          <Route
            path="/training"
            element={
              <AuthGate>
                <TrainingPage />
              </AuthGate>
            }
          />
          <Route
            path="/guide"
            element={
              <AuthGate>
                <GuidePage />
              </AuthGate>
            }
          />
          <Route
            path="/incident"
            element={
              <AuthGate>
                <IncidentPage />
              </AuthGate>
            }
          />
          <Route
            path="/sos"
            element={
              <AuthGate>
                <SosPage />
              </AuthGate>
            }
          />
          <Route
            path="/collect"
            element={
              <AuthGate>
                <CollectPage />
              </AuthGate>
            }
          />
          <Route
            path="/collections"
            element={
              <AuthGate>
                <CollectPage />
              </AuthGate>
            }
          />
          <Route
            path="/history"
            element={
              <AuthGate>
                <HistoryPage />
              </AuthGate>
            }
          />
          <Route
            path="/progress"
            element={
              <AuthGate>
                <ProgressPage />
              </AuthGate>
            }
          />
          <Route
            path="/id"
            element={
              <AuthGate>
                <IdPage />
              </AuthGate>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGate>
                <ProfilePage />
              </AuthGate>
            }
          />
          <Route
            path="/benefits"
            element={
              <AuthGate>
                <BenefitsPage />
              </AuthGate>
            }
          />
          <Route
            path="/health"
            element={
              <AuthGate>
                <HealthPage />
              </AuthGate>
            }
          />
          <Route
            path="/community"
            element={
              <AuthGate>
                <CommunityPage />
              </AuthGate>
            }
          />
          <Route
            path="/municipal"
            element={
              <AdminGate>
                <MunicipalPage />
              </AdminGate>
            }
          />
          <Route
            path="/offline"
            element={
              <AuthGate>
                <OfflinePage />
              </AuthGate>
            }
          />
          <Route
            path="/privacy"
            element={
              <AuthGate>
                <PrivacyPage />
              </AuthGate>
            }
          />
          <Route
            path="/help"
            element={
              <AuthGate>
                <HelpPage />
              </AuthGate>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </I18nProvider>
  )
}

function NotFound() {
  return <div className="p-6 text-muted-foreground">Page not found.</div>
}
