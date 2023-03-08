import test from "tape-promise/tape.js";
import { defaultRouterOptions } from "./router-options.js";
import { parseTemplatePairs, parseTemplateParts } from "./template.js";

test("split-template", async t => {
    {
        const parts = [...parseTemplateParts("/a/{b}/{c}", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, ["/a/", "b", "/", "c", ""]);
    }

    {
        const parts = [...parseTemplateParts("/a/{b}/{c}/", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, ["/a/", "b", "/", "c", "/"]);
    }

    {
        const parts = [...parseTemplateParts("", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [""]);
    }
});

test("split-template-pairs", async t => {
    {
        const parts = [...parseTemplatePairs("/a/{b}/{c}", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [["/a/", null], ["/", "b"], ["", "c"]]);
    }

    {
        const parts = [...parseTemplatePairs("/a/{b}/{c}/", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [["/a/", null], ["/", "b"], ["/", "c"]]);
    }

    {
        const parts = [...parseTemplatePairs("", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [["", null]]);
    }
});
