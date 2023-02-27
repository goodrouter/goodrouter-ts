export function* emitTemplatePathParts(template: string, re: RegExp) {
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
