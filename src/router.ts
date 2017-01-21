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
    name?: string;
    path?: string;
    parent?: string;
    children?: RouteConfig[];
    equal?: RouterHook<boolean>;
    render?: RouterHook<any>;
    setup?: RouterHook<RouteLocalState>;
    teardown?: RouterHook<void>;
}

/**
 * GoodRouter Router class
 */
export class Router {
    private readonly routePathIndex: { [name: string]: RoutePath };
    private readonly routeIndex: { [name: string]: RouteConfig };
    private lastRoute = null as RouteConfig;
    private lastParams = {};
    private readonly routeStateIndex = {} as { [name: string]: RouteLocalState };

    /**
     * Include a list of RouteConfig's when constructing this Router
     */
    public constructor(routeList: RouteConfig[]) {
        const normalizedRouteList = this.normalizeRouteList(routeList);
        this.routeIndex = normalizedRouteList.reduce((index, route) => Object.assign(index, { [route.name]: route }), {});
        this.routePathIndex = normalizedRouteList.filter(router => router.path).reduce((index, route) => Object.assign(index, { [route.name]: new RoutePath(route.path) }), {});
    }

    /**
     * Construct a path that points to a route based on it's name
     */
    public path(name: string, params: any) {
        const routePath = this.routePathIndex[name];
        if (!routePath) throw new Error(`route ${name} not found`);
        const path = routePath.build(params);
        return path;
    }

    /**
     * Transition into a new state! (AKA perform the routing)
     */
    public async transition(path: string, context: any = null) {
        const {lastParams: prevParams, lastRoute: prevRoute} = this;
        const [nextRoute, nextParams] = this.matchRoute(path);
        const nextRouteStack = this.buildRouteStack(nextRoute);
        const prevRouteStack = this.buildRouteStack(prevRoute);

        const state = { prevParams, nextParams, context } as RouteState;
        const changedRouteOffset = await this.getChangedRouteOffset(state, prevRouteStack, nextRouteStack);

        this.applyTeardownHandler(state, prevRouteStack, changedRouteOffset);
        this.applySetupHandler(state, nextRouteStack, changedRouteOffset);
        const result = this.applyRenderHandler(state, nextRouteStack);

        Object.assign(this, { lastParams: nextParams, lastRoute: nextRoute });

        return result;
    }

    private async applyTeardownHandler(state: RouteState, routeStack: RouteConfig[], changedRouteOffset: number) {
        for (
            let routeIndex = routeStack.length - 1;
            routeIndex >= changedRouteOffset;
            routeIndex--
        ) {
            const route = routeStack[routeIndex];
            const {teardown} = route;
            if (teardown) {
                const local = this.routeStateIndex[route.name];
                await teardown.call(this, { ...state, ...{ local } });
            }
            delete this.routeStateIndex[route.name];
        }
    }

    private async applySetupHandler(state: RouteState, routeStack: RouteConfig[], changedRouteOffset: number) {
        for (
            let routeIndex = changedRouteOffset, routeCount = routeStack.length;
            routeIndex < routeCount;
            routeIndex++
        ) {
            const route = routeStack[routeIndex];
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
    }

    private async applyRenderHandler(state: RouteState, routeStack: RouteConfig[]) {
        let result = null;

        for (
            let routeIndex = routeStack.length - 1;
            routeIndex >= 0;
            routeIndex--
        ) {
            const route = routeStack[routeIndex];
            const { render} = route;
            const child = result;
            const local = this.routeStateIndex[route.name];
            if (render) result = await render.call(this, { ...state, ...{ child, local } });
        }

        return result;
    }

    private async getChangedRouteOffset(state: RouteState, prevRouteStack: RouteConfig[], nextRouteStack: RouteConfig[]) {
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

    private normalizeRouteList(routeList: RouteConfig[]) {
        return routeList.
            map((item, index) => (item.name ? item : {
                ...item,
                ...{ name: item.parent ? `${item.parent}-r${index + 1}` : `r${index + 1}` },
            })).
            reduce((list, item) => list.concat(item).concat(
                item.children ? this.normalizeRouteList(item.children.map(child =>
                    ({ ...child, ...{ parent: item.name } })
                )) : []),
            []
            );
    }
}





