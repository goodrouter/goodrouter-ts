import assert from "assert";
import Benchmark from "benchmark";
import { Router } from "./router.js";
import * as testing from "./testing/index.js";

runBenchmark("small", testing.templatesSmall);
runBenchmark("docker", testing.templatesDocker);
runBenchmark("github", testing.templatesGithub);

function runBenchmark(
    name: string,
    templates: string[],
) {
    const parameterNames = [...testing.parametersFromTemplates(templates)];
    const parameters = Object.fromEntries(
        parameterNames.map((name, index) => [name, `p${index}`]),
    );

    const templateCount = templates.length;

    const router = new Router();
    for (const template of templates) {
        router.insertRoute(template, template);
    }

    const paths = templates.map(template => {
        const path = router.stringifyRoute(template, parameters);
        assert(path != null);
        return path;
    });

    let iteration = 0;
    function benchmarkTask() {
        const path = paths[iteration % templateCount];

        router.parseRoute(path);

        iteration++;
    }

    const benchmark = new Benchmark(name, benchmarkTask);

    benchmark.run();

    console.log(String(benchmark));
}

