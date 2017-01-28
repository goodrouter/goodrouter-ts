import * as test from "tape";

test("splice", async t => {
    const a = [1, 2, 3];
    const b = a.splice(0);

    t.deepEqual(a, []);
    t.deepEqual(b, [1, 2, 3]);

    t.end();
});