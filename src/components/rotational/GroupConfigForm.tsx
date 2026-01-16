import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Play,
  Building2,
  Layers,
  Wallet,
  Target,
  TrendingUp
} from "lucide-react";
import { 
  GroupRotationalConfig, 
  GroupConfig, 
  AccountConfig,
  BrokerType,
  createDefaultConfig 
} from "@/utils/groupRotationalSimulator";

interface GroupConfigFormProps {
  config: GroupRotationalConfig;
  onConfigChange: (config: GroupRotationalConfig) => void;
  onStart: () => void;
  isSimulationActive: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const GroupConfigForm = ({
  config,
  onConfigChange,
  onStart,
  isSimulationActive,
}: GroupConfigFormProps) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const addGroup = (brokerType: BrokerType) => {
    const brokerName = brokerType === 'cfd' ? 'FTMO' : 'Apex';
    const groupNumber = config.groups.filter(g => g.brokerType === brokerType).length + 1;
    const defaultRisk = brokerType === 'cfd' ? 800 : 375;
    
    const newGroup: GroupConfig = {
      id: generateId(),
      name: `${brokerName} Grupo ${groupNumber}`,
      brokerType,
      brokerName,
      riskPerTrade: defaultRisk,
      accounts: [],
      ...(brokerType === 'futures' && {
        bufferRequired: 2600,
        trailingStopBuffer: 100,
      }),
    };

    onConfigChange({
      ...config,
      groups: [...config.groups, newGroup],
    });
    setExpandedGroup(newGroup.id);
  };

  const removeGroup = (groupId: string) => {
    onConfigChange({
      ...config,
      groups: config.groups.filter(g => g.id !== groupId),
    });
  };

  const updateGroup = (groupId: string, updates: Partial<GroupConfig>) => {
    onConfigChange({
      ...config,
      groups: config.groups.map(g => 
        g.id === groupId ? { ...g, ...updates } : g
      ),
    });
  };

  const addAccountToGroup = (groupId: string) => {
    const group = config.groups.find(g => g.id === groupId);
    if (!group) return;

    const accountNumber = group.accounts.length + 1;
    const defaultBalance = group.brokerType === 'cfd' ? 100000 : 50000;

    const newAccount: AccountConfig = {
      id: generateId(),
      name: `${group.brokerName} ${defaultBalance / 1000}K #${accountNumber}`,
      initialBalance: defaultBalance,
      currentBalance: defaultBalance,
      profitTarget: config.profitTargetPercent,
      withdrawals: [],
      tradesSinceLastWithdrawal: 0,
      tradesInCurrentMonth: 0,
    };

    updateGroup(groupId, {
      accounts: [...group.accounts, newAccount],
    });
  };

