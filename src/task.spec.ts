import * as test from "blue-tape";
import { TaskQueue } from "./task";

test("task queue", async t => {
    const q = new TaskQueue();
    let v = 0;

    q.execute(() => { v = 1; });
    t.equal(v, 0);

    await q.execute(() => { v = 2; });
    t.equal(v, 2);
});

