
import { OrdComparator } from '../ordering'

export {
    PairingHeap, PairingTree,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify
}


/* Types */

interface PairingHeap<T> {
    comparator: OrdComparator<T>,
    tree: PairingTree<T> | undefined
}

interface List<T> {
    value: T,
    rest: List<T> | undefined
}

interface PairingTree<T> {
    item: T,
    subtrees: List<PairingTree<T>> | undefined
}


/* API Functions */

function isEmpty<T>(heap: PairingHeap<T>): boolean {
    return !heap.tree;
}

function peek<T>(heap: PairingHeap<T>): T | undefined {
    return heap.tree && heap.tree.item;
}

function pop<T>(heap: PairingHeap<T>): [T, PairingHeap<T>] | undefined {
    return heap.tree && [
        heap.tree.item,
        mkHeap2(mergePairs(heap.tree.subtrees, heap.comparator), heap.comparator)
    ];
}

function push<T>(item: T, heap: PairingHeap<T>) {
    if (!heap.tree) {
        return singleton(item, heap.comparator);
    }

    // We've inlined `merge` here. This saves the allocation of a singleton tree for
    // item that would otherwise be immediately destructured. We also save one more
    // node if `item` and `heap.tree.item` are equal as we favour `item`.
    const newTree = heap.comparator(item, heap.tree.item) !== 'GT'
        ? mkTree(item, cons(heap.tree, undefined))
        : mkTree(heap.tree.item, cons(mkTree(item, undefined), heap.tree.subtrees));

    return mkHeap2(newTree, heap.comparator);
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): PairingHeap<T> {
    return items.reduce(
        (heap, x) => push(x, heap),
        mkHeap(comparator)
    );
}


/* Private Implementation Functions */

function merge<T>(
    tree1: PairingTree<T> | undefined,
    tree2: PairingTree<T> | undefined,
    cmp: OrdComparator<T>
): PairingTree<T> | undefined {
    if (!tree1) {
        return tree2;
    }

    if (!tree2) {
        return tree1;
    }

    return cmp(tree1.item, tree2.item) === 'LT'
        ? mkTree(tree1.item, cons(tree2, tree1.subtrees))
        : mkTree(tree2.item, cons(tree1, tree2.subtrees));
}

function mergePairs<T>(list: List<PairingTree<T>> | undefined, cmp: OrdComparator<T>): PairingTree<T> | undefined {
    if (!list) {
        return undefined;
    }

    if (!list.rest) {
        return list.value;
    }

    return merge(
        merge(list.value, list.rest.value, cmp),
        mergePairs(list.rest.rest, cmp),
        cmp
    );
}

/* Constructors */

function mkHeap<T>(comparator: OrdComparator<T>): PairingHeap<T> {
    return { comparator, tree: undefined };
}

function singleton<T>(item: T, comparator: OrdComparator<T>): PairingHeap<T> {
    return mkHeap2(mkTree(item, undefined), comparator);
}

function mkHeap2<T>(tree: PairingTree<T> | undefined, comparator: OrdComparator<T>): PairingHeap<T> {
    return { comparator, tree };
}

function mkTree<T>(item: T, subtrees: List<PairingTree<T>> | undefined): PairingTree<T> {
    return { item, subtrees };
}

function cons<T>(x: T, xs: List<T> | undefined): List<T> {
    return { value: x, rest: xs };
}
