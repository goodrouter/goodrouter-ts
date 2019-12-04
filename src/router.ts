import { synchronize } from "synchronize-async";
import { RouteParams, RoutePath, uniqueReducer } from ".";

export interface RouteLocalState { [name: string]: any; }
export type RouterHook<T> = (this: Router, state: RouteState) => Promise<T> | T;

export interface TransitionOptions {
    reload?: boolean;
}

export const defaultTransitionOptions = { reload: false } as TransitionOptions;

export interface RouteState {
    /**
     * The previous parameters
     */
    prevParams: RouteParams;

    /**
     * The next (or current) parameters
     */
    nextParams: RouteParams;

    /**
     * The context passed to the transition method, useful to distinguish client and server
     * in an isomorphic scenario, but can be used for anything you want.
     */
    context: any;

    /**
     * If this route was invoked via a child, this property holds the result of the child's
     * [[render]] hook. You genrally should wrap and return this (usualy don't throw it away!);
     *
     * only available in the [[render]] hook.
     */
    child: any | null;

    /**
     * The result of the (previous) [[setup]] hook.
     */
    local: RouteLocalState;
}

export const defaultRouteConfig: InternalRouteConfig = {
    name: "",
    path: null,
    parent: null,
    params: [],
    validate: null,
    render: null,
    setup: null,
    teardown: null,
};

export interface RouteConfig {
    /**
     * Name of the route! Useful for constructing urls by route-name and also
     * for specifying a parent for a route.
     */
    name?: string;

    /**
     * The path for a route. You do not have to specify a path, but if you don't
     * the route can not be reached directly. It is not uncommon that a parent
     * route does not have a path.
     */
    path?: string;

    /**
     * The name of the parent route.
     */
    parent?: string;

    /**
     * Configure child routes here, you may also do this via the parent property, but
     * sometimes it makes more sense to do it here.
     */
    children?: RouteConfig[];

    /**
     * Use this property to configure the parameters that will be compared to figure
     * out if the route had changed to figure out if the [[setup]] and [[teardown]] hooks
     * should be executed. These parameters will normally be automagically loaded
     * from the path, but sometimes this is not possible (for instance, if a parent
     * route does not have a path).
     */
    params?: string[];

    /**
     * This hook can be used to determine if the route is valid. If a route is not valid, this
     * hook should return false, if it is valid, return true. This hook may be used to perform
     * authorization for a route.
     *
     * If this hook is considered invalid (returns false) there will be no render action. And child
     * validation hooks will not execute and you will probably have to perform a redirect or other
     * navigation action.
     *
     * This hook will fire from parent-first
     */
    validate?: RouterHook<any>;

    /**
     * This function does the actual redering of the route and is called everytime a
     * transition occurs. The result of this function will be the result of the
     * transition function of the router.
     *
     * This hook will run child-first
     */
    render?: RouterHook<any>;

    /**
     * This function is called everytime this route is entered with different parameters.
     * A very usefull place to [[setup]] subscriptions or retrieve data. It is possible that
     * this function is called on a child route, but not on a parent route. Because the
     * parameters of the parent do not change, but the parameters of the child do.
     *
     * This hook will fire from parent-first
     */
    setup?: RouterHook<RouteLocalState>;

    /**
     * When a transition causes this route to leave, this function is called. A very good
     * place to cleanup things, like a subscription.
     *
     * This hook will run child-first
     */
    teardown?: RouterHook<void>;
}

export interface InternalRouteConfig {
    name: string;
    path: string | null;
    parent: string | null;
    params: string[];
    validate: RouterHook<any> | null;
    render: RouterHook<any> | null;
    setup: RouterHook<RouteLocalState> | null;
    teardown: RouterHook<void> | null;
}

/**
 * GoodRouter Router class
 */
export class Router {
    public lastRoute: InternalRouteConfig | null = null;
    public lastParams: RouteParams = {};
    public lastContext: any = null;

