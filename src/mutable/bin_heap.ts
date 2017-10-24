
import { OrdComparator } from '../ordering'

export {
    BinHeap,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify
}

/* Types */

interface BinHeap<T> {
    comparator: OrdComparator<T>,
    data: T[]
}


/* API Functions */

function isEmpty<T>(heap: BinHeap<T>): boolean {
    return heap.data.length === 0;
}

function peek<T>(heap: BinHeap<T>): T | undefined {
    return heap.data[0];
}

function pop<T>(heap: BinHeap<T>): T | undefined {
    if (heap.data.length <= 1) {
        return heap.data.pop();
    }

    const retval = heap.data[0];
    heap.data[0] = heap.data.pop()!;
    siftDown(heap);

    return retval;
}

function push<T>(item: T, heap: BinHeap<T>) {
    heap.data.push(item);
    siftUp(heap);
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): BinHeap<T> {
    const heap = { comparator, data: items.slice() };

    // Sift all non-leaf nodes.
    //
    // Note 1: we start from the bottom, otherwise a min leaf node
    //         would never float to the top.
    //
    // Note 2: we could have used `siftUp`, but then `heapify` has a worse
    //         O(n log(2, n)) performance. With `siftDown` it's just O(n).
    //
    // See: https://stackoverflow.com/questions/9755721/how-can-building-a-heap-be-on-time-complexity
    for (let idx = parentIdx(items.length - 1); idx >= 0; --idx) {
        siftDown(heap, idx);
    }

    return heap;
}


/* Private Implementation Functions */

function siftDown<T>(heap: BinHeap<T>, idx = 0) {
    const { comparator, data } = heap;

    while (true) {
        const lidx = leftIdx(idx);
        if (lidx >= data.length) {
            break;
        }

        const ridx = rightIdx(idx);
        const childIdx = ridx < data.length
            ? comparator(data[lidx], data[ridx]) === 'LT' ? lidx : ridx
            : lidx;

        if (comparator(data[childIdx], data[idx]) !== 'LT') {
            break;
        }

        swap(childIdx, idx, data);
        idx = childIdx;
    }
}

function siftUp<T>(heap: BinHeap<T>) {
    const { comparator, data } = heap;

    let idx = heap.data.length - 1;
    while (idx > 0) {
        const pidx = parentIdx(idx);

        if (comparator(data[idx], data[pidx]) !== 'LT') {
            break;
        }

        swap(idx, pidx, data);
        idx = pidx;
    }
}


/* Helpers */

function parentIdx(x: number) {
    return (x - 1) >> 1;
}

function leftIdx(x: number) {
    return (x << 1) + 1;
}

function rightIdx(x: number) {
    return (x << 1) + 2;
}

function swap<T>(idx1: number, idx2: number, arr: T[]) {
    const tmp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = tmp;
}


/* Constructors */

function mkHeap<T>(comparator: OrdComparator<T>): BinHeap<T> {
    return { comparator, data: [] };
}

function singleton<T>(item: T, comparator: OrdComparator<T>): BinHeap<T> {
    return { comparator, data: [ item ] };
}
