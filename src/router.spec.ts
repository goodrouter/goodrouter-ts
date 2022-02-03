import assert from "assert";
import test from "tape-promise/tape.js";
import { Router } from "./router.js";

test("router", async t => {
    const router = new Router();
    router.insertRoute("one", "/a");
    router.insertRoute("two", "/a/{x}/{y}");
    router.insertRoute("three", "/c/{x}");
    router.insertRoute("four", "/c/{x}/{y}/");

    {
        const route = router.parseRoute("/a");
        assert(route);
        t.equal(route.name, "one");
    }

    {
        const route = router.parseRoute("/a/1/2");
        assert(route);
        t.equal(route.name, "two");
        t.deepEqual(route.parameters, { x: "1", y: "2" });
    }

    {
        const path = router.stringifyRoute({
            name: "two",
            parameters: { x: "1", y: "2" },
        });
        assert(path);
        t.equal(path, "/a/1/2");
    }

    {
        const route = router.parseRoute("/c/3");
        assert(route);
        t.equal(route.name, "three");
        t.deepEqual(route.parameters, { x: "3" });
    }

    {
        const route = router.parseRoute("/c/3/4");
        assert(route);
        t.equal(route.name, "three");
        t.deepEqual(route.parameters, { x: "3/4" });
    }

    {
        const path = router.stringifyRoute({
            name: "three",
            parameters: { x: "3/4" },
        });
        assert(path);
        t.equal(path, "/c/3%2F4");
    }

    {
        const route = router.parseRoute("/c/3/4/");
        assert(route);

        t.equal(route.name, "four");
        t.deepEqual(route.parameters, { x: "3", y: "4" });
    }
});

test("router bug", async t => {
    const router = new Router();

    router.insertRoute("/docker/containers/{id}/start", "/docker/containers/{id}/start");
    router.insertRoute("/docker/containers/{id}/stop", "/docker/containers/{id}/stop");

    t.equal(
        router.stringifyRoute({
            name: "/docker/containers/{id}/start",
            parameters: {
                id: "e431946a4e0abb1a9099708f542afb80124e633e476733bfa0d61dfca18ee106",
            },
        }),
        "/docker/containers/e431946a4e0abb1a9099708f542afb80124e633e476733bfa0d61dfca18ee106/start",
    );
});
