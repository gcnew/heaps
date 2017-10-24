
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
    return items.reduce(
        (heap, x) => push(x, heap),
        mkHeap(comparator)
    );
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
