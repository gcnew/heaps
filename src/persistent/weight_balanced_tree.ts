
import { OrdComparator } from '../ordering'

export {
    /* (private) Implementation types */
    WBT, Bin, isBalanced,

    /* Public API */
    WeightBalancedTree,

    newTree as mkTree, singleton,
    isEmpty, size, member, lookup, insert, remove, unassoc, removeMin, removeMax,
    map, foldr, foldl,

    /* Utility functions */
    checkBalanced
}

// Implementation based on:
// `Balancing weight-balanced trees`, Hirai & Yamamoto
//     https://yoichihirai.com/bst.pdf
//
// Haskell's Data.Map
//     https://hackage.haskell.org/package/containers-0.5.10.2/docs/Data-Map-Lazy.html


/* Types & Constants */

interface Bin<K, V> {
    key: K,
    value: V,
    left: Bin<K, V> | undefined,
    right: Bin<K, V> | undefined,
    size: number
}

type WBT<K, V> = Bin<K, V> | undefined

// NOTE:
// According to `Balancing weight-balanced trees`, Hirai & Yamamoto
// only (4,2) and (3,2) work for (delta, gamma).
// However, Haskell's Data.Map source notes that (3,2) is faster for inserts
// and (4,2) for deletes, so I chose (as they did as well) (3,2).

const DELTA = 3;
const GAMMA = 2;

interface WeightBalancedTree<K, V> {
    comparator: OrdComparator<K>,
    tree: WBT<K, V>
}


/* API */

function newTree<K, V>(comparator: OrdComparator<K>): WeightBalancedTree<K, V> {
    return mkTree(undefined, comparator);
}

function singleton<K, V>(key: K, value: V, comparator: OrdComparator<K>): WeightBalancedTree<K, V> {
    return mkTree(mkBin(key, value, undefined, undefined), comparator);
}

function checkBalanced<K, V>(wbt: WeightBalancedTree<K, V>): boolean {
    return checkBalancedWorker(wbt.tree);
}

function isEmpty<K, V>(wbt: WeightBalancedTree<K, V>): boolean {
    return !wbt.tree;
}

function size<K, V>(wbt: WeightBalancedTree<K, V>): number {
    return sizeWorker(wbt.tree);
}

function member<K, V>(key: K, wbt: WeightBalancedTree<K, V>): boolean {
    return memberWorker(key, wbt.tree, wbt.comparator);
}

function lookup<K, V>(key: K, wbt: WeightBalancedTree<K, V>): V | undefined {
    return lookupWorker(key, wbt.tree, wbt.comparator);
}

function insert<K, V>(key: K, value: V, wbt: WeightBalancedTree<K, V>): WeightBalancedTree<K, V> {
    return mkTree(
        insertWorker(key, value, wbt.tree, wbt.comparator),
        wbt.comparator
    );
}

function remove<K, V>(key: K, wbt: WeightBalancedTree<K, V>): WeightBalancedTree<K, V> {
    const newTree = removeWorker(key, wbt.tree, wbt.comparator);

    return newTree !== wbt.tree
        ? mkTree(newTree, wbt.comparator)
        : wbt;
}

function unassoc<K, V>(key: K, wbt: WeightBalancedTree<K, V>): [V|undefined, WeightBalancedTree<K, V>] {
    const [value, newTree] = unassocWorker(key, wbt.tree, wbt.comparator);

    return newTree !== wbt.tree
        ? [ value, mkTree(newTree, wbt.comparator) ]
        : [ value, wbt ];
}

function removeMin<K, V>(wbt: WeightBalancedTree<K, V>): [K|undefined, V|undefined, WeightBalancedTree<K, V>] {
    if (!wbt.tree) {
        return [undefined, undefined, wbt];
    }

    const [key, value, tree] = removeMinWorker(wbt.tree);
    return [ key, value, mkTree(tree, wbt.comparator) ];
}

function removeMax<K, V>(wbt: WeightBalancedTree<K, V>): [K|undefined, V|undefined, WeightBalancedTree<K, V>] {
    if (!wbt.tree) {
        return [undefined, undefined, wbt];
    }

    const [key, value, tree] = removeMaxWorker(wbt.tree);
    return [ key, value, mkTree(tree, wbt.comparator) ];
}

function map<K, A, B>(wbt: WeightBalancedTree<K, A>, f: (value: A) => B): WeightBalancedTree<K, B> {
    return mkTree(mapWorker(wbt.tree, f), wbt.comparator);
}

function foldr<K, V, A>(wbt: WeightBalancedTree<K, V>, initial: A, f: (key: K, value: V, acc: A) => A): A {
    return foldrWorker(wbt.tree, initial, f);
}

function foldl<K, V, A>(wbt: WeightBalancedTree<K, V>, initial: A, f: (acc: A, key: K, value: V) => A): A {
    return foldlWorker(wbt.tree, initial, f);
}


/* Worksers */

function sizeWorker<K, V>(tree: WBT<K, V>): number {
    return tree ? tree.size : 0;
}

