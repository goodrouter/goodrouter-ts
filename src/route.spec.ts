import test from "tape-promise/tape.js";
import { findRoute, RouteNode } from "./route.js";

test("find-route", async t => {
    const rootRouteNode: RouteNode<string> = {
        suffix: "",
        key: null,
        parameter: null,
        children: [
            {
                suffix: "/x/",
                key: null,
                parameter: null,
                children: [
                    {
                        suffix: "/z",
                        key: "xyz",
                        parameter: "y",
                        children: [],
                    },
                ],
            },
            {
                suffix: "/a/b/c/d/e",
                key: null,
                parameter: null,
                children: [
                    {
                        suffix: "/",
                        key: "abcde",
                        parameter: null,
                        children: [
                            {
                                suffix: "",
                                key: "abcde",
                                parameter: "f",
                                children: [],
                            },

                        ],
                    },
                ],
            },
            {
                suffix: "/a",
                key: null,
                parameter: null,
                children: [
                    {
                        suffix: "/b",
                        key: "ab",
                        parameter: null,
                        children: [
                            {
                                suffix: "/c",
                                key: "abc",
                                parameter: null,
                                children: [],
                            },
                            {
                                suffix: "/c/d",
                                key: "abcd",
                                parameter: null,
                                children: [],
                            },
                            {
                                suffix: "",
                                key: "abx",
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
            key: "ab",
            parameters: {},
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/c");
        const expected = {
            key: "abc",
            parameters: {},
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/c/d");
        const expected = {
            key: "abcd",
            parameters: {},
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/x");
        const expected = {
            key: "abx",
            parameters: { x: ["/x"] },
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/a/b/c/d/e/f");
        const expected = {
            key: "abcde",
            parameters: { f: ["f"] },
        };
        t.deepEqual(actual, expected);
    }

    {
        const actual = findRoute(rootRouteNode, "/x/y/z");
        const expected = {
            key: "xyz",
            parameters: { y: ["y"] },
        };
        t.deepEqual(actual, expected);
    }

});
