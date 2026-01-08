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

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanClockwise from '@turf/boolean-clockwise';
import centroid from '@turf/centroid';
import rewind from '@turf/rewind';
import deepEqual from 'deep-equal';
import { GeoJSON, Geometry, GeometryCollection, LineString, MultiPolygon, Point, Polygon, Position } from 'geojson';
import proj4 from 'proj4';
import * as xpath from 'xpath';
import { HttpBadRequestError } from '../../../../../utils/utils.js';
import { DEFAULT_CRS } from '../GeoConverter.js';
import proj4jsMappings from './proj4.json' with { type: 'json' };
import { OrientationStrategy } from '../types.js';
import logger from '../../../../../utils/logger.js';

// load proj4js named projections
proj4.defs(Object.entries(proj4jsMappings));

function transformer(crs: string = 'WGS84'): (x: number, y: number) => number[] {
    // shortcut: don't transform if inputCRS = outputCRS!
    if (crs == 'WGS84') {
        return (x: number, y: number) => [x, y];
    }
    return (x: number, y: number) => proj4(crs, 'WGS84').forward([x, y]);
}

function isClockwise(geojson: LineString | Polygon | MultiPolygon): boolean {
    logger.info('Checking if GeoJSON ring is clockwise: ' + JSON.stringify(geojson));
    const isExteriorClockwise = (polygon) => {
        let exteriorDirection = booleanClockwise(polygon[0]);
        // interior rings must be clockwise, i.e. run opposite the exterior (first) linear ring
        // TODO introduce parameter to automatically fix wrong directions
        if (polygon.slice(1).some(coords => booleanClockwise(coords) == exteriorDirection)) {
            throw new Error('Interior linear rings must run in the opposite direction of the exterior ring');
        }
        return exteriorDirection;
    };

    if (geojson.type == 'Polygon') {
        return isExteriorClockwise(geojson.coordinates);
    }
    else if (geojson.type == 'MultiPolygon') {
        let exteriorsAreClockwise = isExteriorClockwise(geojson.coordinates?.[0]);
        if (geojson.coordinates.slice(1).some(polygon => isExteriorClockwise(polygon) != exteriorsAreClockwise)) {
            throw new Error('Polygons in a MultiPolygon must all adhere to the same direction (counter-clockwise)');
        }
        return exteriorsAreClockwise;
    }
    else {
        return booleanClockwise(geojson);
    }
}

function ensureCounterClockwise(geojson: LineString | Polygon | MultiPolygon, orientationStrategy: OrientationStrategy): Geometry {
    try {
        if (isClockwise(geojson)) {
            switch (orientationStrategy) {
                case 'fix':
                    logger.info('Fixing GeoJSON ring orientation to be counter-clockwise');
                    return rewind(geojson) as Geometry;
                case 'warn':
                    logger.warn('GeoJSON ring orientation is clockwise - ignoring incorrect orientation');
                    return geojson;
                case 'error':
                    throw new Error('GeoJSON ring orientation is clockwise');
            }
        }
        else {
            return geojson;
        }
    }
    catch (e) {
        switch (orientationStrategy) {
            case 'fix':
                // TODO fix inconsistent ring orientations
                logger.error(e);
                logger.warn('GeoJSON ring orientation is inconsistent, but fix is not yet implemented - ignoring incorrect orientation');
                return geojson;
            case 'warn':
                logger.error(e);
                logger.warn('GeoJSON ring orientation is inconsistent, ignoring incorrect orientation');
                return geojson;
            case 'error':
                throw e;
            default:
                logger.warn(`Unknown orientationStrategy "${orientationStrategy}", ignoring incorrect orientation`);
                return geojson;
        }
    }
}

export function getBbox(geojson: GeoJSON): Point | Polygon {
    if (!geojson) {
        return undefined;
    }
    if (geojson.type == 'Point') {
        return geojson;
    }
    return bboxPolygon(bbox(geojson))?.geometry;
}

