import 'server-only'
import { tradeinServiceClient as serviceClient } from './client'
import { PHOTO_BUCKET, parsePhotos } from '../domain'
/** Bounded daily job. Never removes photos attached to completed requests. */
export async function cleanupTradeinUploads() {
  const sb = serviceClient()
  const {data,error} = await sb.from('tradein_upload_sessions').select('id,manifest').is('completed_code',null).lt('expires_at',new Date(Date.now()-3600000).toISOString()).order('expires_at').limit(30)
  if (error) return {ok:false,removed:0}
  let removed = 0
  for (const session of data ?? []) {
    const paths = parsePhotos(session.manifest).map(p => p.path)
    if (paths.length) { const result = await sb.storage.from(PHOTO_BUCKET).remove(paths); if (result.error) continue }
    const result = await sb.from('tradein_upload_sessions').delete().eq('id',session.id).is('completed_code',null)
    if (!result.error) removed++
  }
  const result = await sb.from('tradein_upload_sessions').delete().not('completed_code','is',null).lt('created_at',new Date(Date.now()-86400000).toISOString())
  return {ok:!result.error,removed}
}
