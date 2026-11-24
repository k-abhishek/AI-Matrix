import React from 'react';
import { classNames } from '../../utils/helpers';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

const variantStyles = {
  success: 'bg-green-100 text-green-800 border-green-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
};

function getVariant(status: string, variant?: 'success' | 'error' | 'warning' | 'info') {
  if (variant) return variant;
  if (status.toLowerCase() === 'healthy') return 'success';
  if (status.toLowerCase() === 'error' || status.toLowerCase() === 'unhealthy') return 'error';
  if (status.toLowerCase() === 'warning') return 'warning';
  return 'info';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const resolvedVariant = getVariant(status, variant);
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[resolvedVariant]
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={classNames(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            resolvedVariant === 'success' ? 'bg-green-400' : 'bg-current'
          )}
        />
        <span
          className={classNames(
            'relative inline-flex h-2 w-2 rounded-full',
            resolvedVariant === 'success' ? 'bg-green-500' : 'bg-current'
          )}
        />
      </span>
      {status}
    </span>
  );
};

export default StatusBadge;
