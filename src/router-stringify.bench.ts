import Benchmark from "benchmark";
import { Router } from "./router.js";
import * as testing from "./testing/index.js";

runBenchmark("small");
runBenchmark("docker");
runBenchmark("github");

function runBenchmark(
    name: string,
) {
    const templates = testing.loadTemplates(name);
    const parameterNames = [...testing.parametersFromTemplates(templates)];
    const parameters = Object.fromEntries(
        parameterNames.map((name, index) => [name, `p${index}`]),
    );

    const templateCount = templates.length;

    const router = new Router();
    for (const template of templates) {
        router.insertRoute(template, template);
    }

    let iteration = 0;
    function benchmarkTask() {
        const template = templates[iteration % templateCount];

        router.stringifyRoute(template, parameters);

        iteration++;
    }

    const benchmark = new Benchmark(name, benchmarkTask);

    benchmark.run();

    console.log(String(benchmark));
}

