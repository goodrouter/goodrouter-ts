import { getRootNode, makeRouteNode, parseRoute, RouteNode, stringifyRoute } from "./route-node.js";
import { Route } from "./route.js";

export class Router {

    private rootNodes = new Array<RouteNode>();
    private leafNodes = new Map<string, RouteNode>();

    public parseRoute(path: string): Route | null {
        for (const rootNode of this.rootNodes) {
            const route = parseRoute(rootNode, path);
            if (route) return route;
        }
        return null;
    }

    public insertRoute(name: string, template: string) {
        const node = makeRouteNode(name, template);
        const rootNode = getRootNode(node);

        this.rootNodes.push(rootNode);
        this.leafNodes.set(name, node);

        // this.rootNodes.sort(compareRouteNodes);
    }

    public stringifyRoute(route: Route): string | null {
        const node = this.leafNodes.get(route.name);
        if (!node) return null;
        return stringifyRoute(node, route.parameters);
    }
}
