'use server'
import { prepare, finish } from '@/features/tradein/server/submissions'
import type { PhotoDescriptor, TradeinInput, UploadTicket } from '@/features/tradein/domain'

/** Server-action facade; feature code owns validation and persistence. */
export async function prepareTradein(input: TradeinInput, files: PhotoDescriptor[]) { return prepare(input, files) }
export async function submitTradein(ticket: UploadTicket) { return finish(ticket) }
