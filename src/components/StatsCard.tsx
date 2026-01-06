import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  return (
    <div className={cn(
      "glass-card rounded-2xl p-5 card-hover",
      variant === 'primary' && "border-primary/20",
      variant === 'success' && "border-success/20",
      variant === 'warning' && "border-warning/20"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          variant === 'default' && "bg-muted",
          variant === 'primary' && "bg-primary/10",
          variant === 'success' && "bg-success/10",
          variant === 'warning' && "bg-warning/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            variant === 'default' && "text-muted-foreground",
            variant === 'primary' && "text-primary",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning"
          )} />
        </div>
      </div>
    </div>
  );
}
