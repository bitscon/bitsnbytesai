
import { toast } from "sonner";
import { AlertVariant } from "@/components/admin/api-settings/types";

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: AlertVariant;
};

function useToast() {
  const showToast = ({ title, description, variant, duration, action }: ToastProps) => {
    // Map our custom variants to sonner's options
    const options: any = {
      duration: duration || 3000,
    };

    if (variant === "destructive") {
      return toast.error(title, {
        description,
        action,
        ...options,
      });
    } else if (variant === "warning") {
      return toast.warning(title, {
        description,
        action,
        ...options,
      });
    } else {
      return toast(title, {
        description,
        action,
        ...options,
      });
    }
  };

  return {
    toast: showToast,
  };
}

export { useToast };
export type { ToastProps };
