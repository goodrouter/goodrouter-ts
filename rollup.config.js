import commonjs from "rollup-plugin-commonjs";

export default [
    {
        input: "./obj/main.js",
        output: {
            file: "./obj/main.bundle.js",
            format: "cjs",
        },
        plugins: [
            commonjs(),
        ],
        external: [
            "tslib",
            "synchronize-async",
        ],
    },
];

