import test from "tape-promise/tape.js";
import { emitTemplatePathParts } from "./template";

test("emit-template-path-parts", async t => {
    {
        const parts = [...emitTemplatePathParts("/a/{b}/{c}")];

        t.deepEqual(parts, ["/a/", "b", "/", "c", ""]);
    }

    {
        const parts = [...emitTemplatePathParts("/a/{b}/{c}/")];

        t.deepEqual(parts, ["/a/", "b", "/", "c", "/"]);
    }

    {
        const parts = [...emitTemplatePathParts("")];

        t.deepEqual(parts, [""]);
    }
});
