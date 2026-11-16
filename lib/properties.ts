import { createClient } from './supabase/server';
import type { Property } from './types';
export type PropertyFilters = { q?: string; location?: string; type?: string; minSqft?: number; maxSqft?: number; maxRent?: number; floor?: string; furnishing?: string; minMezz?: number };
export const PROPERTY_COLUMNS = 'id,user_id,title,type,location,area_sqft,rent,floor,furnishing,mezzanine_height,keywords,photo_paths,owner_name,phone,created_at,updated_at';
function escapeLike(value: string) { return value.replace(/[\\%_]/g, '\\$&'); }
export async function signPropertyPhotos(supabase: Awaited<ReturnType<typeof createClient>>, properties: Property[]) {
  const paths = properties.flatMap(p => p.photo_paths || []); if (!paths.length) return properties;
  const { data } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || 'property').createSignedUrls(paths, 3600);
  const urls = new Map((data || []).map((item, index) => [paths[index], item.signedUrl]).filter(([, url]) => Boolean(url)) as [string, string][]);
  return properties.map(property => ({ ...property, photo_urls: property.photo_paths.map(path => urls.get(path)).filter(Boolean) as string[], photo_url: urls.get(property.photo_paths[0]) }));
}
export async function queryMyProperties(filters: PropertyFilters = {}) {
  const supabase = await createClient(); let query = supabase.from('properties').select(PROPERTY_COLUMNS).order('created_at', { ascending: false });
  if (filters.location) query = query.eq('location', filters.location); if (filters.type) query = query.eq('type', filters.type); if (filters.minSqft !== undefined) query = query.gte('area_sqft', filters.minSqft); if (filters.maxSqft !== undefined) query = query.lte('area_sqft', filters.maxSqft); if (filters.maxRent !== undefined) query = query.lte('rent', filters.maxRent); if (filters.floor) query = query.eq('floor', filters.floor); if (filters.furnishing) query = query.eq('furnishing', filters.furnishing); if (filters.minMezz !== undefined) query = query.gte('mezzanine_height', filters.minMezz);
  for (const word of (filters.q || '').trim().split(/\s+/).filter(Boolean)) query = query.ilike('search_text', `%${escapeLike(word)}%`);
  const { data, error } = await query; if (error) return { properties: [], locations: [], types: [], error: error.message }; const properties = (data || []) as Property[]; const signed = await signPropertyPhotos(supabase, properties);
  return { properties: signed, locations: [...new Set(properties.map(p => p.location))].sort(), types: [...new Set(properties.map(p => p.type))].sort() };
}
export async function getMyProperty(id: string) { const supabase = await createClient(); const { data, error } = await supabase.from('properties').select(PROPERTY_COLUMNS).eq('id', id).maybeSingle(); if (error || !data) return undefined; const [property] = await signPropertyPhotos(supabase, [data as Property]); return property; }
