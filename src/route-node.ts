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
}

export function findRoute(
    node: RouteNode | null,
    path: string,
    parameters: Record<string, string> = {},
): Route | null {
    if (!node) return null;

    if (node.parameter === null) {
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
        const route = findRoute(
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

export function insertRoute(
    node: RouteNode | null,
    name: string,
    template: string,
) {
    let newNode = makeRouteNode(name, template);
    if (!node) return newNode;

    newNode = {
        name: null,
        children: [
            node,
            newNode,
        ],
        parameter: null,
        suffix: "",
    };
    newNode = optimizeRouteNode(newNode);

    return newNode;
}

export function optimizeRouteNode(node: RouteNode): RouteNode {
    node = explodeRouteNodes(node);
    node = mergeRouteNodes(node);
    node = implodeRouteNodes(node);
    node = sortRouteNodes(node);
    return node;
}

export function sortRouteNodes(node: RouteNode): RouteNode {
    const children = node.children.map(sortRouteNodes);
    children.sort(compareRouteNodes);
    return {
        ...node,
        children,
    };
}

export function explodeRouteNodes(node: RouteNode): RouteNode {
    const suffix = node.suffix;
    const suffixLength = suffix.length;

    node = {
        ...node,
        children: node.children.map(explodeRouteNodes),
    };

    if (suffixLength <= 1) {
        return node;
    }

    const parameter = node.parameter;
    const name = node.name;

    for (let index = suffixLength - 1; index >= 0; index--) {
        if (index === suffixLength - 1) {
            node = {
                suffix: suffix[index],
                name,
                parameter: null,
                children: node.children,
            };
        }
        else if (index === 0) {
            node = {
                suffix: suffix[index],
                name: null,
                parameter,
                children: [node],
            };
        }
        else {
            node = {
                suffix: suffix[index],
                name: null,
                parameter: null,
                children: [node],
            };
        }
    }

    return node;
}

export function implodeRouteNodes(node: RouteNode): RouteNode {
    node = {
        ...node,
        children: node.children.map(implodeRouteNodes),
    };

    if (node.children.length === 1) {
        const [child] = node.children;

        if (node.name === null && child.parameter === null) {
            node = {
                suffix: node.suffix + child.suffix,
                parameter: node.parameter,
                name: child.name,
                children: child.children,
            };
        }
    }

    return node;
}

export function mergeRouteNodes(node: RouteNode): RouteNode {
    let children = [...node.children];

    children.sort((a, b) => {
        if (a.suffix > b.suffix) return 1;
        if (a.suffix < b.suffix) return -1;
        return 0;
    });

    for (let childIndex = 1; childIndex < children.length; childIndex++) {
        const child = children[childIndex];
        const childPrev = children[childIndex - 1];

        // when suffix is not the same we won't merge
        if (
            child.suffix !== childPrev.suffix
        ) continue;

        // merge when parameter is the same or null
        if (
            child.parameter !== null &&
            childPrev.parameter !== null &&
            child.parameter !== childPrev.parameter
        ) continue;

        // merge when name is the same or null
        if (
            child.name !== null &&
            childPrev.name !== null &&
            child.name !== childPrev.name
        ) continue;

        child.name ??= childPrev.name;
        child.parameter ??= childPrev.parameter;

        child.children = [
            ...childPrev.children,
            ...child.children,
        ];

        delete children[childIndex - 1];
    }

    children = children.
        filter(child => child).
        map(mergeRouteNodes);

    return {
        ...node,
        children,
    };
}

export function makeRouteNode(
    name: string,
    template: string,
) {
    const parts = Array.from(emitTemplatePathParts(template));

    const suffix = parts.pop();
    const parameter = parts.pop() ?? null;
    assert(suffix !== undefined);

    let node: RouteNode = {
        suffix,
        name,
        parameter,
        children: [],
    };

    while (parts.length > 0) {
        const suffix = parts.pop();
        const parameter = parts.pop() ?? null;
        assert(suffix !== undefined);

        node = {
            suffix,
            name: null,
            parameter,
            children: [node],
        };
    }

    return node;
}

export function compareRouteNodes(a: RouteNode, b: RouteNode) {
    if ((a.parameter === null) > (b.parameter === null)) return -1;
    if ((a.parameter === null) < (b.parameter === null)) return 1;

    if ((a.name === null) > (b.name === null)) return -1;
    if ((a.name === null) < (b.name === null)) return 1;

    if (a.suffix.length > b.suffix.length) return -1;
    if (a.suffix.length < b.suffix.length) return 1;

    if (a.suffix > b.suffix) return 1;
    if (a.suffix < b.suffix) return -1;

    return 0;

}
