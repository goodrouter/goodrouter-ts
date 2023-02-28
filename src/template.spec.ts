import test from "tape-promise/tape.js";
import { defaultRouterOptions } from "./router-options.js";
import { splitTemplate } from "./template.js";

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
