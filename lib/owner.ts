import { z } from 'zod';

export const ownerNameSchema = z.string()
  .trim()
  .min(2, 'Enter your name (2 to 80 letters).')
  .max(80, 'Enter your name (2 to 80 letters).')
  .regex(/^[\p{L}][\p{L} .'-]*\p{L}$/u, 'Enter your name (2 to 80 letters).');
