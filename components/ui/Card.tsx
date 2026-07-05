import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('bg-secondary border border-gray-800 rounded-3xl overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
