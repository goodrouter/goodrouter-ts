import * as test from "blue-tape";
import { GoodRouter, RouteConfig, PathMatcher } from "./router";

test("path matcher", async t => {
    let matcher = null as PathMatcher;

    matcher = new PathMatcher("/aap/noot");
    t.deepEqual(matcher.match("/aap/noot"), {});
    t.deepEqual(matcher.match("/aap/noot/mies"), null);

    matcher = new PathMatcher("/:a/:b/:c");
    t.deepEqual(matcher.match("/aap/noot"), null);
    t.deepEqual(matcher.match("/aap/noot/mies"), { a: "aap", b: "noot", c: "mies" });
});

test("router path", async t => {
    const homeRoute = {
        path: "/",
        perform: state => "home"
    } as RouteConfig;

    const routes = {
        homeRoute,
    };
    const r = new GoodRouter(routes);

    const result = await r.resolve("/");

    t.equal(result, "home");
});



test("router pattern", async t => {
    const homeRoute = {
        path: "/home/:aap/noot",
        perform: state => state
    } as RouteConfig;

    const routes = {
        homeRoute,
    };
    const r = new GoodRouter(routes);

    t.deepEqual(await r.resolve("/home/123/noot"), {
        context: null,
        nextParams: { aap: "123" },
        prevParams: {},
    });

    t.deepEqual(await r.resolve("/home/456/noot", { "ok": true }), {
        context: { "ok": true },
        nextParams: { aap: "456" },
        prevParams: { aap: "123" },
    });
});

