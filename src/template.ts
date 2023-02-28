/**
 * Take a route template and chops is in pieces! The first piece is a literal part of
 * the template. Then the name of a placeholder. Then a literal parts of the template again.
 * The first and the last elements are always literal strings taken from the template,
 * therefore the number of elements in the resulting iterable is always uneven!
 * 
 * @param template template to chop up
 * @param re regular expression to use when searching for parameter placeholders
 * @returns Iterable of strings, always an uneven number of elements.
 */
export function* splitTemplate(template: string, re: RegExp) {
    if (!re.global) {
        throw new Error("regular expression needs to be global");
    }

    let match;
    let offsetIndex = 0;
    while ((match = re.exec(template)) != null) {
        yield template.substring(offsetIndex, re.lastIndex - match[0].length);
        yield match[1];
        offsetIndex = re.lastIndex;
    }
    yield template.substring(offsetIndex);
}
