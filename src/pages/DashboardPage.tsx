import { useAuth } from "@/contexts/AuthContext";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthenticatedLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.username}!`}
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Admin Panel
          </h1>
          <p className="text-lg text-gray-600">
            Use the navigation menu to access different sections
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