function memberWorker<K, V>(key: K, tree: WBT<K, V>, cmp: OrdComparator<K>): boolean {
    if (!tree) {
        return false;
    }

    switch (cmp(key, tree.key)) {
        case 'EQ': return true;
        case 'LT': return memberWorker(key, tree.left, cmp);
        case 'GT': return memberWorker(key, tree.right, cmp);
    }
}

function lookupWorker<K, V>(key: K, tree: WBT<K, V>, cmp: OrdComparator<K>): V | undefined {
    if (!tree) {
        return undefined;
    }

    switch (cmp(key, tree.key)) {
        case 'EQ': return tree.value;
        case 'LT': return lookupWorker(key, tree.left, cmp);
        case 'GT': return lookupWorker(key, tree.right, cmp);
    }
}

function insertWorker<K, V>(key: K, value: V, tree: WBT<K, V>, cmp: OrdComparator<K>): Bin<K, V> {
    if (!tree) {
        return mkBin(key, value, undefined, undefined);
    }

    switch (cmp(key, tree.key)) {
        case 'EQ': return mkBin(key, value, tree.left, tree.right);
        case 'LT': return balanceR(tree.key, tree.value, insertWorker(key, value, tree.left, cmp), tree.right);
        case 'GT': return balanceL(tree.key, tree.value, tree.left, insertWorker(key, value, tree.right, cmp));
    }
}

function removeWorker<K, V>(key: K, tree: WBT<K, V>, cmp: OrdComparator<K>): WBT<K, V> {
    if (!tree) {
        return undefined
    }

    switch (cmp(key, tree.key)) {
        case 'EQ': return glue(tree.left, tree.right);
        case 'LT': {
            const left = removeWorker(key, tree.left, cmp);

            if (left === tree.left) {
                return tree;
            }

            return tree.right
                ? balanceL(tree.key, tree.value, left, tree.right)
                : mkBin(tree.key, tree.value, left, undefined);
        }

        case 'GT': {
            const right = removeWorker(key, tree.right, cmp);

            if (right === tree.right) {
                return tree;
            }

            return tree.left
                ? balanceR(tree.key, tree.value, tree.left, right)
                : mkBin(tree.key, tree.value, undefined, right);
        }
    }
}

function unassocWorker<K, V>(key: K, tree: WBT<K, V>, cmp: OrdComparator<K>): [V | undefined, WBT<K, V>] {
    if (!tree) {
        return [undefined, undefined];
    }

    let newTree;
    switch (cmp(key, tree.key)) {
        case 'EQ': return [tree.value, glue(tree.left, tree.right)];
        case 'LT': {
            const [value, left] = unassocWorker(key, tree.left, cmp);

            if (left === tree.left) {
                newTree = tree;
            }
            else {
                newTree = tree.right
                    ? balanceL(tree.key, tree.value, left, tree.right)
                    : mkBin(tree.key, tree.value, left, undefined);
            }

            return [value, newTree];
        }

        case 'GT': {
            const [value, right] = unassocWorker(key, tree.right, cmp);

            if (right === tree.right) {
                newTree = tree;
            } else {
                newTree = tree.left
                    ? balanceR(tree.key, tree.value, tree.left, right)
                    : mkBin(tree.key, tree.value, undefined, right)
            }

            return [value, newTree];
        }
    }
}

function removeMaxWorker<K, V>(tree: Bin<K, V>): [K, V, WBT<K, V>] {
    if (!tree.right) {
        return [tree.key, tree.value, tree.left];
    }

    const [key, val, right] = removeMaxWorker(tree.right);
    const newTree = balance(tree.key, tree.value, tree.left, right);
    return [ key, val, newTree ];
}

function removeMinWorker<K, V>(tree: Bin<K, V>): [K, V, WBT<K, V>] {
    if (!tree.left) {
        return [tree.key, tree.value, tree.right];
    }

    const [key, val, left] = removeMinWorker(tree.left);
    const newTree = balance(tree.key, tree.value, left, tree.right);
    return [ key, val, newTree ];
}

function mapWorker<K, A, B>(wbt: WBT<K, A>, f: (value: A) => B): WBT<K, B> {
    if (!wbt) {
        return wbt;
    }

    return mkBin(
        wbt.key,
        f(wbt.value),
        mapWorker(wbt.left, f),
        mapWorker(wbt.right, f)
    );
}

function foldrWorker<K, V, A>(wbt: WBT<K, V>, initial: A, f: (key: K, value: V, acc: A) => A): A {
    if (!wbt) {
        return initial;
    }

    const r = foldrWorker(wbt.right, initial, f);
    return foldrWorker(wbt.left, f(wbt.key, wbt.value, r), f);
}

function foldlWorker<K, V, A>(wbt: WBT<K, V>, initial: A, f: (acc: A, key: K, value: V) => A): A {
    if (!wbt) {
        return initial;
    }

    const l = foldlWorker(wbt.left, initial, f);
    return foldlWorker(wbt.right, f(l, wbt.key, wbt.value), f);
}

