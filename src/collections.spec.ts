import * as test from "tape";
import { uniqueReducer } from "./collections";

test("uniqueReducer", t => {
    t.deepEqual(["a", "b", "a", "a", "b", "c", "c"].reduce(uniqueReducer<string>(i => i), []), ["a", "b", "c"]);
    t.deepEqual(
        [{ a: "a", b: "a" }, { a: "b", b: "a" }, { a: "a", b: "a" }, { a: "a", b: "a" }, { a: "b", b: "a" }, { a: "c", b: "a" }, { a: "c", b: "b" }].
            reduce(uniqueReducer<{ a: string, b: string }>(i => i.a, i => i.b), []),
        [{ a: "a", b: "a" }, { a: "b", b: "a" }, { a: "c", b: "a" }, { a: "c", b: "b" }],
    );

    t.end();
});