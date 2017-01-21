import { RoutePath } from ".";

export type RouteParams = { [name: string]: string };
export type RouteLocalState = { [name: string]: any };

export interface RouteState {
    prevStack: string[];
    prevParams: RouteParams;
    nextStack: string[];
    nextParams: RouteParams;
    context: any;
    child?: any;
    local?: RouteLocalState;
}


export type RouterHook<T> = (this: Router, state: RouteState) => Promise<T> | T;


export interface RouteConfig {
    name: string;
    path?: string;
    parent?: string;
    isDifferentRoute?: RouterHook<boolean>;
    render?: RouterHook<any>;
    isEnteringRoute?: RouterHook<RouteLocalState>;
    hasEnteredRoute?: RouterHook<RouteLocalState>;
    routeIsChanging?: RouterHook<RouteLocalState>;
    routeHasChanged?: RouterHook<RouteLocalState>;
    isLeavingRoute?: RouterHook<RouteLocalState>;
    hasLeftRoute?: RouterHook<RouteLocalState>;
}


export class Router {
    private readonly routePathIndex: { [name: string]: RoutePath };
    private readonly routeIndex: { [name: string]: RouteConfig };
    private lastRoute = null as RouteConfig;
    private lastParams = {};
    private readonly transitionHookStack = [] as RouterHook<void>[];
    private readonly routeStateIndex = {} as { [name: string]: RouteLocalState };

    constructor(routeList: RouteConfig[]) {
        this.routeIndex = routeList.reduce((index, route) => Object.assign(index, { [route.name]: route }), {});
        this.routePathIndex = routeList.filter(router => router.path).reduce((index, route) => Object.assign(index, { [route.name]: new RoutePath(route.path) }), {});
    }

    registerTransitionHook(hook: RouterHook<void>) {
        this.transitionHookStack.push(hook);
    }

    path(name: string, params: any) {
        const routePath = this.routePathIndex[name];
        if (!routePath) throw new Error(`route ${name} not found`);
        const path = routePath.build(params);
        return path;
    }

    async transition(path: string, context: any = null) {
        const {lastParams: prevParams, lastRoute: prevRoute} = this;
        const [nextRoute, nextParams] = this.matchRoute(path);

        const nextRouteStack = [] as RouteConfig[];
        for (
            let currentRoute = nextRoute;
            currentRoute;
            currentRoute = this.routeIndex[currentRoute.parent]
        ) {
            nextRouteStack.unshift(currentRoute);
        }

        const prevRouteStack = [] as RouteConfig[];
        for (
            let currentRoute = prevRoute;
            currentRoute;
            currentRoute = this.routeIndex[currentRoute.parent]
        ) {
            prevRouteStack.unshift(currentRoute);
        }

        const state = { prevStack: prevRouteStack.map(r => r.name), prevParams, nextStack: nextRouteStack.map(r => r.name), nextParams, context } as RouteState;


        const differentRouteSet = [] as RouteConfig[];

        for (
            let routeIndex = 0, routeCount = Math.max(prevRouteStack.length, nextRouteStack.length);
            routeIndex < routeCount;
            routeIndex++
        ) {
            const prevRoute = routeIndex < prevRouteStack.length && prevRouteStack[routeIndex];
            const nextRoute = routeIndex < nextRouteStack.length && nextRouteStack[routeIndex];

            if (prevRoute && nextRoute && prevRoute === nextRoute) {
                const {isDifferentRoute} = prevRoute;
                if (isDifferentRoute) {
                    if (await isDifferentRoute.call(this, state)) differentRouteSet.push(prevRoute);
                }
                else {
                    const routePath = this.routePathIndex[prevRoute.name];
                    for (let param of routePath.params) {
                        if (prevParams[param] !== nextParams[param]) {
                            differentRouteSet.push(prevRoute);
                            break;
                        }
                    }
                }
            }
            else break;
        }


        for (let handler of this.transitionHookStack.splice(0)) {
            if (handler) await handler.call(this, state);
        }


        const callStateHook = async (route: RouteConfig, hookName: string) => {
            const handler = route[hookName] as RouterHook<RouteLocalState>;
            let local = this.routeStateIndex[route.name] || {};
            if (handler) {
                local = {
                    ...local,
                    ...(await handler.call(this, { ...state, ...{ local } }))
                };
                this.routeStateIndex[route.name] = local;
            }
        };


        let result = null;
        const callRender = async (route: RouteConfig) => {
            const { render} = route;
            const child = result;
            const local = this.routeStateIndex[route.name] || {};
            if (render) result = await render.call(this, { ...state, ...{ child, local } });
        };

        for (
            let routeIndex = 0, routeCount = Math.max(prevRouteStack.length, nextRouteStack.length);
            routeIndex < routeCount;
            routeIndex++
        ) {
            const prevRoute = routeIndex < prevRouteStack.length && prevRouteStack[routeIndex];
            const nextRoute = routeIndex < nextRouteStack.length && nextRouteStack[routeIndex];

            if (prevRoute && nextRoute && prevRoute === nextRoute && differentRouteSet.includes(prevRoute)) {
                await callStateHook(prevRoute, "routeIsChanging");
            }
            else {
                if (prevRoute) {
                    await callStateHook(prevRoute, "isLeavingRoute");
                }

                if (nextRoute) {
                    await callStateHook(nextRoute, "isEnteringRoute");
                }
            }
        }


        for (
            let routeIndex = nextRouteStack.length - 1;
            routeIndex >= 0;
            routeIndex--
        ) {
            const nextRoute = nextRouteStack[routeIndex];
            await callRender(nextRoute);
        }


        for (
            let routeIndex = Math.max(prevRouteStack.length, nextRouteStack.length) - 1;
            routeIndex >= 0;
            routeIndex--
        ) {
            const prevRoute = routeIndex < prevRouteStack.length && prevRouteStack[routeIndex];
            const nextRoute = routeIndex < nextRouteStack.length && nextRouteStack[routeIndex];

            if (prevRoute && nextRoute && prevRoute === nextRoute && differentRouteSet.includes(prevRoute)) {
                await callStateHook(prevRoute, "routeHasChanged");
            }
            else {
                if (nextRoute) {
                    await callStateHook(nextRoute, "hasEnteredRoute");
                }

                if (prevRoute) {
                    await callStateHook(prevRoute, "hasLeftRoute");
                }
            }
        }


        this.lastRoute = nextRoute;
        this.lastParams = nextParams;

        return result;
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





