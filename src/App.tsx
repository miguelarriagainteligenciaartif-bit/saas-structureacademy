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
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/equity-curve" element={<ProtectedRoute><EquityCurve /></ProtectedRoute>} />
            <Route path="/backtesting" element={<ProtectedRoute><Backtesting /></ProtectedRoute>} />
            <Route path="/edgecore-x5" element={<ProtectedRoute><EdgecoreX5 /></ProtectedRoute>} />
            <Route path="/flip-rotational" element={<ProtectedRoute><FlipRotational /></ProtectedRoute>} />
            <Route path="/saved-simulations" element={<ProtectedRoute><SavedSimulations /></ProtectedRoute>} />
            <Route path="/forex-calendar" element={<ProtectedRoute><ForexCalendar /></ProtectedRoute>} />
            <Route path="/checklist" element={<ProtectedRoute><Checklist /></ProtectedRoute>} />
            <Route path="/optimization" element={<ProtectedRoute><Optimization /></ProtectedRoute>} />
            <Route path="/streak-tracker" element={<ProtectedRoute><StreakTracker /></ProtectedRoute>} />
            <Route path="/journaling-template" element={<ProtectedRoute><JournalingTemplate /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
