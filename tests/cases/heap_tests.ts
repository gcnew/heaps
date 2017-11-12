
import { testHeap } from '../heap_suite'

import { BinHeap } from '../../src/mutable/bin_heap'
import * as BinHeapDict from '../../src/mutable/bin_heap'

testHeap<BinHeap<number>>('BinHeap', false, {
    mkHeap: BinHeapDict.mkHeap,
    singleton: BinHeapDict.singleton,
    isEmpty: BinHeapDict.isEmpty,

    push: (x, h) => {
        BinHeapDict.push(x, h);
        return h;
    },

    pop: h => {
        const item = BinHeapDict.pop(h);
        return item !== undefined
            ? [item, h]
            : undefined;
    },

    heapify: BinHeapDict.heapify
});
