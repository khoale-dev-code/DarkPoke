export interface HeaderLink { href: string; label: string }

export function currentHeaderHref(pathname: string, params: Pick<URLSearchParams, 'get'>, links: HeaderLink[]) {
  if (pathname === '/san-pham') {
    const type = params.get('type')
    const href = type ? `/san-pham?type=${encodeURIComponent(type)}` : '/san-pham'
    return links.some(link => link.href === href) ? href : null
  }
  if (pathname.startsWith('/san-pham/') || pathname.startsWith('/danh-muc/')) return '/san-pham'
  if (pathname === '/thu-vien-the' || pathname.startsWith('/thu-vien-the/')) return '/thu-vien-the'
  return links.find(link => link.href === pathname)?.href ?? null
}
