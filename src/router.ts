export interface RouteState {
    prevParams: any;
    nextParams: any;
    context: any;
    child?: any;
}


export interface RouteConfig {
    path: string;
    parent?: string;
    onEnter?: (state: RouteState) => Promise<boolean> | boolean;
    onChange?: (state: RouteState) => Promise<boolean> | boolean;
    onLeave?: (state: RouteState) => Promise<boolean> | boolean;
    perform: (state: RouteState) => any;
}


export class PathMatcher {
    private parts = [] as string[];
    private params = [] as string[];
    private paramCount = 0;

    constructor(private readonly path: string) {
        const re = /\:(\w+)/g;
        let index = 0;
        for (let match = re.exec(path); match; match = re.exec(path)) {
            this.parts.push(path.substring(index, match.index));
            this.params.push(match[1]);
            index = match.index + match[0].length;
            this.paramCount++;
        }
        this.parts.push(path.substring(index));
    }

    match(path: string) {
        if (!path.startsWith(this.parts[0])) return null;
        const pathRest = path.substring(this.parts[0].length);

        let values = {};
        let index = 0;
        let lastIndex = 0;
        for (let paramIndex = 0; paramIndex < this.paramCount; paramIndex++) {
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
}


export class GoodRouter {
    private routeStack = [];
    private routeMatchers = [] as [string, RouteConfig, PathMatcher][];
    private lastParams = {};

    constructor(private readonly routeConfigs: { [name: string]: RouteConfig }) {
        this.routeMatchers = Object.entries(routeConfigs).
            map(([name, route]) => [name, route, new PathMatcher(route.path)] as [string, RouteConfig, PathMatcher]);
    }

    async route(path: string, context: any = null) {
        for (let [name, route, routeMatcher] of this.routeMatchers) {
            const params = routeMatcher.match(path);
            if (params) {
                const prevParams = this.lastParams;
                const nextParams = params;
                this.lastParams = params;
                return route.perform({ prevParams, nextParams, context });
            }
        }
    }
}


