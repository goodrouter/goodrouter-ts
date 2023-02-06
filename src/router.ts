import { insertRouteNode, parseRoute, RouteNode, stringifyRoute } from "./route-node.js";
import { Route } from "./route.js";

/**
 * Options to be passed to the router
 */
export interface RouterOptions {
    /**
     * @deprecated
     * Don't use this
     * 
     * @description
     * This function wil be used on each parameter value when parsing a route
     * 
     * @param value value to be encoded
     * @returns encoded value
     */
    encode?: (value: string) => string
    /**
     * @deprecated
     * Don't use this
     * 
     * @description
     * This function wil be used on each parameter value when constructing a route
     * 
     * @param value value to be decoded
     * @returns decoded value
     */
    decode?: (value: string) => string
}

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

    protected options: Required<RouterOptions>;

    constructor(options: RouterOptions = {}) {
        this.options = {
            encode: encodeURIComponent,
            decode: decodeURIComponent,
            ...options,
        };
    }

    private rootNode: RouteNode = new RouteNode();
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
