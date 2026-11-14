import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, className = '', children }) => {
  return (
    <div
      className={cn(
        'rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-border p-6 transition-colors',
        className
      )}
    >
      {title && (
        <h3 className="mb-4 text-base font-semibold text-card-foreground">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;
