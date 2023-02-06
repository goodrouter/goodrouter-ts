import { emitTemplatePathParts } from "./path.js";
import { Route } from "./route.js";
import { findCommonPrefixLength } from "./string.js";

/**
 * @description
 * This interface represents a node in the tree structure that holds all the node
 * for the routes
 */
export class RouteNode {
    /**
     * @description
     * children that represent the rest of the path that needs to be matched
     */
    children = new Array<RouteNode>;
    /**
     * @description
     * parent node, should only be null for the root node
     */
    parent: RouteNode | null = null;

    constructor(
        /**
         * @description
         * suffix that comes after the parameter value (if any!) of the path
         */
        public anchor = "",
        /**
         * @description
         * parameter name or null if this node does not represent a parameter
         */
        public parameter: string | null = null,
        /**
         * @description
         * name that identifies the route
         */
        public name: string | null = null,
    ) {

    }

    parse(
        path: string,
        decode: (value: string) => string,
        parameters: Record<string, string> = {},
    ): Route | null {
        if (this.parameter == null) {
            // if this node does not represent a parameter we expect the path to start with the `anchor`
            if (!path.startsWith(this.anchor)) {
                // this node does not match the path
                return null;
            }

            // we successfully matches the node to the path, now remove the matched part from the path
            path = path.substring(this.anchor.length);
        }
        else {
            // we are matching a parameter value! If the path's length is 0, there is no match, because a parameter value should have at least length 1
            if (path.length === 0) {
                return null;
            }

            // look for the anchor in the path (note: indexOf is probably the most expensive operation!) If the anchor is empty, match the remainder of the path
            const index = this.anchor.length === 0 ?
                path.length :
                path.indexOf(this.anchor);
            if (index < 0) {
                return null;
            }

            // get the parameter value
            const value = decode(path.substring(0, index));

            // remove the matches part from the path
            path = path.substring(index + this.anchor.length);

            // update parameters, parameters is immutable!
            parameters = {
                ...parameters,
                [this.parameter]: value,
            };
        }

        for (const childNode of this.children) {
            // find a route in every child node
            const route = childNode.parse(
                path,
                decode,
                parameters,
            );

            // if a child node is matches, return that node instead of the current! So child nodes are matches first!
            if (route != null) return route;
        }

        // if the node had a route name and there is no path left to match against then we found a route
        if (this.name != null && path.length === 0) {
            return {
                name: this.name,
                parameters,
            };
        }

        // we did not found a route :-(
        return null;
    }

    stringify(
        parameters: Record<string, string> = {},
        encode: (value: string) => string,
    ) {
        let path = "";
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentNode: RouteNode | null = this;
        while (currentNode != null) {
            path = currentNode.anchor + path;
            if (currentNode.parameter != null && currentNode.parameter in parameters) {
                const value = parameters[currentNode.parameter];
                path = encode(value) + path;
            }
            currentNode = currentNode.parent;
        }
        return path;
    }

    compare(other: RouteNode) {
        if (this.anchor.length < other.anchor.length) return 1;
        if (this.anchor.length > other.anchor.length) return -1;

        if ((this.name == null) < (other.name == null)) return 1;
        if ((this.name == null) > (other.name == null)) return -1;

        if ((this.parameter == null) < (other.parameter == null)) return -1;
        if ((this.parameter == null) > (other.parameter == null)) return 1;

        if (this.anchor < other.anchor) return -1;
        if (this.anchor > other.anchor) return 1;

        return 0;
    }

    equal(other: RouteNode) {
        return (
            this.name === other.name &&
            this.anchor === other.anchor &&
            this.parameter === other.parameter
        );
    }

}

export function insertRouteNode(targetNode: RouteNode, name: string, template: string) {
    const chainNodes = [...newRouteNodeChain(name, template)];
    chainNodes.reverse();

    let currentNode = targetNode;
    for (const chainNode of chainNodes) {
        const similarChildResult = findSimilarChildNode(currentNode, chainNode);
        if (similarChildResult == null) {
            currentNode = insertRouteNew(
                currentNode,
                chainNode,
            );
        }
        else {
            const { commonPrefixLength, similarNode } = similarChildResult;
            const strategy = getInsertStrategy(similarNode, chainNode, commonPrefixLength);
            switch (strategy) {
                case "merge":
                    currentNode = insertRouteMerge(
                        currentNode,
                        chainNode,
                        similarNode,
                    );
                    break;

                case "add-to-left":
                    currentNode = insertRouteAddTo(
                        currentNode,
                        chainNode,
                        similarNode,
                        commonPrefixLength,
                    );
                    break;

                case "add-to-right":
                    currentNode = insertRouteAddTo(
                        currentNode,
                        similarNode,
                        chainNode,
                        commonPrefixLength,
                    );
                    break;

                case "intermediate":
                    currentNode = insertRouteIntermediate(
                        currentNode,
                        chainNode,
                        similarNode,
                        commonPrefixLength,
                    );
                    break;
            }

        }
    }

    return currentNode;
}

function insertRouteNew(
    currentNode: RouteNode,
    chainNode: RouteNode,
) {
    const childNode = new RouteNode(
        chainNode.anchor,
        chainNode.parameter,
        chainNode.name,
    );
    childNode.parent = currentNode;
    currentNode.children.push(childNode);
    currentNode.children.sort((a, b) => a.compare(b));
    return childNode;
}
function insertRouteMerge(
    currentNode: RouteNode,
    appendNode: RouteNode,
    receivingNode: RouteNode,
) {
    receivingNode.children.push(...appendNode.children);
    receivingNode.children.sort((a, b) => a.compare(b));
    return receivingNode;
}
function insertRouteAddTo(
    currentNode: RouteNode,
    addNode: RouteNode,
    receivingNode: RouteNode,
    commonPrefixLength: number,
) {
    addNode.anchor = addNode.anchor.substring(commonPrefixLength);
    addNode.parent = receivingNode;

    // addNode.parameter = receivingNode.parameter;
    addNode.parameter = null;

    const childNode = receivingNode.children.
        find(childNode => childNode.equal(addNode));
    if (childNode == null) {
        receivingNode.parent = currentNode;
        receivingNode.children.push(addNode);
        receivingNode.children.sort((a, b) => a.compare(b));
        return addNode;
    }
    else {
        return childNode;
    }
}
function insertRouteIntermediate(
    currentNode: RouteNode,
    newNode: RouteNode,
    childNode: RouteNode,
    commonPrefixLength: number,
) {
    const intermediateNode = new RouteNode(
        childNode.anchor.substring(0, commonPrefixLength),
        childNode.parameter,
    );
    intermediateNode.parent = currentNode;
    intermediateNode.children.push(childNode);
    intermediateNode.children.push(newNode);
    intermediateNode.children.sort((a, b) => a.compare(b));

    currentNode.children.splice(
        currentNode.children.indexOf(childNode),
        1,
        intermediateNode,
    );
    currentNode.children.sort((a, b) => a.compare(b));

    childNode.parent = intermediateNode;
    newNode.parent = intermediateNode;

    childNode.anchor = childNode.anchor.substring(commonPrefixLength);
    newNode.anchor = newNode.anchor.substring(commonPrefixLength);

    childNode.parameter = null;
    newNode.parameter = null;

    return newNode;
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

        yield new RouteNode(
            anchor,
            parameter,
            currentName,
        );

        currentName = null;
    }

}

function findSimilarChildNode(targetNode: RouteNode, otherNode: RouteNode) {
    if (targetNode.parameter != null) return;

    for (const childNode of targetNode.children) {
        if (childNode.parameter != null) continue;

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
