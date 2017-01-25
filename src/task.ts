export type Task<T> = (state: T) => Promise<T> | T;

export class TaskQueue<T> {
    private queue = [] as Task<T>[];
    private busy = false;;

    public result = Promise.resolve(null);

    public enqueue(...task: Task<T>[]) {
        this.queue.push(...task);
    }

    public async flush() {
        if (!this.busy) {
            this.busy = true;
            this.result = (async () => {
                let result = await this.result;
                while (this.queue.length > 0) {
                    const task = this.queue.shift();
                    result = await task(result);
                }
                this.busy = false;
                return result;
            })();
        }
        return await this.result;
    }

}




