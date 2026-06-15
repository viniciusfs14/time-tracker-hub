import { cn } from '@/lib/utils';
import radixLogo from '@/assets/radix-logo.png.asset.json';
import radixLogoLight from '@/assets/radix-logo-light.png.asset.json';

/**
 * Logo oficial da Radix Engenharia e Software.
 * Usa a versão roxa no tema claro e a versão branca no tema escuro
 * (alternadas via classe `dark`) para permanecer legível em qualquer fundo.
 */
interface BrandLogoProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'sm', className }: BrandLogoProps) {
  const height = size === 'lg' ? 'h-12' : 'h-8';

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={radixLogo.url}
        alt="Radix Engenharia e Software"
        className={cn(height, 'w-auto block dark:hidden')}
      />
      <img
        src={radixLogoLight.url}
        alt="Radix Engenharia e Software"
        className={cn(height, 'w-auto hidden dark:block')}
      />
    </div>
  );
}
