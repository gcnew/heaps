
import { HashEqDict  } from '../hashing'

export {
    /* (private) Implementation types */
    Trie, Value, Chain, Bitmap,

    /* Public API */
    HAMT,

    newTrie as mkTrie, singleton,
    isEmpty, size, member, lookup, insert, remove, unassoc,
    map, foldr, foldl,
}


type HAMT<K, V> = {
    dict: HashEqDict<K>,
    trie: Trie<K, V> | undefined
}

type Trie<K, V> = Bitmap<K, V>
                | Chain<K, V>

interface Value<K, V> {
    kind: 'value',
    hash: number,
    key: K,
    value: V
}

interface Chain<K, V> {
    kind: 'chain',
    hash: number,
    data: Value<K, V>[]
}

interface Bitmap<K, V> {
    kind: 'bitmap',
    bitmap: number,
    data: (Trie<K, V> | Value<K, V>)[]
}

// bitcount in the hash
// update `popCount` if `HASH_SZ` > 32
const HASH_SZ = 32;

const SHIFT   = 5;
const MASK    = (1 << SHIFT) - 1;


/* API */

function newTrie<K, V>(dict: HashEqDict<K>): HAMT<K, V> {
    return mkTrie(undefined, dict);
}

function singleton<K, V>(key: K, value: V, dict: HashEqDict<K>): HAMT<K, V> {
    return mkTrie(asBitmap(mkValue(key, value, dict.hash(key))), dict);
}

function isEmpty<K, V>(hamt: HAMT<K, V>): boolean {
    return !hamt.trie;
}

function size<K, V>(hamt: HAMT<K, V>): number {
    return foldl(hamt, 0, x => x + 1);
}

function member<K, V>(key: K, hamt: HAMT<K, V>): boolean {
    return !!hamt.trie && memberWorker(key, hamt.dict.hash(key), 0, hamt.trie, hamt.dict);
}

function lookup<K, V>(key: K, hamt: HAMT<K, V>): V | undefined {
    return hamt.trie && lookupWorker(key, hamt.dict.hash(key), 0, hamt.trie, hamt.dict);
}

function insert<K, V>(key: K, value: V, hamt: HAMT<K, V>): HAMT<K, V> {
    if (!hamt.trie) {
        return singleton(key, value, hamt.dict);
    }

    return mkTrie(
        insertWorker(key, value, hamt.dict.hash(key), 0, hamt.trie, hamt.dict),
        hamt.dict
    );
}

function remove<K, V>(key: K, hamt: HAMT<K, V>): HAMT<K, V> {
    if (!hamt.trie) {
        return hamt;
    }

    const newTrie = removeWorker(key, hamt.dict.hash(key), 0, hamt.trie, hamt.dict);
    return newTrie !== hamt.trie
        ? mkTrie(newTrie && asBitmap(newTrie), hamt.dict)
        : hamt;
}

function unassoc<K, V>(key: K, hamt: HAMT<K, V>): [V|undefined, HAMT<K, V>] {
    if (!hamt.trie) {
        return [undefined, hamt];
    }

    const [value, newTrie] = unassocWorker(key, hamt.dict.hash(key), 0, hamt.trie, hamt.dict);
    return newTrie !== hamt.trie
        ? [ value, mkTrie(newTrie && asBitmap(newTrie), hamt.dict) ]
        : [ value, hamt ];
}

function map<K, A, B>(hamt: HAMT<K, A>, f: (value: A) => B): HAMT<K, B> {
    if (!hamt.trie) {
        return hamt as HAMT<K, B>; // TYH
    }

    return mkTrie(mapWorker(f, hamt.trie) as Trie<K, B>, hamt.dict); // TYH
}

function foldr<K, V, A>(hamt: HAMT<K, V>, initial: A, f: (key: K, value: V, acc: A) => A): A {
    if (!hamt.trie) {
        return initial;
    }

    return foldrWorker(f, initial, hamt.trie);
}

