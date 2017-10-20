
import { OrdComparator } from '../ordering'

export {
    PairingHeap, PairingTree,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify
}


/* Types */

type Nil     = { kind: 'nil' }
type Cons<T> = { kind: 'cons', value: T, rest: List<T> }

type List<T> = Cons<T> | Nil

type PairingHeap<T> = {
    comparator: OrdComparator<T>,
    tree: PairingTree<T>
}

type PairingTree<T> = { kind: 'empty' }
                    | { kind: 'branch', item: T, subtrees: List<PairingTree<T>> }


const Nil = { kind: 'nil' as 'nil' };
const emptyTree = { kind: 'empty' as 'empty' };


/* API Functions */

function isEmpty<T>(heap: PairingHeap<T>): boolean {
    return heap.tree.kind === 'empty';
}

function peek<T>(heap: PairingHeap<T>): T | undefined {
    return heap.tree.kind === 'branch'
        ? heap.tree.item
        : undefined;
}

function pop<T>(heap: PairingHeap<T>): [T, PairingHeap<T>] | undefined {
    if (heap.tree.kind === 'empty') {
        return undefined;
    }

    return [
        heap.tree.item,
        mkHeap2(mergePairs(heap.tree.subtrees, heap.comparator), heap.comparator)
    ];
}

function push<T>(item: T, heap: PairingHeap<T>) {
    if (heap.tree.kind === 'empty') {
        return singleton(item, heap.comparator);
    }

    // We've inlined `merge` here. This saves the allocation of a singleton tree for
    // item that would otherwise be immediately destructured. We also save one more
    // node if `item` and `heap.tree.item` are equal as we favour `item`.
    const newTree = heap.comparator(item, heap.tree.item) !== 'GT'
        ? mkTree(item, cons(heap.tree, Nil))
        : mkTree(heap.tree.item, cons(mkTree(item, Nil), heap.tree.subtrees));

    return mkHeap2(newTree, heap.comparator);
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): PairingHeap<T> {
    return items.reduce(
        (heap, x) => push(x, heap),
        mkHeap(comparator)
    );
}


/* Private Implementation Functions */

function merge<T>(tree1: PairingTree<T>, tree2: PairingTree<T>, cmp: OrdComparator<T>): PairingTree<T> {
    if (tree1.kind === 'empty') {
        return tree2;
    }

    if (tree2.kind === 'empty') {
        return tree1;
    }

    return cmp(tree1.item, tree2.item) === 'LT'
        ? mkTree(tree1.item, cons(tree2, tree1.subtrees))
        : mkTree(tree2.item, cons(tree1, tree2.subtrees));
}

function mergePairs<T>(list: List<PairingTree<T>>, cmp: OrdComparator<T>): PairingTree<T> {
    if (list.kind === 'nil') {
        return emptyTree;
    }

    if (list.rest.kind === 'nil') {
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
    return {
        comparator,
        tree: emptyTree
    };
}

function singleton<T>(item: T, comparator: OrdComparator<T>): PairingHeap<T> {
    return mkHeap2(mkTree(item, Nil), comparator);
}

function mkHeap2<T>(tree: PairingTree<T>, comparator: OrdComparator<T>): PairingHeap<T> {
    return { comparator, tree };
}

function mkTree<T>(item: T, subtrees: List<PairingTree<T>>): PairingTree<T> {
    return { kind: 'branch', item, subtrees };
}

function cons<T>(x: T, xs: List<T>): List<T> {
    return { kind: 'cons', value: x, rest: xs };
}
