import * as test from "blue-tape";
import { spy } from "sinon";
import { RoutePath } from "./route-path";

test("path matcher", async t => {
    let path: RoutePath;

    path = new RoutePath("/aap/noot");
    t.deepEqual(path.match("/aap/noot"), {});
    t.deepEqual(path.match("/aap/noot/mies"), null);

    path = new RoutePath("/:a/:b/:c");
    t.deepEqual(path.match("/aap/noot"), null);
    t.deepEqual(path.match("/aap/noot/mies"), { a: "aap", b: "noot", c: "mies" });
});

test("path builder", async  t => {
    let path: RoutePath;

    path = new RoutePath("/aap/noot");
    t.equal(path.build({}), "/aap/noot");

    path = new RoutePath("/:a/:b/:c");
    t.equal(path.build({ a: "aap", b: "noot", c: "mies" }), "/aap/noot/mies");
});

// test("params equal", async t => {
//     let path: RoutePath;

//     path = new RoutePath("/:a/:b/:c");

//     t.equal(path.paramsEqual({ a: "1", b: "1", c: "1" }, { a: "1", b: "1", c: "1" }), true);
//     t.equal(path.paramsEqual({ a: "1", b: "1", c: "1" }, { a: "1", b: "1", c: "1", d: "1" }), true);

//     t.equal(path.paramsEqual({ a: "1", b: "1", c: "1" }, { a: "1", b: "1", c: "2" }), false);
//     t.equal(path.paramsEqual({ a: "1", b: "1", }, { a: "1", b: "1", c: "2" }), false);
// });