function foldl<K, V, A>(hamt: HAMT<K, V>, initial: A, f: (acc: A, key: K, value: V) => A): A {
    if (!hamt.trie) {
        return initial;
    }

    return foldlWorker(f, initial, hamt.trie);
}


/* Workers */

function memberWorker<K, V>(key: K, hash: number, shift: number, trie: Trie<K, V>, dict: HashEqDict<K>): boolean {
    if (trie.kind === 'chain') {
        if (trie.hash === hash) {
            for (let i = 0; i < trie.data.length; ++i) {
                const kvh = trie.data[i];

                if (dict.eq(kvh.key, key)) {
                    return true;
                }
            }
        }

        return false;
    }

    const hashIdx = (hash >>> shift) & MASK;
    const bitIndex = popCount(trie.bitmap & ((1 << hashIdx) - 1));

    if (!(trie.bitmap & (1 << hashIdx))) {
        return false;
    }

    const bd = trie.data[bitIndex];
    return bd.kind === 'value'
        ? bd.hash === hash && dict.eq(bd.key, key)
        : memberWorker(key, hash, shift + SHIFT, bd, dict);
}

function lookupWorker<K, V>(key: K, hash: number, shift: number, trie: Trie<K, V>, dict: HashEqDict<K>): V | undefined {
    if (trie.kind === 'chain') {
        if (trie.hash === hash) {
            for (let i = 0; i < trie.data.length; ++i) {
                const kvh = trie.data[i];

                if (dict.eq(kvh.key, key)) {
                    return kvh.value;
                }
            }
        }

        return undefined;
    }

    const hashIdx = (hash >>> shift) & MASK;
    const bitIndex = popCount(trie.bitmap & ((1 << hashIdx) - 1));

    if (!(trie.bitmap & (1 << hashIdx))) {
        return undefined;
    }

    const bd = trie.data[bitIndex];
    return bd.kind === 'value'
        ? bd.hash === hash && dict.eq(bd.key, key)
            ? bd.value
            : undefined
        : lookupWorker(key, hash, shift + SHIFT, bd, dict);
}

function insertWorker<K, V>(key: K, value: V, hash: number, shift: number, trie: Trie<K, V>, dict: HashEqDict<K>): Trie<K, V> {
    if (trie.kind === 'chain') {
        if (trie.hash === hash) {
            const insertValue = mkValue(key, value, hash);
            for (let i = 0; i < trie.data.length; ++i) {
                const kvh = trie.data[i];

                if (dict.eq(kvh.key, key)) {
                    return mkChain(hash, update(insertValue, i, trie.data));
                }
            }
        }

        return merge(key, value, hash, shift, trie);
    }

    const hashIdx = (hash >>> shift) & MASK;
    const bitIndex = popCount(trie.bitmap & ((1 << hashIdx) - 1));

    let newData;
    if (trie.bitmap & (1 << hashIdx)) {
        const bd = trie.data[bitIndex];

        const newbd = bd.kind === 'value'
            ? (bd.hash === hash && dict.eq(bd.key, key))
                ? mkValue(key, value, hash)
                : merge(key, value, hash, shift + SHIFT, bd)
            : insertWorker(key, value, hash, shift + SHIFT, bd, dict);

        newData = update(newbd, bitIndex, trie.data);
    }
    else {
        newData = arrInsert(mkValue(key, value, hash), bitIndex, trie.data);
    }

    return mkBitmap(trie.bitmap | (1 << hashIdx), newData);
}

function merge<K, V>(key: K, value: V, hash: number, shift: number, kvh: Value<K, V> | Chain<K, V>): Trie<K, V> {
    if (shift >= HASH_SZ || hash === kvh.hash) {
        const insertValue = mkValue(key, value, hash);

        return kvh.kind === 'chain'
            ? mkChain(hash, prepend(insertValue, kvh.data))
            : mkChain(hash, [insertValue, kvh]);
    }

    const h1 = (hash >>> shift) & MASK;
    const h2 = (kvh.hash >>> shift) & MASK;

    if (h1 === h2) {
        return mkBitmap(1 << h1, [ merge(key, value, hash, shift + SHIFT, kvh) ]);
    }

    const insertValue = mkValue(key, value, hash);
    return mkBitmap(
        (1 << h1) | (1 << h2),
        h1 > h2 ? [kvh, insertValue]
                : [insertValue, kvh]
    );
}

