import { getRootNode, makeRouteNode, optimizeRouteNode, parseRoute, RouteNode, stringifyRoute } from "./route-node.js";
import { Route } from "./route.js";

export class Router {

    private rootNode: RouteNode = {
        name: null,
        anchor: "",
        parameter: null,
        children: [],
        parent: null,
    }
    private leafNodes = new Map<string, RouteNode>();

    public parseRoute(path: string): Route | null {
        const route = parseRoute(this.rootNode, path);
        return route;
    }

    public insertRoute(name: string, template: string) {
        const newNode = makeRouteNode(name, template);
        this.leafNodes.set(name, newNode);

        const rootChildNode = getRootNode(newNode);
        rootChildNode.parent = this.rootNode;
        this.rootNode.children.push(rootChildNode);

        optimizeRouteNode(rootChildNode);
    }

    public stringifyRoute(route: Route): string | null {
        const node = this.leafNodes.get(route.name);
        if (!node) return null;
        return stringifyRoute(node, route.parameters);
    }
}
