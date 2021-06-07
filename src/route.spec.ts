import test from "tape-promise/tape.js";
import { findRoute, RouteNode } from "./route.js";

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
