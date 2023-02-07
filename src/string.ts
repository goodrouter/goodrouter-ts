export function findCommonPrefixLength(stringLeft: string, stringRight: string) {
    const length = Math.min(stringLeft.length, stringRight.length);
    let index;
    for (index = 0; index < length; index++) {
        const charLeft = stringLeft.charAt(index);
        const charRight = stringRight.charAt(index);
        if (charLeft !== charRight) {
            break;
        }
    }
    return index;
}
