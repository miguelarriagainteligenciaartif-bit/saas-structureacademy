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
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/equity-curve" element={<EquityCurve />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/edgecore-x5" element={<EdgecoreX5 />} />
            <Route path="/flip-rotational" element={<FlipRotational />} />
            <Route path="/saved-simulations" element={<SavedSimulations />} />
            <Route path="/forex-calendar" element={<ForexCalendar />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/optimization" element={<Optimization />} />
            <Route path="/streak-tracker" element={<StreakTracker />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
