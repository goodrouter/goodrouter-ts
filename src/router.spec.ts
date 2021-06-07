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
        const route = router.findRoute("/a");
        assert(route);
        t.equal(route.name, "one");
    }

    {
        const route = router.findRoute("/a/1/2");
        assert(route);
        t.equal(route.name, "two");
        t.deepEqual(route.parameters, { x: "1", y: "2" });
    }

    {
        const route = router.findRoute("/c/3");
        assert(route);
        t.equal(route.name, "three");
        t.deepEqual(route.parameters, { x: "3" });
    }

    {
        const route = router.findRoute("/c/3/4");
        assert(route);
        t.equal(route.name, "three");
        t.deepEqual(route.parameters, { x: "3/4" });
    }

    {
        const route = router.findRoute("/c/3/4/");
        assert(route);
        t.equal(route.name, "four");
        t.deepEqual(route.parameters, { x: "3", y: "4" });
    }
});

