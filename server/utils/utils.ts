/**
 * ==================================================
 * geo-conversion-api
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

import * as fs from 'fs';
import { marked } from 'marked';
import { gfmHeadingId } from "marked-gfm-heading-id";

export function parseNumber(str: string | undefined) {
    let num = Number(str);
    return !isNaN(num) ? num : undefined;
}

export async function template(title: string, bodyPath: string): Promise<string> {
    let template = fs.readFileSync('./utils/template.html', 'utf8');
    let md = fs.readFileSync(bodyPath, 'utf8');
    // add html header IDs
    marked.use(gfmHeadingId());
    let body = await marked.parse(md);
    template = template.replace('{{ title }}', title);
    template = template.replace('{{ body }}', body);
    return template;
}

export function throwHttpError(status: string | number, msg: string): never {
    throw new Error(msg, { cause: status });
}
