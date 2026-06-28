import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistWizard } from "@/components/checklist/ChecklistWizard";
import { ChecklistHistory } from "@/components/checklist/ChecklistHistory";
import { ChecklistStats } from "@/components/checklist/ChecklistStats";
import { ClipboardList, History, BarChart3 } from "lucide-react";

const Checklist = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser({ email: user.email || "" });
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Checklist Pre-Trading
          </h1>
          <p className="text-muted-foreground">
            Análisis sistemático antes de la operativa. Disciplina = Rentabilidad.
          </p>
        </div>

        <Tabs defaultValue="checklist" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="checklist" className="data-[state=active]:bg-primary">
              <ClipboardList className="h-4 w-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary">
              <History className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist">
            <ChecklistWizard />
          </TabsContent>

          <TabsContent value="history">
            <ChecklistHistory />
          </TabsContent>

          <TabsContent value="stats">
            <ChecklistStats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Checklist;
