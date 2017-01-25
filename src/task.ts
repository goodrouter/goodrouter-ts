export type Task = () => Promise<void> | void;

export class TaskQueue {
    private queue = [] as Task[];

    public wait = Promise.resolve(null);

    public enqueue(...task: Task[]) {
        this.queue.push(...task);
    }

    public async flush() {
        this.wait = (async () => {
            while (this.queue.length > 0) {
                const task = this.queue.shift();
                await task();
            }
        })();
        return await this.wait;
    }
}




