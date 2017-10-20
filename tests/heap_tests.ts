
import { test } from 'pietr'
import { assert } from 'chai'

import { toComparator, invert } from '../src/ordering'
import { BinHeap, mkHeap, singleton, isEmpty, push, pop, heapify } from '../src/mutable/bin_heap'

const numComp = toComparator(numOrdCmp);

function numOrdCmp(x: number, y: number) {
    return x < y ? 'LT' :
           x > y ? 'GT' : 'EQ';
}

function heapSort(heap: BinHeap<number>) {
    const retval = [];

    while (!isEmpty(heap)) {
        retval.push(pop(heap)!);
    }

    return retval;
}

function mkRandomArray(length: number) {
    const retval = [];

    for (let i = length; i > 0; --i) {
        retval.push((Math.random() * 1000) | 0);
    }

    return retval;
}

test('Heapify', () => {
    assert.deepEqual(heapSort(heapify([], numOrdCmp)), []);

    for (let i = 0; i < 4; ++i) {
        const arr = mkRandomArray(10 ** i);
        const sorted = arr.slice().sort(numComp);

        const heap = heapify(arr, numOrdCmp);
        assert.deepEqual(heapSort(heap), sorted);
    }
});

test('Push / Pop', () => {
    for (let i = 0; i < 4; ++i) {
        const arr = mkRandomArray(10 ** i);
        const sorted = arr.slice().sort(numComp);

        const heap = singleton(arr[0], numOrdCmp);
        for (let k = 1; k < arr.length; ++k) {
            push(arr[k], heap);
        }

        while (sorted.length) {
            assert.equal(pop(heap), sorted.shift());
        }

        assert.isTrue(isEmpty(heap));
    }
});

test('Push / Pop - max heap', () => {
    const ordCmp = invert(numOrdCmp);
    const numCmp = (x: number, y: number) => numComp(x, y) * -1;

    for (let i = 0; i < 4; ++i) {
        const arr = mkRandomArray(10 ** i);
        const sorted = arr.slice().sort(numCmp);

        const heap = mkHeap(ordCmp);
        for (let k = 0; k < arr.length; ++k) {
            push(arr[k], heap);
        }

        while (sorted.length) {
            assert.equal(pop(heap), sorted.shift());
        }

        assert.isTrue(isEmpty(heap));
    }
});
