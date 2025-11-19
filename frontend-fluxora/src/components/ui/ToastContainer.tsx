'use client'
import React from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export default function ToastContainer({
  toasts,
  onClose,
  position = 'top-right',
}: ToastContainerProps) {
  return (
    <div
      className={`fixed z-50 flex flex-col gap-3 pointer-events-none ${positionStyles[position]} max-w-md w-full`}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
