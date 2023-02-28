import test from "tape-promise/tape.js";
import { defaultRouterOptions } from "./router-options.js";
import { emitTemplatePathParts } from "./template.js";

test("emit-template-path-parts", async t => {
    {
        const parts = [...emitTemplatePathParts("/a/{b}/{c}", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, ["/a/", "b", "/", "c", ""]);
    }

    {
        const parts = [...emitTemplatePathParts("/a/{b}/{c}/", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, ["/a/", "b", "/", "c", "/"]);
    }

    {
        const parts = [...emitTemplatePathParts("", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [""]);
    }
});
