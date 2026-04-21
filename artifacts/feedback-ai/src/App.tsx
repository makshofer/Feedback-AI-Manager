import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import HistoryPage from "@/pages/dashboard/HistoryPage";
import FeedbackDetailPage from "@/pages/dashboard/FeedbackDetailPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UsersPage from "@/pages/admin/UsersPage";
import CohortPage from "@/pages/admin/CohortPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import FunnelPage from "@/pages/admin/FunnelPage";
import AssistantPage from "@/pages/AssistantPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Manager Routes */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/dashboard/history" component={HistoryPage} />
      <ProtectedRoute path="/dashboard/feedback/:id" component={FeedbackDetailPage} />
      <ProtectedRoute path="/assistant" component={AssistantPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} requireAdmin />
      <ProtectedRoute path="/admin/users" component={UsersPage} requireAdmin />
      <ProtectedRoute path="/admin/cohort" component={CohortPage} requireAdmin />
      <ProtectedRoute path="/admin/analytics" component={AnalyticsPage} requireAdmin />
      <ProtectedRoute path="/admin/funnel" component={FunnelPage} requireAdmin />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
