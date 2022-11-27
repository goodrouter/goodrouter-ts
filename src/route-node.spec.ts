import { permutations } from "itertools";
import test from "tape-promise/tape.js";
import { insertRouteNode, newRootRouteNode, RouteNode, routeNodeCompare } from "./route-node.js";

test("route-node-permutations", async t => {
    interface RouteConfig {
        name: string,
        template: string,
    }

    const routeConfigs: RouteConfig[] = [
        {
            name: "a",
            template: "/a",
        },
        {
            name: "b",
            template: "/b/{x}",
        },
        {
            name: "c",
            template: "/b/{x}/c",
        },
        {
            name: "d",
            template: "/b/{x}/d",
        },
    ];

    const permutedRouteConfigs = permutations(routeConfigs, routeConfigs.length);

    let rootNodePrevious: RouteNode | null = null;

    for (const routeConfigs of permutedRouteConfigs) {
        const rootNode = newRootRouteNode();

        for (const { name, template } of routeConfigs) {
            insertRouteNode(rootNode, name, template);
        }

        {
            t.equal(rootNode.children.length, 1);
        }

        if (rootNodePrevious != null) {
            t.deepEqual(rootNodePrevious, rootNode);
        }

        rootNodePrevious = rootNode;
    }
});

test("route-node-sort", async t => {
    const nodes: RouteNode[] = [
        {
            name: null,
            parameter: "p",
            anchor: "aa",
            parent: null,
            children: [],
        },
        {
            name: null,
            parameter: null,
            anchor: "aa",
            parent: null,
            children: [],
        },
        {
            name: null,
            parameter: null,
            anchor: "xx",
            parent: null,
            children: [],
        },
        {
            name: "n",
            parameter: null,
            anchor: "aa",
            parent: null,
            children: [],
        },
        {
            name: null,
            parameter: null,
            anchor: "x",
            parent: null,
            children: [],
        },
    ];

    const nodesExpected = [...nodes];
    const nodesActual = [...nodes].sort(routeNodeCompare);

    t.deepEqual(nodesActual, nodesExpected);

});
