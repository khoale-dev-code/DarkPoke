import raw from './catalog.json'
import type {
  AdminOrder, AttributeDef, Brand, Category, Collection, CustomerSummary, Product, ProductImage, ProductOption,
  ProductType, PublicOrder, ShopSettings, Staff, TradeinRequest, Variant
} from '@/lib/types'

export const demo = raw as unknown as {
  types: ProductType[]
  attributes: AttributeDef[]
  categories: Category[]
  brands: Brand[]
  collections: Collection[]
  products: Product[]
  variants: Variant[]
  images: ProductImage[]
  options: ProductOption[]
  product_collections: { product_id: string; collection_id: string }[]
}

export const DEFAULT_SETTINGS: ShopSettings = {
  shop: { name: 'Dark Poke', tagline: 'HUNT - TRADE - COLLECT', hotline: '[SỐ HOTLINE]', zalo: '[ZALO]', address: '[ĐỊA CHỈ CỬA HÀNG]', email: '[EMAIL]' },
  bank: { bank_bin: '970403', bank_name: '[NGÂN HÀNG]', account_no: '[SỐ TÀI KHOẢN]', account_name: '[CHỦ TÀI KHOẢN]', transfer_template: '{code} {name}' },
  shipping: { hcm: 30000, other: 40000, pickup: 0, free_over: null, pickup_hold_days: 3 },
  rules: {
    unpaid_cancel_hours: 24, preorder_deposit_pct: 30, preorder_balance_days: 3, cart_hold_minutes: 15,
    tradein_quote_hours: 48, tradein_approval_limit: 5000000, cashier_max_discount_pct: 5
  },
  modules: { preorder: true, tradein: true, cart_hold: true, pos: true, attribute_filters: true }
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
const hoursLater = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()

export const DEMO_ORDERS: (AdminOrder & { items: PublicOrder['items']; events: PublicOrder['events'] })[] = [
  {
    id: 'demo-o1', code: 'DP100118', access_token: 'demo', kind: 'order', channel: 'online', status: 'pending_payment', payment_method: 'bank_transfer',
    fulfillment: 'delivery', customer_name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@gmail.com', province: 'TP. Hồ Chí Minh',
    address: '[SỐ NHÀ, ĐƯỜNG, PHƯỜNG]', note: null, subtotal: 3350000, shipping_fee: 30000, discount: 0, total: 3380000, amount_due: 3380000,
    paid_amount: 0, proof_path: null, customer_confirmed_at: null, expires_at: hoursLater(23.9), created_at: hoursAgo(0.1),
    items: [
      { name: 'Elite Trainer Box Chaos Rising', variant_title: 'Mặc định', sku: 'PKM-ETB-CR-EN', image_url: '/art/etb1.svg', unit_price: 2700000, qty: 1, line_total: 2700000, is_preorder: false },
      { name: 'Luffy · OP-12 #001 · NM', variant_title: 'Mặc định', sku: 'SGL-0104', image_url: '/art/card1.svg', unit_price: 650000, qty: 1, line_total: 650000, is_preorder: false }
    ],
    events: [{ status: 'pending_payment', message: 'Khách đặt hàng', created_at: hoursAgo(0.1) }]
  },
  {
    id: 'demo-o2', code: 'DP100117', access_token: 'demo', kind: 'order', channel: 'online', status: 'paid', payment_method: 'bank_transfer',
    fulfillment: 'delivery', customer_name: 'Trần Minh K.', phone: '0901999567', email: 'minhk@gmail.com', province: 'Hà Nội', address: '1 Tràng Tiền',
    note: 'Gọi trước khi giao', subtotal: 5500000, shipping_fee: 40000, discount: 0, total: 5540000, amount_due: 5540000, paid_amount: 5540000,
    proof_path: null, customer_confirmed_at: hoursAgo(2), expires_at: null, created_at: hoursAgo(3),
    items: [{ name: 'Booster Box Chaos Rising', variant_title: 'Mặc định', sku: 'PKM-BB-CR-EN', image_url: '/art/box1.svg', unit_price: 5500000, qty: 1, line_total: 5500000, is_preorder: false }],
    events: [
      { status: 'pending_payment', message: 'Khách đặt hàng', created_at: hoursAgo(3) },
      { status: 'paid', message: 'Nhận chuyển khoản 5.540.000₫', created_at: hoursAgo(2) }
    ]
  },
  {
    id: 'demo-o3', code: 'DP100116', access_token: 'demo', kind: 'preorder', channel: 'online', status: 'pending_payment', payment_method: 'bank_transfer',
    fulfillment: 'pickup', customer_name: 'Lê Hoàng', phone: '0912345678', email: null, province: null, address: null, note: null,
    subtotal: 3900000, shipping_fee: 0, discount: 0, total: 3900000, amount_due: 1170000, paid_amount: 0, proof_path: null,
    customer_confirmed_at: null, expires_at: hoursLater(20), created_at: hoursAgo(4),
    items: [{ name: 'Booster Box OP-13 (Pre-order)', variant_title: 'Mặc định', sku: 'OP-BB-13-JP', image_url: '/art/box3.svg', unit_price: 1950000, qty: 2, line_total: 3900000, is_preorder: true }],
    events: [{ status: 'pending_payment', message: 'Khách đặt trước', created_at: hoursAgo(4) }]
  },
  {
    id: 'demo-o4', code: 'DP100115', access_token: 'demo', kind: 'order', channel: 'pos', status: 'completed', payment_method: 'cash',
    fulfillment: 'pickup', customer_name: 'Khách lẻ', phone: '-', email: null, province: null, address: null, note: null,
    subtotal: 950000, shipping_fee: 0, discount: 0, total: 950000, amount_due: 950000, paid_amount: 950000, proof_path: null,
    customer_confirmed_at: null, expires_at: null, created_at: hoursAgo(26),
    items: [{ name: 'Booster Pack Mega Dream ex JP', variant_title: 'Mặc định', sku: 'PKM-BP-MD-JP', image_url: '/art/pack1.svg', unit_price: 95000, qty: 10, line_total: 950000, is_preorder: false }],
    events: [{ status: 'completed', message: 'Bán tại quầy', created_at: hoursAgo(26) }]
  }
]

export const DEMO_TRADEINS: TradeinRequest[] = [
  {
    id: 'demo-t1', code: 'TM1002', customer_name: 'Phạm Quân', phone: '0933222111', email: null, method: 'store', payout: 'cash',
    items: [{ name: 'Charizard ex · Obsidian Flames #125', condition: 'NM', qty: 1, expected: 1500000 }, { name: 'Gengar · Mega Dream #112', condition: 'LP', qty: 2 }],
    note: 'Mang tới shop chiều thứ 7', status: 'new', quoted_total: null, quote_expires_at: null, staff_note: null, created_at: hoursAgo(5)
  },
  {
    id: 'demo-t2', code: 'TM1001', customer_name: 'Võ Thảo', phone: '0988777666', email: 'thao@gmail.com', method: 'ship', payout: 'credit',
    items: [{ name: 'Booster Box OP-10 còn seal', condition: 'Seal', qty: 1, expected: 1600000 }],
    note: null, status: 'quoted', quoted_total: 1450000, quote_expires_at: hoursLater(30), staff_note: 'Hộp móp nhẹ góc', created_at: hoursAgo(20)
  }
]

export const DEMO_STAFF: Staff[] = [
  { id: 'demo-s1', user_id: 'demo', email: 'owner@darkpoke.vn', full_name: 'Chủ shop (demo)', role: 'owner', allow_google: true, active: true, created_at: hoursAgo(500) },
  { id: 'demo-s2', user_id: null, email: 'quanly@darkpoke.vn', full_name: 'Quản lý cửa hàng', role: 'manager', allow_google: true, active: true, created_at: hoursAgo(300) },
  { id: 'demo-s3', user_id: null, email: 'thungan@darkpoke.vn', full_name: 'Thu ngân ca sáng', role: 'cashier', allow_google: false, active: true, created_at: hoursAgo(100) }
]

export const DEMO_CUSTOMERS: CustomerSummary[] = [
  { phone: '0901234567', customer_name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', has_account: true, order_count: 3, total_spent: 8920000, last_order_at: hoursAgo(0.1) },
  { phone: '0901999567', customer_name: 'Trần Minh K.', email: 'minhk@gmail.com', has_account: true, order_count: 1, total_spent: 5540000, last_order_at: hoursAgo(3) },
  { phone: '0912345678', customer_name: 'Lê Hoàng', email: null, has_account: false, order_count: 1, total_spent: 0, last_order_at: hoursAgo(4) }
]
