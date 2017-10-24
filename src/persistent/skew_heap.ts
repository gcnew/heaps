
import { OrdComparator } from '../ordering'

export {
    SkewHeap, SkewTree,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify
}


/* Types */

// Skew heaps are the same as leftist heaps in implementation sense, appart
// form the merge method and the lack of `rank` bookkeeping.
//
// NOTE: Please keep in-sync

interface SkewTree<T> {
    item: T,
    left: SkewTree<T> | undefined,
    right: SkewTree<T> | undefined
}

interface SkewHeap<T> {
    comparator: OrdComparator<T>,
    tree: SkewTree<T> | undefined
}


/* API Functions */

function isEmpty<T>(heap: SkewHeap<T>): boolean {
    return !heap.tree;
}

function peek<T>(heap: SkewHeap<T>): T | undefined {
    return heap.tree && heap.tree.item;
}

function pop<T>(heap: SkewHeap<T>): [T, SkewHeap<T>] | undefined {
    return heap.tree && [
        heap.tree.item,
        mkHeap2(merge(heap.tree.left, heap.tree.right, heap.comparator), heap.comparator)
    ];
}

function push<T>(item: T, heap: SkewHeap<T>) {
    return mkHeap2(
        merge(mkTree(item, undefined, undefined), heap.tree, heap.comparator),
        heap.comparator
    );
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): SkewHeap<T> {
    // Pairwise merging should be O(n) according to Wikipedia.
    // The naive `push` based approach is O(n * log(n)).

    // Basic idea: we do parwise merges until there is only one tree left.
    // Instead of mapping the initial values into singleton trees, we are doing
    // a one-off optimized merge and then we proceed with normal tree merges.

    const primTrees = combinePairs(
        items,
        (x, y) => comparator(x, y) === 'LT'
            ? mkTree(x, mkTree(y, undefined, undefined), undefined)
            : mkTree(y, mkTree(x, undefined, undefined), undefined),
        x => mkTree(x, undefined, undefined)
    );

    let unmerged = primTrees;
    while (unmerged.length > 1) {
        unmerged = combinePairs(
            unmerged,
            (x, y) => merge(x, y, comparator)!,
            x => x
        );
    }

    return unmerged[0] ? mkHeap2(unmerged[0], comparator)
                       : mkHeap(comparator);
}


/* Private Implementation Functions */

function merge<T>(
    tree1: SkewTree<T> | undefined,
    tree2: SkewTree<T> | undefined,
    cmp: OrdComparator<T>
): SkewTree<T> | undefined {
    if (!tree1) {
        return tree2;
    }

    if (!tree2) {
        return tree1;
    }

    // NB: Flip sides!
    return cmp(tree1.item, tree2.item) !== 'GT'
        ? mkTree(tree1.item, merge(tree2, tree1.right, cmp), tree1.left)
        : mkTree(tree2.item, merge(tree1, tree2.right, cmp), tree2.left);
}

// I think I've seen it called treeFold, but I couldn't find a reference.
function combinePairs<A, B>(xs: A[], combine: (x: A, y: A) => B, map: (x: A) => B) {
    const retval = [];

    let i;
    for (i = 0; i + 1 < xs.length; i += 2) {
        const x = xs[i];
        const y = xs[i + 1];

        retval.push(combine(x, y));
    }

    if (i < xs.length) {
        retval.push(map(xs[i]));
    }

    return retval;
}


/* Constructors */

function mkHeap<T>(comparator: OrdComparator<T>): SkewHeap<T> {
    return { comparator, tree: undefined };
}

function singleton<T>(item: T, comparator: OrdComparator<T>): SkewHeap<T> {
    return mkHeap2(mkTree(item, undefined, undefined), comparator);
}

function mkHeap2<T>(tree: SkewTree<T> | undefined, comparator: OrdComparator<T>): SkewHeap<T> {
    return { comparator, tree };
}

function mkTree<T>(item: T, left: SkewTree<T> | undefined, right: SkewTree<T> | undefined): SkewTree<T> {
    return { item, left, right };
}
