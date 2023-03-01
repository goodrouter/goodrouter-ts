import test from "tape-promise/tape.js";
import { defaultRouterOptions } from "./router-options.js";
import { splitTemplate, splitTemplatePairs } from "./template.js";

test("split-template", async t => {
    {
        const parts = [...splitTemplate("/a/{b}/{c}", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, ["/a/", "b", "/", "c", ""]);
    }

    {
        const parts = [...splitTemplate("/a/{b}/{c}/", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, ["/a/", "b", "/", "c", "/"]);
    }

    {
        const parts = [...splitTemplate("", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [""]);
    }
});

test("split-template-pairs", async t => {
    {
        const parts = [...splitTemplatePairs("/a/{b}/{c}", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [["/a/", null], ["/", "b"], ["", "c"]]);
    }

    {
        const parts = [...splitTemplatePairs("/a/{b}/{c}/", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [["/a/", null], ["/", "b"], ["/", "c"]]);
    }

    {
        const parts = [...splitTemplatePairs("", defaultRouterOptions.parameterPlaceholderRE)];

        t.deepEqual(parts, [["", null]]);
    }
});
