import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });

export const metadata: Metadata = { title: 'La Casa Properties', description: 'Find a place that feels like yours.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${bricolage.variable} ${instrument.variable}`}>{children}</body></html>;
}
