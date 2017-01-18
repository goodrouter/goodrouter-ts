export interface RouteState {
    prevParams: any;
    nextParams: any;
    context: any;
    child?: any;
}


export interface RouteConfig {
    path: string;
    parent?: string;
    isEnteringRoute?: (state: RouteState) => Promise<boolean> | boolean;
    hasEnteredRoute?: (state: RouteState) => Promise<boolean> | boolean;
    render?: (state: RouteState) => Promise<any> | any;
    routeIsChanging?: (state: RouteState) => Promise<boolean> | boolean;
    routeHasChanged?: (state: RouteState) => Promise<boolean> | boolean;
    isLeavingRoute?: (state: RouteState) => Promise<boolean> | boolean;
    hasLeftRoute?: (state: RouteState) => Promise<boolean> | boolean;
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

    async transition(path: string, context: any = null) {
        const [nextRoute, nextParams] = this.findRoute(path);

        const nextRouteStack = [] as RouteConfig[];
        const lastRouteStack = this.routeStack;

        const prevParams = this.lastParams;

        for (let currentRoute = nextRoute; currentRoute; currentRoute = this.routeConfigs[currentRoute.parent]) {
            nextRouteStack.unshift(currentRoute);
        }

        await nextRouteStack.reduce(async (result, currentRoute) => {
            const { isLeavingRoute: handler} = currentRoute;
            await result;
            if (handler) await handler({ prevParams, nextParams, context });
        }, null);

        await nextRouteStack.reduce(async (result, currentRoute) => {
            const { routeIsChanging: handler} = currentRoute;
            await result;
            if (handler) await handler({ prevParams, nextParams, context });
        }, null);

        await nextRouteStack.reduce(async (result, currentRoute) => {
            const { isEnteringRoute: handler} = currentRoute;
            await result;
            if (handler) await handler({ prevParams, nextParams, context });
        }, null);


        let result = await nextRouteStack.reduceRight(async (result, currentRoute) => {
            const { render: handler} = currentRoute;
            const child = await result;
            if (handler) return await handler({ prevParams, nextParams, context, child });
            else return child;
        }, null);


        await nextRouteStack.reduceRight(async (result, currentRoute) => {
            const { hasEnteredRoute: handler} = currentRoute;
            await result;
            if (handler) await handler({ prevParams, nextParams, context });
        }, null);

        await nextRouteStack.reduceRight(async (result, currentRoute) => {
            const { routeHasChanged: handler} = currentRoute;
            await result;
            if (handler) await handler({ prevParams, nextParams, context });
        }, null);

        await nextRouteStack.reduceRight(async (result, currentRoute) => {
            const { hasLeftRoute: handler} = currentRoute;
            await result;
            if (handler) await handler({ prevParams, nextParams, context });
        }, null);


        this.routeStack = nextRouteStack;
        this.lastParams = nextParams;

        return result;
    }


    private findRoute(path: string): [RouteConfig, any] {
        for (let [name, route, routeMatcher] of this.routeMatchers) {
            const params = routeMatcher.match(path);
            if (params) return [route, params];
        }
    }

}





