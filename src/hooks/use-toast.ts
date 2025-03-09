
import { toast as sonnerToast } from "sonner";
import { AlertVariant } from "@/components/admin/api-settings/types";

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: AlertVariant;
};

// Create a toast array for the toaster component
export type ToastType = ToastProps & {
  id: string;
};

const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000;

let toasts: ToastType[] = [];

const useToast = () => {
  const showToast = ({ title, description, variant, duration, action }: ToastProps) => {
    // Map our custom variants to sonner's options
    const options: any = {
      duration: duration || 3000,
    };

    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
        action,
        ...options,
      });
    } else if (variant === "warning") {
      return sonnerToast.warning(title, {
        description,
        action,
        ...options,
      });
    } else {
      return sonnerToast(title, {
        description,
        action,
        ...options,
      });
    }
  };

  return {
    toast: showToast,
    // Add a getter for toasts to support the Toaster component
    get toasts() {
      return toasts;
    },
  };
};

// Export the toast function directly for convenience
export const toast = ({ title, description, variant, duration, action }: ToastProps) => {
  const options: any = {
    duration: duration || 3000,
  };

  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      action,
      ...options,
    });
  } else if (variant === "warning") {
    return sonnerToast.warning(title, {
      description,
      action,
      ...options,
    });
  } else {
    return sonnerToast(title, {
      description,
      action,
      ...options,
    });
  }
};

export { useToast };
