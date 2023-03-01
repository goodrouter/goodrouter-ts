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
     * parent node, should only be null for the root node
     */
    private parent: RouteNode | null = null;
    /**
     * @description
     * children that represent the rest of the path that needs to be matched
     */
    private readonly children = new Array<RouteNode>();

    private addChild(childNode: RouteNode) {
        if (childNode.parent === this) {
            throw new Error("cannot add childNode to self");
        }

        if (childNode.parent != null) {
            throw new Error("childNode already has parent");
        }

        childNode.parent = this;
        this.children.push(childNode);
    }

    private removeChild(childNode: RouteNode) {
        const childIndex = this.children.indexOf(childNode);

        if (childNode.parent !== this || childIndex < 0) {
            throw new Error("childNode is not a child of this node");
        }

        childNode.parent = null;
        this.children.splice(childIndex, 1);
    }

    countChildren() {
        return this.children.length;
    }

    insert(
        routeName: string,
        routeTemplate: string,
        parameterPlaceholderRE: RegExp,
    ) {
        const pairs = [...splitTemplatePairs(routeTemplate, parameterPlaceholderRE)];

        const route: Route = {
            name: routeName,
            parameters: pairs.
                map(([, parameter]) => parameter).
                filter(parameter => parameter) as string[],
        };

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentNode: RouteNode = this;
        for (let index = 0; index < pairs.length; index++) {
            const [anchor, parameter] = pairs[Number(index)];
            const hasParameter = parameter != null;

            const [commonPrefixLength, childNode] =
                currentNode.findSimilarChild(anchor, hasParameter);

            currentNode = currentNode.merge(
                childNode,
                anchor,
                hasParameter,
                index === pairs.length - 1 ? route : null,
                commonPrefixLength,
            );
        }

        return currentNode;
    }

    parse(
        path: string,
        decode: (value: string) => string,
        maximumParameterValueLength: number,
    ): [Route | null, string[]] {
        const parameters = new Array<string>();

        if (this.hasParameter) {
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

            // add value to parameters
            parameters.push(value);
        }
        else {
            // if this node does not represent a parameter we expect the path to start with the `anchor`
            if (!path.startsWith(this.anchor)) {
                // this node does not match the path
                return [null, []];
            }

            // we successfully matches the node to the path, now remove the matched part from the path
            path = path.substring(this.anchor.length);
        }

        for (const childNode of this.children) {
            // find a route in every child node
            const [childRoute, childParameters] = childNode.parse(
                path,
                decode,
                maximumParameterValueLength,
            );

            // if a child node is matched, return that node instead of the current! So child nodes are matched first!
            if (childRoute != null) {
                return [
                    childRoute,
                    [
                        ...parameters,
                        ...childParameters,
                    ],
                ];
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
        anchor: string,
        hasParameter: boolean,
        route: Route | null,
        commonPrefixLength: number,
    ) {
        if (childNode == null) {
            return this.mergeNew(
                anchor,
                hasParameter,
                route,
            );
        }

        const commonPrefix = childNode.anchor.substring(0, commonPrefixLength);

        if (childNode.anchor === anchor) {
            return this.mergeJoin(
                childNode,
                route,
            );
        }
        else if (childNode.anchor === commonPrefix) {
            return this.mergeAddToChild(
                childNode,
                anchor,
                hasParameter,
                route,
                commonPrefixLength,
            );
        }
        else if (anchor === commonPrefix) {
            return this.mergeAddToNew(
                childNode,
                anchor,
                hasParameter,
                route,
                commonPrefixLength,
            );
        }
        else {
            return this.mergeIntermediate(
                childNode,
                anchor,
                hasParameter,
                route,
                commonPrefixLength,
            );
        }
    }
    private mergeNew(
        anchor: string,
        hasParameter: boolean,
        route: Route | null,
    ) {
        const newNode = new RouteNode(
            anchor,
            hasParameter,
            route,
        );
        this.addChild(newNode);
        this.children.sort((a, b) => a.compare(b));
        return newNode;
    }
    private mergeJoin(
        childNode: RouteNode,
        route: Route | null,
    ) {
        if (
            childNode.route != null &&
            route != null
        ) {
            throw new Error("ambiguous route");
        }

        childNode.route ??= route;
        childNode.parent?.children.sort((a, b) => a.compare(b));
        return childNode;
    }
    private mergeIntermediate(
        childNode: RouteNode,
        anchor: string,
        hasParameter: boolean,
        route: Route | null,
        commonPrefixLength: number,
    ) {
        this.removeChild(childNode);

        const newNode = new RouteNode(
            anchor.substring(commonPrefixLength),
            false,
            route,
        );

        childNode.anchor = childNode.anchor.substring(commonPrefixLength);
        childNode.hasParameter = false;

        const intermediateNode = new RouteNode(
            anchor.substring(0, commonPrefixLength),
            hasParameter,
        );
        intermediateNode.addChild(childNode);
        intermediateNode.addChild(newNode);

        this.addChild(intermediateNode);

        this.children.sort((a, b) => a.compare(b));
        intermediateNode.children.sort((a, b) => a.compare(b));

        return newNode;
    }
    private mergeAddToChild(
        childNode: RouteNode,
        anchor: string,
        hasParameter: boolean,
        route: Route | null,
        commonPrefixLength: number,
    ): RouteNode {
        anchor = anchor.substring(commonPrefixLength);
        hasParameter = false;

        const [commonPrefixLength2, childNode2] =
            childNode.findSimilarChild(anchor, hasParameter);

        return childNode.merge(
            childNode2,
            anchor,
            hasParameter,
            route,
            commonPrefixLength2,
        );
    }
    private mergeAddToNew(
        childNode: RouteNode,
        anchor: string,
        hasParameter: boolean,
        route: Route | null,
        commonPrefixLength: number,
    ): RouteNode {
        const newNode = new RouteNode(
            anchor,
            hasParameter,
            route,
        );
        this.addChild(newNode);

        this.removeChild(childNode);

        childNode.anchor = childNode.anchor.substring(commonPrefixLength);
        childNode.hasParameter = false;

        newNode.addChild(childNode);

        this.children.sort((a, b) => a.compare(b));
        newNode.children.sort((a, b) => a.compare(b));

        return newNode;
    }

    private findSimilarChild(
        anchor: string,
        hasParameter: boolean,
    ) {
        for (const childNode of this.children) {
            if (childNode.hasParameter !== hasParameter) {
                continue;
            }

            const commonPrefixLength = findCommonPrefixLength(anchor, childNode.anchor);
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

        if (this.hasParameter < other.hasParameter) return -1;
        if (this.hasParameter > other.hasParameter) return 1;

        if (this.anchor < other.anchor) return -1;
        if (this.anchor > other.anchor) return 1;

        return 0;
    }

}

