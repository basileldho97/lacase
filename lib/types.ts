export type Role = 'admin' | 'user';
export type Profile = { id: string; email: string; full_name: string | null; role: Role; created_at: string };
export type Property = {
  id: string; user_id: string; title: string; type: 'Flat'|'House'|'Shop'|'Warehouse'|'Godown'; location: string;
  area_sqft: number; rent: number; floor: string; furnishing: string; mezzanine_height: number | null;
  keywords: string[]; photo_paths: string[]; owner_name: string; phone: string; search_text?: string | null;
  created_at: string; updated_at: string; photo_urls?: string[]; photo_url?: string;
};