function removeWorker<K, V>(
    key: K,
    hash: number,
    shift: number,
    trie: Trie<K, V>,
    dict: HashEqDict<K>
): Trie<K, V> | Value<K, V> | undefined {
    if (trie.kind === 'chain') {
        if (trie.hash === hash) {
            for (let i = 0; i < trie.data.length; ++i) {
                const kvh = trie.data[i];

                if (dict.eq(kvh.key, key)) {
                    // a valid Chain always has >= 2 children
                    if (trie.data.length === 2) {
                        return trie.data[i ^ 1];
                    }

                    return mkChain(hash, arrRemove(i, trie.data));
                }
            }
        }

        return trie;
    }

    const hashIdx = (hash >>> shift) & MASK;
    const bitIndex = popCount(trie.bitmap & ((1 << hashIdx) - 1));

    if (!(trie.bitmap & (1 << hashIdx))) {
        return trie;
    }

    const bd = trie.data[bitIndex];
    if (bd.kind === 'value') {
        if (bd.hash !== hash || !dict.eq(bd.key, key)) {
            return trie;
        }
    }
    else {
        const res = removeWorker(key, hash, shift + SHIFT, bd, dict);
        if (res === bd) {
            return trie;
        }

        if (res) {
            return mkBitmap(trie.bitmap, update(res, bitIndex, trie.data));
        }
    }

    if (trie.data.length === 1) {
        return undefined;
    }

    if (trie.data.length === 2 && trie.data[bitIndex ^ 1].kind !== 'bitmap') {
        return trie.data[bitIndex ^ 1];
    }

    const newData = arrRemove(bitIndex, trie.data);
    return mkBitmap(trie.bitmap ^ (1 << hashIdx), newData);
}

function unassocWorker<K, V>(
    key: K,
    hash: number,
    shift: number,
    trie: Trie<K, V>,
    dict: HashEqDict<K>
): [V | undefined, Trie<K, V> | Value<K, V> | undefined] {
    if (trie.kind === 'chain') {
        if (trie.hash === hash) {
            for (let i = 0; i < trie.data.length; ++i) {
                const kvh = trie.data[i];

                if (dict.eq(kvh.key, key)) {
                    // a valid Chain always has >= 2 children
                    if (trie.data.length === 2) {
                        return [kvh.value, trie.data[i ^ 1]];
                    }

                    return [kvh.value, mkChain(hash, arrRemove(i, trie.data))];
                }
            }
        }

        return [undefined, trie];
    }

    const hashIdx = (hash >>> shift) & MASK;
    const bitIndex = popCount(trie.bitmap & ((1 << hashIdx) - 1));

    if (!(trie.bitmap & (1 << hashIdx))) {
        return [undefined, trie];
    }

    let returnValue;
    const bd = trie.data[bitIndex];
    if (bd.kind === 'value') {
        if (bd.hash !== hash || !dict.eq(bd.key, key)) {
            return [undefined, trie];
        }

        returnValue = bd.value;
    }
    else {
        const res = unassocWorker(key, hash, shift + SHIFT, bd, dict);
        if (res[1] === bd) {
            return [undefined, trie];
        }

        if (res[1]) {
            return [res[0], mkBitmap(trie.bitmap, update(res[1]!, bitIndex, trie.data)) ]; // TYH
        }

        returnValue = res[0];
    }

    if (trie.data.length === 1) {
        return [returnValue, undefined];
    }

    if (trie.data.length === 2 && trie.data[bitIndex ^ 1].kind !== 'bitmap') {
        return [returnValue, trie.data[bitIndex ^ 1]];
    }

    const newData = arrRemove(bitIndex, trie.data);
    return [returnValue, mkBitmap(trie.bitmap ^ (1 << hashIdx), newData)];
}

