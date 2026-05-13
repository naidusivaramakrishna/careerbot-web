import { toast } from 'sonner';

export const usePaymentToast = () => {
  return {
    success: (message: string) => {
      toast.success(message, {
        duration: 5000,
        position: 'bottom-right',
      });
    },
    error: (message: string) => {
      toast.error(message, {
        duration: 5000,
        position: 'bottom-right',
      });
    },
    info: (message: string) => {
      toast.info(message, {
        duration: 4000,
        position: 'bottom-right',
      });
    },
  };
};
