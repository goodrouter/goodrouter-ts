export type RouteParams = { [name: string]: string };

export class RoutePath {
    private readonly parts = [] as string[];
    private readonly params = [] as string[];

    public constructor(private readonly path: string) {
        const re = /\:(\w+)/g;
        let index = 0;
        for (let match = re.exec(path); match; match = re.exec(path)) {
            this.parts.push(path.substring(index, match.index));
            this.params.push(match[1]);
            index = match.index + match[0].length;
        }
        this.parts.push(path.substring(index));
    }


    public build(values: any) {
        let str = this.parts[0];
        for (let paramIndex = 0, paramCount = this.params.length; paramIndex < paramCount; paramIndex++) {
            const part = this.parts[paramIndex + 1];
            const param = this.params[paramIndex];
            if (!(param in values)) throw new Error(`missing param ${param}`);
            str += values[param];
            str += this.parts[paramIndex + 1];
        }
        return str;
    }

    public match(path: string) {
        if (!path.startsWith(this.parts[0])) return null;
        const pathRest = path.substring(this.parts[0].length);

        let values = {};
        let index = 0;
        let lastIndex = 0;
        for (let paramIndex = 0, paramCount = this.params.length; paramIndex < paramCount; paramIndex++) {
            const part = this.parts[paramIndex + 1];
            index = part === "" ? pathRest.length : pathRest.indexOf(part, index);
            if (index < 0) return null;
            const param = this.params[paramIndex];
            const value = pathRest.substring(lastIndex, index);
            values[param] = value;
            index += part.length;
            lastIndex = index;
        }
        if (index < pathRest.length) return null;
        return values;
    }

    public paramsEqual(params1: RouteParams, params2: RouteParams) {
        for (let param of this.params) {
            if (params1[param] === params2[param]) continue;
            return false;
        }
        return true;
    }
}


