'use client'
import * as Primitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Local, editable Radix primitives following the shadcn/ui composition pattern.
export const Dialog = Primitive.Root
export const DialogTrigger = Primitive.Trigger
export const DialogTitle = Primitive.Title
export const DialogDescription = Primitive.Description
export const DialogClose = Primitive.Close
export function DialogContent({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Overlay className="dialog-overlay" /><Primitive.Content className={cn('dialog-content', className)} {...props}>
    {children}
    <Primitive.Close className="dialog-close" aria-label="Đóng"><X size={20} aria-hidden="true" /></Primitive.Close>
  </Primitive.Content></Primitive.Portal>
}
