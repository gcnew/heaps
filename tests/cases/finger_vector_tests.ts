
import { test } from 'pietr'
import { assert } from 'chai'

import { mkRandomArray } from '../utils'

import {
    FingerVector,

    mkVector, length, isEmpty,

    cons, snoc, head, last, popLeft, popRight,

    splitAt, take, drop, elementAt, append,

    foldl, foldr, map
} from '../../src/persistent/finger_vector'

const arr1 = [1];
const arr10 = mkRandomArray(10);
const arr100 = mkRandomArray(100);
const arr1000 = mkRandomArray(1000);

const vec1c    = arr1.reduce((acc, x) => cons(x, acc), mkVector<number>());
const vec10c   = arr10.reduce((acc, x) => cons(x, acc), mkVector<number>());
const vec100c  = arr100.reduce((acc, x) => cons(x, acc), mkVector<number>());
const vec1000c = arr1000.reduce((acc, x) => cons(x, acc), mkVector<number>());

const vec1s    = arr1.reduce((acc, x) => snoc(x, acc), mkVector<number>());
const vec10s   = arr10.reduce((acc, x) => snoc(x, acc), mkVector<number>());
const vec100s  = arr100.reduce((acc, x) => snoc(x, acc), mkVector<number>());
const vec1000s = arr1000.reduce((acc, x) => snoc(x, acc), mkVector<number>());

const vec1sc    = arr1.reduce((acc, x, i) => (i & 1 ? snoc : cons)(x, acc), mkVector<number>());
const vec10sc   = arr10.reduce((acc, x, i) => (i & 1 ? snoc : cons)(x, acc), mkVector<number>());
const vec100sc  = arr100.reduce((acc, x, i) => (i & 1 ? snoc : cons)(x, acc), mkVector<number>());
const vec1000sc = arr1000.reduce((acc, x, i) => (i & 1 ? snoc : cons)(x, acc), mkVector<number>());

const testArr = arr100;
const testVec = vec100s;

function assertSameElements<T>(vec: FingerVector<T>, arr: T[], start: number, end: number) {
    let item, curr = vec;
    for (let i = start; i < end; ++i) {
        [item, curr] = popLeft(curr)!;
        assert.equal(item, arr[i]);
    }
    assert.isTrue(isEmpty(curr));
}

test('FingerTree :: length', () => {
    assert.equal(length(mkVector()), 0);

    assert.equal(length(vec1c), arr1.length);
    assert.equal(length(vec10c), arr10.length);
    assert.equal(length(vec100c), arr100.length);
    assert.equal(length(vec1000c), arr1000.length);

    assert.equal(length(vec1s), arr1.length);
    assert.equal(length(vec10s), arr10.length);
    assert.equal(length(vec100s), arr100.length);
    assert.equal(length(vec1000s), arr1000.length);

    assert.equal(length(vec1sc), arr1.length);
    assert.equal(length(vec10sc), arr10.length);
    assert.equal(length(vec100sc), arr100.length);
    assert.equal(length(vec1000sc), arr1000.length);
});

test('FingerTree :: head / popLeft', () => {
    assert.isUndefined(head(mkVector()));

    let item, vec = vec1000s;
    for (let i = 0; i < arr1000.length; ++i) {
        assert.equal(head(vec), arr1000[i]);
        [item, vec] = popLeft(vec)!;
        assert.equal(item, arr1000[i]);
    }

    assert.isTrue(isEmpty(vec));
});

test('FingerTree :: last / popRight', () => {
    assert.isUndefined(head(mkVector()));

    let item, vec = vec1000c;
    for (let i = 0; i < arr1000.length; ++i) {
        assert.equal(last(vec), arr1000[i]);
        [item, vec] = popRight(vec)!;
        assert.equal(item, arr1000[i]);
    }

    assert.isTrue(isEmpty(vec));
});

