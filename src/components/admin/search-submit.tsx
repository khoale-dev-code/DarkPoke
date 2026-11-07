'use client'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
export function SearchSubmit() { const { pending } = useFormStatus(); return <button type="submit" className="btn btn-secondary" disabled={pending}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}Tìm</button> }
