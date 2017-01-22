export type Selector<T> = (item: T) => string | number;


export function uniqueReducer<T>(...selectors: Selector<T>[]) {
    const hash = {};
    return (list: T[], item: T) => {
        let subHash: any = hash;
        let exists = true;

        for (let selector of selectors) {
            const key = selector(item);
            exists = exists && (key in subHash);
            if (!(key in subHash)) subHash[key] = {};
            subHash = subHash[key];
        }

        return exists ? list : list.concat(item);
    };
}
