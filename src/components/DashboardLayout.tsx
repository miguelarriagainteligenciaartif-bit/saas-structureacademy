import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FlaskConical, Activity, Save, Newspaper, Menu, 
  Flame, Shield, ArrowDownRight, LayoutDashboard, LineChart, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import structureLogo from "@/assets/logo.png";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split("@")[0] || null);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "admin") {
          setIsAdmin(true);
        }
      }
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/analytics", label: "Análisis", icon: LineChart },
    { path: "/cuentas-fondeadas", label: "Cuentas Fondeadas", icon: Activity },
    { path: "/backtesting", label: "Backtesting", icon: FlaskConical },
    { path: "/streak-tracker", label: "Racha Tracker", icon: Flame },
    { path: "/structure-lab", label: "STRUCTURE LAB", icon: Activity },
    { path: "/optimization", label: "Optimización", icon: ArrowDownRight },
    { path: "/saved-simulations", label: "Simulaciones", icon: Save },
    { path: "/forex-calendar", label: "Calendario PNL", icon: Newspaper },
  ];

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col gap-2 ${mobile ? 'mt-8' : ''}`}>
      {navItems.map((item) => (
        <Button
          key={item.path}
          variant={isActive(item.path) ? "secondary" : "ghost"}
          className={`justify-start w-full ${isActive(item.path) ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon && <item.icon className="mr-3 h-5 w-5" />}
          <span className={mobile ? "text-lg" : "text-sm font-medium"}>{item.label}</span>
        </Button>
      ))}
      {isAdmin && (
        <>
          <div className="my-2 border-t border-border/50"></div>
          <Button
            variant="ghost"
            className="justify-start w-full text-structure-green hover:bg-structure-green/10 hover:text-structure-green"
            onClick={() => navigate("/admin")}
          >
            <Shield className="mr-3 h-5 w-5" />
            <span className={mobile ? "text-lg" : "text-sm font-medium"}>Panel Admin</span>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed inset-y-0 z-50">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center justify-center mb-8">
            <img 
              src={structureLogo} 
              alt="Structure Academy" 
              className="w-full max-w-[180px] h-auto object-contain" 
            />
          </Link>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <NavLinks />
          </div>
        </div>
        <div className="mt-auto p-6 border-t border-border">
          {userName && (
            <div className="mb-4 text-sm font-medium text-muted-foreground truncate px-2">
              Hola, {userName}
            </div>
          )}
          <Button onClick={handleSignOut} variant="outline" className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex flex-col flex-1 lg:pl-64 min-h-screen">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
          <Link to="/dashboard">
            <img 
              src={structureLogo} 
              alt="Structure Academy" 
              className="h-10 w-auto object-contain" 
            />
          </Link>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6 flex flex-col">
                <NavLinks mobile />
                <div className="mt-auto pt-6 border-t border-border flex flex-col gap-4">
                  {userName && (
                    <span className="text-sm text-muted-foreground">
                      Hola, {userName}
                    </span>
                  )}
                  <Button onClick={handleSignOut} variant="outline" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
