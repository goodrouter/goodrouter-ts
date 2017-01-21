import * as test from "blue-tape";
import { spy } from "sinon";
import { Router, RouteConfig } from "./router";

test("router path", async t => {
    const r = new Router([{
        name: "home",
        path: "/",
        render: state => "home"
    }]);

    const result = await r.transition("/");

    t.equal(result, "home");
});


test("router pattern", async t => {
    const r = new Router([{
        name: "home",
        path: "/home/:aap/noot",
        render: state => state
    }]);

    t.deepEqual(await r.transition("/home/123/noot"), {
        child: null,
        context: null,
        local: {},
        nextParams: { aap: "123" },
        prevParams: {},
    });

    t.deepEqual(await r.transition("/home/456/noot", { "ok": true }), {
        child: null,
        context: { "ok": true },
        local: {},
        nextParams: { aap: "456" },
        prevParams: { aap: "123" },
    });
});

test("router match", async t => {
    const r = new Router([{
        name: "home",
        path: "/home/:aap/noot",
        render: state => state
    }]);

    t.equal(r.path("home", { aap: "123" }), "/home/123/noot");
});


test("router child", async t => {
    const rootRoute = {
        name: "root",
        path: "/",
        render: state => ({ name: "root", child: state.child })
    } as RouteConfig;

    const homeRoute = {
        name: "home",
        parent: "root",
        path: "/home",
        render: state => ({ name: "home", child: state.child })
    } as RouteConfig;

    const r = new Router([rootRoute, homeRoute]);

    t.deepEqual(await r.transition("/home"), {
        name: "root",
        child: {
            name: "home",
            child: null
        }
    });

});



test("router hooks", async t => {
    const hookSpy = spy();

    const rootRoute = {
        name: "root",
        path: "/",
        setup: hookSpy.bind(null, "root-setup"),
        teardown: hookSpy.bind(null, "root-teardown"),

    };

    const childRoute1 = {
        name: "child1",
        parent: "root",
        path: "/child1",
        setup: hookSpy.bind(null, "child1-setup"),
        teardown: hookSpy.bind(null, "child1-teardown"),
    };

    const childRoute2 = {
        name: "child2",
        parent: "root",
        path: "/child2",
        setup: hookSpy.bind(null, "child2-setup"),
        teardown: hookSpy.bind(null, "child2-teardown"),
    };

    const r = new Router([rootRoute, childRoute1, childRoute2]);


    hookSpy.reset();
    await r.transition("/child1");
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "root-setup",
        "child1-setup",
    ]);

    hookSpy.reset();
    await r.transition("/child2");
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "child1-teardown",
        "child2-setup",
    ]);

    hookSpy.reset();
    await r.transition(null);
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "child2-teardown",
        "root-teardown",
    ]);

});




