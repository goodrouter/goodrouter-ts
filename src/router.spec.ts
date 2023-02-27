import assert from "assert";
import test from "tape-promise/tape.js";
import { Router } from "./router.js";

test("router-readme", async t => {
    const router = new Router();

    router.insertRoute("all-products", "/product/all");
    router.insertRoute("product-detail", "/product/{id}");

    // And now we can parse routes!

    {
        const [routeName] = router.parseRoute("/not-found");
        assert.equal(routeName, null);
    }

    {
        const [routeName] = router.parseRoute("/product/all");
        assert.equal(routeName, "all-products");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/product/1");
        assert.equal(routeName, "product-detail");
        assert.deepEqual(routeParameters, { id: "1" });
    }

    // And we can stringify routes

    {
        const path = router.stringifyRoute("all-products");
        assert.equal(path, "/product/all");
    }

    {
        const path = router.stringifyRoute("product-detail", { id: "2" });
        assert.equal(path, "/product/2");
    }
});

test("parse-route 1", async t => {
    const router = new Router();

    router.insertRoute("a", "/a");
    router.insertRoute("b", "/b/{x}");
    router.insertRoute("c", "/b/{x}/c");
    router.insertRoute("d", "/b/{x}/d");

    {
        const [routeName] = router.parseRoute("/a");
        t.equal(routeName, "a");
    }
    {
        const [routeName] = router.parseRoute("/b/x");
        t.equal(routeName, "b");
    }
    {
        const [routeName] = router.parseRoute("/b/y/c");
        t.equal(routeName, "c");
    }
    {
        const [routeName] = router.parseRoute("/b/z/d");
        t.equal(routeName, "d");
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
        const [routeName, routeParameters] = router.parseRoute("/a");
        t.equal(routeName, "one");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/a/1/2");
        t.equal(routeName, "two");
        t.deepEqual(routeParameters, { x: "1", y: "2" });
    }

    {
        const path = router.stringifyRoute(
            "two",
            { x: "1", y: "2" },
        );
        assert(path);
        t.equal(path, "/a/1/2");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/c/3");
        t.equal(routeName, "three");
        t.deepEqual(routeParameters, { x: "3" });
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/c/3/4");
        t.equal(routeName, "three");
        t.deepEqual(routeParameters, { x: "3/4" });
    }

    {
        const path = router.stringifyRoute(
            "three",
            { x: "3/4" },
        );
        assert(path);
        t.equal(path, "/c/3%2F4");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/c/3/4/");
        t.equal(routeName, "four");
        t.deepEqual(routeParameters, { x: "3", y: "4" });
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
        ["/docker/images/create", {}],
    );

    t.equal(
        router.stringifyRoute(
            "/docker/containers/{id}/start",
            {
                id: "e431946a4e0abb1a9099708f542afb80124e633e476733bfa0d61dfca18ee106",
            },
        ),
        "/docker/containers/e431946a4e0abb1a9099708f542afb80124e633e476733bfa0d61dfca18ee106/start",
    );

});

