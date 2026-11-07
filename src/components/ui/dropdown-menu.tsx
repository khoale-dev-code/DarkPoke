'use client'
import * as Primitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
export const DropdownMenu = Primitive.Root
export const DropdownMenuTrigger = Primitive.Trigger
export const DropdownMenuSeparator = Primitive.Separator
export function DropdownMenuContent({ className, sideOffset = 8, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Content sideOffset={sideOffset} className={cn('dropdown-content', className)} {...props} /></Primitive.Portal>
}
export function DropdownMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Item>) {
  return <Primitive.Item className={cn('dropdown-item', className)} {...props} />
}
