
export const FORMATS = {
    'geojson': 'text/json',
    'gml': 'application/gml+xml',
    'wkt': 'text/plain'
} as const;
export const MODES = ['bbox', 'centroid', 'full'] as const;

export type GeoFormat = keyof typeof FORMATS;
export type ConversionMode = typeof MODES[number];