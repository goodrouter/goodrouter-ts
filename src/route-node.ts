import { emitTemplatePathParts } from "./path.js";
import { Route } from "./route.js";
import { findCommonPrefixLength } from "./string.js";

/**
 * @description
 * This interface represents a node in the tree structure that holds all the node
 * for the routes
 */
export interface RouteNode {
    /**
     * @description
     * name that identifies the route
     */
    name: string | null;
    /**
     * @description
     * suffix that comes after the parameter value (if any!) of the path
     */
    anchor: string;
    /**
     * @description
     * parameter name or null if this node does not represent a parameter
     */
    parameter: string | null;
    /**
     * @description
     * children that represent the rest of the path that needs to be matched
     */
    children: RouteNode[];
    /**
     * @description
     * parent node, should only be null for the root node
     */
    parent: RouteNode | null;
}

export function newRootRouteNode(): RouteNode {
    return {
        name: null,
        anchor: "",
        parameter: null,
        children: [],
        parent: null,
    };
}

export function stringifyRoute(
    node: RouteNode | null,
    parameters: Record<string, string> = {},
    encode: (value: string) => string,
) {
    let path = "";
    while (node) {
        path = node.anchor + path;
        if (node.parameter != null && node.parameter in parameters) {
            const value = parameters[node.parameter];
            path = encode(value) + path;
        }
        node = node.parent;
    }
    return path;
}

export function parseRoute(
    node: RouteNode | null,
    path: string,
    decode: (value: string) => string,
    parameters: Record<string, string> = {},
): Route | null {
    if (!node) return null;

    if (node.parameter == null) {
        // if this node does not represent a parameter we expect the path to start with the `anchor`
        if (!path.startsWith(node.anchor)) {
            // this node does not match the path
            return null;
        }

        // we successfully matches the node to the path, now remove the matched part from the path
        path = path.substring(node.anchor.length);
    }
    else {
        // we are matching a parameter value! If the path's length is 0, there is no match, because a parameter value should have at least length 1
        if (path.length === 0) return null;

        // look for the anchor in the path (note: indexOf is probably the most expensive operation!) If the anchor is empty, match the remainder of the path
        const index = node.anchor.length === 0 ?
            path.length :
            path.indexOf(node.anchor);
        if (index < 0) {
            return null;
        }

        // get the parameter value
        const value = decode(path.substring(0, index));

        // remove the matches part from the path
        path = path.substring(index + node.anchor.length);

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
            decode,
            parameters,
        );

        // if a childnode is matches, return that node instead of the current! So childnodes are matches first!
        if (route != null) return route;
    }

    // if the node had a route name and there is no path left to match against then we found a route
    if (node.name != null && path.length === 0) {
        return {
            name: node.name,
            parameters,
        };
    }

    // we did not found a route :-(
    return null;
}

export function insertRouteNode(targetNode: RouteNode, name: string, template: string) {
    const chainNodes = [...newRouteNodeChain(name, template)];
    chainNodes.reverse();

    let currentNode = targetNode;
    for (const chainNode of chainNodes) {
        const similarChildResult = findSimilarChildNode(currentNode, chainNode);
        if (similarChildResult == null) {
            currentNode = insertUniqueRoute(
                currentNode,
                chainNode,
            );
        }
        else {
            const { commonPrefixLength, similarNode } = similarChildResult;
            currentNode = insertSimilarRoute(
                currentNode,
                chainNode,
                similarNode,
                commonPrefixLength,
            );
        }
    }

    return currentNode;
}

export function routeNodeCompare(a: RouteNode, b: RouteNode) {
    if (a.anchor.length < b.anchor.length) return 1;
    if (a.anchor.length > b.anchor.length) return -1;

    if ((a.name == null) < (b.name == null)) return 1;
    if ((a.name == null) > (b.name == null)) return -1;

    if ((a.parameter == null) < (b.parameter == null)) return -1;
    if ((a.parameter == null) > (b.parameter == null)) return 1;

    if (a.anchor < b.anchor) return -1;
    if (a.anchor > b.anchor) return 1;

    return 0;
}

export function routeNodeEqual(a: RouteNode, b: RouteNode) {
    return (
        a.name === b.name &&
        a.anchor === b.anchor &&
        a.parameter === b.parameter
    );
}

