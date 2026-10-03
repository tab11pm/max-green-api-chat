export function formatTime(timestamp?: number): string {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return '--:--'
  const date = new Date(timestamp * 1000)
  if (Number.isNaN(date.getTime())) return '--:--'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
