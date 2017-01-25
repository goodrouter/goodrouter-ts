import * as test from "blue-tape";
import { TaskQueue } from "./task";

test("task queue", async t => {
    const q = new TaskQueue();
    const s = [];

    q.execute(() => s.push(1));
    t.deepEqual(s, []);

    q.execute(() => new Promise(resolve => setTimeout(() => {
        s.push(2);
        resolve();
    }, 100)));
    t.deepEqual(s, []);

    await q.execute(() => s.push(3));
    t.deepEqual(s, [1, 2, 3]);
});
