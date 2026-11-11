/** "+995 596 56-99-99" / "596569999" / "0596569999" -> "995596569999". Returns '' when it cannot be a phone number. */
export function normalizePhone(input: string): string {
  let d = String(input || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 9) d = '995' + d;
  return d.length >= 11 && d.length <= 15 ? d : '';
}
