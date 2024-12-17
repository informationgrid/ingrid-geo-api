/**
 * ==================================================
 * Copyright (C) 2024 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or - as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 *
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * ==================================================
 */

export const FORMATS = {
    'geojson': ['application/json', 'application/geo+json'] as string[],
    'gml': ['application/xml', 'application/gml+xml'] as string[],
    'wkt': ['text/plain'] as string[]
} as const;

export const MODES = ['bbox', 'centroid', 'full'] as const;

export type GeoFormat = keyof typeof FORMATS;

export type ConversionMode = typeof MODES[number];

export const DEFAULT_CRS = 'WGS84';

export type ConversionSettings = {
    importCRS: string,
    exportFormat: GeoFormat,
    exportCRS: string,
    mode: ConversionMode
}

/**
 * https://www.datypic.com/sc/niem21/e-gml32_geometryMember.html
 */
export const GEOMETRY_TYPES = [
    'MultiGeometry', 
    'MultiPoint', 
    'MultiCurve', 
    'MultiSurface', 
    'MultiSolid', 
    'Point', 
    'LineString', 
    'CompositeCurve', 
    'Curve', 
    'OrientableCurve', 
    'Polygon', 
    'CompositeSurface', 
    'Surface', 
    'PolyhedralSurface', 
    'TriangulatedSurface', 
    'Tin', 
    'OrientableSurface', 
    'CompositeSolid', 
    'Solid', 
    'GeometricComplex', 
    'Grid', 
    'RectifiedGrid', 
];
