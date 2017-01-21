import * as test from "blue-tape";
import { spy } from "sinon";
import { RoutePath } from "./route-path";


test("path matcher", async t => {
    let path = null as RoutePath;

    path = new RoutePath("/aap/noot");
    t.deepEqual(path.match("/aap/noot"), {});
    t.deepEqual(path.match("/aap/noot/mies"), null);

    path = new RoutePath("/:a/:b/:c");
    t.deepEqual(path.match("/aap/noot"), null);
    t.deepEqual(path.match("/aap/noot/mies"), { a: "aap", b: "noot", c: "mies" });
});


test("path builder", async t => {
    let path = null as RoutePath;

    path = new RoutePath("/aap/noot");
    t.equal(path.build({}), "/aap/noot");

    path = new RoutePath("/:a/:b/:c");
    t.equal(path.build({ a: "aap", b: "noot", c: "mies" }), "/aap/noot/mies");
});
