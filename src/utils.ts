/**
 * Cost in paise for a user to join a lobby with the given pay-per-head (rupees).
 * Mirrors the payout split: boss fee (200) + organizer fee (pay_per_head) + a
 * 25% platform markup, plus GST on the platform fee (PLATFORM_TAX_RATE).
 */
export function lobbyCostPaise(payPerHead: number): number {
  const taxRate = parseFloat(process.env.PLATFORM_TAX_RATE || "0");
  const costRupees = payPerHead * 1.25 + 200 + taxRate * payPerHead * 0.25;
  return Math.round(costRupees * 100);
}

export function calculateAge(dob: string) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthday) age--;
  return age;
}