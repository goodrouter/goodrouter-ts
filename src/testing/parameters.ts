import { defaultRouterOptions } from "../router-options.js";
import { parseTemplateParts } from "../template.js";

export function parametersFromTemplates(
    templates: Iterable<string>,
): Iterable<string> {
    const parameters = new Set<string>();
    for (const template of templates) {
        let index = 0;
        for (const part of parseTemplateParts(
            template,
            defaultRouterOptions.parameterPlaceholderRE,
        )) {
            if (index % 2 !== 0) {
                parameters.add(part);
            }

            index++;
        }
    }

    return parameters;
}
