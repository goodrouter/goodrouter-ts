export function* emitTemplateParts(template: string) {
    const re = /(.*?)\{(.*?)\}/g;
    let match;
    let lastIndex = 0;
    while ((match = re.exec(template)) !== null) {
        yield match[1];
        yield match[2];
        lastIndex = re.lastIndex;
    }
    yield template.substring(lastIndex);
}
