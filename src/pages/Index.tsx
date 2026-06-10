import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/LoginForm';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Clock } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-glow animate-float">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Layout>
      {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </Layout>
  );
};

export default Index;
