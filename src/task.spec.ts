import * as test from "blue-tape";
import { TaskQueue } from "./task";

test("task queue", async t => {
    const q = new TaskQueue();
    let v = 0;

    q.enqueue(() => { v = 1; });
    t.equal(v, 0);

    await q.flush();
    t.equal(v, 1);

    q.enqueue(() => { v = 2; });
    q.enqueue(() => { v = 3; });
    t.equal(v, 1);

    await q.flush();
    t.equal(v, 3);

    return q.wait;
});