export function getCentroid(geojson: GeoJSON): Point {
    if (!geojson) {
        return undefined;
    }
    let modifiedSpatial = { ...geojson };
    // turf/centroid does not support envelope, so we turn it into a linestring which has the same centroid
    if (modifiedSpatial.type?.toLowerCase() == 'envelope') {
        modifiedSpatial.type = 'LineString';
    }
    if (modifiedSpatial.type == 'GeometryCollection') {
        (modifiedSpatial as GeometryCollection).geometries
            .filter((geometry: GeoJSON | Envelope) => geometry.type.toLowerCase() == 'envelope')
            .forEach((geometry: GeoJSON | Envelope) => geometry.type = 'LineString');
    }
    return centroid(modifiedSpatial)?.geometry;
}

/**
 * Project a GeoJSON from a given reference system to another.
 * 
 * For origin and licensing information, see NOTES.md
 * 
 * @param geojson geometry to project from one CRS to another
 * @param importCRS input reference system
 * @param exportCRS output reference system
 * @returns a reprojection of the original geometry
 */
export function project(geojson: GeoJSON, importCRS: string, exportCRS: string): GeoJSON {

    if (importCRS != DEFAULT_CRS && !(importCRS in proj4jsMappings)) {
        throw new HttpBadRequestError(`importCRS "${importCRS}" is not supported`);
    }
    if (exportCRS != DEFAULT_CRS && !(exportCRS.replace('EPSG:', '') in proj4jsMappings)) {
        throw new HttpBadRequestError(`exportCRS "${exportCRS}" is not supported`);
    }

    exportCRS = exportCRS.replace('EPSG:', '');

    const reproject = (coords: number[]) => proj4(importCRS, exportCRS).forward(coords);

    const reprojectLine = (coords, options) => {
        let densify =
            typeof options === "object" && typeof options.densify === "number"
            ? options.densify
            : 0;
        const strategy =
            typeof options === "object" && typeof options.strategy === "string"
            ? options.strategy
            : "auto";
        
        // just in case densify isn't a round number
        densify = Math.round(densify);
        
        // algorithm
        // drop point when the slope changes (and at the end)
        const out = [];
        
        let [xprev, yprev] = reproject(coords[0]);
        let mprev = null;
        let m = null;
        
        for (let i = 1; i < coords.length; i++) {
            const [x1, y1] = coords[i - 1];
            const [x2, y2] = coords[i];
        
            const xdist = x2 - x1;
            const ydist = y2 - y1;
        
            const xstep = xdist / (densify + 1);
            const ystep = ydist / (densify + 1);
        
            for (let ii = 1; ii <= densify; ii++) {
                const [rx, ry] = reproject([x1 + ii * xstep, y1 + ii * ystep]);
                m = (ry - yprev) / (rx - xprev);
            
                if (strategy === "always" || m !== mprev) {
                    out.push([xprev, yprev]);
                    mprev = m;
                }
                xprev = rx;
                yprev = ry;
            }

            // try with last coord in segment
            const [rx2, ry2] = reproject([x2, y2]);
            m = (ry2 - yprev) / (rx2 - xprev);

            // if slope changes, drop point
            if (strategy === "always" || m !== mprev) {
                out.push([xprev, yprev]);
                mprev = m;
            }

            xprev = rx2;
            yprev = ry2;
        }

        // drop last point
        out.push([xprev, yprev]);

        return out;
    };

    const reprojectGeoJSONPluggable = (geojson: GeoJSON, { densify }) => {
        if (geojson.type === "FeatureCollection") {
            return {
                ...geojson,
                features: geojson.features.map(feature => reprojectGeoJSONPluggable(feature, { densify }))
            };
        } else if (geojson.type === "Feature") {
            return {
                ...geojson,
                geometry: reprojectGeoJSONPluggable(geojson.geometry, { densify })
            };
        } else if (geojson.type === "GeometryCollection") {
            return {
                ...geojson,
                geometries: geojson.geometries.map(geometry => reprojectGeoJSONPluggable(geometry, { densify }))
            };
        } else if (geojson.type === "LineString") {
            return {
                ...geojson,
                coordinates: reprojectLine(geojson.coordinates, { densify })
            };
        } else if (geojson.type === "MultiLineString") {
            return {
                ...geojson,
                coordinates: geojson.coordinates.map(line => reprojectLine(line, { densify }))
            };
        } else if (geojson.type === "MultiPoint") {
            return {
                ...geojson,
                coordinates: geojson.coordinates.map(point => reproject(point))
            };
        } else if (geojson.type === "MultiPolygon") {
            return {
                ...geojson,
                coordinates: geojson.coordinates.map(polygon => {
                    return polygon.map(ring => reprojectLine(ring, { densify }));
                })
            };
        } else if (geojson.type === "Point") {
            return {
                ...geojson,
                coordinates: reproject(geojson.coordinates)
            };
        } else if (geojson.type === "Polygon") {
            return {
                ...geojson,
                coordinates: geojson.coordinates.map(ring => reprojectLine(ring, { densify }))
            };
        }
        return geojson;
    };

    return reprojectGeoJSONPluggable(geojson, { densify: null });
}

