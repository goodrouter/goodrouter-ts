export interface RouteNode<K extends PropertyKey> {
    // key to identify the route
    key: K | null;
    // suffix that comes after the parameter value (if any!) of the path
    suffix: string;
    // parameter name or null if this node does not represent a prameter
    parameter: string | null;
    // children that represent the rest of the path that needs to be matched
    children: RouteNode<K>[];
}

export interface Route<K extends PropertyKey> {
    key: K;
    parameters: Record<string, string[]>;
}

export function findRoute<K extends PropertyKey>(
    node: RouteNode<K>,
    path: string,
    parameters: Record<string, string[]> = {},
): Route<K> | null {

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
            ...{
                [node.parameter]: [
                    ...parameters[node.parameter] ?? [],
                    value,
                ],
            },
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

    // if the node had a route key and there is no path left to match against then we found a route
    if (node.key !== null && path.length === 0) {
        return {
            key: node.key,
            parameters,
        };
    }

    // we have not found a route :-(
    return null;
}
