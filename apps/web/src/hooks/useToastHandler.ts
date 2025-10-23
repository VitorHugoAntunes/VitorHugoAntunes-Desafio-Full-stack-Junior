import toast from 'react-hot-toast';
import { mapErrorMessage } from '@/utils/errorMapper';

interface ToastOptions {
  successMessage?: string;
  silent?: boolean;
  duration?: number;
}

export const useToastHandler = () => {
  const showSuccess = (message: string, duration?: number) => {
    toast.success(message, {
      duration: duration || 3000,
      position: 'top-right',
    });
  };

  const showError = (error: any, duration?: number) => {
    const translatedMessage = mapErrorMessage(error);
    toast.error(translatedMessage, {
      duration: duration || 4000,
      position: 'top-right',
    });
  };

  const showWarning = (message: string, duration?: number) => {
    toast(message, {
      duration: duration || 3000,
      position: 'top-right',
      icon: '⚠️',
    });
  };

  const showInfo = (message: string, duration?: number) => {
    toast(message, {
      duration: duration || 3000,
      position: 'top-right',
      icon: 'ℹ️',
    });
  };

  const handlePromise = async <T,>(
    promise: Promise<T>,
    options?: ToastOptions
  ): Promise<T> => {
    try {
      const result = await promise;
      
      if (!options?.silent && options?.successMessage) {
        showSuccess(options.successMessage, options.duration);
      }
      
      return result;
    } catch (error) {
      if (!options?.silent) {
        showError(error, options?.duration);
      }
      throw error;
    }
  };

  const createLoadingToast = (message: string = 'Processando...') => {
    const toastId = toast.loading(message);

    return {
      success: (successMessage: string) => {
        toast.success(successMessage, { id: toastId });
      },
      error: (error: any) => {
        toast.error(mapErrorMessage(error), { id: toastId });
      },
      dismiss: () => {
        toast.dismiss(toastId);
      },
    };
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handlePromise,
    createLoadingToast,
  };
};