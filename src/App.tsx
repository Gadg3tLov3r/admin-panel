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
import MerchantSettlementsPage from "@/pages/MerchantSettlementsPage";
import ProviderSettlementsPage from "@/pages/ProviderSettlementsPage";
import ProviderSettlementDetailsPage from "@/pages/ProviderSettlementDetailsPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import SettlementDetailPage from "./pages/SettlementDetailsPage";

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
              path="/settlements"
              element={
                <ProtectedRoute>
                  <MerchantSettlementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settlements/:id"
              element={
                <ProtectedRoute>
                  <SettlementDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider-settlements"
              element={
                <ProtectedRoute>
                  <ProviderSettlementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider-settlements/:id"
              element={
                <ProtectedRoute>
                  <ProviderSettlementDetailsPage />
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
