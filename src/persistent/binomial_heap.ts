
import { OrdComparator } from '../ordering'

export {
    BinomialHeap, BinomialTree,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify, heapify2
}


/* Types */

interface BinomialHeap<T> {
    comparator: OrdComparator<T>,
    forest: Forest<T>
}

interface BinomialTree<T> {
    item: T,
    subtrees: BinomialTree<T>[]
}

type Forest<T> = (BinomialTree<T> | undefined)[]

const emptyArray: never[] = [];


/* API Functions */

function isEmpty<T>(heap: BinomialHeap<T>): boolean {
    return !heap.forest.length;
}

function peek<T>(heap: BinomialHeap<T>): T | undefined {
    if (!heap.forest.length) {
        return undefined;
    }

    const tree = heap.forest[findMinElementIdx(heap.forest, heap.comparator)];
    return tree!.item;
}

function pop<T>(heap: BinomialHeap<T>): [T, BinomialHeap<T>] | undefined {
    if (!heap.forest.length) {
        return undefined;
    }

    const minIdx = findMinElementIdx(heap.forest, heap.comparator);
    const tree = heap.forest[minIdx]!;

    return [
        tree.item,
        mkHeap2(
            merge(removeTree(minIdx, heap.forest), tree.subtrees, heap.comparator),
            heap.comparator
        )
    ];
}

function push<T>(item: T, heap: BinomialHeap<T>) {
    return mkHeap2(
        merge(heap.forest, [ mkTree(item, emptyArray) ], heap.comparator),
        heap.comparator
    );
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): BinomialHeap<T> {
    return items.reduce(
        (heap, x) => push(x, heap),
        mkHeap(comparator)
    );
}

function heapify2<T>(items: T[], comparator: OrdComparator<T>): BinomialHeap<T> {
    const forest = [];

    for (let i = 1, start = 0; i <= items.length; i <<= 1) {
        let tree;

        if (items.length & i) {
            tree = heapifyBinary(items, start, start + i, comparator);
            start += i;
        }
        else {
            tree = undefined;
        }

        forest.push(tree);
    }

    return mkHeap2(forest, comparator);
}


/* Private Implementation Functions */

function removeTree<T>(idx: number, forest: Forest<T>) {
    const prev = prevTreeIndex(idx, forest);
    const isLastTree = forest.length === idx + 1;

    if (isLastTree) {
        return prev === -1 ? emptyArray
                           : forest.slice(0, prev + 1);
    }

    const retval = forest.slice();
    retval[idx] = undefined;

    return retval;
}

function prevTreeIndex<T>(stop: number, forest: Forest<T>) {
    let i = 0;
    let prev = -1;

    for (i = 0; i < forest.length && i < stop; ++i) {
        if (forest[i]) {
            prev = i;
        }
    }

    return prev;
}

function merge<T>(tree1: BinomialTree<T>[], tree2: BinomialTree<T>[], cmp: OrdComparator<T>): BinomialTree<T>[];
function merge<T>(tree1: Forest<T>, tree2: Forest<T>, cmp: OrdComparator<T>): Forest<T>;

function merge<T>(tree1: Forest<T>, tree2: Forest<T>, cmp: OrdComparator<T>): Forest<T> {
    if (!tree1.length) {
        return tree2;
    }

    if (!tree2.length) {
        return tree1;
    }

    const result = [];
    let carry: BinomialTree<T> | undefined;
    for (let i = 0, len = Math.max(tree1.length, tree2.length); i < len; ++i) {
        const merged = mergeTree(tree1[i], tree2[i], cmp);

        if (willCarry(tree1[i], tree2[i])) {
            result.push(carry);
            carry = merged;
            continue;
        }

        const merged2 = mergeTree(merged, carry, cmp);
        if (willCarry(merged, carry)) {
            result.push(undefined);
            carry = merged2;
            continue;
        }

        carry = undefined;
        result.push(merged2);
    }

    if (carry) {
        result.push(carry);
    }

    return result;
}

function willCarry<T>(tree1: BinomialTree<T> | undefined, tree2: BinomialTree<T> | undefined) {
    return !!(tree1 && tree2);
}

function mergeTree<T>(
    tree1: BinomialTree<T> | undefined,
    tree2: BinomialTree<T> | undefined,
    cmp: OrdComparator<T>
): BinomialTree<T> | undefined {
    if (!tree1) {
        return tree2;
    }

    if (!tree2) {
        return tree1;
    }

    return cmp(tree1.item, tree2.item) !== 'GT'
        ? appendSubtree(tree1, tree2)
        : appendSubtree(tree2, tree1);
}

function appendSubtree<T>(parent: BinomialTree<T>, toAppend: BinomialTree<T>) {
    return mkTree(
        parent.item,
        parent.subtrees.concat([ toAppend ])
    );
}

function findMinElementIdx<T>(forest: Forest<T>, comparator: OrdComparator<T>) {
    if (!forest.length) throw new Error('Broken heap');

    return forest.reduce(
        (currIdx, x, newIdx, forest) => {
            const tree = forest[currIdx];

            return !tree || tree && x && comparator(x.item, tree.item) === 'LT'
                ? newIdx
                : currIdx;
        },
        0
    );
}

function heapifyBinary<T>(items: T[], start: number, end: number, comparator: OrdComparator<T>): BinomialTree<T> {
    const subtrees = [];
    const len = end - start;

    for (let i = 1, offset = start; i < len; i <<= 1) {
        subtrees.push(heapifyBinary(items, offset, offset + i, comparator));
        offset += i;
    }

    return siftDown(items[end - 1], subtrees, comparator);
}

function siftDown<T>(item: T, subtrees: BinomialTree<T>[], comparator: OrdComparator<T>) {
    if (!subtrees.length) {
        return mkTree(item, emptyArray);
    }

    const minIdx = findMinElementIdx(subtrees, comparator);
    if (comparator(item, subtrees[minIdx].item) !== 'GT') {
        return mkTree(item, subtrees);
    }

    // we can mutate them as they are not used anywhere else, but..
    const newSubtrees = subtrees.slice();
    newSubtrees[minIdx] = siftDown(item, subtrees[minIdx].subtrees, comparator);

    return mkTree(subtrees[minIdx].item, newSubtrees);
}


/* Constructors */

function mkHeap<T>(comparator: OrdComparator<T>): BinomialHeap<T> {
    return { comparator, forest: emptyArray };
}

function singleton<T>(item: T, comparator: OrdComparator<T>): BinomialHeap<T> {
    return mkHeap2([ mkTree(item, emptyArray) ], comparator);
}

function mkHeap2<T>(forest: Forest<T>, comparator: OrdComparator<T>): BinomialHeap<T> {
    return { comparator, forest };
}

function mkTree<T>(item: T, subtrees: BinomialTree<T>[]): BinomialTree<T> {
    return { item, subtrees };
}
