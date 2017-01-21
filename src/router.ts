import { RoutePath, RouteParams } from ".";

export type RouteLocalState = { [name: string]: any };
export type RouterHook<T> = (this: Router, state: RouteState) => Promise<T> | T;

export interface RouteState {
    prevParams: RouteParams;
    nextParams: RouteParams;
    context: any;
    child?: any;
    local?: RouteLocalState;
}

export interface RouteConfig {
    name: string;
    path?: string;
    parent?: string;
    equal?: RouterHook<boolean>;
    render?: RouterHook<any>;
    setup?: RouterHook<RouteLocalState>;
    teardown?: RouterHook<void>;
}

export class Router {
    private readonly routePathIndex: { [name: string]: RoutePath };
    private readonly routeIndex: { [name: string]: RouteConfig };
    private lastRoute = null as RouteConfig;
    private lastParams = {};
    private readonly routeStateIndex = {} as { [name: string]: RouteLocalState };

    public constructor(routeList: RouteConfig[]) {
        this.routeIndex = routeList.reduce((index, route) => Object.assign(index, { [route.name]: route }), {});
        this.routePathIndex = routeList.filter(router => router.path).reduce((index, route) => Object.assign(index, { [route.name]: new RoutePath(route.path) }), {});
    }

    public path(name: string, params: any) {
        const routePath = this.routePathIndex[name];
        if (!routePath) throw new Error(`route ${name} not found`);
        const path = routePath.build(params);
        return path;
    }

    public async transition(path: string, context: any = null) {
        const {lastParams: prevParams, lastRoute: prevRoute} = this;
        const [nextRoute, nextParams] = this.matchRoute(path);
        const nextRouteStack = this.buildRouteStack(nextRoute);
        const prevRouteStack = this.buildRouteStack(prevRoute);

        const state = {
            prevParams,
            nextParams,
            context,
        } as RouteState;

        const changedRouteOffset = await this.getChangedRouteOffset(prevRouteStack, nextRouteStack, state);

        let result = null;

        for (
            let routeIndex = prevRouteStack.length - 1;
            routeIndex >= changedRouteOffset;
            routeIndex--
        ) {
            const route = prevRouteStack[routeIndex];
            const {teardown} = route;
            if (teardown) {
                const local = this.routeStateIndex[route.name];
                await teardown.call(this, { ...state, ...{ local } });
            }
            delete this.routeStateIndex[route.name];
        }

        for (
            let routeIndex = changedRouteOffset, routeCount = nextRouteStack.length;
            routeIndex < routeCount;
            routeIndex++
        ) {
            const route = nextRouteStack[routeIndex];
            const {setup} = route;
            let local = route.parent ? this.routeStateIndex[route.parent] : {};
            if (setup) {
                local = {
                    ...local,
                    ...await setup.call(this, { ...state, ...{ local } }),
                };
            }
            this.routeStateIndex[route.name] = local;
        }

        for (
            let routeIndex = nextRouteStack.length - 1;
            routeIndex >= 0;
            routeIndex--
        ) {
            const route = nextRouteStack[routeIndex];
            const { render} = route;
            const child = result;
            const local = this.routeStateIndex[route.name];
            if (render) result = await render.call(this, { ...state, ...{ child, local } });
        }

        this.lastRoute = nextRoute;
        this.lastParams = nextParams;

        return result;
    }

    private async getChangedRouteOffset(prevRouteStack: RouteConfig[], nextRouteStack: RouteConfig[], state: RouteState) {
        for (
            let routeIndex = 0, routeCount = Math.min(prevRouteStack.length, nextRouteStack.length);
            routeIndex < routeCount;
            routeIndex++
        ) {
            const prevRoute = prevRouteStack[routeIndex];
            const nextRoute = nextRouteStack[routeIndex];
            let areEqual = false;

            if (prevRoute && nextRoute && prevRoute === nextRoute) {
                const {equal} = prevRoute;
                if (equal) {
                    areEqual = await !equal.call(this, state);
                }
                else {
                    const routePath = this.routePathIndex[prevRoute.name];
                    areEqual = routePath.paramsEqual(state.nextParams, state.prevParams);
                }
            }

            if (!areEqual) return routeIndex;
        }

        return Math.min(prevRouteStack.length, nextRouteStack.length);
    }

    private buildRouteStack(route: RouteConfig) {
        const routeStack = [] as RouteConfig[];
        for (
            let currentRoute = route;
            currentRoute;
            currentRoute = this.routeIndex[currentRoute.parent]
        ) {
            routeStack.unshift(currentRoute);
        }
        return routeStack;
    }

    private matchRoute(path: string): [RouteConfig, any] {
        if (path !== null) {
            for (let [name, routePath] of Object.entries(this.routePathIndex)) {
                const params = routePath.match(path);
                if (params) {
                    const route = this.routeIndex[name];
                    return [route, params];
                }
            }
        }
        return [null, {}];
    }

}





