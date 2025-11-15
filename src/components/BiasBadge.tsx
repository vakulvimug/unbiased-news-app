import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BiasBadgeProps {
  bias: string | null;
  className?: string;
}

export function BiasBadge({ bias, className }: BiasBadgeProps) {
  if (!bias) return null;

  const biasLower = bias.toLowerCase();
  
  const getBiasColor = () => {
    if (biasLower.includes('left')) return 'bg-bias-left';
    if (biasLower.includes('right')) return 'bg-bias-right';
    if (biasLower.includes('center') || biasLower.includes('neutral')) return 'bg-bias-center';
    return 'bg-muted';
  };

  return (
    <Badge 
      className={cn(
        'text-white',
        getBiasColor(),
        className
      )}
    >
      {bias}
    </Badge>
  );
}
