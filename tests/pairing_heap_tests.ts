
import { test } from 'pietr'
import { assert } from 'chai'

import { toComparator, invert } from '../src/ordering'
import { PairingHeap, mkHeap, singleton, isEmpty, push, pop, heapify } from '../src/persistent/pairing_heap'

const numComp = toComparator(numOrdCmp);

function numOrdCmp(x: number, y: number) {
    return x < y ? 'LT' :
           x > y ? 'GT' : 'EQ';
}

function heapSort(heap: PairingHeap<number>) {
    let item;
    const retval = [];

    while (!isEmpty(heap)) {
        [ item, heap ] = pop(heap)!;
        retval.push(item);
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

        let heap = singleton(arr[0], numOrdCmp);
        for (let k = 1; k < arr.length; ++k) {
            heap = push(arr[k], heap);
        }

        let item;
        while (sorted.length) {
            [ item, heap ] = pop(heap)!;
            assert.equal(item, sorted.shift());
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

        let heap = mkHeap(ordCmp);
        for (let k = 0; k < arr.length; ++k) {
            heap = push(arr[k], heap);
        }

        let item;
        while (sorted.length) {
            [ item, heap ] = pop(heap)!;
            assert.equal(item, sorted.shift());
        }

        assert.isTrue(isEmpty(heap));
    }
});

test('Persistence - push', () => {
    const heaps = [ mkHeap(numOrdCmp) ];
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (let i = 0; i < expected.length; ++i) {
        const last = heaps[heaps.length - 1];
        heaps.push(push(expected[i], last));
    }

    for (let i = 0; i < heaps.length; ++i) {
        const arr = heapSort(heaps[i]);
        assert.deepEqual(arr, expected.slice(0, i));
    }
});

test('Persistence - pop', () => {
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const heaps = [ heapify(expected, numOrdCmp) ];


    for (let i = 0; i < expected.length; ++i) {
        const last = heaps[heaps.length - 1];
        heaps.push(pop(last)![1]);
    }

    for (let i = 0; i < heaps.length; ++i) {
        const arr = heapSort(heaps[i]);
        assert.deepEqual(arr, expected.slice(i));
    }
});
