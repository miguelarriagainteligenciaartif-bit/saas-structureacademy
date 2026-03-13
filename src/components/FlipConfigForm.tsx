import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FlipConfig } from "@/utils/flipX5Simulator";
import { Settings } from "lucide-react";

interface FlipConfigFormProps {
  initialConfig?: FlipConfig;
  onConfigChange: (config: FlipConfig) => void;
}

export const FlipConfigForm = ({ initialConfig, onConfigChange }: FlipConfigFormProps) => {
  const [config, setConfig] = useState<FlipConfig>(
    initialConfig || {
      accountSize: 1000,
      cycleSize: 2,
      riskPerCycle: 200,
      rrRatio: 2.0,
      reinvestPercent: 80,
    }
  );

  const handleChange = (field: keyof FlipConfig, value: number | boolean) => {
    let newConfig = { ...config, [field]: value };
    
    // Si se activa el modo porcentaje y el riesgo es muy alto, ajustarlo a un valor razonable
    if (field === "usePercentageRisk" && value === true && config.riskPerCycle > 10) {
      newConfig.riskPerCycle = 1; // 1% por defecto
    }
    // Si se desactiva el modo porcentaje y el riesgo es muy bajo, ajustarlo
    if (field === "usePercentageRisk" && value === false && config.riskPerCycle < 10) {
      newConfig.riskPerCycle = 200; // $200 por defecto
    }
    
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Card className="p-6 bg-card/30 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Configuración de Cuenta</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="usePercentageRisk" className="text-sm cursor-pointer">
            Usar porcentaje fijo
          </Label>
          <Switch
            id="usePercentageRisk"
            checked={config.usePercentageRisk || false}
            onCheckedChange={(checked) => handleChange("usePercentageRisk", checked)}
          />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountSize">Tamaño de Cuenta ($)</Label>
          <Input
            id="accountSize"
            type="number"
            min="0"
            step="100"
            value={config.accountSize}
            onChange={(e) => handleChange("accountSize", parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cycleSize">Tamaño de Ciclo</Label>
          <Input
            id="cycleSize"
            type="number"
            min="1"
            max="10"
            value={config.cycleSize}
            onChange={(e) => handleChange("cycleSize", parseInt(e.target.value))}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">Máx. 2 trades por ciclo (reinicia al SL)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="riskPerCycle">
            {config.usePercentageRisk ? "Riesgo por Trade (%)" : "Riesgo por Ciclo ($)"}
          </Label>
          <Input
            id="riskPerCycle"
            type="number"
            min="0"
            step={config.usePercentageRisk ? "0.1" : "10"}
            value={config.riskPerCycle}
            onChange={(e) => handleChange("riskPerCycle", parseFloat(e.target.value))}
          />
          {config.usePercentageRisk && (
            <p className="text-xs text-muted-foreground">% del balance actual por trade</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rrRatio">Ratio R:R</Label>
          <Input
            id="rrRatio"
            type="number"
            min="0.1"
            step="0.1"
            value={config.rrRatio}
            onChange={(e) => handleChange("rrRatio", parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Ej: 2 = 1:2</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reinvestPercent">Reinversión (%)</Label>
          <Input
            id="reinvestPercent"
            type="number"
            min="0"
            max="100"
            step="5"
            value={config.reinvestPercent}
            onChange={(e) => handleChange("reinvestPercent", parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">% del profit</p>
        </div>
      </div>
    </Card>
  );
};
