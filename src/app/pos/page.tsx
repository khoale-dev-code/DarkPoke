import { PosScreen } from '@/components/admin/pos'
import { getStaff } from '@/lib/auth'
import { getSettings } from '@/lib/catalog'

export default async function PosPage() {
  const [staff, settings] = await Promise.all([getStaff(), getSettings()])
  return <PosScreen cashier={staff?.full_name || staff?.email || ''} role={staff?.role ?? 'cashier'} maxDiscountPct={settings.rules.cashier_max_discount_pct} shopName={settings.shop.name} bank={settings.bank} />
}
