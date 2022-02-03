export type Comparer<T> = (a: T, b: T) => number;
export const defaultComparer: Comparer<string | number | boolean> = (a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
};

export function addToSortedArray<T>(
    array: T[],
    value: T,
    comparer: Comparer<T>,
) {
    for (let index = 0; index < array.length; index++) {
        const comparison = comparer(array[index], value);
        if (comparison >= 0) {
            array.splice(index, 0, value);
            return;
        }
    }

    array.push(value);
}
