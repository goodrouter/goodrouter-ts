import { findRoute, insertRoute, Route, RouteNode } from "./route-node.js";

export class Router {

    constructor(
        private rootNode: RouteNode = {
            name: null,
            children: [],
            parameter: null,
            suffix: "",
        },
    ) {

    }

    public findRoute(path: string): Route | null {
        return findRoute(this.rootNode, path);
    }

    public insertRoute(template: string) {
        this.rootNode = insertRoute(this.rootNode, template);
    }
}
