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
        params: ["id"],
        setup: hookSpy.bind(null, "root-setup"),
        teardown: hookSpy.bind(null, "root-teardown"),
        children: [{
            path: "/child1/:id",
            setup: hookSpy.bind(null, "child1-setup"),
            teardown: hookSpy.bind(null, "child1-teardown"),
        }, {
            path: "/child2/:id",
            setup: hookSpy.bind(null, "child2-setup"),
            teardown: hookSpy.bind(null, "child2-teardown"),
        }]
    };

    const r = new Router([rootRoute]);


    hookSpy.reset();
    await r.transition("/child1/1");
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "root-setup",
        "child1-setup",
    ]);

    hookSpy.reset();
    await r.transition("/child2/1");
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "child1-teardown",
        "child2-setup",
    ]);

    hookSpy.reset();
    await r.transition("/child2/2");
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "child2-teardown",
        "root-teardown",
        "root-setup",
        "child2-setup",
    ]);

    hookSpy.reset();
    await r.transition(null);
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "child2-teardown",
        "root-teardown",
    ]);

});




test("router queue", async t => {
    const argStack = [];
    const route = {
        path: "/:arg",
        async render(state) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const {arg} = state.nextParams;
            argStack.push(arg);
            return arg;
        },
    } as RouteConfig;

    const r = new Router([route]);

    t.deepEqual(argStack, []);
    t.deepEqual(await r.transition("/aap"), "aap");
    t.deepEqual(argStack, ["aap"]);

    r.transition("/noot");
    r.transition("/mies");
    t.deepEqual(argStack, ["aap"]);

    await r.wait;
    t.deepEqual(argStack, ["aap", "noot", "mies"]);
});



