'use client'
import React, { useEffect, useState } from 'react';
import MaterialIcon from '@/components/ui/MaterialIcon';

export interface ToastProps {
  id: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  icon?: string;
  onClose: (id: string) => void;
}

const variantStyles = {
  success: {
    container: 'bg-white border-l-4 border-green-500 shadow-lg',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-gray-700',
    closeButton: 'text-gray-400 hover:text-gray-600',
    defaultIcon: 'check_circle',
  },
  error: {
    container: 'bg-white border-l-4 border-red-500 shadow-lg',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-gray-700',
    closeButton: 'text-gray-400 hover:text-gray-600',
    defaultIcon: 'error',
  },
  warning: {
    container: 'bg-white border-l-4 border-yellow-500 shadow-lg',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    message: 'text-gray-700',
    closeButton: 'text-gray-400 hover:text-gray-600',
    defaultIcon: 'warning',
  },
  info: {
    container: 'bg-white border-l-4 border-blue-500 shadow-lg',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-gray-700',
    closeButton: 'text-gray-400 hover:text-gray-600',
    defaultIcon: 'info',
  },
};

export default function Toast({
  id,
  variant = 'info',
  title,
  message,
  duration = 5000,
  icon,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const styles = variantStyles[variant];
  const iconName = icon || styles.defaultIcon;

  useEffect(() => {
    // Animación de entrada
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-cierre
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Duración de la animación de salida
  };

  return (
    <div
      className={`flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg pointer-events-auto transition-all duration-300 transform ${
        styles.container
      } ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${styles.icon} mt-0.5 md:mt-1`}>
        <MaterialIcon name={iconName} className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-0" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-xs md:text-sm font-semibold mb-1 ${styles.title}`}>
            {title}
          </h4>
        )}
        <p className={`text-xs md:text-sm ${styles.message}`}>
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-md transition-colors self-start mt-0.5 md:mt-1 ${styles.closeButton}`}
        aria-label="Cerrar"
      >
        <MaterialIcon name="close" className="w-3 h-3 md:w-4 md:h-4" />
      </button>
    </div>
  );
}
