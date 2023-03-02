import { defaultRouterOptions } from "../router-options.js";

export function parametersFromTemplates(
    templates: Iterable<string>,
): Iterable<string> {
    const { parameterPlaceholderRE } = defaultRouterOptions;
    const parameters = new Set<string>();

    for (const template of templates) {
        let match: RegExpExecArray | null;
        while ((match = parameterPlaceholderRE.exec(template)) != null) {
            parameters.add(match[1]);
        }
    }

    return parameters;
}
