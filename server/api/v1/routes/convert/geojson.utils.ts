/*
 * Copyright (c) 2018, parse-gml-polygon authors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above 
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

import * as xpath from 'xpath';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import centroid from '@turf/centroid';
import deepEqual from 'deep-equal';
import proj4 from 'proj4';
import rewind from '@turf/rewind';
import { AllGeoJSON } from '@turf/helpers';
import { Geometry, GeometryCollection, Point, Polygon } from 'geojson';

// prepare proj4js
const proj4jsMappings = require('./proj4.json');
proj4.defs(Object.entries(proj4jsMappings));

function transformer(crs: string = 'WGS84'): (x: number, y: number) => number[] {
    return (x: number, y: number) => proj4(crs, 'WGS84').forward([x, y]);
}

// TODO
export function convert(geojson: any, exportCRS: string) {
    return geojson;
}

export function getBbox(spatial: AllGeoJSON): Point | Polygon | undefined {
    if (!spatial) {
        return undefined;
    }
    if (spatial?.type == 'Point') {
        return spatial;
    }
    return bboxPolygon(bbox(spatial))?.geometry;
}

export function getCentroid(spatial: Geometry | GeometryCollection): Point | undefined {
    if (!spatial) {
        return undefined;
    }
    let modifiedSpatial = { ...spatial };
    // turf/centroid does not support envelope, so we turn it into a linestring which has the same centroid
    if (modifiedSpatial.type?.toLowerCase() == 'envelope') {
        modifiedSpatial.type = 'LineString';
    }
    if (modifiedSpatial.type == 'GeometryCollection') {
        // @ts-expect-error we will check for Envelope, just to be sure
        (<GeometryCollection>modifiedSpatial).geometries.filter((geometry: AllGeoJSON) => geometry.type == 'Envelope').forEach((geometry: AllGeoJSON) => geometry.type = 'LineString');
    }
    return centroid(modifiedSpatial)?.geometry;
}

export function getBoundingBox(lowerCorner: string, upperCorner: string, crs?: string) {
    const transformCoords = transformer(crs);
    let [west, south] = transformCoords(...lowerCorner.trim().split(' ').map(parseFloat) as [number, number]);
    let [east, north] = transformCoords(...upperCorner.trim().split(' ').map(parseFloat) as [number, number]);

    if (west === east && north === south) {
        return {
            'type': 'point',
            'coordinates': [west, north]
        };
    }
    else if (west === east || north === south) {
        return {
            'type': 'linestring',
            'coordinates': [[west, north], [east, south]]
        };
    }
    else {
        return {
            'type': 'Polygon',
            'coordinates': [[[west, north], [west, south], [east, south], [east, north], [west, north]]]
        };
    }
}

// @ts-expect-error despite what TS says, function does NOT lack return statement
export function parse(_: Node, opts: ParseOptions = { stride: 2 }, nsMap: { [ name: string ]: string; }): Geometry | null {
    if (_ == null) {
        return null;
    }

    const select = <XPathElementSelect>xpath.useNamespaces(nsMap);

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
        const srsDimensionAttribute = (<Element>_).getAttribute('srsDimension');

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

    const childCtx = createChildContext(_, opts, {});

    opts ??= {};
    if (!opts.crs) {
        // observed Patterns for CRS are
        // - urn:ogc:def:crs:EPSG::4326
        // - http://www.opengis.net/def/crs/EPSG/0/4326
        opts.crs = (<Element>_).getAttribute('srsName')?.replace(/^.*?(\d+)$/, '$1');
    }

    try {
        switch (_.nodeName) {
            case 'gml:Point':
                return {
                    type: 'Point',
                    coordinates: parsePoint(_, opts, childCtx)
                };
            case 'gml:LineString':
                return rewind({
                    type: 'LineString',
                    coordinates: parseLinearRingOrLineString(_, opts, childCtx)
                }) as Geometry;
            case 'gml:MultiCurve':
                return {
                    type: 'MultiLineString',
                    coordinates: [parseRing(_, opts, childCtx)]
                };
            case 'gml:Rectangle':
                // same as polygon
            // eslint-disable-next-line no-fallthrough
            case 'gml:Polygon':
                return rewind({
                    type: 'Polygon',
                    coordinates: parsePolygonOrRectangle(_, opts, childCtx)
                }) as Geometry;
            case 'gml:Surface':
                return rewind({
                    type: 'MultiPolygon',
                    coordinates: parseSurface(_, opts, childCtx)
                }) as Geometry;
            case 'gml:MultiSurface':
                return rewind({
                    type: 'MultiPolygon',
                    coordinates: parseMultiSurface(_, opts, childCtx)
                }) as Geometry;
            case 'gml:MultiGeometry':
                // TODO similar to gml:MultiSurface ??
                // example: https://metropolplaner.de/osterholz/wfs?typeNames=plu:LU.SupplementaryRegulation&request=GetFeature
                break;
            default:
                return null;
        }
    }
    catch (e) {
        // TODO log error
        return null;
    }
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