  const removeAccountFromGroup = (groupId: string, accountId: string) => {
    const group = config.groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      accounts: group.accounts.filter(a => a.id !== accountId),
    });
  };

  const updateAccount = (groupId: string, accountId: string, updates: Partial<AccountConfig>) => {
    const group = config.groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      accounts: group.accounts.map(a =>
        a.id === accountId ? { ...a, ...updates } : a
      ),
    });
  };

  const loadDefaultConfig = () => {
    onConfigChange(createDefaultConfig());
  };

  const cfdGroups = config.groups.filter(g => g.brokerType === 'cfd');
  const futuresGroups = config.groups.filter(g => g.brokerType === 'futures');

  const totalAccounts = config.groups.reduce((sum, g) => sum + g.accounts.length, 0);
  const totalCapital = config.groups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, a) => accSum + a.initialBalance, 0), 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Configuración de Grupos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parámetros globales */}
        <div className="p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Estrategia: Ratio 1:2 fijo</span>
            <Badge variant="outline" className="text-xs">Objetivo: 2% mensual</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            El ratio R:R está fijado en 1:2 según la estrategia. Configura tus grupos y cuentas abajo.
          </p>
        </div>

        {/* Resumen */}
        <div className="flex flex-wrap gap-4 text-sm">
          <Badge variant="outline" className="gap-1">
            <Layers className="h-3 w-3" />
            {config.groups.length} grupos
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {totalAccounts} cuentas
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Wallet className="h-3 w-3" />
            ${totalCapital.toLocaleString()} capital
          </Badge>
        </div>

        {/* Grupos CFD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              CFD (FTMO, etc.)
              <span className="text-xs text-muted-foreground">
                - Retiro: balance vuelve a inicial
              </span>
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addGroup('cfd')}
              disabled={isSimulationActive}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir Grupo
            </Button>
          </div>

          {cfdGroups.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
              No hay grupos CFD configurados
            </div>
          ) : (
            <div className="space-y-2">
              {cfdGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroup === group.id}
                  onToggle={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                  onUpdate={(updates) => updateGroup(group.id, updates)}
                  onRemove={() => removeGroup(group.id)}
                  onAddAccount={() => addAccountToGroup(group.id)}
                  onRemoveAccount={(accountId) => removeAccountFromGroup(group.id, accountId)}
                  onUpdateAccount={(accountId, updates) => updateAccount(group.id, accountId, updates)}
                  disabled={isSimulationActive}
                />
              ))}
            </div>
          )}
        </div>

        {/* Grupos Futuros */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Futuros (Apex, etc.)
              <span className="text-xs text-muted-foreground">
                - Retiro: mantiene colchón + trailing
              </span>
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addGroup('futures')}
              disabled={isSimulationActive}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir Grupo
            </Button>
          </div>

          {futuresGroups.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
              No hay grupos de Futuros configurados
            </div>
          ) : (
            <div className="space-y-2">
              {futuresGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroup === group.id}
                  onToggle={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                  onUpdate={(updates) => updateGroup(group.id, updates)}
                  onRemove={() => removeGroup(group.id)}
                  onAddAccount={() => addAccountToGroup(group.id)}
                  onRemoveAccount={(accountId) => removeAccountFromGroup(group.id, accountId)}
                  onUpdateAccount={(accountId, updates) => updateAccount(group.id, accountId, updates)}
                  disabled={isSimulationActive}
                />
              ))}
            </div>
          )}
        </div>

        {!isSimulationActive && config.groups.length > 0 && totalAccounts > 0 && (
          <Button onClick={onStart} className="w-full" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Iniciar Simulación
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

interface GroupCardProps {
  group: GroupConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<GroupConfig>) => void;
  onRemove: () => void;
  onAddAccount: () => void;
  onRemoveAccount: (accountId: string) => void;
  onUpdateAccount: (accountId: string, updates: Partial<AccountConfig>) => void;
  disabled: boolean;
}

const GroupCard = ({
  group,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddAccount,
  onRemoveAccount,
  onUpdateAccount,
  disabled,
}: GroupCardProps) => {
  const totalBalance = group.accounts.reduce((sum, a) => sum + a.initialBalance, 0);
  const colorClass = group.brokerType === 'cfd' ? 'border-blue-500/30' : 'border-amber-500/30';

  return (
    <div className={`border rounded-lg overflow-hidden ${colorClass}`}>
      <div 
        className="flex items-center justify-between p-3 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{group.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {group.accounts.length} cuentas · ${totalBalance.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {group.brokerName}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3 bg-background">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre del Grupo</Label>
              <Input
                value={group.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Broker</Label>
              <Input
                value={group.brokerName}
                onChange={(e) => onUpdate({ brokerName: e.target.value })}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Target className="h-3 w-3" />
                Riesgo/Trade ($)
              </Label>
              <Input
                type="number"
                value={group.riskPerTrade}
                onChange={(e) => onUpdate({ riskPerTrade: parseFloat(e.target.value) || 0 })}
                disabled={disabled}
                className="h-8 text-sm"
                placeholder="375"
              />
            </div>
          </div>

          {group.brokerType === 'futures' && (
            <div className="grid grid-cols-2 gap-3 p-2 bg-amber-500/10 rounded">
              <div className="space-y-1">
                <Label className="text-xs">Umbral Retiro ($)</Label>
                <Input
                  type="number"
                  value={group.withdrawalThreshold || 54100}
                  onChange={(e) => onUpdate({ withdrawalThreshold: parseFloat(e.target.value) || 54100 })}
                  disabled={disabled}
                  className="h-8 text-sm"
                  placeholder="54100"
                />
                <p className="text-[10px] text-muted-foreground">Balance al que retirar</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monto Retiro ($)</Label>
                <Input
                  type="number"
                  value={group.withdrawalAmount || 2000}
                  onChange={(e) => onUpdate({ withdrawalAmount: parseFloat(e.target.value) || 2000 })}
                  disabled={disabled}
                  className="h-8 text-sm"
                  placeholder="2000"
                />
                <p className="text-[10px] text-muted-foreground">Cuánto retirar</p>
              </div>
            </div>
          )}

          {/* Cuentas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Cuentas del grupo (replicador)</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onAddAccount}
                disabled={disabled}
              >
                <Plus className="h-3 w-3 mr-1" />
                Añadir Cuenta
              </Button>
            </div>

            {group.accounts.length === 0 ? (
              <div className="text-center py-3 text-xs text-muted-foreground border border-dashed rounded">
                Sin cuentas. Añade al menos una.
              </div>
            ) : (
              <div className="space-y-2">
                {group.accounts.map((account, idx) => (
                  <div key={account.id} className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                    <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                    <Input
                      value={account.name}
                      onChange={(e) => onUpdateAccount(account.id, { name: e.target.value })}
                      disabled={disabled}
                      className="h-7 text-xs flex-1"
                      placeholder="Nombre"
                    />
                    <Input
                      type="number"
                      value={account.initialBalance}
                      onChange={(e) => onUpdateAccount(account.id, { 
                        initialBalance: parseFloat(e.target.value) || 0,
                        currentBalance: parseFloat(e.target.value) || 0,
                      })}
                      disabled={disabled}
                      className="h-7 text-xs w-28"
                      placeholder="Balance"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onRemoveAccount(account.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
