import { toast } from 'react-hot-toast';

export interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export function notifyError(error: Error | ErrorDetails | string): void {
  let message: string;
  let details: any = undefined;

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
    details = error.stack;
  } else {
    message = error.message;
    details = error.details;
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error notification:', { message, details });
  }

  // Show toast notification
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
  });
}

export function notifySuccess(message: string): void {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    },
  });
}

export function notifyWarning(message: string): void {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fed7aa',
    },
  });
}

export function notifyInfo(message: string): void {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#eff6ff',
      color: '#2563eb',
      border: '1px solid #bfdbfe',
    },
  });
}

// Global error handler for unhandled fetch errors
export function handleFetchError(error: any, context?: string): void {
  let message = 'An unexpected error occurred';
  
  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        message = 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'You are not authorized. Please log in again.';
        break;
      case 403:
        message = 'Access denied. You do not have permission.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = `Request failed with status ${error.status}`;
    }
  } else if (error instanceof TypeError && error.message.includes('fetch')) {
    message = 'Network error. Please check your connection.';
  } else if (error?.message) {
    message = error.message;
  }

  if (context) {
    message = `${context}: ${message}`;
  }

  notifyError(message);
}
