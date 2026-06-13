import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Logo da Radix Engenharia e Software.
 * Para usar a logo oficial, faça upload do arquivo e substitua o bloco do
 * ícone abaixo por: <img src={logoUrl} alt="Radix Engenharia e Software" />
 */
interface BrandLogoProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'sm', className }: BrandLogoProps) {
  const box = size === 'lg' ? 'w-20 h-20 rounded-2xl' : 'w-10 h-10 rounded-xl';
  const icon = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';
  return (
    <div
      className={cn(
        'bg-primary flex items-center justify-center shadow-glow',
        box,
        size === 'lg' && 'animate-float',
        className
      )}
    >
      <Clock className={cn('text-primary-foreground', icon)} />
    </div>
  );
}
