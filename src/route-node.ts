import { emitTemplatePathParts } from "./path.js";
import { Route } from "./route.js";
import { findCommonPrefixLength } from "./string.js";

export interface RouteNode {
    // name that identifies the route
    name: string | null;
    // suffix that comes after the parameter value (if any!) of the path
    anchor: string;
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
    encode: (value: string) => string,
) {
    let path = "";
    while (node) {
        path = node.anchor + path;
        if (node.parameter && node.parameter in parameters) {
            path = encode(parameters[node.parameter]) + path;
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

        // get the paremeter value
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

    const anchor = parts.pop()!;
    const parameter = parts.pop() ?? null;

    const node: RouteNode = {
        name,
        anchor,
        parameter,
        children: [],
        parent: null,
    };
    let rootNode = node;

    while (parts.length > 0) {
        const anchor = parts.pop()!;
        const parameter = parts.pop() ?? null;

        const parentNode = {
            anchor,
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

export function routeNodeOrder(a: RouteNode, b: RouteNode) {
    if ((a.parameter == null) > (b.parameter == null)) return -1;
    if ((a.parameter == null) < (b.parameter == null)) return 1;

    if ((a.name == null) > (b.name == null)) return -1;
    if ((a.name == null) < (b.name == null)) return 1;

    if (a.anchor.length > b.anchor.length) return -1;
    if (a.anchor.length < b.anchor.length) return 1;

    if (a.anchor > b.anchor) return -1;
    if (a.anchor < b.anchor) return 1;

    return 0;
}

export function routeNodeEqual(a: RouteNode, b: RouteNode) {
    return (
        a.name === b.name &&
        a.anchor === b.anchor &&
        a.parameter === b.parameter
    );
}

export function optimizeRouteNode(newNode: RouteNode) {
    const parentNode = newNode.parent;
    if (!parentNode) throw new Error("cannot optimize root node");

    const newNodeIndex = parentNode.children.indexOf(newNode);

    // First, find a similar node, a route with a common anchor prefix

    let similarNodeIndex = -1;
    let similarNode: RouteNode | null = null;
    let commonPrefix = "";

    for (
        let childNodeIndex = 0;
        childNodeIndex < parentNode.children.length;
        childNodeIndex++
    ) {
        if (childNodeIndex === newNodeIndex) continue;

        const childNode = parentNode.children[childNodeIndex];

        const commonPrefixLength = findCommonPrefixLength(newNode.anchor, childNode.anchor);
        if (commonPrefixLength === 0) continue;

        commonPrefix = newNode.anchor.substring(0, commonPrefixLength);
        similarNodeIndex = childNodeIndex;
        similarNode = childNode;

        break;
    }

    if (similarNode == null) {
        // no similar node found! cannot optimize this node
        return;
    }

    // now that we found a similar node, lets figure out what strategy we need to merge

    if (newNode.anchor === similarNode.anchor) {
        if (
            newNode.name != null &&
            similarNode.name != null &&
            newNode.name !== similarNode.name
        ) {
            throw new Error("ambiguous route");
        }

        if (
            newNode.parameter != null &&
            similarNode.parameter != null &&
            newNode.parameter !== similarNode.parameter
        ) {
            // this is kind of an edge case, the parameter names are different, but for the rest
            // the node is the same. We place an intermediate node that groups the two with an
            // empty anchor.

            const intermediateNode: RouteNode = {
                name: null,
                anchor: commonPrefix,
                parameter: null,
                children: [
                    similarNode,
                    newNode,
                ],
                parent: parentNode,
            };
            parentNode.children.splice(similarNodeIndex, 1, intermediateNode);
            parentNode.children.splice(newNodeIndex, 1);

            similarNode.anchor = "";
            similarNode.parent = intermediateNode;

            newNode.anchor = "";
            newNode.parent = intermediateNode;

            intermediateNode.children.sort(routeNodeOrder);
        }
        else {
            // The two nodes can be merged! This is great! we merge the names, parameter
            // and the children

            parentNode.children.splice(newNodeIndex, 1);

            similarNode.name ??= newNode.name;
            similarNode.parameter ??= newNode.parameter;
            similarNode.children.push(...newNode.children);

            newNode.children.forEach(child => child.parent = similarNode);
            newNode.children.forEach(optimizeRouteNode);

            similarNode.children.sort(routeNodeOrder);
        }
    }
    else if (newNode.anchor === commonPrefix) {
        // in this case the similar node should be child of the new node
        // because the new node anchor is a prefix of the similar node anchor

        parentNode.children.splice(similarNodeIndex, 1);

        similarNode.anchor = similarNode.anchor.substring(commonPrefix.length);

        newNode.children.push(similarNode);
        similarNode.parent = newNode;

        optimizeRouteNode(similarNode);

        newNode.children.sort(routeNodeOrder);
    }
    else if (similarNode.anchor === commonPrefix) {
        // this is the exact inverse of the previous clause

        parentNode.children.splice(newNodeIndex, 1);

        newNode.anchor = newNode.anchor.substring(commonPrefix.length);

        similarNode.children.push(newNode);
        newNode.parent = similarNode;

        optimizeRouteNode(newNode);

        similarNode.children.sort(routeNodeOrder);
    }
    else {
        // we encounteres two nodes that are not the same, and none of the two nodes
        // has an anchor that is a prefix of the other. Both nodes share a common prefix
        // in the anchor. We need an intermediate that has the common prefix as the
        // anchor with the two nodes as children. The common prefix is removed from the
        // anchor of the two nodes.

        const intermediateNode: RouteNode = {
            name: null,
            anchor: commonPrefix,
            parameter: null,
            children: [
                similarNode,
                newNode,
            ],
            parent: parentNode,
        };
        parentNode.children.splice(similarNodeIndex, 1, intermediateNode);
        parentNode.children.splice(newNodeIndex, 1);

        similarNode.anchor = similarNode.anchor.substring(commonPrefix.length);
        similarNode.parent = intermediateNode;

        newNode.anchor = newNode.anchor.substring(commonPrefix.length);
        newNode.parent = intermediateNode;

        intermediateNode.children.sort(routeNodeOrder);
    }

}

export function insertRouteNode(targetNode: RouteNode, name: string, template: string) {
    const chainNodes = [...newRouteNodeChain(name, template)];
    chainNodes.reverse();

    let currentNode = targetNode;
    for (const chainNode of chainNodes) {
        const similarChildResult = findSimilarChildNode(currentNode, chainNode);
        if (similarChildResult == null) {
            const childNode = { ...chainNode };
            childNode.parent = currentNode;
            currentNode.children.push(childNode);
            currentNode.children.sort(routeNodeOrder);
            currentNode = childNode;
        } else {
            const { commonPrefixLength, similarNode } = similarChildResult;
            const strategy = getInsertStrategy(similarNode, chainNode, commonPrefixLength);
            switch (strategy) {
                case "merge": {
                    similarNode.name ??= chainNode.name;
                    similarNode.parameter ??= chainNode.parameter;
                    similarNode.children.push(...chainNode.children);
                    similarNode.children.sort(routeNodeOrder);
                    currentNode = similarNode;
                    break;
                }

                case "add-to-left": {
                    chainNode.anchor = chainNode.anchor.substring(commonPrefixLength);
                    chainNode.parent = similarNode;

                    const childNode = similarNode.children.
                        find(childNode => routeNodeEqual(childNode, chainNode));
                    if (childNode == null) {
                        similarNode.children.push(chainNode);
                        similarNode.children.sort(routeNodeOrder);
                        currentNode = chainNode;
                    }
                    else {
                        currentNode = childNode;
                    }
                    break;
                }

                case "add-to-right": {
                    similarNode.anchor = similarNode.anchor.substring(commonPrefixLength);
                    similarNode.parent = chainNode;

                    const childNode = chainNode.children.
                        find(childNode => routeNodeOrder(childNode, similarNode) === 0);
                    if (childNode == null) {
                        chainNode.children.push(similarNode);
                        chainNode.children.sort(routeNodeOrder);
                        currentNode = similarNode;
                    }
                    else {
                        currentNode = childNode;
                    }
                    break;
                }

                case "intermediate": {
                    const intermediateNode = {
                        anchor: similarNode.anchor.substring(0, commonPrefixLength),
                        name: null,
                        parameter: null,
                        children: [
                            similarNode,
                            chainNode,
                        ],
                        parent: currentNode,
                    };
                    intermediateNode.children.sort(routeNodeOrder);

                    currentNode.children.splice(
                        currentNode.children.indexOf(similarNode),
                        1,
                        intermediateNode,
                    );
                    currentNode.children.sort(routeNodeOrder);

                    similarNode.parent = intermediateNode;
                    chainNode.parent = intermediateNode;

                    similarNode.anchor = similarNode.anchor.substring(commonPrefixLength);
                    chainNode.anchor = chainNode.anchor.substring(commonPrefixLength);

                    currentNode = chainNode;
                    break;
                }
            }

        }
    }

    return currentNode;
}

export function* newRouteNodeChain(name: string, template: string): Iterable<RouteNode> {
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
    for (const childNode of targetNode.children) {
        if (childNode.parameter != null) continue;
        if (childNode.name != null) continue;

        const commonPrefixLength = findCommonPrefixLength(otherNode.anchor, childNode.anchor);

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
