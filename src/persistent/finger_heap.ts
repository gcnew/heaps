
import { FingerTree } from './finger_tree'
import * as FT from './finger_tree'

import { OrdComparator } from '../ordering'

export {
    FingerHeap, OrdBox,

    mkHeap, singleton, isEmpty, peek, pop, push, heapify
}


type FingerHeap<T> = FingerTree<T, OrdBox<T>>

type OrdBox<T> = { kind: 'empty' }
               | { kind: 'boxed', item: T }


const EmptyBox = { kind: 'empty' as 'empty' };


function mkHeap<T>(comparator: OrdComparator<T>): FingerHeap<T> {
    return FT.mkTree(mkMM(comparator));
}

function singleton<T>(item: T, comparator: OrdComparator<T>): FingerHeap<T> {
    return FT.singleton(item, mkMM(comparator));
}

function isEmpty<T>(heap: FingerHeap<T>): boolean {
    return FT.isEmpty(heap);
}

function peek<T>(heap: FingerHeap<T>): T | undefined {
    const measurement = FT.measure(heap);

    return measurement.kind === 'empty'
        ? undefined
        : measurement.item;
}

function pop<T>(heap: FingerHeap<T>): [T, FingerHeap<T>] | undefined {
    const measurement = FT.measure(heap);
    if (measurement.kind === 'empty') {
        return undefined;
    }

    const split = FT.splitWithItem(
        heap,
        x => x.kind === 'boxed' && x.item === measurement.item
    );

    return split && [ split[1], FT.concat(split[0], split[2]) ];
}

function push<T>(item: T, heap: FingerHeap<T>) {
    return FT.cons(item, heap);
}

function heapify<T>(items: T[], comparator: OrdComparator<T>): FingerHeap<T> {
    return items.reduce(
        (acc, x) => FT.snoc(x, acc),
        mkHeap(comparator)
    );
}

function mkMM<T>(cmp: OrdComparator<T>) {
    return FT.mkMeasureMonoidDict<T, OrdBox<T>>(
        mkBoxed,
        EmptyBox,
        (x, y) => {
            if (x.kind === 'empty') {
                return y;
            }

            if (y.kind === 'empty') {
                return x;
            }

            return cmp(x.item, y.item) !== 'GT' ? x : y;
        }
    );
}


function mkBoxed<T>(item: T): OrdBox<T> {
    return { kind: 'boxed', item };
}
