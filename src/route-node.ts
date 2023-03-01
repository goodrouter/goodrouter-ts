import { Route } from "./route.js";
import { findCommonPrefixLength } from "./string.js";
import { splitTemplatePairs } from "./template.js";

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
         * does this node have a parameter value
         */
        public hasParameter = false,
        /**
         * @description
         * route
         */
        public route: Route | null = null,
    ) {

    }

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
            throw new Error("cannot add childNode to self");
        }

        if (childNode.parent != null) {
            throw new Error("childNode already has parent");
        }

        childNode.parent = this;
        this.children.push(childNode);
        this.children.sort((a, b) => a.compare(b));
    }

    removeChild(childNode: RouteNode) {
        const childIndex = this.children.indexOf(childNode);

        if (childNode.parent !== this || childIndex < 0) {
            throw new Error("childNode is not a child of this node");
        }

        childNode.parent = null;
        this.children.splice(childIndex, 1);
    }

    insert(
        name: string,
        template: string,
        parameterPlaceholderRE: RegExp,
    ) {
        const pairs = [...splitTemplatePairs(template, parameterPlaceholderRE)];

        const route: Route = {
            name,
            parameters: pairs.
                map(([, parameter]) => parameter).
                filter(parameter => parameter) as string[],
        };

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentNode: RouteNode = this;
        for (let index = 0; index < pairs.length; index++) {
            const [anchor, parameter] = pairs[Number(index)];
            const newNode = new RouteNode(
                anchor,
                parameter,
                parameter != null,
                index === pairs.length - 1 ? route : null,
            );

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
        decode: (value: string) => string,
        parameters: string[],
        maximumParameterValueLength: number,
    ): [Route | null, string[]] {
        if (!this.hasParameter) {
            // if this node does not represent a parameter we expect the path to start with the `anchor`
            if (!path.startsWith(this.anchor)) {
                // this node does not match the path
                return [null, []];
            }

            // we successfully matches the node to the path, now remove the matched part from the path
            path = path.substring(this.anchor.length);
        }
        else {
            // we are matching a parameter value! If the path's length is 0, there is no match, because a parameter value should have at least length 1
            if (path.length === 0) {
                return [null, []];
            }

            // look for the anchor in the path (note: indexOf is probably the most expensive operation!) If the anchor is empty, match the remainder of the path
            const index = this.anchor.length === 0 ?
                path.length :
                path.substring(0, maximumParameterValueLength + this.anchor.length).
                    indexOf(this.anchor);
            if (index < 0) {
                return [null, []];
            }

            // get the parameter value
            const value = decode(path.substring(0, index));

            // remove the matches part from the path
            path = path.substring(index + this.anchor.length);

            // update parameters, parameters is immutable!
            parameters = [
                ...parameters,
                value,
            ];
        }

        for (const childNode of this.getChildren()) {
            // find a route in every child node
            const [routeName, routeParameters] = childNode.parse(
                path,
                decode,
                parameters,
                maximumParameterValueLength,
            );

            // if a child node is matches, return that node instead of the current! So child nodes are matches first!
            if (routeName != null) {
                return [routeName, routeParameters];
            }
        }

        // if the node had a route name and there is no path left to match against then we found a route
        if (this.route != null && path.length === 0) {
            return [
                this.route,
                parameters,
            ];
        }

        // we did not found a route :-(
        return [null, []];
    }

    stringify(
        parameters: string[],
        encode: (value: string) => string,
    ) {
        let parameterIndex = parameters.length;
        let path = "";
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentNode: RouteNode | null = this;
        while (currentNode != null) {
            path = currentNode.anchor + path;
            if (currentNode.hasParameter) {
                parameterIndex--;
                const value = parameters[Number(parameterIndex)];
                path = encode(value) + path;
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
                childNode.route != null &&
                newNode.route != null &&
                childNode.route.name !== newNode.route.name
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
        childNode.route ??= newNode.route;
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
            childNode.hasParameter,
        );
        intermediateNode.addChild(childNode);
        intermediateNode.addChild(newNode);

        this.addChild(intermediateNode);

        childNode.anchor = childNode.anchor.substring(commonPrefixLength);
        newNode.anchor = newNode.anchor.substring(commonPrefixLength);

        childNode.parameter = null;
        newNode.parameter = null;

        childNode.hasParameter = false;
        newNode.hasParameter = false;

        return newNode;
    }
    private mergeAddToChild(
        childNode: RouteNode,
        newNode: RouteNode,
        commonPrefixLength: number,
    ): RouteNode {
        newNode.anchor = newNode.anchor.substring(commonPrefixLength);
        newNode.parameter = null;
        newNode.hasParameter = false;

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
        childNode.hasParameter = false;

        return newNode;
    }

    private findSimilarChild(
        findNode: RouteNode,
    ) {
        for (const childNode of this.getChildren()) {
            if (
                childNode.parameter != null &&
                childNode.parameter !== findNode.parameter
            ) {
                continue;
            }

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

        if ((this.route == null) < (other.route == null)) return 1;
        if ((this.route == null) > (other.route == null)) return -1;

        if (this.hasParameter < other.hasParameter) return 1;
        if (this.hasParameter > other.hasParameter) return -1;

        if (this.anchor < other.anchor) return -1;
        if (this.anchor > other.anchor) return 1;

        return 0;
    }

}

