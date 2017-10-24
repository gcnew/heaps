
import { OrdComparator } from '../ordering'

export {
    LeftistHeap, LeftistTree,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify
}


/* Types */

// Height biased leftist tree. The rank is the minimum distance to an empty subtree.
//
// e.g. rank(undefined)                     == 0
//      rank(singleton(x))                  == 1
//      rank(left rank = 5, right rank = 0) == 0

interface LeftistTree<T> {
    item: T,
    rank: number,
    left: LeftistTree<T> | undefined,
    right: LeftistTree<T> | undefined
}

interface LeftistHeap<T> {
    comparator: OrdComparator<T>,
    tree: LeftistTree<T> | undefined
}


/* API Functions */

function isEmpty<T>(heap: LeftistHeap<T>): boolean {
    return !heap.tree;
}

function peek<T>(heap: LeftistHeap<T>): T | undefined {
    return heap.tree && heap.tree.item;
}

function pop<T>(heap: LeftistHeap<T>): [T, LeftistHeap<T>] | undefined {
    return heap.tree && [
        heap.tree.item,
        mkHeap2(merge(heap.tree.left, heap.tree.right, heap.comparator), heap.comparator)
    ];
}

function push<T>(item: T, heap: LeftistHeap<T>) {
    return mkHeap2(
        merge(mkTree(item, 1, undefined, undefined), heap.tree, heap.comparator),
        heap.comparator
    );
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): LeftistHeap<T> {
    // Pairwise merging should be O(n) according to Wikipedia.
    // The naive `push` based approach is O(n * log(n)).

    // Basic idea: we do parwise merges until there is only one tree left.
    // Instead of mapping the initial values into singleton trees, we are doing
    // a one-off optimized merge and then we proceed with normal tree merges.

    const primTrees = combinePairs(
        items,
        (x, y) => comparator(x, y) === 'LT'
            ? mkTree(x, 1, mkTree(y, 1, undefined, undefined), undefined)
            : mkTree(y, 1, mkTree(x, 1, undefined, undefined), undefined),
        x => mkTree(x, 1, undefined, undefined)
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
    tree1: LeftistTree<T> | undefined,
    tree2: LeftistTree<T> | undefined,
    cmp: OrdComparator<T>
): LeftistTree<T> | undefined {
    if (!tree1) {
        return tree2;
    }

    if (!tree2) {
        return tree1;
    }

    // favour left side
    return cmp(tree1.item, tree2.item) !== 'GT'
        ? join(tree1.item, tree1.left, merge(tree1.right, tree2, cmp))
        : join(tree2.item, tree2.left, merge(tree1, tree2.right, cmp));
}

function join<T>(item: T, tree1: LeftistTree<T> | undefined, tree2: LeftistTree<T> | undefined) {
    const rank1 = tree1 ? tree1.rank : 0;
    const rank2 = tree2 ? tree2.rank : 0;

    return (rank1 >= rank2)
        ? mkTree(item, rank2 + 1, tree1, tree2)
        : mkTree(item, rank1 + 1, tree2, tree1);
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

function mkHeap<T>(comparator: OrdComparator<T>): LeftistHeap<T> {
    return { comparator, tree: undefined };
}

function singleton<T>(item: T, comparator: OrdComparator<T>): LeftistHeap<T> {
    return mkHeap2(mkTree(item, 1, undefined, undefined), comparator);
}

function mkHeap2<T>(tree: LeftistTree<T> | undefined, comparator: OrdComparator<T>): LeftistHeap<T> {
    return { comparator, tree };
}

function mkTree<T>(item: T, rank: number, left: LeftistTree<T> | undefined, right: LeftistTree<T> | undefined): LeftistTree<T> {
    return { item, rank, left, right };
}
