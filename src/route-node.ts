import { emitTemplatePathParts } from "./path.js";
import { Route } from "./route.js";
import { findCommonPrefixLength } from "./string.js";

/**
 * @description
 * This interface represents a node in the tree structure that holds all the node
 * for the routes
 */
export class RouteNode {

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

    public maximumParameterValueLength = 20;

    /**
     * @description
     * children that represent the rest of the path that needs to be matched
     */
    private readonly children = new Array<RouteNode>();
    /**
     * @description
     * parent node, should only be null for the root node
     */
    private parent: RouteNode | null = null;

    getChildren(): Iterable<RouteNode> {
        return this.children.values();
    }

    countChildren() {
        return this.children.length;
    }

    getParent() {
        return this.parent;
    }

    addChild(childNode: RouteNode) {
        if (childNode.parent === this) {
            throw new TypeError("cannot add childNode to self");
        }

        if (childNode.parent != null) {
            throw new TypeError("childNode already has parent");
        }

        childNode.parent = this;
        this.children.push(childNode);
        this.children.sort((a, b) => a.compare(b));
    }

    removeChild(childNode: RouteNode) {
        const childIndex = this.children.indexOf(childNode);

        if (childNode.parent !== this || childIndex < 0) {
            throw new TypeError("childNode is not a child of this node");
        }

        childNode.parent = null;
        this.children.splice(childIndex, 1);
    }

    insert(
        name: string,
        template: string,
    ) {
        const newNodes = [...newRouteNodesFromTemplate(name, template)];

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentNode: RouteNode = this;
        for (const newNode of newNodes) {
            const [commonPrefixLength, childNode] = currentNode.findSimilarChild(newNode);

            currentNode = currentNode.merge(
                childNode,
                newNode,
                commonPrefixLength,
            );
        }

        return currentNode;
    }

    parse(
        path: string,
        decode: (value: string, name: string) => string,
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
                path.indexOf(this.anchor.substring(0, this.maximumParameterValueLength));
            if (index < 0) {
                return null;
            }

            // get the parameter value
            const value = decode(path.substring(0, index), this.parameter);

            // remove the matches part from the path
            path = path.substring(index + this.anchor.length);

            // update parameters, parameters is immutable!
            parameters = {
                ...parameters,
                [this.parameter]: value,
            };
        }

        for (const childNode of this.getChildren()) {
            // find a route in every child node
            const route = childNode.parse(
                path,
                decode,
                parameters,
            );

            // if a child node is matches, return that node instead of the current! So child nodes are matches first!
            if (route != null) {
                return route;
            }
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
        encode: (value: string, name: string) => string,
    ) {
        let path = "";
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentNode: RouteNode | null = this;
        while (currentNode != null) {
            path = currentNode.anchor + path;
            if (
                currentNode.parameter != null &&
                parameters[currentNode.parameter] != null
            ) {
                const value = parameters[currentNode.parameter];
                path = encode(value, currentNode.parameter) + path;
            }
            currentNode = currentNode.parent;
        }
        return path;
    }

