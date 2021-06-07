import { findRoute, insertRoute, RouteNode } from "./route-node.js";
import { Route } from "./route.js";

export class Router {

    constructor(
        private rootNode: RouteNode | null = null,
    ) {

    }

    public getRootNode() {
        return this.rootNode;
    }

    public findRoute(path: string): Route | null {
        return findRoute(this.rootNode, path);
    }

    public insertRoute(name: string, template: string) {
        this.rootNode = insertRoute(this.rootNode, name, template);
    }
}
