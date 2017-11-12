
import { FingerTree } from './finger_tree'
import * as FT from './finger_tree'

export {
    FingerVector,

    mkVector, singleton,

    cons, snoc, append,

    isEmpty, length,

    head, tail, last, init, popLeft, popRight,

    elementAt, take, drop, splitAt,

    map, foldl, foldr
}

type Size = number
type FingerVector<T> = FingerTree<T, Size>

const SizeDict = FT.mkMeasureMonoidDict<{}, Size>(
    _ => 1,
    0,
    (x, y) => x + y
);

const empty = FT.mkTree<any, number>(SizeDict);

function mkVector<T>(): FingerVector<T> {
    return empty;
}

function isEmpty<T>(vec: FingerVector<T>) {
    return FT.isEmpty(vec);
}

function singleton<T>(x: T): FingerVector<T> {
    return FT.singleton(x, SizeDict);
}

function cons<T>(x: T, vec: FingerVector<T>) {
    return FT.cons(x, vec);
}

function snoc<T>(x: T, vec: FingerVector<T>) {
    return FT.snoc(x, vec);
}

function append<T>(vec1: FingerVector<T>, vec2: FingerVector<T>): FingerVector<T> {
    return FT.concat(vec1, vec2);
}

function length<T>(vec: FingerVector<T>) {
    return FT.measure(vec);
}

function head<T>(vec: FingerVector<T>): T | undefined {
    return FT.peekLeft(vec);
}

function tail<T>(vec: FingerVector<T>): FingerVector<T> | undefined {
    const res = FT.popLeft(vec);
    return res && res[1];
}

function last<T>(vec: FingerVector<T>): T | undefined {
    return FT.peekRight(vec);
}

function init<T>(vec: FingerVector<T>): FingerVector<T> | undefined {
    const res = FT.popRight(vec);
    return res && res[1];
}

function popLeft<T>(vec: FingerVector<T>): [T, FingerVector<T>] | undefined {
    return FT.popLeft(vec);
}

function popRight<T>(vec: FingerVector<T>): [T, FingerVector<T>] | undefined {
    return FT.popRight(vec);
}

function elementAt<T>(index: number, vec: FingerVector<T>): T | undefined {
    return FT.search(vec, x => index < x);
}

function splitAt<T>(index: number, vec: FingerVector<T>): [FingerVector<T>, FingerVector<T>] {
    return FT.split(vec, x => index < x);
}

function take<T>(n: number, vec: FingerVector<T>): FingerVector<T> {
    return FT.splitLeft(vec, x => n < x);
}

function drop<T>(n: number, vec: FingerVector<T>): FingerVector<T> {
    return FT.splitRight(vec, x => n < x);
}

function map<A, B>(vec: FingerVector<A>, f: (x: A) => B): FingerVector<B> {
    return FT.map(vec, f, SizeDict);
}

function foldr<A, B>(vec: FingerVector<A>, initial: B, f: (x: A, acc: B) => B): B {
    return FT.foldr(vec, initial, f);
}

function foldl<A, B>(vec: FingerVector<A>, initial: B, f: (acc: B, x: A) => B): B {
    return FT.foldl(vec, initial, f);
}
