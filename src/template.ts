/**
 * Take a route template and chops is in pieces! The first piece is a literal part of
 * the template. Then the name of a placeholder. Then a literal parts of the template again.
 * The first and the last elements are always literal strings taken from the template,
 * therefore the number of elements in the resulting iterable is always uneven!
 * 
 * @param routeTemplate template to chop up
 * @param parameterPlaceholderRE regular expression to use when searching for parameter placeholders
 * @returns Iterable of strings, always an uneven number of elements.
 */
export function* parseTemplateParts(
    routeTemplate: string,
    parameterPlaceholderRE: RegExp,
) {
    if (!parameterPlaceholderRE.global) {
        throw new Error("regular expression needs to be global");
    }

    let match;
    let offsetIndex = 0;
    while ((match = parameterPlaceholderRE.exec(routeTemplate)) != null) {
        yield routeTemplate.substring(
            offsetIndex,
            parameterPlaceholderRE.lastIndex - match[0].length,
        );
        yield match[1];
        offsetIndex = parameterPlaceholderRE.lastIndex;
    }
    yield routeTemplate.substring(offsetIndex);
}

export function* parseTemplatePairs(
    routeTemplate: string,
    parameterPlaceholderRE: RegExp,
) {
    const parts = parseTemplateParts(routeTemplate, parameterPlaceholderRE);

    let index = 0;
    let parameter: string | null = null;
    for (const part of parts) {
        if (index % 2 === 0) {
            yield [part, parameter] as const;
        }
        else {
            parameter = part;
        }
        index++;
    }
}
