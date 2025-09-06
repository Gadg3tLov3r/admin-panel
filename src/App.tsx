import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";

import PaymentsPage from "@/pages/PaymentsPage";
import PaymentDetailsPage from "@/pages/PaymentDetailsPage";
import DisbursementsPage from "@/pages/DisbursementsPage";
import DisbursementDetailsPage from "@/pages/DisbursementDetailsPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/:paymentId"
              element={
                <ProtectedRoute>
                  <PaymentDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disbursements"
              element={
                <ProtectedRoute>
                  <DisbursementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disbursements/:disbursementId"
              element={
                <ProtectedRoute>
                  <DisbursementDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </Router>
    </AuthProvider>
  );
}
