import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import structureLogo from "@/assets/logo_color-01.jpeg";

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center relative overflow-hidden">
        {/* Top green accent bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-structure-green"></div>
        
        <div className="flex justify-center mb-8">
          <img 
            src={structureLogo} 
            alt="Structure Academy" 
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-structure-dark mb-4 font-display">
          Cuenta en Revisión
        </h1>
        
        <p className="text-structure-gray mb-8 leading-relaxed">
          Tu cuenta ha sido creada correctamente, pero actualmente se encuentra <span className="font-bold text-yellow-600">pendiente de aprobación</span>.
          <br /><br />
          El equipo de Structure Academy revisará tu solicitud para darte acceso a las herramientas.
        </p>

        <Button 
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