function insertUniqueRoute(
    currentNode: RouteNode,
    chainNode: RouteNode,
) {
    const childNode = { ...chainNode };
    childNode.parent = currentNode;
    currentNode.children.push(childNode);
    currentNode.children.sort(routeNodeCompare);
    return childNode;
}

function insertSimilarRoute(
    currentNode: RouteNode,
    chainNode: RouteNode,
    similarNode: RouteNode,
    commonPrefixLength: number,
) {
    const strategy = getInsertStrategy(similarNode, chainNode, commonPrefixLength);
    switch (strategy) {
        case "merge": {
            similarNode.children.push(...chainNode.children);
            similarNode.children.sort(routeNodeCompare);
            return similarNode;
        }

        case "add-to-left": {
            chainNode.anchor = chainNode.anchor.substring(commonPrefixLength);
            chainNode.parent = similarNode;

            // similarNode.parameter = chainNode.parameter;
            chainNode.parameter = null;

            const childNode = similarNode.children.
                find(childNode => routeNodeEqual(childNode, chainNode));
            if (childNode == null) {
                similarNode.parent = currentNode;
                similarNode.children.push(chainNode);
                similarNode.children.sort(routeNodeCompare);
                return chainNode;
            }
            else {
                return childNode;
            }
        }

        case "add-to-right": {
            similarNode.anchor = similarNode.anchor.substring(commonPrefixLength);
            similarNode.parent = chainNode;

            // chainNode.parameter = similarNode.parameter;
            similarNode.parameter = null;

            const childNode = chainNode.children.
                find(childNode => routeNodeEqual(childNode, similarNode));
            if (childNode == null) {
                chainNode.parent = currentNode;
                chainNode.children.push(similarNode);
                chainNode.children.sort(routeNodeCompare);
                return similarNode;
            }
            else {
                return childNode;
            }
        }

        case "intermediate": {
            const intermediateNode = {
                anchor: similarNode.anchor.substring(0, commonPrefixLength),
                name: null,
                parameter: similarNode.parameter,
                children: [
                    similarNode,
                    chainNode,
                ],
                parent: currentNode,
            };
            intermediateNode.children.sort(routeNodeCompare);

            currentNode.children.splice(
                currentNode.children.indexOf(similarNode),
                1,
                intermediateNode,
            );
            currentNode.children.sort(routeNodeCompare);

            similarNode.parent = intermediateNode;
            chainNode.parent = intermediateNode;

            similarNode.anchor = similarNode.anchor.substring(commonPrefixLength);
            chainNode.anchor = chainNode.anchor.substring(commonPrefixLength);

            similarNode.parameter = null;
            chainNode.parameter = null;

            return chainNode;
        }
    }

}

function* newRouteNodeChain(name: string, template: string): Iterable<RouteNode> {
    const parts = [...emitTemplatePathParts(template)];
    let currentName: string | null = name;

    while (parts.length > 0) {
        const anchor = parts.pop();
        const parameter = parts.pop() ?? null;

        if (anchor == null) {
            throw new TypeError("expected anchors");
        }

        yield {
            anchor,
            name: currentName,
            parameter,
            children: [],
            parent: null,
        };

        currentName = null;
    }

}

function findSimilarChildNode(targetNode: RouteNode, otherNode: RouteNode) {
    if (targetNode.parameter != null) return;

    for (const childNode of targetNode.children) {
        const commonPrefixLength = findCommonPrefixLength(otherNode.anchor, childNode.anchor);

        if (childNode.parameter != null) continue;

        if (commonPrefixLength === 0) continue;

        return { commonPrefixLength, similarNode: childNode };
    }
}

function getInsertStrategy(leftNode: RouteNode, rightNode: RouteNode, commonPrefixLength: number) {
    const commonPrefix = leftNode.anchor.substring(0, commonPrefixLength);

    if (leftNode.anchor === rightNode.anchor) {
        if (
            leftNode.name != null &&
            rightNode.name != null &&
            leftNode.name !== rightNode.name
        ) {
            throw new Error("ambiguous route");
        }
        else if (
            leftNode.parameter != null &&
            rightNode.parameter != null &&
            leftNode.parameter !== rightNode.parameter
        ) {
            return "intermediate" as const;
        }
        else {
            return "merge" as const;
        }
    }
    else if (leftNode.anchor === commonPrefix) {
        return "add-to-left" as const;
    }
    else if (rightNode.anchor === commonPrefix) {
        return "add-to-right" as const;
    }
    else {
        return "intermediate" as const;
    }
}