    private merge(
        childNode: RouteNode | null,
        newNode: RouteNode,
        commonPrefixLength: number,
    ) {
        if (childNode == null) {
            return this.mergeNew(
                newNode,
            );
        }

        const commonPrefix = childNode.anchor.substring(0, commonPrefixLength);

        if (childNode.anchor === newNode.anchor) {
            if (
                childNode.name != null &&
                newNode.name != null &&
                childNode.name !== newNode.name
            ) {
                throw new Error("ambiguous route");
            }
            else if (
                childNode.parameter != null &&
                newNode.parameter != null &&
                childNode.parameter !== newNode.parameter
            ) {
                return this.mergeIntermediate(
                    childNode,
                    newNode,
                    commonPrefixLength,
                );
            }
            else {
                return this.mergeJoin(
                    childNode,
                    newNode,
                );
            }
        }
        else if (childNode.anchor === commonPrefix) {
            return this.mergeAddToChild(
                childNode,
                newNode,
                commonPrefixLength,
            );
        }
        else if (newNode.anchor === commonPrefix) {
            return this.mergeAddToNew(
                childNode,
                newNode,
                commonPrefixLength,
            );
        }
        else {
            return this.mergeIntermediate(
                childNode,
                newNode,
                commonPrefixLength,
            );
        }
    }
    private mergeNew(
        newNode: RouteNode,
    ) {
        this.addChild(newNode);
        return newNode;
    }
    private mergeJoin(
        childNode: RouteNode,
        newNode: RouteNode,
    ) {
        childNode.name ??= newNode.name;
        return childNode;
    }
    private mergeIntermediate(
        childNode: RouteNode,
        newNode: RouteNode,
        commonPrefixLength: number,
    ) {
        this.removeChild(childNode);

        const intermediateNode = new RouteNode(
            childNode.anchor.substring(0, commonPrefixLength),
            childNode.parameter,
        );
        intermediateNode.addChild(childNode);
        intermediateNode.addChild(newNode);

        this.addChild(intermediateNode);

        childNode.anchor = childNode.anchor.substring(commonPrefixLength);
        newNode.anchor = newNode.anchor.substring(commonPrefixLength);

        childNode.parameter = null;
        newNode.parameter = null;

        return newNode;
    }
    private mergeAddToChild(
        childNode: RouteNode,
        newNode: RouteNode,
        commonPrefixLength: number,
    ): RouteNode {
        newNode.anchor = newNode.anchor.substring(commonPrefixLength);
        newNode.parameter = null;

        const [commonPrefixLength2, childNode2] = childNode.findSimilarChild(newNode);

        return childNode.merge(
            childNode2,
            newNode,
            commonPrefixLength2,
        );
    }
    private mergeAddToNew(
        childNode: RouteNode,
        newNode: RouteNode,
        commonPrefixLength: number,
    ): RouteNode {
        this.removeChild(childNode);
        this.addChild(newNode);

        newNode.addChild(childNode);

        childNode.anchor = childNode.anchor.substring(commonPrefixLength);
        childNode.parameter = null;

        return newNode;
    }

    private findSimilarChild(
        findNode: RouteNode,
    ) {
        for (const childNode of this.getChildren()) {
            if (childNode.parameter != null) continue;

            const commonPrefixLength = findCommonPrefixLength(findNode.anchor, childNode.anchor);
            if (commonPrefixLength === 0) continue;

            return [commonPrefixLength, childNode] as const;
        }

        return [0, null] as const;
    }

    // eslint-disable-next-line complexity
    compare(other: RouteNode) {
        if (this.anchor.length < other.anchor.length) return 1;
        if (this.anchor.length > other.anchor.length) return -1;

        if ((this.name == null) < (other.name == null)) return 1;
        if ((this.name == null) > (other.name == null)) return -1;

        if ((this.parameter == null) < (other.parameter == null)) return -1;
        if ((this.parameter == null) > (other.parameter == null)) return 1;

        if (this.countChildren() > other.countChildren()) return -1;
        if (this.countChildren() < other.countChildren()) return 1;

        if ((this.name ?? "") < (other.name ?? "")) return -1;
        if ((this.name ?? "") > (other.name ?? "")) return 1;

        if ((this.parameter ?? "") < (other.parameter ?? "")) return -1;
        if ((this.parameter ?? "") > (other.parameter ?? "")) return 1;

        if (this.anchor < other.anchor) return -1;
        if (this.anchor > other.anchor) return 1;

        return 0;
    }

    equal(other: RouteNode) {
        return this.anchor === other.anchor &&
            this.parameter === other.parameter &&
            this.name === other.name;
    }
}

function* newRouteNodesFromTemplate(
    routeName: string,
    routeTemplate: string,
): Iterable<RouteNode> {
    const parts = [...emitTemplatePathParts(routeTemplate)];

    for (let partIndex = 0; partIndex < parts.length; partIndex += 2) {
        const anchor = parts[partIndex + 0];
        const parameter = partIndex > 0 ?
            parts[partIndex - 1] :
            null;

        const name = (partIndex >= parts.length - 1) ?
            routeName :
            null;
        yield new RouteNode(
            anchor,
            parameter,
            name,
        );
    }

}