test('FingerTree :: split / concat', () => {
    const empty = mkVector<number>();

    const split1 = splitAt(-10, empty);
    assert.isTrue(isEmpty(split1[0]) && isEmpty(split1[1]));

    const split2 = splitAt(10, empty);
    assert.isTrue(isEmpty(split2[0]) && isEmpty(split2[1]));

    const split3 = splitAt(0, empty);
    assert.isTrue(isEmpty(split3[0]) && isEmpty(split3[1]));

    for (let i = 0; i < testArr.length; ++i) {
        const split = splitAt(i, testVec);

        assertSameElements(split[0], testArr, 0, i);
        assertSameElements(split[1], testArr, i, testArr.length);
        assertSameElements(append(split[0], split[1]), testArr, 0, testArr.length);
    }
});

test('FingerTree :: search', () => {
    for (let i = 0; i < testArr.length; ++i) {
        const e = elementAt(i, testVec);
        assert.equal(e, testArr[i]);
    }
});

test('FingerTree :: splitLeft', () => {
    for (let i = 0; i < testArr.length; ++i) {
        const split = take(i, testVec);
        assertSameElements(split, testArr, 0, i);
    }
});

test('FingerTree :: splitRight', () => {
    for (let i = 0; i < testArr.length; ++i) {
        const split = drop(i, testVec);
        assertSameElements(split, testArr, i, testArr.length);
    }
});

test('FingerTree :: foldr', () => {
    foldr(vec1c, 0, (x, idx) => (assert.equal(x, arr1[idx]), idx + 1));
    foldr(vec10c, 0, (x, idx) => (assert.equal(x, arr10[idx]), idx + 1));
    foldr(vec100c, 0, (x, idx) => (assert.equal(x, arr100[idx]), idx + 1));
    foldr(vec1000c, 0, (x, idx) => (assert.equal(x, arr1000[idx]), idx + 1));

    foldr(vec1s, arr1.length - 1, (x, idx) => (assert.equal(x, arr1[idx]), idx - 1));
    foldr(vec10s, arr10.length - 1, (x, idx) => (assert.equal(x, arr10[idx]), idx - 1));
    foldr(vec100s, arr100.length - 1, (x, idx) => (assert.equal(x, arr100[idx]), idx - 1));
    foldr(vec1000s, arr1000.length - 1, (x, idx) => (assert.equal(x, arr1000[idx]), idx - 1));
});

test('FingerTree :: foldl', () => {
    foldl(vec1s, 0, (idx, x) => (assert.equal(x, arr1[idx]), idx + 1));
    foldl(vec10s, 0, (idx, x) => (assert.equal(x, arr10[idx]), idx + 1));
    foldl(vec100s, 0, (idx, x) => (assert.equal(x, arr100[idx]), idx + 1));
    foldl(vec1000s, 0, (idx, x) => (assert.equal(x, arr1000[idx]), idx + 1));

    foldl(vec1c, arr1.length - 1, (idx, x) => (assert.equal(x, arr1[idx]), idx - 1));
    foldl(vec10c, arr10.length - 1, (idx, x) => (assert.equal(x, arr10[idx]), idx - 1));
    foldl(vec100c, arr100.length - 1, (idx, x) => (assert.equal(x, arr100[idx]), idx - 1));
    foldl(vec1000c, arr1000.length - 1, (idx, x) => (assert.equal(x, arr1000[idx]), idx - 1));
});

test('FingerTree :: map', () => {
    const times5 = (x: number) => x * 5;

    foldl(map(vec1s, times5), 0, (idx, x) => (assert.equal(x, times5(arr1[idx])), idx + 1));
    foldl(map(vec10s, times5), 0, (idx, x) => (assert.equal(x, times5(arr10[idx])), idx + 1));
    foldl(map(vec100s, times5), 0, (idx, x) => (assert.equal(x, times5(arr100[idx])), idx + 1));
    foldl(map(vec1000s, times5), 0, (idx, x) => (assert.equal(x, times5(arr1000[idx])), idx + 1));

    foldl(map(vec1c, times5), arr1.length - 1, (idx, x) => (assert.equal(x, times5(arr1[idx])), idx - 1));
    foldl(map(vec10c, times5), arr10.length - 1, (idx, x) => (assert.equal(x, times5(arr10[idx])), idx - 1));
    foldl(map(vec100c, times5), arr100.length - 1, (idx, x) => (assert.equal(x, times5(arr100[idx])), idx - 1));
    foldl(map(vec1000c, times5), arr1000.length - 1, (idx, x) => (assert.equal(x, times5(arr1000[idx])), idx - 1));
});
