import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300';

  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark text-black hover:shadow-glow-white hover:scale-105 active:scale-95',
    secondary: 'bg-secondary-light text-white border border-border-light hover:border-primary/30 hover:bg-secondary',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-muted hover:text-white hover:bg-secondary',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    gold: 'bg-gradient-to-r from-accent to-accent-light text-black hover:shadow-glow-white hover:scale-105 active:scale-95'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], disabled && 'opacity-50 cursor-not-allowed hover:scale-100', className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className='w-5 h-5 mr-2 animate-spin' />}
      {children}
    </button>
  );
};

export default Button;
