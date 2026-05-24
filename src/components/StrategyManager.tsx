import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  initial_capital: number;
  risk_reward_ratio: string;
  asset: string;
  entry_models: string[] | null;
  created_at: string;
}

interface StrategyManagerProps {
  selectedStrategy: string | null;
  onStrategyChange: (strategyId: string) => void;
  onStrategiesUpdate: () => void;
}

export const StrategyManager = ({ selectedStrategy, onStrategyChange, onStrategiesUpdate }: StrategyManagerProps) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    initial_capital: "0",
    risk_reward_ratio: "1:2",
    asset: "Nasdaq 100",
    entry_models: ["M1", "M3", "Continuación"] as string[],
  });
  const [newModel, setNewModel] = useState("");

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    const { data, error } = await supabase
      .from("backtest_strategies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading strategies:", error);
      toast.error("Error al cargar estrategias");
      return;
    }

    setStrategies(data || []);
    
    // Auto-select first strategy if none selected
    if (data && data.length > 0 && !selectedStrategy) {
      onStrategyChange(data[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const capitalValue = parseFloat(formData.initial_capital);
    if (isNaN(capitalValue) || capitalValue < 0) {
      toast.error("Capital inicial inválido");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingStrategy) {
        const { error } = await supabase
          .from("backtest_strategies")
          .update({
            name: formData.name,
            description: formData.description || null,
            initial_capital: capitalValue,
            risk_reward_ratio: formData.risk_reward_ratio,
            asset: formData.asset,
            entry_models: formData.entry_models.length > 0 ? formData.entry_models : ["M1", "M3", "Continuación"],
          })
          .eq("id", editingStrategy.id);

        if (error) throw error;
        toast.success("Estrategia actualizada");
      } else {
        const { error } = await supabase
          .from("backtest_strategies")
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description || null,
            initial_capital: capitalValue,
            risk_reward_ratio: formData.risk_reward_ratio,
            asset: formData.asset,
            entry_models: formData.entry_models.length > 0 ? formData.entry_models : ["M1", "M3", "Continuación"],
          });

        if (error) throw error;
        toast.success("Estrategia creada");
      }

      setIsDialogOpen(false);
      setEditingStrategy(null);
      resetForm();
      loadStrategies();
      onStrategiesUpdate();
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast.error("Error al guardar estrategia");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta estrategia? Se eliminarán también todas sus operaciones.")) {
      return;
    }

    const { error } = await supabase
      .from("backtest_strategies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Error al eliminar estrategia");
      return;
    }

    toast.success("Estrategia eliminada");
    loadStrategies();
    onStrategiesUpdate();
    
    if (selectedStrategy === id) {
      onStrategyChange("");
    }
  };

  const openEditDialog = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description || "",
      initial_capital: strategy.initial_capital.toString(),
      risk_reward_ratio: strategy.risk_reward_ratio,
      asset: strategy.asset || "Nasdaq 100",
      entry_models: (strategy.entry_models && strategy.entry_models.length > 0)
        ? [...strategy.entry_models]
        : ["M1", "M3", "Continuación"],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      initial_capital: "0",
      risk_reward_ratio: "1:2",
      asset: "Nasdaq 100",
      entry_models: ["M1", "M3", "Continuación"],
    });
    setNewModel("");
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingStrategy(null);
      resetForm();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estrategias de Backtesting</CardTitle>
            <CardDescription>Gestiona tus diferentes estrategias de trading</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Estrategia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStrategy ? "Editar Estrategia" : "Nueva Estrategia"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Estrategia Londres AM"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Trading de 8:00-12:00 GMT en sesión de Londres"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="asset">Activo *</Label>
                  <Select
                    value={formData.asset}
                    onValueChange={(value) => setFormData({ ...formData, asset: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nasdaq 100">Nasdaq 100</SelectItem>
                      <SelectItem value="Oro">Oro</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                      <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                      <SelectItem value="Petróleo">Petróleo</SelectItem>
                      <SelectItem value="S&P 500">S&P 500</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capital">Capital Inicial *</Label>
                  <Input
                    id="capital"
                    type="number"
                    step="0.01"
                    value={formData.initial_capital}
                    onChange={(e) => setFormData({ ...formData, initial_capital: e.target.value })}
                    placeholder="Ej: 5000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ratio">Ratio Riesgo/Beneficio *</Label>
                  <Select
                    value={formData.risk_reward_ratio}
                    onValueChange={(value) => setFormData({ ...formData, risk_reward_ratio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="1:1.5">1:1.5</SelectItem>
                      <SelectItem value="1:2">1:2</SelectItem>
                      <SelectItem value="1:2.5">1:2.5</SelectItem>
                      <SelectItem value="1:3">1:3</SelectItem>
                      <SelectItem value="1:4">1:4</SelectItem>
                      <SelectItem value="1:5">1:5</SelectItem>
                      <SelectItem value="Variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modelos de Entrada *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Modelos disponibles al registrar operaciones de esta estrategia. Personaliza según tu sistema.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                    {formData.entry_models.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Sin modelos. Añade al menos uno.</span>
                    ) : (
                      formData.entry_models.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
                        >
                          {m}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                entry_models: formData.entry_models.filter((x) => x !== m),
                              })
                            }
                            className="hover:text-destructive"
                            aria-label={`Quitar ${m}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="Ej: Breaker, OB, FVG..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = newModel.trim();
                          if (v && !formData.entry_models.includes(v)) {
                            setFormData({ ...formData, entry_models: [...formData.entry_models, v] });
                            setNewModel("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const v = newModel.trim();
                        if (v && !formData.entry_models.includes(v)) {
                          setFormData({ ...formData, entry_models: [...formData.entry_models, v] });
                          setNewModel("");
                        }
                      }}
                    >
                      Añadir
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingStrategy ? "Actualizar" : "Crear"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {strategies.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No hay estrategias creadas. Crea tu primera estrategia para empezar.
          </p>
        ) : (
          <div className="space-y-2">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedStrategy === strategy.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onStrategyChange(strategy.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{strategy.name}</h3>
                    {strategy.description && (
                      <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Activo: <span className="font-medium text-foreground">{strategy.asset}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Capital: <span className="font-medium text-foreground">${strategy.initial_capital.toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        R:R: <span className="font-medium text-foreground">{strategy.risk_reward_ratio}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(strategy);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(strategy.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};