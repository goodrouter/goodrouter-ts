import test from "tape-promise/tape.js";
import { addToSortedArray, defaultComparer } from "./array.js";

test("add-to-sorted-array", async t => {
    const array = [20, 30, 10];

    array.sort(defaultComparer);
    t.deepEqual(
        array,
        [10, 20, 30],
    );

    addToSortedArray(array, 40, defaultComparer);
    t.deepEqual(
        array,
        [10, 20, 30, 40],
    );

    addToSortedArray(array, 5, defaultComparer);
    t.deepEqual(
        array,
        [5, 10, 20, 30, 40],
    );

    addToSortedArray(array, 25, defaultComparer);
    t.deepEqual(
        array,
        [5, 10, 20, 25, 30, 40],
    );

});
