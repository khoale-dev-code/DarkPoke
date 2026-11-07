import { z } from 'zod'
const text = (n:number) => z.string().trim().max(n,'Nội dung quá dài')
const money = z.number('Vui lòng nhập số hợp lệ').int().min(0,'Giá trị phải từ 0 trở lên').max(1_000_000_000_000)
const pct = z.number('Vui lòng nhập phần trăm').int().min(0).max(100,'Tối đa 100%')
export const settingSchemas = {
  shop:z.object({name:text(100).min(2,'Tên cửa hàng cần ít nhất 2 ký tự'),tagline:text(200),hotline:text(30),zalo:text(100),email:text(160),address:text(500)}),
  bank:z.object({bank_bin:z.string().regex(/^\d{6}$/,'Mã BIN gồm 6 chữ số'),bank_name:text(100).min(2,'Nhập tên ngân hàng'),account_no:z.string().regex(/^[A-Za-z0-9]{4,40}$/,'Số tài khoản gồm 4–40 chữ hoặc số'),account_name:text(160).min(2,'Nhập tên chủ tài khoản'),transfer_template:text(100).min(1)}),
  shipping:z.object({hcm:money,other:money,pickup:money,free_over:money.nullable(),pickup_hold_days:z.number().int().min(1).max(365)}),
  rules:z.object({unpaid_cancel_hours:z.number().int().min(1).max(720),preorder_deposit_pct:pct.min(1),preorder_balance_days:z.number().int().min(1).max(365),cart_hold_minutes:z.number().int().min(1).max(1440),tradein_quote_hours:z.number().int().min(1).max(720),tradein_approval_limit:money,cashier_max_discount_pct:pct}),
  modules:z.object({preorder:z.boolean(),tradein:z.boolean(),cart_hold:z.boolean(),pos:z.boolean(),attribute_filters:z.boolean()})
} as const
