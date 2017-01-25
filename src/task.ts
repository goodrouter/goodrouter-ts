export type Task<T> = () => Promise<T> | T;

export class TaskQueue {
    private lastResult = Promise.resolve(null);

    public async execute<T>(task: Task<T>): Promise<T> {
        const {lastResult} = this;
        const result = lastResult.then(task);
        this.lastResult = result;
        return await result;
    }

}


