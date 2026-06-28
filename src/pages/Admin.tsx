import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Check, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Profile {
  id: string;
  email?: string;
  status: string;
  role: string;
  created_at: string;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        setIsAdmin(true);
        loadProfiles();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar el estado");
    } else {
      toast.success("Estado actualizado correctamente");
      loadProfiles(); // Reload
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-structure-green"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-center">Acceso Denegado</h1>
        <p className="text-gray-500 text-center">No tienes permisos de administrador para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
<div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-structure-dark rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-structure-dark tracking-tight">Panel de Control</h1>
            <p className="text-structure-gray text-sm">Gestiona el acceso de los alumnos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                  <th className="p-4 font-semibold text-gray-600">Usuario (Email)</th>
                  <th className="p-4 font-semibold text-gray-600">Fecha de registro</th>
                  <th className="p-4 font-semibold text-gray-600">Estado</th>
                  <th className="p-4 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {p.email ? p.email : <span className="font-mono text-gray-400 text-xs">{p.id.substring(0, 12)}...</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute:"2-digit"
                      })}
                    </td>
                    <td className="p-4">
                      {p.status === "pending" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      ) : p.status === "approved" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.status === "pending" && (
                        <Button
                          onClick={() => updateStatus(p.id, "approved")}
                          size="sm"
                          className="bg-structure-green hover:bg-structure-green/90 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                      )}
                      {p.status === "approved" && (
                        <Button
                          onClick={() => updateStatus(p.id, "pending")}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Revocar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No hay usuarios registrados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
