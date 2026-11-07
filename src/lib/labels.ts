import type { OrderStatus, StaffRole, TradeinStatus } from './types'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'warn' | 'ok' | 'brand' | 'neu' | 'bad' }> = {
  pending_payment: { label: 'Chờ thanh toán', tone: 'warn' },
  paid: { label: 'Đã thanh toán', tone: 'brand' },
  packing: { label: 'Đang đóng gói', tone: 'warn' },
  shipping: { label: 'Đang giao', tone: 'brand' },
  ready_pickup: { label: 'Chờ nhận tại shop', tone: 'brand' },
  completed: { label: 'Hoàn tất', tone: 'ok' },
  cancelled: { label: 'Đã hủy', tone: 'bad' }
}

export const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }[]>> = {
  pending_payment: [{ to: 'paid', label: 'Xác nhận đã nhận tiền' }],
  paid: [{ to: 'packing', label: 'Bắt đầu đóng gói' }],
  packing: [
    { to: 'shipping', label: 'Giao cho đơn vị vận chuyển' },
    { to: 'ready_pickup', label: 'Báo khách đến nhận' }
  ],
  shipping: [{ to: 'completed', label: 'Đã giao thành công' }],
  ready_pickup: [{ to: 'completed', label: 'Khách đã nhận' }]
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: 'Chủ shop',
  manager: 'Quản lý',
  cashier: 'Thu ngân',
  staff: 'Nhân viên kho'
}

export const TRADEIN_STATUS: Record<TradeinStatus, { label: string; tone: 'warn' | 'ok' | 'brand' | 'neu' | 'bad' }> = {
  new: { label: 'Chờ báo giá', tone: 'warn' },
  quoted: { label: 'Đã báo giá', tone: 'brand' },
  accepted: { label: 'Khách đồng ý', tone: 'brand' },
  received: { label: 'Đã nhận hàng', tone: 'brand' },
  paid: { label: 'Đã thanh toán', tone: 'ok' },
  rejected: { label: 'Từ chối', tone: 'bad' },
  expired: { label: 'Hết hạn báo giá', tone: 'neu' }
}

export const PROVINCES = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế',
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai',
  'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình',
  'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa',
  'Tuyên Quang', 'Vĩnh Long'
]

const DB_ERRORS: Record<string, string> = {
  EMPTY_CART: 'Giỏ hàng đang trống.',
  TOO_MANY_ITEMS: 'Giỏ hàng có quá nhiều sản phẩm.',
  BAD_NAME: 'Vui lòng nhập họ tên.',
  BAD_PHONE: 'Số điện thoại chưa đúng, ví dụ 0901234567.',
  BAD_ADDRESS: 'Vui lòng nhập đủ địa chỉ và tỉnh, thành phố.',
  BAD_QTY: 'Số lượng không hợp lệ.',
  UNAVAILABLE: 'Có sản phẩm đã ngừng bán, vui lòng kiểm tra lại giỏ hàng.',
  MIXED_PREORDER: 'Hàng pre-order cần đặt riêng, không gộp chung với hàng có sẵn.',
  DISCOUNT_NEEDS_MANAGER: 'Mức giảm vượt hạn mức thu ngân, cần quản lý duyệt.',
  BAD_DISCOUNT: 'Mức giảm không hợp lệ.',
  FORBIDDEN: 'Tài khoản không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  ORDER_CANCELLED: 'Đơn đã hủy, không đổi trạng thái được.',
  CATEGORY_TOO_DEEP: 'Danh mục chỉ lồng tối đa 3 cấp.',
  CATEGORY_CYCLE: 'Danh mục cha không hợp lệ.',
  BAD_TYPE: 'Vui lòng chọn loại sản phẩm.',
  MODULE_OFF: 'Tính năng này đang tạm tắt.',
  EMPTY_ITEMS: 'Vui lòng thêm ít nhất một món.'
}

/** Đổi lỗi từ Postgres/PostgREST sang câu tiếng Việt dễ hiểu. */
export function dbError(err: { message?: string; code?: string } | null | undefined): string {
  const msg = err?.message ?? ''
  const [key, detail] = msg.split(':')
  if (key === 'OUT_OF_STOCK') return `${detail?.trim() || 'Sản phẩm'} không đủ hàng.`
  if (key === 'OVER_LIMIT') return `${detail?.trim() || 'Sản phẩm'} vượt giới hạn mua mỗi đơn.`
  if (key === 'PREORDER_CLOSED') return `${detail?.trim() || 'Sản phẩm'} đã đóng đặt trước.`
  if (key && DB_ERRORS[key]) return DB_ERRORS[key]
  if (err?.code === '23505') return 'Giá trị bị trùng (SKU, đường dẫn hoặc email đã tồn tại).'
  if (err?.code === '23503') return 'Đang có dữ liệu khác dùng mục này nên chưa xóa được.'
  if (err?.code === '42501') return 'Tài khoản không có quyền thực hiện thao tác này.'
  return 'Có lỗi xảy ra, vui lòng thử lại.'
}