/**
 * Parse a GML snippet into a GeoJSON object.
 * 
 * For origin and licensing information, see NOTES.md
 * 
 * @param _ the XML DOM node to parse
 * @param opts 
 * @param nsMap prefix-to-uri map of namespaces used in the original snippet
 * @returns 
 */
export function parseGml(_: Node, nsMap: { [ name: string ]: string; }, opts: ParseOptions = { stride: 2 }): Geometry {
    if (_ == null) {
        return null;
    }

    const select = xpath.useNamespaces(nsMap) as XPathElementSelect;

    const parseCoords = (s: string, opts: ParseOptions = { stride: 2 }, ctx: Context = { srsDimension: undefined }) => {
        const stride = ctx.srsDimension || opts.stride || 2;
        const transformCoords = transformer(opts.crs);

        const coords = s.replace(/\s+/g, ' ').trim().split(' ');
        if (coords.length === 0 || (coords.length % stride) !== 0) {
            throw new Error(`invalid coordinates list (stride ${stride})`);
        }

        const points: number[][] = [];
        for (let i = 0; i < (coords.length - 1); i += stride) {
            const point = coords.slice(i, i + stride).map(parseFloat);
            points.push(transformCoords(...point as [number, number]));
            // points.push(transformCoords.apply(point));
        }

        return points;
    };

    const findIn = (root: Node, ...tags: string[]) => {
        return select(`.//${tags.join('/')}`, root, true);
    };

    const createChildContext = (_: Node, opts: ParseOptions, ctx: Context) => {
        const srsDimensionAttribute = (_ as Element).getAttribute('srsDimension');

        if (srsDimensionAttribute) {
            const srsDimension = parseInt(srsDimensionAttribute);
            if (Number.isNaN(srsDimension) || srsDimension <= 0) {
                throw new Error(`invalid srsDimension attribute value "${srsDimensionAttribute}", expected a positive integer`);
            }

            const childCtx = Object.create(ctx);
            childCtx.srsDimension = srsDimension;
            return childCtx;
        }

        return ctx;
    };

    const parsePosList = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const childCtx = createChildContext(_, opts, ctx);

        const coords = _.textContent;
        if (!coords) {
            throw new Error('invalid gml:posList element');
        }

        return parseCoords(coords, opts, childCtx);
    };

    const parsePos = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const childCtx = createChildContext(_, opts, ctx);

        const coords = _.textContent;
        if (!coords) {
            throw new Error('invalid gml:pos element');
        }

        const points = parseCoords(coords, opts, childCtx);
        if (points.length !== 1) {
            throw new Error('gml:pos must have 1 point');
        }
        return points[0];
    };

    const parsePoint = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const childCtx = createChildContext(_, opts, ctx);

        // TODO AV: Parse other gml:Point options
        const pos = findIn(_, 'gml:pos');
        if (!pos) {
            throw new Error('invalid gml:Point element, expected a gml:pos subelement');
        }
        return parsePos(pos, opts, childCtx);
    };

    const parseLinearRingOrLineString = (_: Node, opts: ParseOptions, ctx: Context = {}) => { // or a LineStringSegment
        const childCtx = createChildContext(_, opts, ctx);

        let points: number[][] = [];

        const posList = findIn(_, 'gml:posList');
        if (posList) {
            points = parsePosList(posList, opts, childCtx);
        }
        else {
            Object.values(select('.//gml:Point', _)).forEach(c => {
                points.push(parsePoint(c, opts, childCtx));
            });
            Object.values(select('.//gml:pos', _)).forEach(c => {
                points.push(parsePos(c, opts, childCtx));
            });
        }

        if (points.length === 0) {
            throw new Error(_.nodeName + ' must have > 0 points');
        }
        return points;
    };

    const parseCurveSegments = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const points: number[][] = [];
        Object.values(select('.//gml:LineStringSegment|.//gml:LineString|.//gml:Arc', _)).forEach(c => {
            const points2 = parseLinearRingOrLineString(c, opts, ctx);

            // remove overlapping
            const end = points[points.length - 1];
            const start = points2[0];
            if (end && start && deepEqual(end, start)) {
                points2.shift();
            }
            points.push(...points2);
        });

        if (points.length === 0) {
            throw new Error('gml:Curve > gml:segments must have > 0 points');
        }
        return points;
    };

    const parseRing = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const childCtx = createChildContext(_, opts, ctx);

        const points: number[][] = [];
        Object.values(select('.//gml:curveMember', _)).forEach((c: Node) => {
            let points2;

            const lineString = findIn(c, 'gml:LineString');
            if (lineString) {
                points2 = parseLinearRingOrLineString(lineString, opts, childCtx);
            }
            else {
                const segments = findIn(c, 'gml:Curve/gml:segments');
                if (!segments) {
                    throw new Error('invalid ' + c.nodeName + ' element');
                }
                points2 = parseCurveSegments(segments, opts, childCtx);
            }

            // remove overlapping
            const end = points[points.length - 1];
            const start = points2[0];
            if (end && start && deepEqual(end, start)) {
                points2.shift();
            }
            points.push(...points2);
        });

        if (points.length < 4) {
            throw new Error(_.nodeName + ' must have >= 4 points');
        }
        return points;
    };

    const parseExteriorOrInterior = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const linearRing = findIn(_, 'gml:LinearRing');
        if (linearRing) {
            return parseLinearRingOrLineString(linearRing, opts, ctx);
        }

        const ring = findIn(_, 'gml:Ring');
        if (ring) {
            return parseRing(ring, opts, ctx);
        }
        throw new Error('invalid ' + _.nodeName + ' element');
    };

    const parsePolygonOrRectangle = (_: Node, opts: ParseOptions, ctx: Context = {}) => { // or PolygonPatch
        const childCtx = createChildContext(_, opts, ctx);

        const exterior = findIn(_, 'gml:exterior');
        if (!exterior) {
            throw new Error('invalid ' + _.nodeName + ' element');
        }
        const pointLists = [parseExteriorOrInterior(exterior, opts, childCtx)];
        Object.values(select('.//gml:interior', _)).forEach(c => {
            pointLists.push(parseExteriorOrInterior(c, opts, childCtx));
        });

        return pointLists;
    };

    const parseSurface = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const childCtx = createChildContext(_, opts, ctx);

        const patches = findIn(_, 'gml:patches');
        if (!patches) {
            throw new Error('invalid ' + _.nodeName + ' element');
        }
        const polygons: number[][][][] = [];
        Object.values(select('.//gml:PolygonPatch|.//gml:Rectangle', _)).forEach(c => {
            polygons.push(parsePolygonOrRectangle(c, opts, childCtx));
        });

        if (polygons.length === 0) {
            throw new Error(_.nodeName + ' must have > 0 polygons');
        }
        return polygons;
    };

    const parseCompositeSurface = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const childCtx = createChildContext(_, opts, ctx);

        const polygons: number[][][][] = [];
        Object.values(select('.//gml:surfaceMember', _)).forEach((c: Element) => {
            const c2 = firstElementChild(c);
            if (c2.nodeName === 'gml:Surface') {
                polygons.push(...parseSurface(c2, opts, childCtx));
            }
            else if (c2.nodeName === 'gml:Polygon') {
                polygons.push(parsePolygonOrRectangle(c2, opts, childCtx));
            }
        });

        if (polygons.length === 0) {
            throw new Error(_.nodeName + ' must have > 0 polygons');
        }
        return polygons;
    };

    const parseMultiSurface = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const polygons: number[][][][] = [];
        Object.values(select('.//gml:Surface|.//gml:surfaceMember', _)).forEach((c: Element) => {
            if (c.nodeName === 'gml:Surface') {
                const polygons2 = parseSurface(c, opts, ctx);
                polygons.push(...polygons2);
            }
            else if (c.nodeName === 'gml:surfaceMember') {
                const c2 = firstElementChild(c);
                if (c2.nodeName === 'gml:CompositeSurface') {
                    polygons.push(...parseCompositeSurface(c2, opts, ctx));
                }
                else if (c2.nodeName === 'gml:Surface') {
                    polygons.push(...parseSurface(c2, opts, ctx));
                }
                else if (c2.nodeName === 'gml:Polygon') {
                    polygons.push(parsePolygonOrRectangle(c2, opts, ctx));
                }
            }
        });

        if (polygons.length === 0) {
            throw new Error(_.nodeName + ' must have > 0 polygons');
        }
        return polygons;
    };

    const parseMultiGeometry = (_: Node, opts: ParseOptions, ctx: Context = {}) => {
        const geometries: Geometry[] = [];
        Object.values(select('.//gml:geometryMembers/*|.//gml:geometryMember/*', _)).forEach((c: Element) => {
            geometries.push(parseGml(c, nsMap, opts));
        });

        if (geometries.length === 0) {
            throw new Error(_.nodeName + ' must have > 0 geometries');
        }
        return geometries;
    };

    const childCtx = createChildContext(_, opts, {});

    opts ??= {};
    if (!opts.crs) {
        // observed Patterns for CRS are
        // - urn:ogc:def:crs:EPSG::4326
        // - http://www.opengis.net/def/crs/EPSG/0/4326
        opts.crs = (_ as Element).getAttribute('srsName')?.replace(/^.*?(\d+)$/, '$1');
    }

    let orientationStrategy: OrientationStrategy = 'fix';

    switch (_.nodeName) {
        case 'gml:Point':
            return {
                type: 'Point',
                coordinates: parsePoint(_, opts, childCtx)
            };
        case 'gml:LineString':
            return ensureCounterClockwise({
                type: 'LineString',
                coordinates: parseLinearRingOrLineString(_, opts, childCtx)
            }, orientationStrategy);
        case 'gml:MultiCurve':
            return {
                type: 'MultiLineString',
                coordinates: [parseRing(_, opts, childCtx)]
            };
        // same as polygon
        case 'gml:Rectangle':
        // eslint-disable-next-line no-fallthrough
        case 'gml:Polygon':
            return ensureCounterClockwise({
                type: 'Polygon',
                coordinates: parsePolygonOrRectangle(_, opts, childCtx)
            }, orientationStrategy);
        case 'gml:Surface':
            return ensureCounterClockwise({
                type: 'MultiPolygon',
                coordinates: parseSurface(_, opts, childCtx)
            }, orientationStrategy);
        case 'gml:MultiSurface':
            return ensureCounterClockwise({
                type: 'MultiPolygon',
                coordinates: parseMultiSurface(_, opts, childCtx)
            }, orientationStrategy);
        case 'gml:MultiGeometry':
            return {
                "type": "GeometryCollection",
                "geometries": parseMultiGeometry(_, opts, childCtx)
            };
        default:
            return null;
    }
}

interface Envelope {
    type: 'Envelope',
    coordinates: Position[]
}

interface Context {
    srsDimension?: number
}

interface ParseOptions {
    crs?: string,
    stride?: number
}

interface XPathElementSelect {
    (expression: string, node?: Node): Array<Element>;
    (expression: string, node: Node, single: true): Element;
}

function firstElementChild(node: Node): Element {
    return Object.values(node.childNodes).find(child => child.nodeType === 1) as Element;//Node.ELEMENT_NODE);
}
