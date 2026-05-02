import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KNOWN_FUNDING_COMPANIES } from "./FundingAccountManager";

export interface CompanySummary {
  id: string;
  user_id: string;
  funding_company: string;
  total_evaluations: number;
  total_passed: number;
  total_failed: number;
  total_cost: number;
  notes: string | null;
}

const empty = {
  funding_company: "",
  custom_company: "",
  total_evaluations: "",
  total_passed: "",
  total_failed: "",
  total_cost: "",
  notes: "",
};

interface Props {
  summaries: CompanySummary[];
  liveCountByCompany: Record<string, number>;
  userId: string;
  onChange: () => void;
}

export function CompanySummaryManager({ summaries, liveCountByCompany, userId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompanySummary | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      const known = KNOWN_FUNDING_COMPANIES.includes(editing.funding_company);
      setForm({
        funding_company: known ? editing.funding_company : "Otra",
        custom_company: known ? "" : editing.funding_company,
        total_evaluations: String(editing.total_evaluations ?? ""),
        total_passed: String(editing.total_passed ?? ""),
        total_failed: String(editing.total_failed ?? ""),
        total_cost: String(editing.total_cost ?? ""),
        notes: editing.notes ?? "",
      });
      setOpen(true);
    }
  }, [editing]);

  const reset = () => { setOpen(false); setEditing(null); setForm(empty); };

  const handleSubmit = async () => {
    const company = form.funding_company === "Otra" ? form.custom_company.trim() : form.funding_company;
    if (!company) return toast.error("Selecciona o escribe la empresa");

    const payload = {
      user_id: userId,
      funding_company: company,
      total_evaluations: parseInt(form.total_evaluations) || 0,
      total_passed: parseInt(form.total_passed) || 0,
      total_failed: parseInt(form.total_failed) || 0,
      total_cost: Number(form.total_cost) || 0,
      notes: form.notes.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("funding_company_summary").update(payload).eq("id", editing.id)
      : await supabase.from("funding_company_summary").insert(payload);

    if (error) return toast.error(error.message);
    toast.success(editing ? "Resumen actualizado" : "Resumen creado");
    reset();
    onChange();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("funding_company_summary").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Resumen eliminado");
    onChange();
  };

  const fmt = (v: number) => `$${(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resumen por Empresa</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Registra el agregado histórico (ej: Apex 42 compradas / 21 pasadas) sin tener que crear una fila por cada evaluación
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(empty); }}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar resumen" : "Nuevo resumen por empresa"}</DialogTitle>
              <DialogDescription>
                Introduce los totales agregados. Las cuentas live activas se gestionan abajo de forma individual.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={form.funding_company} onValueChange={(v) => setForm({ ...form, funding_company: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {KNOWN_FUNDING_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.funding_company === "Otra" && (
                <div className="space-y-2">
                  <Label>Nombre empresa *</Label>
                  <Input value={form.custom_company} onChange={(e) => setForm({ ...form, custom_company: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Evaluaciones compradas</Label>
                <Input type="number" value={form.total_evaluations} onChange={(e) => setForm({ ...form, total_evaluations: e.target.value })} placeholder="42" />
              </div>
              <div className="space-y-2">
                <Label>Aprobadas / Pasadas</Label>
                <Input type="number" value={form.total_passed} onChange={(e) => setForm({ ...form, total_passed: e.target.value })} placeholder="21" />
              </div>
              <div className="space-y-2">
                <Label>Perdidas</Label>
                <Input type="number" value={form.total_failed} onChange={(e) => setForm({ ...form, total_failed: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Coste total acumulado ($)</Label>
                <Input type="number" step="0.01" value={form.total_cost} onChange={(e) => setForm({ ...form, total_cost: e.target.value })} placeholder="7000" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notas</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aún no has registrado ningún resumen por empresa.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Compradas</TableHead>
                <TableHead className="text-right">Pasadas</TableHead>
                <TableHead className="text-right">Perdidas</TableHead>
                <TableHead className="text-right">Live activas</TableHead>
                <TableHead className="text-right">Pass rate</TableHead>
                <TableHead className="text-right">Coste total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(s => {
                const passRate = s.total_evaluations > 0 ? (s.total_passed / s.total_evaluations) * 100 : 0;
                const liveCount = liveCountByCompany[s.funding_company] ?? 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.funding_company}</TableCell>
                    <TableCell className="text-right">{s.total_evaluations}</TableCell>
                    <TableCell className="text-right text-emerald-500">{s.total_passed}</TableCell>
                    <TableCell className="text-right text-destructive">{s.total_failed}</TableCell>
                    <TableCell className="text-right text-primary">{liveCount}</TableCell>
                    <TableCell className="text-right">{passRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-destructive">{fmt(Number(s.total_cost))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar resumen de {s.funding_company}?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}