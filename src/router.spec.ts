import assert from "assert";
import test from "tape-promise/tape.js";
import { Router } from "./router.js";

test("parse-route 1", async t => {
    const router = new Router();

    router.
        insertRoute("a", "/a").
        insertRoute("b", "/b/{x}").
        insertRoute("c", "/b/{x}/c").
        insertRoute("d", "/b/{x}/d");

    {
        const route = router.parseRoute("/a");
        assert(route != null);
        t.equal(route.name, "a");
    }
    {
        const route = router.parseRoute("/b/x");
        assert(route != null);
        t.equal(route.name, "b");
    }
    {
        const route = router.parseRoute("/b/y/c");
        assert(route != null);
        t.equal(route.name, "c");
    }
    {
        const route = router.parseRoute("/b/z/d");
        assert(route != null);
        t.equal(route.name, "d");
    }

});

test("parse-route 2", async t => {
    const router = new Router();

    router.insertRoute("aa", "a/{a}/a");
    router.insertRoute("a", "a");

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

    router.insertRoute("/node-exporter/metrics", "/node-exporter/metrics");
    router.insertRoute("/mutex/lock", "/mutex/lock");
    router.insertRoute("/docker/info", "/docker/info");
    router.insertRoute("/docker/events", "/docker/events");
    router.insertRoute("/docker/containers/{id}/stats", "/docker/containers/{id}/stats");
    router.insertRoute("/docker/images/json", "/docker/images/json");
    router.insertRoute("/docker/images/{name}/json", "/docker/images/{name}/json");
    router.insertRoute("/docker/images/create", "/docker/images/create");
    router.insertRoute("/docker/images/{name}", "/docker/images/{name}");
    router.insertRoute("/docker/containers/json", "/docker/containers/json");
    router.insertRoute("/docker/containers/{id}/json", "/docker/containers/{id}/json");
    router.insertRoute("/docker/containers/create", "/docker/containers/create");
    router.insertRoute("/docker/containers/{id}/start", "/docker/containers/{id}/start");
    router.insertRoute("/docker/containers/{id}/stop", "/docker/containers/{id}/stop");
    router.insertRoute("/docker/containers/{id}/logs", "/docker/containers/{id}/logs");
    router.insertRoute("/docker/containers/{id}/archive", "/docker/containers/{id}/archive");
    router.insertRoute("/docker/containers/{id}/changes", "/docker/containers/{id}/changes");

    t.deepEqual(
        router.parseRoute("/docker/images/create"),
        {
            name: "/docker/images/create",
            parameters: {},
        },
    );

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

