
import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

import { useToast as useToastHooks } from "@/hooks/use-toast"

const VIEWPORT_PADDING = 16

type ToastProps = React.ComponentProps<typeof Toast>

type ToastActionProps = React.ComponentProps<typeof ToastClose>

const ToastProviderComponent = ToastProvider

const ToastViewportComponent = ToastViewport

const ToastComponent = Toast

const ToastTitleComponent = ToastTitle

const ToastDescriptionComponent = ToastDescription

const ToastCloseComponent = ToastClose

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  ToastActionProps
>(({ className, ...props }, ref) => {
  return (
    <ToastClose
      ref={ref}
      className={className}
      {...props}
    />
  )
})

ToastAction.displayName = "ToastAction"

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  useToastHooks as useToast,
  ToastProviderComponent as ToastProvider,
  ToastViewportComponent as ToastViewport,
  ToastComponent as Toast,
  ToastTitleComponent as ToastTitle,
  ToastDescriptionComponent as ToastDescription,
  ToastCloseComponent as ToastClose,
  ToastAction,
}
export type { ToastProps, ToastActionProps, ToastActionElement }
