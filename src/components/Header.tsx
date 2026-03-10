import { FlaskConical, Activity, Save, Layers, Newspaper, ClipboardCheck, Menu, Crosshair } from "lucide-react";
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

interface HeaderProps {
  userName?: string | null;
}

export const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    { path: "/", label: "Dashboard" },
    { path: "/analytics", label: "Análisis" },
    { path: "/equity-curve", label: "Equity Curve" },
    { path: "/backtesting", label: "Backtesting", icon: FlaskConical },
    { path: "/edgecore-x5", label: "X5 Simulator", icon: Activity },
    { path: "/flip-rotational", label: "Flip Rotacional", icon: Layers },
    { path: "/saved-simulations", label: "Simulaciones", icon: Save },
    { path: "/forex-calendar", label: "Calendario USD", icon: Newspaper },
    { path: "/checklist", label: "Checklist", icon: ClipboardCheck },
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
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

            {/* Mobile Navigation */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {userName && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hola, {userName}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
