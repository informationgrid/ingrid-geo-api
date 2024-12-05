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
import { GeoJSON } from 'geojson';
import { geomToGml } from 'geojson-to-gml-3';
import { HttpBadRequestError } from '../../../../../../utils/utils.js';
import { DEFAULT_CRS } from '../../GeoConverter.js';
import { parseGml } from '../geojson.utils.js';
import { GeoParser } from '../GeoParser.js';

const DOM_PARSER = new DOMParser({
    // throw on error, swallow rest
    onError: (level, msg) => {
        if (level == 'error') {
            throw new HttpBadRequestError(`Could not parse GML: ${msg}`);
        }
    }
});

export class GmlParser implements GeoParser {

    parse(geometry: string): GeoJSON {
        // if the gml snippet does not contain namespace information, add it manually for parsing
        if (!geometry.includes('xmlns:gml')) {
            geometry = geometry.replace('>', ' xmlns:gml="http://www.opengis.net/gml/3.2">');
        }
        let dom = DOM_PARSER.parseFromString(geometry, 'application/xml');
        // @ts-expect-error xmldom uses own Node/Element implementations, which are compatible
        // see https://github.com/xmldom/xmldom/issues/724
        return parseGml(dom.documentElement, { 'gml': 'http://www.opengis.net/gml/3.2' });
    }

    write(geojson: GeoJSON, crs: string): string {
        let gml: string = geomToGml(geojson);
        // add srsName if given
        if (crs && crs != DEFAULT_CRS) {
            gml = gml.replace('>', ` srsName="${crs}">`);
        }
        return gml;
    }
}
