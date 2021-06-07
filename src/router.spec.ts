import assert from "assert";
import test from "tape-promise/tape.js";
import { Router } from "./router.js";

test("router", async t => {
    const router = new Router();
    router.insertRoute("one", "/one");
    const route = router.findRoute("/one");
    assert(route);
    t.equal(route.name, "one");
});

