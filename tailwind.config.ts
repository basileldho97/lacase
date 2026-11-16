import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { forest: '#06110C', charcoal: '#171717', crimson: '#A31C1B', mist: '#F2F0E7', muted: '#9A9E96' }, fontFamily: { display: ['var(--font-bricolage)'], sans: ['var(--font-instrument)'] } } }, plugins: [] };
export default config;
