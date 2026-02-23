const formatter = Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
})
export function formatIdr(value: number) {
  return formatter.format(value)
}
