import type { Metadata } from 'next'
import { CartView } from '@/components/shop/cart-view'
import { CheckoutSteps } from '@/components/shop/checkout-steps'
export const metadata:Metadata={title:'Giỏ hàng',robots:{index:false}}
export default function CartPage(){return <div className="shop-container shop-page"><CheckoutSteps step={1}/><div className="shop-page-header"><span className="shop-eyebrow">Bộ sưu tập đang chờ bạn</span><h1 className="h-page">Giỏ hàng của bạn</h1><p className="shop-page-description">Kiểm tra sản phẩm và số lượng trước khi tiếp tục đặt hàng.</p></div><CartView/></div>}
