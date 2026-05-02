import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

interface Props { userId: string; onChange: () => void; }

export function BulkPasteLiveAccounts({ userId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const example = `Apex, 50K-A, 50000
Apex, 50K-B, 50000
FTMO, 100K-1, 100000
FTMO, 100K-2, 100000`;

  const handleImport = async () => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return toast.error("Pega al menos una línea");

    const rows = lines.map((line, i) => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      const company = parts[0] || "";
      const label = parts[1] || `Cuenta ${i + 1}`;
      const size = Number(parts[2]?.replace(/[^\d.]/g, "")) || 0;
      return company ? {
        user_id: userId,
        funding_company: company,
        account_label: label,
        account_type: "live",
        status: "live",
        account_size: size,
        cost: 0,
      } : null;
    }).filter(Boolean) as any[];

    if (rows.length === 0) return toast.error("No se pudo interpretar ninguna línea");

    const { error } = await supabase.from("funding_accounts").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} cuentas live importadas`);
    setText("");
    setOpen(false);
    onChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ClipboardPaste className="h-4 w-4 mr-2" />
          Pegar lista
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar cuentas live pegando una lista</DialogTitle>
          <DialogDescription>
            Una cuenta por línea, formato: <strong>empresa, etiqueta, tamaño</strong>. Puedes separar con coma, punto y coma o tabulador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ejemplo:</Label>
            <pre className="text-xs bg-muted p-2 rounded">{example}</pre>
          </div>
          <div className="space-y-1">
            <Label>Tu lista</Label>
            <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={example} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleImport}>Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}