function mapWorker<K, A, B>(f: (value: A) => B, x: Trie<K, A> | Value<K, A>): Trie<K, B> | Value<K, B> {
    if (x.kind === 'value') {
        return mkValue(x.key, f(x.value), x.hash);
    }

    const data = x.data;
    const newData = new Array(data.length);

    for (let i = 0; i < data.length; ++i) {
        newData[i] = mapWorker(f, data[i]);
    }

    return x.kind === 'bitmap'
        ? mkBitmap(x.bitmap, newData)
        : mkChain(x.hash, newData);
}

function foldrWorker<K, V, A>(f: (key: K, value: V, acc: A) => A, acc: A, x: Trie<K, V> | Value<K, V>) {
    if (x.kind === 'value') {
        return f(x.key, x.value, acc);
    }

    const data = x.data;
    for (let i = 0; i < data.length; ++i) {
        acc = foldrWorker(f, acc, data[i]);
    }

    return acc;
}

function foldlWorker<K, V, A>(f: (acc: A, key: K, value: V) => A, acc: A, x: Trie<K, V> | Value<K, V>) {
    if (x.kind === 'value') {
        return f(acc, x.key, x.value);
    }

    const data = x.data;
    for (let i = 0; i < data.length; ++i) {
        acc = foldlWorker(f, acc, data[i]);
    }

    return acc;
}


/* Helpers */

function prepend<T>(x: T, xs: T[]): T[] {
    const retval = new Array(xs.length);

    retval[0] = x;
    for (let i = 0; i < xs.length; ++i) {
        retval[i + 1] = xs[i];
    }

    return retval;
}

function update<T>(x: T, idx: number, xs: T[]): T[] {
    const retval = new Array(xs.length);

    for (let i = 0; i < xs.length; ++i) {
        retval[i] = xs[i];
    }
    retval[idx] = x;

    return retval;
}

function arrInsert<T>(x: T, idx: number, xs: T[]): T[] {
    const retval = new Array(xs.length + 1);

    for (let i = 0; i < idx; ++i) {
        retval[i] = xs[i];
    }

    retval[idx] = x;
    for (let i = idx; i < xs.length; ++i) {
        retval[i + 1] = xs[i];
    }

    return retval;
}

function arrRemove<T>(idx: number, xs: T[]): T[] {
    const retval = new Array(xs.length - 1);

    for (let i = 0; i < idx; ++i) {
        retval[i] = xs[i];
    }

    for (let i = idx; i < retval.length; ++i) {
        retval[i] = xs[i + 1];
    }

    return retval;
}

function asBitmap<K, V>(mixed: Trie<K, V> | Value<K, V>): Bitmap<K, V> {
    if (mixed.kind === 'bitmap') {
        return mixed;
    }

    const hashIdx = mixed.hash & MASK;
    return mkBitmap(1 << hashIdx, [mixed]);
}

// Copied from Java's Integer.bitCount
function popCount(i: number) {
    i = i - ((i >>> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
    i = (i + (i >>> 4)) & 0x0f0f0f0f;
    i = i + (i >>> 8);
    i = i + (i >>> 16);

    return i & 0x3f;
}


/* Constructors */

function mkBitmap<K, V>(bitmap: number, data: (Trie<K, V> | Value<K, V>)[]): Bitmap<K, V> {
    return { kind: 'bitmap', bitmap, data };
}

function mkChain<K, V>(hash: number, data: Value<K, V>[]): Chain<K, V> {
    return { kind: 'chain', hash, data };
}

function mkValue<K, V>(key: K, value: V, hash: number): Value<K, V> {
    return { kind: 'value', hash, key, value };
}

function mkTrie<K, V>(trie: Trie<K, V> | undefined, dict: HashEqDict<K>): HAMT<K, V> {
    return { dict, trie };
}
