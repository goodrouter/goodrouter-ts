export function findCommonPrefixLength(stringLeft: string, stringRight: string) {
    const length = Math.min(stringLeft.length, stringRight.length);
    let index;
    for (index = 0; index < length; index++) {
        const charLeft = stringLeft[index];
        const charRight = stringRight[index];
        if (charLeft !== charRight) break;
    }
    return index;
}
