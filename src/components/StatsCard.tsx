import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend = "neutral", subtitle }: StatsCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={cn(
              "text-2xl font-bold mb-1 truncate",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-foreground"
            )}>
              {value}
            </h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn(
            "p-3 rounded-lg shrink-0",
            trend === "up" && "bg-success/10",
            trend === "down" && "bg-destructive/10",
            trend === "neutral" && "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
