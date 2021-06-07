import test from "tape-promise/tape.js";
import { findCommonPrefixLength } from "./string.js";

test("find-common-prefix-length", async t => {
    t.equal(
        findCommonPrefixLength("ab", "abc"),
        2,
    );

    t.equal(
        findCommonPrefixLength("abc", "abc"),
        3,
    );

    t.equal(
        findCommonPrefixLength("bc", "abc"),
        0,
    );
});
