/** Price helpers for the trade-in form: 1000000 ↔ "1.000.000" and the amount in Vietnamese words. */
export const digitsOnly = (value: string) => value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
export const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const DIGITS: readonly string[] = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const UNITS: readonly string[] = ['', ' nghìn', ' triệu', ' tỷ']

const digit = (n: number) => DIGITS[n] ?? ''

function readTriple(n: number, full: boolean): string {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10
  const parts: string[] = []
  if (h || full) parts.push(`${digit(h)} trăm`)
  if (t === 0) { if (u && (h || full)) parts.push('linh') }
  else if (t === 1) parts.push('mười')
  else parts.push(`${digit(t)} mươi`)
  if (u) parts.push(u === 1 && t > 1 ? 'mốt' : u === 5 && t > 0 ? 'lăm' : u === 4 && t > 1 ? 'tư' : digit(u))
  return parts.join(' ')
}

/** "1000000" → "Một triệu đồng". Empty for empty or zero input. */
export function amountInWords(digits: string): string {
  const value = digits.replace(/\D/g, '').replace(/^0+/, '')
  if (!value) return ''
  const groups: number[] = []
  for (let end = value.length; end > 0; end -= 3) groups.unshift(Number(value.slice(Math.max(0, end - 3), end)))
  const words: string[] = []
  groups.forEach((g, i) => {
    const unit = UNITS[groups.length - 1 - i] ?? ''
    if (!g) return
    words.push(readTriple(g, words.length > 0) + unit)
  })
  const text = words.join(' ').replace(/\s+/g, ' ').trim()
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng` : ''
}
