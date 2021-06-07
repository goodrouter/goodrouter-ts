import test from "tape-promise/tape.js";
import { findRoute, implodeRouteNodes, insertRoute, mergeRouteNodes, optimizeRouteNode, RouteNode } from "./route-node.js";

test("find-route", async t => {
    const rootRouteNode: RouteNode = {
        suffix: "",
        name: null,
        parameter: null,
        children: [
            {
                suffix: "/x/",
                name: null,
                parameter: null,
                children: [
                    {
                        suffix: "/z",
                        name: "xyz",
                        parameter: "y",
                        children: [],
                    },
                ],
            },
            {
                suffix: "/a/b/c/d/e",
                name: null,
                parameter: null,
                children: [
                    {
                        suffix: "/",
                        name: "abcde",
                        parameter: null,
                        children: [
                            {
                                suffix: "",
                                name: "abcde",
                                parameter: "f",
                                children: [],
                            },

                        ],
                    },
                ],
            },
            {
                suffix: "/a",
                name: null,
                parameter: null,
                children: [
                    {
                        suffix: "/b",
                        name: "ab",
                        parameter: null,
                        children: [
                            {
                                suffix: "/c",
                                name: "abc",
                                parameter: null,
                                children: [],
                            },
                            {
                                suffix: "/c/d",
                                name: "abcd",
                                parameter: null,
                                children: [],
                            },
                            {
                                suffix: "",
                                name: "abx",
                                parameter: "x",
                                children: [],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    {
        const actual = findRoute(rootRouteNode, "/a/b");
        const expected = {
            name: "ab",
            parameters: {},
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/c");
        const expected = {
            name: "abc",
            parameters: {},
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/c/d");
        const expected = {
            name: "abcd",
            parameters: {},
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/x");
        const expected = {
            name: "abx",
            parameters: { x: "/x" },
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/c/d/e/f");
        const expected = {
            name: "abcde",
            parameters: { f: "f" },
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/x/y/z");
        const expected = {
            name: "xyz",
            parameters: { y: "y" },
        };
        t.deepEqual(actual, expected);
    }

});

test("insert-route", async t => {
    let node: RouteNode | null = null;

    node = insertRoute(node, "1", "/a/");
    t.deepEqual(
        node,
        {
            name: "1",
            suffix: "/a/",
            parameter: null,
            children: [],
        },
    );

    node = insertRoute(node, "2", "/a");
    t.deepEqual(
        node,
        {
            name: "2",
            suffix: "/a",
            parameter: null,
            children: [
                {
                    name: "1",
                    suffix: "/",
                    parameter: null,
                    children: [],
                },
            ],
        },
    );

    node = insertRoute(node, "3", "/a/{b}/c/{d}");
    t.deepEqual(
        node,
        {
            name: "2",
            suffix: "/a",
            parameter: null,
            children: [
                {
                    name: "1",
                    suffix: "/",
                    parameter: null,
                    children: [
                        {
                            name: null,
                            suffix: "/c/",
                            parameter: "b",
                            children: [
                                {
                                    name: "3",
                                    suffix: "",
                                    parameter: "d",
                                    children: [],
                                }],
                        },
                    ],
                },
            ],
        },
    );

    node = insertRoute(node, "4", "/a/{bb}/c");
    t.deepEqual(
        node,
        {
            name: "2",
            suffix: "/a",
            parameter: null,
            children: [
                {
                    name: "1",
                    suffix: "/",
                    parameter: null,
                    children: [
                        {
                            name: null,
                            suffix: "/c/",
                            parameter: "b",
                            children: [
                                {
                                    name: "3",
                                    suffix: "",
                                    parameter: "d",
                                    children: [],
                                }],
                        },
                        {
                            name: "4",
                            suffix: "/c",
                            parameter: "bb",
                            children: [],
                        },
                    ],
                },
            ],
        },
    );
});

test("optmize-route-nodes", async t => {
    const actual = optimizeRouteNode({
        suffix: "", name: null, parameter: null,
        children: [
            {
                suffix: "/match", name: "/match", parameter: null,
                children: [],
            },
            {
                suffix: "/match/", name: null, parameter: null,
                children: [
                    {
                        suffix: "", name: "/match/{match-id}", parameter: "match-id",
                        children: [],
                    },
                ],
            },
            {
                suffix: "/match/", name: null, parameter: null,
                children: [
                    {
                        suffix: "/demofile", name: "/match/{match-id}/demofile", parameter: "match-id",
                        children: [],
                    },
                ],
            },
        ],
    });

    const expected = {
        suffix: "/match", name: "/match", parameter: null,
        children: [
            {
                suffix: "/", name: null, parameter: null,
                children: [
                    {
                        suffix: "/demofile", name: "/match/{match-id}/demofile", parameter: "match-id",
                        children: [],
                    },
                    {
                        suffix: "", name: "/match/{match-id}", parameter: "match-id",
                        children: [
                        ],
                    },
                ],
            },
        ],
    };

    t.deepEqual(actual, expected);
});

test("merge-route-nodes", async t => {
    const actual = mergeRouteNodes({
        suffix: "", name: null, parameter: null,
        children: [
            {
                suffix: "/", name: null, parameter: null,
                children: [
                    {
                        suffix: "a", name: null, parameter: null,
                        children: [],
                    },
                ],
            },
            {
                suffix: "/", name: null, parameter: null,
                children: [
                    {
                        suffix: "b", name: null, parameter: null,
                        children: [],
                    },
                ],
            },
        ],
    });
    const expected = {
        suffix: "", name: null, parameter: null,
        children: [
            {
                suffix: "/", name: null, parameter: null,
                children: [
                    {
                        suffix: "a", name: null, parameter: null,
                        children: [],
                    },
                    {
                        suffix: "b", name: null, parameter: null,
                        children: [],
                    },
                ],
            },
        ],
    };

    t.deepEqual(actual, expected);
});

test("implode-route-nodes", async t => {
    const actual = implodeRouteNodes({
        suffix: "", name: null, parameter: null,
        children: [
            {
                suffix: "/", name: null, parameter: null,
                children: [
                    {
                        suffix: "a", name: null, parameter: null,
                        children: [],
                    },
                    {
                        suffix: "b", name: null, parameter: null,
                        children: [
                            {
                                suffix: "c", name: "c", parameter: null,
                                children: [
                                    {
                                        suffix: "d", name: "d", parameter: null,
                                        children: [],
                                    },

                                ],
                            },

                        ],
                    },
                    {
                        suffix: "e", name: "e", parameter: null,
                        children: [
                            {
                                suffix: "f", name: null, parameter: "f",
                                children: [
                                    {
                                        suffix: "g", name: "g", parameter: "g",
                                        children: [],
                                    },

                                ],
                            },

                        ],
                    },
                ],
            },
        ],
    });

    const expected = {
        suffix: "/", name: null, parameter: null,
        children: [
            {
                suffix: "a", name: null, parameter: null,
                children: [],
            },
            {
                suffix: "bc", name: "c", parameter: null,
                children: [
                    {
                        suffix: "d", name: "d", parameter: null,
                        children: [],
                    },
                ],
            },
            {
                suffix: "e", name: "e", parameter: null,
                children: [
                    {
                        suffix: "f", name: null, parameter: "f",
                        children: [
                            {
                                suffix: "g", name: "g", parameter: "g",
                                children: [],
                            },

                        ],
                    },
                ],
            },
        ],
    };

    t.deepEqual(actual, expected);
});
