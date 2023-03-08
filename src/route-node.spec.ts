import { permutations } from "itertools";
import test from "tape-promise/tape.js";
import { RouteNode } from "./route-node.js";
import { defaultRouterOptions } from "./router-options.js";

test("route-node-permutations", async t => {
    const routeConfigs = [
        "/a",
        "/b/{x}",
        "/b/{x}/",
        "/b/{x}/c",
        "/b/{x}/d",
        "/b/e/{x}/f",
    ];

    const permutedRouteConfigs = permutations(routeConfigs, routeConfigs.length);

    let rootNodePrevious: RouteNode<string> | null = null;

    for (const routeConfigs of permutedRouteConfigs) {
        const rootNode = new RouteNode<string>();

        for (const template of routeConfigs) {
            rootNode.insert(template, template, defaultRouterOptions.parameterPlaceholderRE);
        }

        {
            t.equal(rootNode.countChildren(), 1);
        }

        if (rootNodePrevious != null) {
            t.deepEqual(rootNode, rootNodePrevious);
        }

        rootNodePrevious = rootNode;
    }
});

test("route-node-sort", async t => {
    const nodes: RouteNode<string>[] = [
        new RouteNode("aa"),
        new RouteNode("xx"),
        new RouteNode("aa", true),
        new RouteNode("x"),
    ];

    const nodesExpected = [...nodes];
    const nodesActual = [...nodes].sort((a, b) => a.compare(b));

    t.deepEqual(nodesActual, nodesExpected);
});
