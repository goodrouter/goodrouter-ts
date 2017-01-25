import { RoutePath, RouteParams, uniqueReducer, TaskQueue } from ".";

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
    params?: string[];
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
    private readonly routeNameList: string[];
    private lastRoute = null as RouteConfig;
    private lastParams = {} as RouteParams;
    private readonly routeStateIndex = {} as { [name: string]: RouteLocalState };
    private readonly queue = new TaskQueue();

    /**
     * Include a list of RouteConfig's when constructing this Router
     * @param routeList A list of routes!
     */
    public constructor(routeList: RouteConfig[]) {
        const normalizedRouteList = this.normalizeRouteList(routeList);
        this.routeNameList = normalizedRouteList.
            map(route => route.name);
        this.routePathIndex = normalizedRouteList.
            filter(router => router.path).
            reduce((index, route) => Object.assign(index, { [route.name]: new RoutePath(route.path) }), {});
        this.routeIndex = normalizedRouteList.
            map(route => {
                if (!(route.name in this.routePathIndex)) return route;
                const routePath = this.routePathIndex[route.name];
                if (!route.params) return { ...route, ...{ params: routePath.params } };
                return { ...route, ...{ params: [...route.params, ...routePath.params].reduce(uniqueReducer<string>(i => i), []) } };
            }).
            reduce((index, route) => Object.assign(index, { [route.name]: route }), {});
    }

    /**
     * Construct a path that points to a route based on it's name
     */
    public path(name: string, params: RouteParams) {
        const routePath = this.routePathIndex[name];
        if (!routePath) throw new Error(`route ${name} not found`);
        const path = routePath.build(params);
        return path;
    }

    /**
     * Transition into a new state! (AKA perform the routing)
     */
    public async transition(path: string, context: any = null) {
        return await this.queue.execute(async () => {
            const {lastParams: prevParams, lastRoute: prevRoute} = this;
            const [nextRoute, nextParams] = this.matchRoute(path);
            const nextRouteStack = this.buildRouteStack(nextRoute);
            const prevRouteStack = this.buildRouteStack(prevRoute);

            const state = { prevParams, nextParams, context } as RouteState;
            const changedRouteOffset = await this.getChangedRouteOffset(state, prevRouteStack, nextRouteStack);

            await this.applyTeardownHandler(state, prevRouteStack, changedRouteOffset);
            await this.applySetupHandler(state, nextRouteStack, changedRouteOffset);
            const result = await this.applyRenderHandler(state, nextRouteStack);

            Object.assign(this, { lastParams: nextParams, lastRoute: nextRoute });

            return result;
        });
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
                areEqual = this.paramsEqual(nextRoute.params, state.nextParams, state.prevParams);
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
            for (let name of this.routeNameList) {
                if (!(name in this.routePathIndex)) continue;

                const routePath = this.routePathIndex[name];
                const params = routePath.match(path);
                if (!params) continue;

                const route = this.routeIndex[name];
                return [route, params];
            }
        }
        return [null, {}];
    }

    private normalizeRouteList(routeList: RouteConfig[]) {
        return routeList.
            map((item, index) => item.name ? item : {
                ...item,
                ...{ name: item.parent ? `${item.parent}-r${index + 1}` : `r${index + 1}` },
            }).
            map(item => item.params ? item : { ...item, ...{ params: [] } }).
            reduce((list, item) => [
                ...list,
                item,
                ...(item.children ? this.normalizeRouteList(item.children.map(child =>
                    ({ ...child, ...{ parent: item.name } })
                )) : []),
            ], []);
    }

    /**
     * see if the parameters, defined in this path, of two states are equal
     */
    public paramsEqual(params: string[], values1: RouteParams, values2: RouteParams) {
        for (let param of params) {
            if (values1[param] === values2[param]) continue;
            return false;
        }
        return true;
    }

}





