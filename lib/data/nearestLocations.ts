import { LOCATIONS } from '@/data/locations';
import type { ServiceLocation } from '@/data/locations';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type WithCitySlug = { city_slug?: string | null };

export function itemsNearCity<T extends WithCitySlug>(
  items: T[],
  city: ServiceLocation,
  radiusKm = 80
): T[] {
  return items.filter((item) => {
    if (!item.city_slug) return false;
    const itemCity = LOCATIONS.find((l) => l.slug === item.city_slug);
    if (!itemCity) return false;
    return haversineKm(city.geo.lat, city.geo.lng, itemCity.geo.lat, itemCity.geo.lng) <= radiusKm;
  });
}
