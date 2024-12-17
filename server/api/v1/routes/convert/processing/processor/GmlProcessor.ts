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

import { DOMParser } from '@xmldom/xmldom';
import xmlFormat from 'xml-formatter';
import * as xpath from 'xpath';
import { gmlTemplate, HttpBadRequestError } from '../../../../../../utils/utils.js';
import { GEOMETRY_TYPES } from '../../types.js';
import { GdalOpts, ProcessingOptions, Processor } from '../Processor.js';

const DOM_PARSER = new DOMParser({
    // throw on error, swallow rest
    onError: (level, msg) => {
        if (level == 'error') {
            throw new HttpBadRequestError(`Could not parse GML: ${msg}`);
        }
    }
});
const select = xpath.useNamespaces({ 'ogr': 'http://ogr.maptools.org/', 'gml': 'http://www.opengis.net/gml/3.2' });

export class GmlProcessor implements Processor {

    preprocess(geometry: string): string {
        let parsableGeometry = geometry.includes('xmlns:gml') ? geometry : geometry.replace('>', ' xmlns:gml="http://www.opengis.net/gml/3.2">');
        let dom = DOM_PARSER.parseFromString(parsableGeometry, 'application/xml');
        if (dom.documentElement.localName == 'FeatureCollection') {
            return parsableGeometry;
        }
        if (!GEOMETRY_TYPES.includes(dom.documentElement.localName)) {
            throw new HttpBadRequestError(`Either provide a FeatureCollection or one of the following geometry types:\n${GEOMETRY_TYPES}`);
        }
        geometry = gmlTemplate(geometry);
        return geometry;
    }

    postprocess(geometry: string, { extractGeometry = true, pretty = true }: GmlProcessingOptions = {}): string {
        if (extractGeometry) {
            let dom = DOM_PARSER.parseFromString(geometry, 'application/xml');
            // extract geometry
            // @ts-expect-error xmldom uses own Node/Element implementations, which are compatible; ref. https://github.com/xmldom/xmldom/issues/724
            let geometryNode: Element = select('//ogr:FeatureCollection/ogr:featureMember/*/ogr:geometryProperty/*', dom.documentElement, true);
            if (!geometryNode) {
                throw new HttpBadRequestError('Could not extract geometry because no valid one was found');
            }
            // remove superfluous `gml:id` attribute
            (select('//*[@gml:id]', geometryNode) as Element[]).forEach(node => node.removeAttribute('gml:id'));
            geometry = geometryNode.toString();
        }
        // @ts-expect-error incorrect implementation in xmlFormat, still works
        return pretty ? xmlFormat(geometry, { lineSeparator: '\n' }) : geometry;
    }

    gdalOptions(geometry: string): GdalOpts {
        // TODO this doesn't work currently, waiting for https://github.com/OSGeo/gdal/issues/11491
        // TODO after that, this needs to be thoroughly tested
        let swap = !geometry.includes('srsName="');
        return {
            driver: '',
            format: 'GML',
            openOptions: swap ? ['-oo', 'SWAP_COORDINATES=YES'] : [],
            outputOptions: []
        };
    }
}

export type GmlProcessingOptions = {
    extractGeometry?: boolean,
    outputSimpleCRS?: boolean
} & ProcessingOptions;
