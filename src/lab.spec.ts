import test from "tape-promise/tape.js";

test("splice", async t => {
    const a = [1, 2, 3];
    const b = a.splice(0);

    t.deepEqual(a, []);
    t.deepEqual(b, [1, 2, 3]);
});

const p = [
    { name: "str", convert: String },
    { name: "num", convert: Number },
] as const;

interface ParameterDefinition<T = unknown> {
    parse(value: string): T,
}

type ParameterDefinitions<T extends object> = {
    [P in keyof T]: (value: string) => T[P]
}
