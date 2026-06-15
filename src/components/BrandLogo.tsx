import { cn } from '@/lib/utils';

/**
 * Logo da Radix Engenharia e Software.
 * Marca composta pela folha/lâmina verde (#43C781) + wordmark "RADIX".
 * O wordmark usa a cor de texto do tema (branco no escuro, escuro no claro)
 * para permanecer legível em qualquer fundo.
 */
interface BrandLogoProps {
  size?: 'sm' | 'lg';
  /** Mostra o texto "RADIX" ao lado da folha. */
  wordmark?: boolean;
  className?: string;
}

function RadixLeaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 10 L29 1 L18 28 L11 33 Z"
        fill="hsl(var(--secondary))"
      />
    </svg>
  );
}

export function BrandLogo({ size = 'sm', wordmark = true, className }: BrandLogoProps) {
  const leaf = size === 'lg' ? 'w-12 h-12' : 'w-7 h-7';
  const text = size === 'lg' ? 'text-4xl' : 'text-2xl';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RadixLeaf className={cn(leaf, size === 'lg' && 'animate-float')} />
      {wordmark && (
        <span
          className={cn(
            'font-bold tracking-tight leading-none text-foreground',
            text
          )}
        >
          RADIX
        </span>
      )}
    </div>
  );
}
