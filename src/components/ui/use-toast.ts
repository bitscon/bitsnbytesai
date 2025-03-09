import {
  atom,
  useAtom,
} from 'jotai'
import {
  useEffect,
} from 'react'
import { AlertVariant } from "@/components/admin/api-settings/types";

type Toast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  variant?: AlertVariant
}

const toastsAtom = atom<Toast[]>([])

type AddToast = Omit<Toast, 'id'> & {
  id?: string
}

type UpdateToast = Partial<Toast> & {
  id: string
}

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  variant?: AlertVariant;
}

function useToast() {
  const [toasts, setToasts] = useAtom(toastsAtom)

  useEffect(() => {
    if (toasts.length && toasts[0].duration !== Infinity) {
      const timer = setTimeout(() => {
        removeToast(toasts[0].id)
      }, toasts[0].duration || 3000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  function addToast(props: AddToast) {
    const id = props.id || Math.random().toString(36).substring(2)
    const toast = {
      ...props,
      id,
    }
    setToasts([...toasts, toast])
    return id
  }

  function updateToast(props: UpdateToast) {
    setToasts(
      toasts.map((toast) => {
        if (toast.id === props.id) {
          return {
            ...toast,
            ...props,
          }
        }
        return toast
      })
    )
  }

  function removeToast(id: string) {
    setToasts(toasts.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    updateToast,
    removeToast,
  }
}

export {
  useToast,
  ToastProps,
}
