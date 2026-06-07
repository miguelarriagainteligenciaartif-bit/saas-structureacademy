// Auth page - Quantum Trading Tracker
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import structureLogo from "@/assets/logo_color-01.jpeg";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido!");
        navigate("/dashboard");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu email para confirmar tu cuenta.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Te hemos enviado un email con instrucciones para recuperar tu contraseña.");
        setMode("login");
      }
    } catch (error: any) {
      toast.error(error.message || "Error en autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border bg-card shadow-soft relative">
        <button 
          onClick={() => navigate("/")}
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1"
        >
          ← Volver
        </button>
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="flex justify-center cursor-pointer" onClick={() => navigate("/")}>
            <img 
              src={structureLogo} 
              alt="Structure Academy" 
              className="h-48 w-auto object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Structure Academy
            </CardTitle>
            <p className="text-sm text-primary font-medium mt-1">
              Disciplina primero, resultados después
            </p>
          </div>
          <CardDescription className="text-muted-foreground">
            {mode === "login"
              ? "Inicia sesión en tu cuenta"
              : mode === "signup"
              ? "Crea tu cuenta para comenzar"
              : "Recupera el acceso a tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-secondary border-border"
                />
              </div>
            )}
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading
                ? "Procesando..."
                : mode === "login"
                ? "INICIAR SESIÓN"
                : mode === "signup"
                ? "REGISTRARSE"
                : "ENVIAR EMAIL DE RECUPERACIÓN"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="block w-full text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-primary hover:underline font-medium"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-primary hover:underline font-medium"
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
