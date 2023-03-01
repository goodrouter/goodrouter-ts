import { RouteNode } from "./route-node.js";
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
 *   const [routeName, routeParameters] = router.parseRoute("/product/all");
 *   assert.equal(routeName, "all-products");
 *   assert.deepEqual(routeParameters, {});
 * }
 * 
 * {
 *   const [routeName, routeParameters] = router.parseRoute("/product/1");
 *   assert.equal(routeName, "product-detail");
 *   assert.deepEqual(routeParameters, { id: "1" });
 * }
 * 
 * // And we can stringify routes
 * 
 * {
 *   const path = router.stringifyRoute(
 *     "all-products",
 *   });
 *   assert.equal(path, "/product/all");
 * }
 * 
 * {
 *   const path = router.stringifyRoute(
 *     "product-detail",
 *     { id: "2" },
 *   );
 *   assert.equal(path, "/product/2");
 * }
 * ```
 */
export class Router {

    constructor(options: RouterOptions = {}) {
        this.options = {
            ...defaultRouterOptions,
            ...options,
        };
    }

    protected options: RouterOptions & typeof defaultRouterOptions;

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
        const leafNode = this.rootNode.insert(name, template, this.options.parameterPlaceholderRE);
        this.leafNodes.set(name, leafNode);
        return this;
    }

    /**
     * @description
     * Match the path against one of the provided routes and parse the parameters in it
     * 
     * @param path path to match
     * @returns tuple with the route name or null if no route found. Then the parameters
     */
    public parseRoute(path: string): [string | null, Record<string, string>] {
        const [route, parameters] = this.rootNode.parse(
            path,
            this.options.decode,
            [],
            this.options.maximumParameterValueLength,
        );
        if (route == null) {
            return [null, {}];
        }

        return [
            route.name,
            Object.fromEntries(
                route.parameters.map((name, index) => [name, parameters[Number(index)]]),
            ),
        ];
    }

    /**
     * @description
     * Convert a route to a path string.
     * 
     * @param routeName route to stringify
     * @param routeParameters parameters to include in the path
     * @returns string representing the route or null if the route is not found by name
     */
    public stringifyRoute(
        routeName: string,
        routeParameters: Record<string, string> = {},
    ): string | null {
        const node = this.leafNodes.get(routeName);
        if (!node) return null;
        if (!node.route) return null;

        return node.stringify(
            node.route.parameters.map(name => routeParameters[String(name)]),
            this.options.encode,
        );
    }
}