function glue<K, V>(left: WBT<K, V>, right: WBT<K, V>): WBT<K, V> {
    if (!left) {
        return right;
    }

    if (!right) {
        return left;
    }

    if (sizeWorker(left) > sizeWorker(right)) {
        const [key, val, l] = removeMaxWorker(left);
        return balanceL(key, val, l, right);
    }
    else {
        const [key, val, r] = removeMinWorker(right);
        return balanceR(key, val, left, r);
    }
}

function isBalanced<K, V>(left: WBT<K, V>, right: WBT<K, V>): boolean {
    const ls = sizeWorker(left);
    const rs = sizeWorker(right);

    return ls + rs <= 1 || DELTA * ls >= rs;
}

function checkBalancedWorker<K, V>(tree: WBT<K, V>): boolean {
    if (!tree) {
        return true;
    }

    return isBalanced(tree.left, tree.right)
        && isBalanced(tree.right, tree.left)
        && checkBalancedWorker(tree.left)
        && checkBalancedWorker(tree.right);
}

function isSingle<K, V>(left: WBT<K, V>, right: WBT<K, V>): boolean {
    const ls = sizeWorker(left);
    const rs = sizeWorker(right);

    return ls < GAMMA * rs;
}

function balance<K, V>(key: K, value: V, left: WBT<K, V>, right: WBT<K, V>): Bin<K, V> {
    if (isBalanced(left, right) && isBalanced(right, left)) {
        return mkBin(key, value, left, right);
    }

    if (sizeWorker(left) > sizeWorker(right)) {
        if (!left) {
            throw new Error('balance: broken left tree');
        }

        return rotateR(key, value, left, right);
    }

    if (!right) {
        throw new Error('balance: broken right tree');
    }

    return rotateL(key, value, left, right);
}

function balanceL<K, V>(key: K, value: V, left: WBT<K, V>, right: Bin<K, V>): Bin<K, V> {
    return isBalanced(left, right)
        ? mkBin(key, value, left, right)
        : rotateL(key, value, left, right);
}

function balanceR<K, V>(key: K, value: V, left: Bin<K, V>, right: WBT<K, V>): Bin<K, V> {
    return isBalanced(right, left)
        ? mkBin(key, value, left, right)
        : rotateR(key, value, left, right);
}

function rotateL<K, V>(key: K, value: V, left: WBT<K, V>, right: Bin<K, V>) {
    return isSingle(right.left, right.right)
        ? rotSingleL(key, value, left, right)
        : rotDoubleL(key, value, left, right);
}

function rotateR<K, V>(key: K, value: V, left: Bin<K, V>, right: WBT<K, V>) {
    return isSingle(left.right, left.left)
        ? rotSingleR(key, value, left, right)
        : rotDoubleR(key, value, left, right);
}

/*
     A                C
    / \              / \
   x   C     ->     A   z
      / \          / \
     y   z        x   y
*/
function rotSingleL<K, V>(key: K, value: V, left: WBT<K, V>, right: Bin<K, V>): Bin<K, V> {
    return mkBin(right.key, right.value, mkBin(key, value, left, right.left), right.right);
}

/*
       C              A
      / \            / \
     A   z    ->    x   C
    / \                / \
   x   y              y   z
*/
function rotSingleR<K, V>(key: K, value: V, left: Bin<K, V>, right: WBT<K, V>): Bin<K, V> {
    return mkBin(left.key, left.value, left.left, mkBin(key, value, left.right, right));
}

/*
     A                  B
    / \              /     \
   x   C     ->     A       C
      / \          / \     / \
     B   z        x   y0  y1  z
    / \
   y0  y1
*/
function rotDoubleL<K, V>(key: K, value: V, left: WBT<K, V>, right: Bin<K, V>): Bin<K, V> {
    if (!right.left) {
        throw new Error('rotDoubleL: broken tree');
    }

    return mkBin(
        right.left.key,
        right.left.value,
        mkBin(key, value, left, right.left.left),
        mkBin(right.key, right.value, right.left.right, right.right)
    );
}

/*
         A                  B
        / \              /     \
       C   x     ->     C       A
      / \              / \     / \
     z   B            z   y0  y1  x
        / \
       y0  y1
*/
function rotDoubleR<K, V>(key: K, value: V, left: Bin<K, V>, right: WBT<K, V>): Bin<K, V> {
    if (!left.right) {
        throw new Error('rotDoubleR: broken tree');
    }

    return mkBin(
        left.right.key,
        left.right.value,
        mkBin(left.key, left.value, left.left, left.right.left),
        mkBin(key, value, left.right.right, right)
    );
}


/* Constructors */

function mkBin<K, V>(key: K, value: V, left: WBT<K, V>, right: WBT<K, V>): Bin<K, V> {
    const size = sizeWorker(left) + sizeWorker(right) + 1;
    return { key, value, left, right, size };
}

function mkTree<K, V>(tree: WBT<K, V>, comparator: OrdComparator<K>): WeightBalancedTree<K, V> {
    return { comparator, tree };
}
