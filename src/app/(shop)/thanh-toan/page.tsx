import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/shop/checkout-form'
import { CheckoutSteps } from '@/components/shop/checkout-steps'
import { getSettings } from '@/lib/catalog'
import { getCurrentUser } from '@/lib/auth'
export const metadata:Metadata={title:'Đặt hàng',robots:{index:false}}
export default async function CheckoutPage(){const [settings,user]=await Promise.all([getSettings(),getCurrentUser()]);return <div className="shop-container shop-page"><CheckoutSteps step={2}/><div className="shop-page-header"><span className="shop-eyebrow">Sắp tới tay bạn</span><h1 className="h-page">Hoàn tất thông tin đặt hàng</h1><p className="shop-page-description">Cho Dark Poke biết nơi bạn muốn nhận những món yêu thích.</p></div><CheckoutForm settings={{shipping:settings.shipping,rules:settings.rules}} defaults={{name:'',email:user?.email??''}}/></div>}
