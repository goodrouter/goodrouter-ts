import assert from "assert";
import { emitTemplatePathParts } from "./path.js";
import { Route } from "./route.js";

export interface RouteNode {
    // name that identifies the route
    name: string | null;
    // suffix that comes after the parameter value (if any!) of the path
    suffix: string;
    // parameter name or null if this node does not represent a prameter
    parameter: string | null;
    // children that represent the rest of the path that needs to be matched
    children: RouteNode[];
    // parent node, should only be null for the root node
    parent: RouteNode | null;
}

export function stringifyRoute(
    node: RouteNode | null,
    parameters: Record<string, string> = {},
) {
    let path = "";
    while (node) {
        path = node.suffix + path;
        if (node.parameter && node.parameter in parameters) {
            path = parameters[node.parameter] + path;
        }
        node = node.parent;
    }
    return path;
}

export function parseRoute(
    node: RouteNode | null,
    path: string,
    parameters: Record<string, string> = {},
): Route | null {
    if (!node) return null;

    if (node.parameter == null) {
        // if this node does not represent a parameter we expect the path to start with the suffix
        if (!path.startsWith(node.suffix)) {
            // this node does not match the path
            return null;
        }

        // we successfully matches the node to the path, now remove the matched part from the path
        path = path.substring(node.suffix.length);
    }
    else {
        // we are matching a parameter value! If the path's length is 0, there is no match, because a parameter value should have at least length 1
        if (path.length === 0) return null;

        // look for the suffix in the path (note: indexOf is probably the most expensive operation!) If the suffix is empty, match the remainder of the path
        const index = node.suffix.length === 0 ?
            path.length :
            path.indexOf(node.suffix);
        if (index < 0) {
            return null;
        }

        // get the paremeter value
        const value = decodeURIComponent(path.substring(0, index));

        // remove the matches part from the path
        path = path.substring(index + node.suffix.length);

        // update parameters, parameters is immutable!
        parameters = {
            ...parameters,
            [node.parameter]: value,
        };
    }

    for (const childNode of node.children) {
        // find a route in every child node
        const route = parseRoute(
            childNode,
            path,
            parameters,
        );

        // if a childnoide is matches, return that node instead of the current! So childnodes are matches first!
        if (route !== null) return route;
    }

    // if the node had a route name and there is no path left to match against then we found a route
    if (node.name !== null && path.length === 0) {
        return {
            name: node.name,
            parameters,
        };
    }

    // we have not found a route :-(
    return null;
}

export function getRootNode(node: RouteNode) {
    while (node.parent) {
        node = node.parent;
    }
    return node;
}

export function makeRouteNode(
    name: string,
    template: string,
) {
    const parts = Array.from(emitTemplatePathParts(template));

    const suffix = parts.pop();
    const parameter = parts.pop() ?? null;
    assert(suffix !== undefined);

    const node: RouteNode = {
        suffix,
        name,
        parameter,
        children: [],
        parent: null,
    };
    let rootNode = node;

    while (parts.length > 0) {
        const suffix = parts.pop();
        const parameter = parts.pop() ?? null;
        assert(suffix !== undefined);

        const parentNode = {
            suffix,
            name: null,
            parameter,
            children: [rootNode],
            parent: null,
        };
        rootNode.parent = parentNode;
        rootNode = parentNode;
    }

    return node;
}

export function compareRouteNodes(a: RouteNode, b: RouteNode) {
    if ((a.parameter == null) > (b.parameter == null)) return -1;
    if ((a.parameter == null) < (b.parameter == null)) return 1;

    if ((a.name == null) > (b.name == null)) return -1;
    if ((a.name == null) < (b.name == null)) return 1;

    if (a.suffix.length > b.suffix.length) return -1;
    if (a.suffix.length < b.suffix.length) return 1;

    if (a.suffix > b.suffix) return 1;
    if (a.suffix < b.suffix) return -1;

    return 0;

}

export function sortRouteNodeAndParents(node: RouteNode) {
    node.children.sort(compareRouteNodes);
    if (node.parent) {
        sortRouteNodeAndParents(node.parent);
    }
}

export function optimizeRouteNode(node: RouteNode) {
    sortRouteNodeAndParents(node);
}
