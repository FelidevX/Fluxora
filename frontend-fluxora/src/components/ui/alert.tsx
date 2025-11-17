'use client'
import React from 'react';
import MaterialIcon from '@/components/ui/MaterialIcon';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  icon?: string;
  dismissible?: boolean;
  className?: string;
}

const variantStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-900',
    icon: 'text-green-600',
    closeButton: 'text-green-600 hover:text-green-800 hover:bg-green-100',
    defaultIcon: 'check_circle',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: 'text-red-600',
    closeButton: 'text-red-600 hover:text-red-800 hover:bg-red-100',
    defaultIcon: 'error',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    icon: 'text-yellow-600',
    closeButton: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100',
    defaultIcon: 'warning',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    closeButton: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
    defaultIcon: 'info',
  },
};

export default function Alert({
  variant = 'info',
  title,
  message,
  onClose,
  icon,
  dismissible = true,
  className = '',
}: AlertProps) {
  const styles = variantStyles[variant];
  const iconName = icon || styles.defaultIcon;

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg ${styles.container} ${className}`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${styles.icon}`}>
        <MaterialIcon name={iconName} className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-semibold mb-1">
            {title}
          </h3>
        )}
        <p className="text-sm">
          {message}
        </p>
      </div>

      {/* Close Button */}
      {dismissible && onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${styles.closeButton}`}
          aria-label="Cerrar"
        >
          <MaterialIcon name="close" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
