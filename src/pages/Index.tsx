import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/LoginForm';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Clock, LayoutDashboard, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [adminView, setAdminView] = useState<'admin' | 'employee'>('admin');

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

  if (user?.role === 'admin') {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Admin view switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setAdminView('admin')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                adminView === 'admin'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutDashboard className="w-4 h-4" /> Gestão
            </button>
            <button
              onClick={() => setAdminView('employee')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                adminView === 'employee'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <UserCircle className="w-4 h-4" /> Meu registro
            </button>
          </div>

          {adminView === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <EmployeeDashboard />
    </Layout>
  );
};

export default Index;
