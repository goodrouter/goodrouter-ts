import { getRootNode, makeRouteNode, optimizeRouteNode, parseRoute, RouteNode, stringifyRoute } from "./route-node.js";
import { Route } from "./route.js";

export interface RouterOptions {
    encode?: (value: string) => string
    decode?: (value: string) => string
}

export class Router {

    protected options: Required<RouterOptions>

    constructor(options: RouterOptions = {}) {
        this.options = {
            encode: encodeURIComponent,
            decode: decodeURIComponent,
            ...options,
        };
    }

    private rootNode: RouteNode = {
        name: null,
        anchor: "",
        parameter: null,
        children: [],
        parent: null,
    }
    private leafNodes = new Map<string, RouteNode>();

    public parseRoute(path: string): Route | null {
        const route = parseRoute(this.rootNode, path, this.options.decode);
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
        return stringifyRoute(node, route.parameters, this.options.encode);
    }
}