    private readonly routePathIndex: { [name: string]: RoutePath };
    private readonly routeIndex: { [name: string]: InternalRouteConfig };
    private readonly routeNameList: string[];
    private readonly routeStateIndex: { [name: string]: RouteLocalState } = {};

    /**
     * Include a list of RouteConfig's when constructing this Router
     * @param routeList A list of routes!
     */
    public constructor(
        routeList: RouteConfig[],
    ) {
        const normalizedRouteList = this.normalizeRouteList(routeList);
        this.routeNameList = normalizedRouteList.
            map(route => route.name);
        this.routePathIndex = normalizedRouteList.
            filter(router => router.path !== null).
            reduce((index, route) => Object.assign(
                index,
                { [route.name]: route.path && new RoutePath(route.path) }),
                {},
            );
        this.routeIndex = normalizedRouteList.
            map(route => {
                if (!(route.name in this.routePathIndex)) return route;
                const routePath = this.routePathIndex[route.name];
                if (!route.params) return {
                    ...route,
                    ...{ params: routePath.params },
                };
                return {
                    ...route,
                    ...{
                        params: [
                            ...route.params,
                            ...routePath.params,
                        ].
                            reduce(uniqueReducer<string>(i => i), []),
                    },
                };
            }).
            reduce((index, route) => Object.assign(
                index,
                { [route.name]: route },
            ), {});
    }

    /**
     * Construct a path that points to a route based on it's name
     */
    public path(
        name: string,
        params: RouteParams,
    ) {
        const routePath = this.routePathIndex[name];
        if (!routePath) throw new Error(`route ${name} not found`);
        const path = routePath.build(params);
        return path;
    }

    /**
     * Transition into a new state! (AKA perform the routing)
     */
    @synchronize()
    public async transition(
        path: string | null,
        context: any = null,
        config: TransitionOptions = {},
    ) {
        config = { ...defaultTransitionOptions, ...config };
        const { lastParams: prevParams, lastRoute: prevRoute } = this;
        const [nextRoute, nextParams] = this.matchRoute(path);
        const nextRouteStack = this.buildRouteStack(nextRoute);
        const prevRouteStack = this.buildRouteStack(prevRoute);

        const state = { prevParams, nextParams, context } as RouteState;
        const changedRouteOffset = config.reload ?
            0 :
            this.getChangedRouteOffset(state, prevRouteStack, nextRouteStack);

        await this.applyTeardownHandler(state, prevRouteStack, changedRouteOffset);
        await this.applySetupHandler(state, nextRouteStack, changedRouteOffset);

        let result = null;
        try {
            const valid = await this.applyValidateHandler(state, nextRouteStack);
            result = valid ?
                await this.applyRenderHandler(state, nextRouteStack) :
                null;
        } finally {
            Object.assign(this, { lastParams: nextParams, lastRoute: nextRoute, lastContext: context });
        }

        return result;
    }

    /**
     * Teardown and setup all handlers again without calling the render functions.
     */
    @synchronize()
    public async reload() {
        const { lastParams, lastRoute, lastContext } = this;
        const routeStack = this.buildRouteStack(lastRoute);
        const state: RouteState = {
            prevParams: lastParams,
            nextParams: lastParams,
            context: lastContext,
            child: null,
            local: {},
        };

        await this.applyTeardownHandler(state, routeStack, 0);
        await this.applySetupHandler(state, routeStack, 0);
    }

