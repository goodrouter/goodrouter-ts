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
export class Router<K extends string | number> {

    constructor(options: RouterOptions = {}) {
        this.options = {
            ...defaultRouterOptions,
            ...options,
        };
    }

    protected options: RouterOptions & typeof defaultRouterOptions;

    private rootNode = new RouteNode<K>();
    private leafNodes = new Map<K, RouteNode<K>>();

    /**
     * @description
     * Adds a new route
     *
     * @param key name of the route
     * @param template template for the route, als defines parameters
     */
    public insertRoute(key: K, template: string) {
        const leafNode = this.rootNode.insert(
            key,
            template,
            this.options.parameterPlaceholderRE,
        );
        this.leafNodes.set(key, leafNode);
        return this;
    }

    /**
     * @description
     * Match the path against a known routes and parse the parameters in it
     * 
     * @param path path to match
     * @returns tuple with the route name or null if no route found. Then the parameters
     */
    public parseRoute(
        path: string,
    ): [K | null, Record<string, string>] {
        const [routeKey, parameterNames, parameterValues] = this.rootNode.parse(
            path,
            this.options.maximumParameterValueLength,
        );
        if (routeKey == null) {
            return [null, {}];
        }

        const parameters: Record<string, string> = {};
        for (let index = 0; index < parameterNames.length; index++) {
            const parameterName = parameterNames[Number(index)];
            const parameterValue = parameterValues[Number(index)];
            parameters[String(parameterName)] = this.options.parameterValueDecoder(parameterValue);
        }

        return [
            routeKey,
            parameters,
        ];
    }

    /**
     * @description
     * Convert a route to a path string.
     * 
     * @param routeKey route to stringify
     * @param routeParameters parameters to include in the path
     * @returns string representing the route or null if the route is not found by name
     */
    public stringifyRoute(
        routeKey: K,
        routeParameters: Record<string, string> = {},
    ): string | null {
        const node = this.leafNodes.get(routeKey);
        if (!node) return null;

        const parameterValues = new Array<string>();
        for (const parameterName of node.routeParameterNames) {
            const parameterValue = routeParameters[String(parameterName)];
            parameterValues.push(this.options.parameterValueEncoder(parameterValue));
        }

        return node.stringify(parameterValues);
    }
}
