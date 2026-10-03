export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');

  if (/^7\d{10}$/.test(digits) || /^375\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}
