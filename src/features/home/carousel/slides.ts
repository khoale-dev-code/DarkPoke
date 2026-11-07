export interface HeroSlide {
  id: string
  /** 1920 × 784 artwork for tablet and desktop. */
  src: string
  /** Tiny pre-blurred copy that fills the strip under the transparent header. */
  backdrop: string
  /** Portrait artwork designed for phones, with its own blurred backdrop. */
  mobile: { src: string; width: number; height: number; backdrop: string }
  name: string
  alt: string
  href: string
  action: string
}

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'celebration-30th',
    src: '/home-v14/celebration-30th.webp',
    backdrop: 'data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAABQBgCdASowABQAPtFapU2oJSOiMBVYAQAaCWIArkwYAH4gVVfLp3jZlcz8cSo2VopPsOjHU3bX6Bb6sAD+XVxeNFXbffmw9RBGiYwb518V2OinOhRB4QAQcRwyq45UcX0VEJFmc3f3jf3oj2eCWFFYtRfTkgN9iP9zKKwGl9M9jhKtGJTRtKXyZnf6wmMMEXuouAPfAAA=',
    mobile: { src: '/home-v14/celebration-30th-portrait.webp', width: 1103, height: 1426, backdrop: 'data:image/webp;base64,UklGRq4AAABXRUJQVlA4IKIAAADQBQCdASoUABoAPs1OokunpCMht/VYAPAZiWgAnTKDI2weEsGBPX0wemlNHiqMzHEPEv589WeAAOHwSsg4EwU46PtIs89CRBYbR/akF9ECnM/MFS6BYN074BzPWvai3e8iNzie2BH3LPfy1ZvjSwlD2klId7ShD6/kpcgfWoBFjh2sVsHsRmARE0o5hwrTayUynPGdWbuFeVe/XrJHFpgAAAA=' },
    name: '30th Celebration · Elite Trainer Box',
    alt: 'Pokémon TCG 30th Celebration Elite Trainer Box: 9 gói booster, thẻ promo foil Nidorina, sách Player’s Guide và phụ kiện thi đấu',
    href: '/san-pham?q=30th%20Celebration',
    action: 'Xem sản phẩm 30th Celebration'
  },
  {
    id: 'perfect-order',
    src: '/home-v14/perfect-order.webp',
    backdrop: 'data:image/webp;base64,UklGRpoAAABXRUJQVlA4II4AAADQBQCdASowABQAPtFeqk6oJSQiJWsxABoJQBbdKIDfkHKLfgxIxJzeREdf2oB5miv8eG++vlfAAP7Nv/XChW/a2UT22grTp4UtcFvu0QBrAXjGxD2oTVt57s3V2pAdBz2E1kdCEJuZdNObKWRSp55tkKoNrL6EEnRDTXZR71TelolaJNfVokNN0EalyAAA',
    mobile: { src: '/home-v14/perfect-order-portrait.webp', width: 1024, height: 1536, backdrop: 'data:image/webp;base64,UklGRqwAAABXRUJQVlA4IKAAAACwBACdASoUAB4APslYpEunpaOhsBgMAPAZCWgAnTKAAZjpIcPYDNuQ2ONygXcYAP7Bx/t7+gbniZ96exeUjPYg+/ZJV/JX0iH5V7D4JLN3cBsJ32livOp+Y6IUGhMjozrzwCpEAyAChSL0pj+BfHMZkJ1/XWcXIFODzcpp5UxNc8C2de5w9OtkDdxSGlG7iN3P8sjHjeSMgqsF32t+XgAA' },
    name: 'Mega Evolution · Perfect Order Elite Trainer Box',
    alt: 'Pokémon TCG Mega Evolution Perfect Order Elite Trainer Box: 9 gói booster, thẻ promo foil Tyrunt, hướng dẫn và phụ kiện thi đấu',
    href: '/san-pham?q=Perfect%20Order',
    action: 'Xem sản phẩm Perfect Order'
  },
  {
    id: 'op18-dominance-of-god',
    src: '/home-v14/op18-dominance-of-god.webp',
    backdrop: 'data:image/webp;base64,UklGRroAAABXRUJQVlA4IK4AAABwBgCdASowABQAPt1apE2opSOiOrZoARAbiWMAxNhRlHj3n+M7xo+pONEomJXQR6gWd4tmm/vOybZm1AAA/u3CfbF+z23+G1ticPl1C5JDfxrK3CbXo5HFJ2BLhv2y2HP8JY7fzY5REpficIzOS1mUBNuBzI2sC+YbP0xNkTMS/I2uqdMFIynwpTD+TKE9J2XH6RUfVQTs1npvyN/Zd+QTAri0OPRDx3uWqWO5AAA=',
    mobile: { src: '/home-v14/op18-dominance-of-god-portrait.webp', width: 1024, height: 1536, backdrop: 'data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAAAwBQCdASoUAB4APu1kqE2ppaOiMAgBMB2JQBhQDSvsvtISUrg0ZCdvaLToBV++s/75AAD++jPtq0uwTVKY8IhGtandhHSqesIPI9bWDjWrkULYWDZf2hs8KG3+APJxgt58hRsrFj6PkN5oRbrXNjqi57zwtc3VgKoTstAA' },
    name: 'One Piece OP-18 · The Dominance of God',
    alt: 'One Piece Card Game OP-18 The Dominance of God: booster pack thứ 18 về Water Seven và Holy Knights of God, phát hành 20/11/2026',
    href: '/pre-order',
    action: 'Đặt trước One Piece OP-18 The Dominance of God'
  },
  {
    id: 'treasure-cup-2026',
    src: '/home-v14/treasure-cup-2026.webp',
    backdrop: 'data:image/webp;base64,UklGRugAAABXRUJQVlA4INwAAABwBwCdASowABQAPu1qrE+ppiQiMBVYATAdiWgAnTKEhFSA7O4vAJcXjLmoZUt1uaUpzuFTRKbtRs6fYKnbBa+SiZAIAAD+8NOYsSmfEUlojSY/JqiZvQn/Wsz08ljyzvtpnU7J6NFbFn2RiTO1KsbZe3eK78K0kNdqp5f9OV36+qngWFHmtBZD28zZ6bS1Oaaewr5RRAmYEx6e33NGemVe1TTrDSl86Mpxl7uBQesxLoHpbNbAvvLFgEcOzP08i619f3BZDrBGcP4ad0mvibSJdH0Ue5OUpoz+J8AA',
    mobile: { src: '/home-v14/treasure-cup-2026-portrait.webp', width: 1024, height: 1536, backdrop: 'data:image/webp;base64,UklGRqoAAABXRUJQVlA4IJ4AAADQBQCdASoUAB4APtFWok2oJSMiN+gBABoJZgCdMoR2f0eE25HeW+gHYkcb9HAXbAf9L1gR2HCAAP7xEkaTQ9hb9dM8xhh3+qJ5bF2G51s29tEUjvZG76UQHshfqKimXfc/3x5nozD9JZBPRI4LE65feXd4Iq/HdgHoGgnrXV61Piybmi/XmYtEWGjOa0xeJ+IFtpdJzymOsi5m4yQAAA==' },
    name: 'One Piece Store Treasure Cup · Tháng 12/2026',
    alt: 'One Piece Card Game Store Treasure Cup tháng 12 năm 2026',
    href: '/san-pham?q=One%20Piece',
    action: 'Xem sản phẩm One Piece Card Game'
  }
]

export const HERO_INTERVAL = 6000