    /**
     * Find a route for the provided path and return the config and parsed
     * params
     *
     * @param path Path to find a route for
     */
    public matchRoute(
        path: string | null,
    ): [InternalRouteConfig | null, any] {
        if (path !== null) {
            for (const name of this.routeNameList) {
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

    /**
     * see if the parameters, defined in this path, of two states are equal
     */
    public paramsEqual(
        params: string[],
        values1: RouteParams,
        values2: RouteParams,
    ) {
        for (const param of params) {
            if (values1[param] === values2[param]) continue;
            return false;
        }
        return true;
    }

    private async applyTeardownHandler(
        state: RouteState,
        routeStack: InternalRouteConfig[],
        changedRouteOffset: number,
    ) {
        for (
            let routeIndex = routeStack.length - 1;
            routeIndex >= changedRouteOffset;
            routeIndex--
        ) {
            const route = routeStack[routeIndex];
            const { teardown } = route;
            if (teardown) {
                const local = this.routeStateIndex[route.name];
                await teardown.call(this, {
                    ...state,
                    ...{ local },
                });
            }
            delete this.routeStateIndex[route.name];
        }
    }

    private async applySetupHandler(
        state: RouteState,
        routeStack: InternalRouteConfig[],
        changedRouteOffset: number,
    ) {
        for (
            let routeIndex = changedRouteOffset, routeCount = routeStack.length;
            routeIndex < routeCount;
            routeIndex++
        ) {
            const route = routeStack[routeIndex];
            const { setup } = route;
            let local = route.parent ? this.routeStateIndex[route.parent] : {};
            if (setup) {
                local = {
                    ...local,
                    ...await setup.call(this, {
                        ...state,
                        ...{ local },
                    }),
                };
            }
            this.routeStateIndex[route.name] = local;
        }
    }

    private async applyValidateHandler(
        state: RouteState,
        routeStack: InternalRouteConfig[],
    ) {
        let result = true;
        for (
            let routeIndex = 0, routeCount = routeStack.length;
            routeIndex < routeCount;
            routeIndex++
        ) {
            const route = routeStack[routeIndex];
            const { validate } = route;
            const local = this.routeStateIndex[route.name];
            if (validate) result = await validate.call(this, {
                ...state,
                ...{ local },
            });
            if (result === false) break;
        }
        return result;
    }

    private async applyRenderHandler(
        state: RouteState,
        routeStack: InternalRouteConfig[],
    ) {
        let result: any = null;

        for (
            let routeIndex = routeStack.length - 1;
            routeIndex >= 0;
            routeIndex--
        ) {
            const route = routeStack[routeIndex];
            const { render } = route;
            const child = result;
            const local = this.routeStateIndex[route.name];
            if (render) result = await render.call(this, {
                ...state,
                ...{ child, local },
            });
        }

        return result;
    }

    private getChangedRouteOffset(
        state: RouteState,
        prevRouteStack: InternalRouteConfig[],
        nextRouteStack: InternalRouteConfig[],
    ) {
        for (
            let routeIndex = 0, routeCount = Math.min(
                prevRouteStack.length,
                nextRouteStack.length,
            );
            routeIndex < routeCount;
            routeIndex++
        ) {
            const prevRoute = prevRouteStack[routeIndex];
            const nextRoute = nextRouteStack[routeIndex];
            let areEqual = false;

            if (prevRoute && nextRoute && prevRoute === nextRoute) {
                areEqual = this.paramsEqual(
                    nextRoute.params,
                    state.nextParams,
                    state.prevParams,
                );
            }
            if (!areEqual) return routeIndex;
        }

        return Math.min(prevRouteStack.length, nextRouteStack.length);
    }

    private buildRouteStack(
        route: InternalRouteConfig | null,
    ) {
        const routeStack = [] as InternalRouteConfig[];
        for (
            let currentRoute = route;
            currentRoute !== null;
            currentRoute = currentRoute.parent ? this.routeIndex[currentRoute.parent] : null
        ) {
            routeStack.unshift(currentRoute);
        }
        return routeStack;
    }

    private normalizeRouteList(
        routeList: RouteConfig[],
    ): InternalRouteConfig[] {
        return routeList.
            map((item, index) => item.name ? item : {
                ...item,
                ...{ name: item.parent ? `${item.parent}-r${index + 1}` : `r${index + 1}` },
            }).
            map(item => ({ ...defaultRouteConfig, ...item })).
            reduce((list, item) => [
                ...list,
                item,
                ...this.normalizeRouteList(
                    (item.children || []).map(child => ({ ...child, ...{ parent: item.name } })),
                ),
            ], new Array<InternalRouteConfig>());
    }

}
