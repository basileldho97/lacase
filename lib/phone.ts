import { z } from 'zod';

export function normalizeIndianPhone(value: string): string | null {
  let digits = value.replace(/[\s-]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export const indianPhoneSchema = z.string().transform(normalizeIndianPhone).refine((value): value is string => Boolean(value), 'Enter a valid 10-digit mobile number.');
