import { useEffect, useState } from "react";
import { FlaskConical, Activity, Save, Layers, Newspaper, ClipboardCheck, Menu, Crosshair, Flame, Shield, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import structureLogo from "@/assets/logo.png";

interface HeaderProps {
  userName?: string | null;
}

export const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
    checkAdmin();
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
    { path: "/dashboard", label: "Dashboard" },
    { path: "/analytics", label: "Análisis" },
    { path: "/cuentas-fondeadas", label: "Cuentas Fondeadas" },
    { path: "/backtesting", label: "Backtesting", icon: FlaskConical },
    { path: "/streak-tracker", label: "Racha Tracker", icon: Flame },
    { path: "/structure-lab", label: "STRUCTURE LAB", icon: Activity },
    { path: "/optimization", label: "Optimización", icon: ArrowDownRight },
    { path: "/admin", label: "Panel Admin", icon: Shield, adminOnly: true },
    { path: "/saved-simulations", label: "Simulaciones", icon: Save },
    { path: "/forex-calendar", label: "Calendario PNL", icon: Newspaper },
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer flex items-center" 
            onClick={() => navigate("/dashboard")}
          >
            <img 
              src={structureLogo} 
              alt="Structure Academy" 
              className="h-16 lg:h-20 w-auto object-contain" 
            />
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="lg:hidden flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={isActive(item.path) ? "bg-primary/20 text-primary" : ""}
                  >
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    {item.label}
                  </DropdownMenuItem>
                ))}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="text-structure-green">
                    <Shield className="mr-2 h-4 w-4" />
                    Panel Admin
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 flex-wrap justify-center flex-1 px-4">
            {navItems.map((item) => (
              <Button 
                key={item.path}
                variant={isActive(item.path) ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => navigate(item.path)}
                className={isActive(item.path) ? "bg-primary/20 text-primary" : ""}
              >
                {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* User Settings / Actions */}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button 
                onClick={() => navigate("/admin")} 
                variant="outline" 
                size="sm"
                className="hidden xl:flex border-structure-green text-structure-green hover:bg-structure-green hover:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Panel Admin
              </Button>
            )}
            {userName && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hola, {userName}
              </span>
            )}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Cerrar Sesión
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
};
