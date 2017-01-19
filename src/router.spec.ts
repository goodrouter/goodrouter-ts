import * as test from "blue-tape";
import { spy } from "sinon";
import { Router, RouteConfig, RouterPath } from "./router";


test("path matcher", async t => {
    let matcher = null as RouterPath;

    matcher = new RouterPath("/aap/noot");
    t.deepEqual(matcher.match("/aap/noot"), {});
    t.deepEqual(matcher.match("/aap/noot/mies"), null);

    matcher = new RouterPath("/:a/:b/:c");
    t.deepEqual(matcher.match("/aap/noot"), null);
    t.deepEqual(matcher.match("/aap/noot/mies"), { a: "aap", b: "noot", c: "mies" });
});


test("path builder", async t => {
    let matcher = null as RouterPath;

    matcher = new RouterPath("/aap/noot");
    t.deepEqual(matcher.build({}), "/aap/noot");

    matcher = new RouterPath("/:a/:b/:c");
    t.deepEqual(matcher.build({ a: "aap", b: "noot", c: "mies" }), "/aap/noot/mies");
});


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
        render: state => ({ name: "root", child: state.child }),
        isEnteringRoute: hookSpy.bind(null, "root-isEnteringRoute"),
        hasEnteredRoute: hookSpy.bind(null, "root-hasEnteredRoute"),
        routeIsChanging: hookSpy.bind(null, "root-routeIsChanging"),
        routeHasChanged: hookSpy.bind(null, "root-routeHasChanged"),
        isLeavingRoute: hookSpy.bind(null, "root-isLeavingRoute"),
        hasLeftRoute: hookSpy.bind(null, "root-hasLeftRoute"),
    };

    const childRoute1 = {
        name: "child1",
        parent: "root",
        path: "/child1",
        render: state => ({ name: "child1", child: state.child }),
        isEnteringRoute: hookSpy.bind(null, "child1-isEnteringRoute"),
        hasEnteredRoute: hookSpy.bind(null, "child1-hasEnteredRoute"),
        routeIsChanging: hookSpy.bind(null, "child1-routeIsChanging"),
        routeHasChanged: hookSpy.bind(null, "child1-routeHasChanged"),
        isLeavingRoute: hookSpy.bind(null, "child1-isLeavingRoute"),
        hasLeftRoute: hookSpy.bind(null, "child1-hasLeftRoute"),
    };

    const childRoute2 = {
        name: "child2",
        parent: "root",
        path: "/child2",
        render: state => ({ name: "child2", child: state.child }),
        isEnteringRoute: hookSpy.bind(null, "child2-isEnteringRoute"),
        hasEnteredRoute: hookSpy.bind(null, "child2-hasEnteredRoute"),
        routeIsChanging: hookSpy.bind(null, "child2-routeIsChanging"),
        routeHasChanged: hookSpy.bind(null, "child2-routeHasChanged"),
        isLeavingRoute: hookSpy.bind(null, "child2-isLeavingRoute"),
        hasLeftRoute: hookSpy.bind(null, "child2-hasLeftRoute"),
    };

    const r = new Router([rootRoute, childRoute1, childRoute2]);


    hookSpy.reset();
    t.deepEqual(await r.transition("/child1"), {
        name: "root",
        child: {
            name: "child1",
            child: null
        }
    });
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "root-isEnteringRoute",
        "child1-isEnteringRoute",
        "child1-hasEnteredRoute",
        "root-hasEnteredRoute",
    ]);


    hookSpy.reset();
    t.deepEqual(await r.transition("/child2"), {
        name: "root",
        child: {
            name: "child2",
            child: null
        }
    });
    t.deepEqual(hookSpy.args.map(([arg]) => arg), [
        "root-routeIsChanging",
        "child1-isLeavingRoute",
        "child2-isEnteringRoute",
        "child2-hasEnteredRoute",
        "child1-hasLeftRoute",
        "root-routeHasChanged",
    ]);

});



