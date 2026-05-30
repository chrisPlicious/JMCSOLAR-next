import { getMunicipalityLocations } from '@/data/locations';

export function buildAreaServedArray() {
  return getMunicipalityLocations().map((l) => ({
    '@type': 'City',
    name: l.name,
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: l.province,
      containedInPlace: {
        '@type': 'Country',
        name: 'Philippines',
      },
    },
  }));
}
