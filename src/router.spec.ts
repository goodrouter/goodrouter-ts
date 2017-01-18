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
        render: state => "home"
    } as RouteConfig;

    const routes = {
        homeRoute,
    };
    const r = new GoodRouter(routes);

    const result = await r.transition("/");

    t.equal(result, "home");
});


test("router pattern", async t => {
    const homeRoute = {
        path: "/home/:aap/noot",
        render: state => state
    } as RouteConfig;

    const routes = {
        homeRoute,
    };
    const r = new GoodRouter(routes);

    t.deepEqual(await r.transition("/home/123/noot"), {
        child: null,
        context: null,
        nextParams: { aap: "123" },
        prevParams: {},
    });

    t.deepEqual(await r.transition("/home/456/noot", { "ok": true }), {
        child: null,
        context: { "ok": true },
        nextParams: { aap: "456" },
        prevParams: { aap: "123" },
    });
});



test("router child", async t => {
    const rootRoute = {
        path: "/",
        render: state => ({ name: "root", child: state.child })
    } as RouteConfig;

    const homeRoute = {
        parent: "rootRoute",
        path: "/home",
        render: state => ({ name: "home", child: state.child })
    } as RouteConfig;

    const routes = {
        rootRoute,
        homeRoute,
    };
    const r = new GoodRouter(routes);

    t.deepEqual(await r.transition("/home"), {
        name: "root",
        child: {
            name: "home",
            child: null
        }
    });

});

