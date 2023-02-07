import { insertRouteNode, newRootRouteNode, parseRoute, RouteNode, stringifyRoute } from "./route-node.js";
import { Route } from "./route.js";
import { defaultRouterOptions, RouterOptions } from "./router-options.js";

/**
 * @description
 * This is the actual router that contains all routes and does the actual routing
 * 
 * @example
 * ```typescript
 * const router = new Router();
 * 
 * router.insertRoute("all-products", "/product/all");
 * router.insertRoute("product-detail", "/product/{id}");
 * 
 * // And now we can parse routes!
 * 
 * {
 *   const route = router.parseRoute("/not-found");
 *   assert.equal(route, null);
 * }
 * 
 * {
 *   const route = router.parseRoute("/product/all");
 *   assert.deepEqual(route, {
 *     name: "all-products",
 *     parameters: {},
 *   });
 * }
 * 
 * {
 *   const route = router.parseRoute("/product/1");
 *   assert.deepEqual(route, {
 *     name: "product-detail",
 *     parameters: {
 *       id: "1",
 *     },
 *   });
 * }
 * 
 * // And we can stringify routes
 * 
 * {
 *   const path = router.stringifyRoute({
 *     name: "all-products",
 *     parameters: {},
 *   });
 *   assert.equal(path, "/product/all");
 * }
 * 
 * {
 *   const path = router.stringifyRoute({
 *     name: "product-detail",
 *     parameters: {
 *       id: "2",
 *     },
 *   });
 *   assert.equal(path, "/product/2");
 * }
 * ```
 */
export class Router {

    protected options: RouterOptions & typeof defaultRouterOptions;

    constructor(options: RouterOptions = {}) {
        this.options = {
            ...defaultRouterOptions,
            ...options,
        };
    }

    private rootNode: RouteNode = newRootRouteNode();
    private leafNodes = new Map<string, RouteNode>();

    /**
     * @description
     * Adds a new route
     *
     * @param name name of the route
     * @param template template for the route, als defines parameters
     */
    public insertRoute(name: string, template: string) {
        const leafNode = insertRouteNode(this.rootNode, name, template);
        this.leafNodes.set(name, leafNode);
    }

    /**
     * @description
     * Match the path against one of the provided routes and parse the parameters in it
     * 
     * @param path path to match
     * @returns route that is matches to the path or null if no match is found
     */
    public parseRoute(path: string): Route | null {
        const route = parseRoute(this.rootNode, path, this.options.decode);
        return route;
    }

    /**
     * @description
     * Convert a route to a path string.
     * 
     * @param route route to stringify
     * @returns string representing the route or null if the route is not found by name
     */
    public stringifyRoute(route: Route): string | null {
        const node = this.leafNodes.get(route.name);
        if (!node) return null;
        return stringifyRoute(node, route.parameters, this.options.encode);
    }
}
