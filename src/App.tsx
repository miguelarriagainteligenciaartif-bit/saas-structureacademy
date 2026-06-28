import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./pages/Analytics";
import EquityCurve from "./pages/EquityCurve";
import Backtesting from "./pages/Backtesting";
import EdgecoreX5 from "./pages/EdgecoreX5";
import FlipRotational from "./pages/FlipRotational";
import SavedSimulations from "./pages/SavedSimulations";
import ForexCalendar from "./pages/ForexCalendar";
import Checklist from "./pages/Checklist";
import Optimization from "./pages/Optimization";
import StreakTracker from "./pages/StreakTracker";
import JournalingTemplate from "./pages/JournalingTemplate";
import NotFound from "./pages/NotFound";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import PendingApproval from "./pages/PendingApproval";
import Admin from "./pages/Admin";

// ... existing imports

const queryClient = new QueryClient();

function App() {
  console.log("App component rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes (Needs Auth) */}
            <Route path="/pending" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><DashboardLayout><Admin /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Index /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} />
            <Route path="/cuentas-fondeadas" element={<ProtectedRoute><DashboardLayout><EquityCurve /></DashboardLayout></ProtectedRoute>} />
            <Route path="/backtesting" element={<ProtectedRoute><DashboardLayout><Backtesting /></DashboardLayout></ProtectedRoute>} />
            <Route path="/structure-lab" element={<ProtectedRoute><DashboardLayout><EdgecoreX5 /></DashboardLayout></ProtectedRoute>} />
            <Route path="/flip-rotational" element={<ProtectedRoute><DashboardLayout><FlipRotational /></DashboardLayout></ProtectedRoute>} />
            <Route path="/saved-simulations" element={<ProtectedRoute><DashboardLayout><SavedSimulations /></DashboardLayout></ProtectedRoute>} />
            <Route path="/forex-calendar" element={<ProtectedRoute><DashboardLayout><ForexCalendar /></DashboardLayout></ProtectedRoute>} />
            <Route path="/checklist" element={<ProtectedRoute><DashboardLayout><Checklist /></DashboardLayout></ProtectedRoute>} />
            <Route path="/optimization" element={<ProtectedRoute><DashboardLayout><Optimization /></DashboardLayout></ProtectedRoute>} />
            <Route path="/streak-tracker" element={<ProtectedRoute><DashboardLayout><StreakTracker /></DashboardLayout></ProtectedRoute>} />
            <Route path="/journaling-template" element={<ProtectedRoute><DashboardLayout><JournalingTemplate /></DashboardLayout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
