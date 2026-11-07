'use client'
import * as Primitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
export function Checkbox(props: React.ComponentPropsWithoutRef<typeof Primitive.Root>) {
  return <Primitive.Root {...props} className="check-target"><span className="check-box"><Primitive.Indicator>{props.checked === 'indeterminate' ? <Minus size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}</Primitive.Indicator></span></Primitive.Root>
}
