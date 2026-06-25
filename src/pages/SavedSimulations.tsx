import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Download, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedSimulation {
  id: string;
  name: string;
  account_size: number;
  cycle_size: number;
  risk_per_cycle: number;
  rr_ratio: number;
  reinvest_percent: number;
  trade_results: string[];
  created_at: string;
}

const SavedSimulations = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadSimulations();
    }
  }, [user]);

  const loadSimulations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("flip_simulations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSimulations(data || []);
    } catch (error) {
      console.error("Error loading simulations:", error);
      toast.error("Error al cargar las simulaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("flip_simulations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Simulación eliminada");
      loadSimulations();
    } catch (error) {
      console.error("Error deleting simulation:", error);
      toast.error("Error al eliminar la simulación");
    }
    setDeleteId(null);
  };

  const handleLoad = (simulation: SavedSimulation) => {
    // Navegar a la página del simulador con los datos en el state
    navigate("/edgecore-x5", {
      state: {
        config: {
          accountSize: simulation.account_size,
          cycleSize: simulation.cycle_size,
          riskPerCycle: simulation.risk_per_cycle,
          rrRatio: simulation.rr_ratio,
          reinvestPercent: simulation.reinvest_percent,
        },
        trades: simulation.trade_results,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <Header userName={user?.email} />
      
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-foreground">SIMULACIONES</span>{" "}
                <span className="text-primary">GUARDADAS</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Historial de simulaciones STRUCTURE LAB
              </p>
            </div>
            <Button onClick={() => navigate("/edgecore-x5")} variant="default" size="sm">
              Nuevo Simulador
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-card/30 border-border/50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : simulations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg">No tienes simulaciones guardadas</p>
                <p className="text-sm">Crea una nueva simulación en el STRUCTURE LAB</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta Inicial</TableHead>
                    <TableHead>Riesgo/Ciclo</TableHead>
                    <TableHead>R:R</TableHead>
                    <TableHead>Reinversión</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulations.map((sim) => (
                    <TableRow key={sim.id}>
                      <TableCell className="font-medium">{sim.name}</TableCell>
                      <TableCell>${sim.account_size.toFixed(2)}</TableCell>
                      <TableCell>${sim.risk_per_cycle.toFixed(2)}</TableCell>
                      <TableCell>1:{sim.rr_ratio}</TableCell>
                      <TableCell>{sim.reinvest_percent}%</TableCell>
                      <TableCell>{sim.trade_results.length}</TableCell>
                      <TableCell>
                        {new Date(sim.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoad(sim)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Cargar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(sim.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar simulación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La simulación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedSimulations;
