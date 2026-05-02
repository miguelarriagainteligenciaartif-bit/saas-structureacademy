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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const KNOWN_FUNDING_COMPANIES = [
  "Apex",
  "Topstep",
  "Tradeify",
  "Earn2Trade",
  "Alpha Capital",
  "MyFundedFutures",
  "FTMO",
  "The Funded Trader",
  "FundedNext",
  "Funded Pips",
  "Maven Trading",
  "Pip Farm",
  "Otra",
];

const ACCOUNT_TYPES = [
  { value: "evaluation", label: "Evaluación" },
  { value: "live", label: "Cuenta Live" },
];

const STATUS_OPTIONS = [
  { value: "in_progress", label: "En progreso", color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  { value: "passed", label: "Aprobada", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  { value: "live", label: "Activa (Live)", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  { value: "failed", label: "Perdida", color: "bg-red-500/15 text-red-500 border-red-500/30" },
  { value: "closed", label: "Cerrada", color: "bg-muted text-muted-foreground border-border" },
];

export interface FundingAccount {
  id: string;
  user_id: string;
  funding_company: string;
  account_label: string | null;
  account_type: string;
  status: string;
  account_size: number;
  cost: number;
  purchase_date: string | null;
  passed_date: string | null;
  funded_date: string | null;
  closed_date: string | null;
  notes: string | null;
}

export interface FundingPayout {
  id: string;
  funding_account_id: string;
  payout_date: string;
  amount: number;
  notes: string | null;
}

const emptyForm = {
  funding_company: "",
  custom_company: "",
  account_label: "",
  account_type: "evaluation",
  status: "in_progress",
  account_size: "",
  cost: "",
  purchase_date: "",
  passed_date: "",
  funded_date: "",
  closed_date: "",
  notes: "",
};

interface Props {
  accounts: FundingAccount[];
  payouts: FundingPayout[];
  onChange: () => void;
  userId: string;
}

export function FundingAccountManager({ accounts, payouts, onChange, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FundingAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [payoutDialog, setPayoutDialog] = useState<FundingAccount | null>(null);
  const [payoutForm, setPayoutForm] = useState({ payout_date: "", amount: "", notes: "" });

  useEffect(() => {
    if (editing) {
      const isKnown = KNOWN_FUNDING_COMPANIES.includes(editing.funding_company);
      setForm({
        funding_company: isKnown ? editing.funding_company : "Otra",
        custom_company: isKnown ? "" : editing.funding_company,
        account_label: editing.account_label ?? "",
        account_type: editing.account_type,
        status: editing.status,
        account_size: String(editing.account_size ?? ""),
        cost: String(editing.cost ?? ""),
        purchase_date: editing.purchase_date ?? "",
        passed_date: editing.passed_date ?? "",
        funded_date: editing.funded_date ?? "",
        closed_date: editing.closed_date ?? "",
        notes: editing.notes ?? "",
      });
      setOpen(true);
    }
  }, [editing]);

  const resetAndClose = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const company = form.funding_company === "Otra" ? form.custom_company.trim() : form.funding_company;
    if (!company) {
      toast.error("Selecciona o escribe la empresa de fondeo");
      return;
    }
    const payload = {
      user_id: userId,
      funding_company: company,
      account_label: form.account_label.trim() || null,
      account_type: form.account_type,
      status: form.status,
      account_size: Number(form.account_size) || 0,
      cost: Number(form.cost) || 0,
      purchase_date: form.purchase_date || null,
      passed_date: form.passed_date || null,
      funded_date: form.funded_date || null,
      closed_date: form.closed_date || null,
      notes: form.notes.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("funding_accounts").update(payload).eq("id", editing.id)
      : await supabase.from("funding_accounts").insert(payload);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Cuenta actualizada" : "Cuenta creada");
    resetAndClose();
    onChange();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("funding_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cuenta eliminada");
    onChange();
  };

  const handleAddPayout = async () => {
    if (!payoutDialog) return;
    if (!payoutForm.payout_date || !payoutForm.amount) {
      toast.error("Fecha e importe son obligatorios");
      return;
    }
    const { error } = await supabase.from("funding_payouts").insert({
      user_id: userId,
      funding_account_id: payoutDialog.id,
      payout_date: payoutForm.payout_date,
      amount: Number(payoutForm.amount),
      notes: payoutForm.notes.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Payout registrado");
    setPayoutForm({ payout_date: "", amount: "", notes: "" });
    setPayoutDialog(null);
    onChange();
  };

  const handleDeletePayout = async (id: string) => {
    const { error } = await supabase.from("funding_payouts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payout eliminado");
    onChange();
  };

  const fmtMoney = (v: number) => `$${(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const statusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return <Badge variant="outline" className={opt?.color}>{opt?.label ?? status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mis Cuentas de Fondeo</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Evaluaciones y cuentas live registradas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(emptyForm); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cuenta" : "Nueva cuenta de fondeo"}</DialogTitle>
              <DialogDescription>Registra una evaluación o cuenta live de cualquier empresa de fondeo.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label>Empresa de fondeo *</Label>
                <Select value={form.funding_company} onValueChange={(v) => setForm({ ...form, funding_company: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona empresa" /></SelectTrigger>
                  <SelectContent>
                    {KNOWN_FUNDING_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.funding_company === "Otra" && (
                <div className="space-y-2">
                  <Label>Nombre empresa *</Label>
                  <Input value={form.custom_company} onChange={(e) => setForm({ ...form, custom_company: e.target.value })} placeholder="Ej: Mi Funding" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Etiqueta / Identificador</Label>
                <Input value={form.account_label} onChange={(e) => setForm({ ...form, account_label: e.target.value })} placeholder="Ej: Apex 50K #2" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tamaño de cuenta ($)</Label>
                <Input type="number" value={form.account_size} onChange={(e) => setForm({ ...form, account_size: e.target.value })} placeholder="50000" />
              </div>
              <div className="space-y-2">
                <Label>Coste / Fee ($)</Label>
                <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="167" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de compra</Label>
                <Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha aprobación</Label>
                <Input type="date" value={form.passed_date} onChange={(e) => setForm({ ...form, passed_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fondeo (live)</Label>
                <Input type="date" value={form.funded_date} onChange={(e) => setForm({ ...form, funded_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha cierre</Label>
                <Input type="date" value={form.closed_date} onChange={(e) => setForm({ ...form, closed_date: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notas</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editing ? "Guardar cambios" : "Crear cuenta"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay cuentas registradas. Crea tu primera cuenta de fondeo.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Tamaño</TableHead>
                <TableHead className="text-right">Coste</TableHead>
                <TableHead className="text-right">Payouts</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map(acc => {
                const accPayouts = payouts.filter(p => p.funding_account_id === acc.id);
                const totalPayouts = accPayouts.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.funding_company}</TableCell>
                    <TableCell>{acc.account_label ?? "—"}</TableCell>
                    <TableCell>{acc.account_type === "live" ? "Live" : "Eval."}</TableCell>
                    <TableCell>{statusBadge(acc.status)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(acc.account_size)}</TableCell>
                    <TableCell className="text-right text-destructive">{fmtMoney(acc.cost)}</TableCell>
                    <TableCell className="text-right text-success">{fmtMoney(totalPayouts)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Añadir payout" onClick={() => setPayoutDialog(acc)}>
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(acc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará "{acc.funding_company} {acc.account_label ?? ""}" y todos sus payouts. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(acc.id)}>Eliminar</AlertDialogAction>
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

        {/* Payouts list */}
        {payouts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3">Historial de Payouts</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...payouts].sort((a, b) => b.payout_date.localeCompare(a.payout_date)).map(p => {
                  const acc = accounts.find(a => a.id === p.funding_account_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.payout_date}</TableCell>
                      <TableCell>{acc ? `${acc.funding_company} ${acc.account_label ?? ""}` : "—"}</TableCell>
                      <TableCell className="text-right text-success">{fmtMoney(Number(p.amount))}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.notes ?? ""}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar este payout?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePayout(p.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Payout dialog */}
      <Dialog open={!!payoutDialog} onOpenChange={(o) => { if (!o) setPayoutDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Payout</DialogTitle>
            <DialogDescription>
              {payoutDialog ? `${payoutDialog.funding_company} ${payoutDialog.account_label ?? ""}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" value={payoutForm.payout_date} onChange={(e) => setPayoutForm({ ...payoutForm, payout_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Importe ($) *</Label>
              <Input type="number" step="0.01" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={payoutForm.notes} onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(null)}>Cancelar</Button>
            <Button onClick={handleAddPayout}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}