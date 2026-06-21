import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // Fetch profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
        }

        // If status is pending and we're not already on the pending page, redirect
        if (profile?.status === 'pending' && location.pathname !== '/pending') {
          navigate("/pending");
          return;
        }

        // If somehow they ended up on /pending but are approved, send to dashboard
        if (profile?.status === 'approved' && location.pathname === '/pending') {
          navigate("/dashboard");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-structure-green"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
