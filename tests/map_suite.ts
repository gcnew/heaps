
import { test } from 'pietr'
import { assert } from 'chai'

import { assertFail } from './utils'
import { strictEq } from '../src/eq'
import { HashEqDict, mkHashEqDict, stringHash } from '../src/hashing'
import { OrdComparator, invert, naturalComparator, naturalOrdComparator } from '../src/ordering'

export { Map, MapDict, testMap }

interface Map<K, V> {
    __key: K,
    __value: V
}

interface MapLike<V> {
    [key: string]: V
}

interface MapDict {
    mkMap:        <K, V>(cmp: OrdComparator<K>, dict: HashEqDict<K>) => Map<K, V>,
    singleton:    <K, V>(key: K, value: V, cmp: OrdComparator<K>, dict: HashEqDict<K>) => Map<K, V>,
    isEmpty:      <K, V>(map: Map<K, V>) => boolean,
    size:         <K, V>(map: Map<K, V>) => number,
    member:       <K, V>(key: K, map: Map<K, V>) => boolean,
    lookup:       <K, V>(key: K, map: Map<K, V>) => V | undefined,
    insert:       <K, V>(key: K, value: V, map: Map<K, V>) => Map<K, V>,
    remove:       <K, V>(key: K, map: Map<K, V>) => Map<K, V>,
    unassoc:      <K, V>(key: K, map: Map<K, V>) => [V | undefined, Map<K, V>],
    removeMin:    (<K, V>(map: Map<K, V>) => [K | undefined, V | undefined, Map<K, V>]) | undefined,
    removeMax:    (<K, V>(map: Map<K, V>) => [K | undefined, V | undefined, Map<K, V>]) | undefined,
    map:          <K, V, V2>(map: Map<K, V>, f: (value: V) => V2) => Map<K, V2>,
    foldr:        <K, V, A>(map: Map<K, V>, initial: A, f: (key: K, value: V, acc: A) => A) => A,
    foldl:        <K, V, A>(map: Map<K, V>, initial: A, f: (acc: A, key: K, value: V) => A) => A
}

const StringDict = mkHashEqDict(stringHash, strictEq);
const NumberDict = mkHashEqDict((x: number) => x, strictEq);

const adjectives = [
    'good',   'evil',  'strong',    'weak',   'smart',
    'heroic', 'big',   'small',     'red',    'swelte',
    'green',  'blue',  'sweet',     'salty',  'little',
    'old',    'new',   'important', 'famous', 'rich',
    'shy',    'lazy',  'massive',   'bitter', 'juicy',
    'heavy',  'light', 'moldy',     'misty',  'affable'
];

const nouns = [
    'cat',       'dog',      'computer',    'wombat', 'desk',
    'stone',     'phone',    'pine-cone',   'bag',    'chair',
    'car',       'pencil',   'spreadsheet', 'parser', 'lexer',
    'token',     'function', 'dinosaur',    'song',   'album',
    'processor', 'piece',    'app',         'store',  'goods'
];

function pick<T>(xs: T[]): T {
    const idx = (xs.length * Math.random()) | 0;
    return xs[idx];
}

function generateKey() {
    const adj  = pick(adjectives);
    const noun = pick(nouns);
    const idx  = (Math.random() * 1000 + 1) | 0;

    return adj + '-' + noun + '-' + idx;
}

function generateUniqueKey<T>(obj: MapLike<T>) {
    let key;

    do {
        key = generateKey();
    } while (obj[key] !== undefined);

    return key;
}

function mkRandomObject(n: number) {
    const retval: { [key: string]: number } = {};

    for (let i = 0; i < n; ++i) {
        let key = generateUniqueKey(retval);
        retval[key] = Math.random() * 1000 | 0;
    }

    return retval;
}

function testMap(
    prefix: string,
    { ordered, idRemove }: {
        ordered: boolean,
        idRemove: boolean
    },
    { mkMap, singleton, isEmpty, size, member, lookup, insert,
      remove, unassoc, removeMin, removeMax, map, foldr, foldl
    }: MapDict
) {
    function fromObject<V>(obj: { [key: string]: V }): Map<string, V> {
        return Object.keys(obj).reduce(
            (m, k) => insert(k, obj[k], m),
            mkMap<string, V>(naturalOrdComparator, StringDict)
        );
    }

    function checkSameProps<V>(obj: MapLike<V>, map: Map<string, V>) {
        const keys = Object.keys(obj);
        for (const k of keys) {
            assert.equal(lookup(k, map), obj[k]);
        }

        assert.equal(size(map), keys.length);
    }

    function dataClone<T>(x: T): T {
        return JSON.parse(JSON.stringify(x));
    }

    const __emptyStringMap = mkMap<string, any>(naturalOrdComparator, StringDict);
    function emptyStringMap<T>(): Map<string, T> {
        return __emptyStringMap;
    }

    const obj1    = { test: 'value' };
    const obj10   = mkRandomObject(10);
    const obj100  = mkRandomObject(100);
    const obj1000 = mkRandomObject(1000);

    const map1    = singleton('test', 'value', naturalOrdComparator, StringDict);
    const map10   = fromObject(obj10);
    const map100  = fromObject(obj100);
    const map1000 = fromObject(obj1000);

    const testObj = obj100;
    const testMap = map100;

    test(`${ prefix } :: empty / size`, () => {
        const m0 = mkMap<string, number>(naturalOrdComparator, StringDict);
        const m1 = insert("hello", 1, m0);
        const m2 = insert("world", 2, m1);

        assert.equal(isEmpty(m0), true, 'XOXO');
        assert.equal(isEmpty(m1), false);
        assert.equal(isEmpty(m2), false);

        assert.equal(size(m0), 0);
        assert.equal(size(m1), 1);
        assert.equal(size(m2), 2);

        assert.equal(isEmpty(map1), false);
        assert.equal(isEmpty(map10), false);
        assert.equal(isEmpty(map100), false);
        assert.equal(isEmpty(map1000), false);

        assert.equal(size(map1), 1);
        assert.equal(size(map10), 10);
        assert.equal(size(map100), 100);
        assert.equal(size(map1000), 1000);
    });

    test(`${ prefix } :: member`, () => {
        assert.equal(member('zest', map1), false);
        assert.equal(member('test', map1), true);

        for (const k of Object.keys(testObj)) {
            assert.equal(member(k, testMap), true);
        }
    });

    test(`${ prefix } :: lookup`, () => {
        assert.equal(lookup('zest', map1), undefined);
        assert.equal(lookup('test', map1), 'value');

        for (const k of Object.keys(testObj)) {
            assert.equal(lookup(k, testMap), testObj[k]);
        }
    });

    test(`${ prefix } :: insert ascending`, () => {
        const keys = Object.keys(testObj).sort(naturalComparator);

        const map = keys.reduce(
            (m, k) => insert(k, testObj[k], m),
            mkMap<string, number>(naturalOrdComparator, StringDict)
        );

        checkSameProps(testObj, map);
    });

    test(`${ prefix } :: insert descending`, () => {
        const keys = Object.keys(testObj).sort(invert(naturalComparator));

        const map = keys.reduce(
            (m, k) => insert(k, testObj[k], m),
            mkMap<string, number>(naturalOrdComparator, StringDict)
        );

        checkSameProps(testObj, map);
    });

    test(`${ prefix } :: remove`, () => {
        let map = testMap;
        let obj = dataClone(testObj);

        for (const k of Object.keys(obj)) {
            map = remove(k, map);
            delete obj[k];

            checkSameProps(obj, map);
        }

        assert.equal(size(map), 0);
    });

    test(`${ prefix } :: unassoc`, () => {
        let value;
        let map = testMap;

        for (const k of Object.keys(testObj)) {
            [value, map] = unassoc(k, map);
            assert.equal(value, testObj[k]);
        }

        assert.equal(isEmpty(map), true);
    });

    removeMin && test(`${ prefix } :: removeMin`, () => {
        let key, value;
        let map = testMap;

        const keys = Object.keys(testObj).sort(naturalComparator);
        for (const k of keys) {
            [key, value, map] = removeMin(map);
            assert.equal(key, k);
            assert.equal(value, testObj[k]);
        }

        assert.equal(isEmpty(map), true);
    });

    removeMax && test(`${ prefix } :: removeMax`, () => {
        let key, value;
        let map = testMap;

        const keys = Object.keys(testObj).sort(invert(naturalComparator));
        for (const k of keys) {
            [key, value, map] = removeMax(map);
            assert.equal(key, k);
            assert.equal(value, testObj[k]);
        }

        assert.equal(isEmpty(map), true);
    });

    test(`${ prefix } :: map`, () => {
        const f = (x: number) => String(x * 5);

        assert.equal(map(emptyStringMap(), assertFail), emptyStringMap());

        const m = map(testMap, x => f(x));
        const o = Object.keys(testObj).reduce(
            (acc, k) => (acc[k] = f(testObj[k]), acc), {} as MapLike<string>
        );

        checkSameProps(o, m);
    });

    test(`${ prefix } :: update`, () => {
        const m0 = mkMap<string, string>(naturalOrdComparator, StringDict);
        const m1 = insert('token', 'string', m0);
        const m2 = insert('token', 'number', m1);
        const m3 = insert('token', 'object', m2);

        assert.equal(size(m0), 0);
        assert.equal(lookup('token', m0), undefined);

        assert.equal(size(m1), 1);
        assert.equal(lookup('token', m1), 'string');

        assert.equal(size(m2), 1);
        assert.equal(lookup('token', m2), 'number');

        assert.equal(size(m3), 1);
        assert.equal(lookup('token', m3), 'object');
    });

    test(`${ prefix } :: foldr`, () => {
        assert.equal(foldr(emptyStringMap(), 10, assertFail), 10);

        const found: MapLike<boolean> = {};
        const keys = Object.keys(testObj).sort(naturalComparator);
        const res = foldr(testMap, keys.length, (k, v, idx) => {
            assert.equal(v, testObj[k]);
            if (ordered) {
                assert.equal(k, keys[idx - 1]);
            }
            else {
                assert.equal(found[k], undefined);
                found[k] = true;
            }

            return idx - 1;
        });

        assert.equal(res, 0);
    });

    test(`${ prefix } :: foldl`, () => {
        assert.equal(foldl(emptyStringMap(), 10, assertFail), 10);

        const found: MapLike<boolean> = {};
        const keys = Object.keys(testObj).sort(naturalComparator);
        const res = foldl(testMap, 0, (idx, k, v) => {
            assert.equal(v, testObj[k]);
            if (ordered) {
                assert.equal(k, keys[idx]);
            }
            else {
                assert.equal(found[k], undefined);
                found[k] = true;
            }

            return idx + 1;
        });

        assert.equal(res, keys.length);
    });

    test(`${ prefix } :: GHC_4242 - simple remove`, () => {
        const values = [0,2,5,1,6,4,8,9,7,11,10,3];
        const m0 = values.reduce(
            (acc, i) => insert(i, i, acc),
            mkMap<number, number>(naturalOrdComparator, NumberDict)
        );

        const m1 = remove(0, m0);
        const m2 = remove(1, m1);

        assert.equal(size(m2), values.length - 2);
    });

    removeMin && test(`${ prefix } :: GHC_4242`, () => {
        const values = [0,2,5,1,6,4,8,9,7,11,10,3];
        const m0 = values.reduce(
            (acc, i) => insert(i, i, acc),
            mkMap<number, number>(naturalOrdComparator, NumberDict)
        );

        const [k1, v1, m1] = removeMin(m0);
        const [k2, v2, m2] = removeMin(m1);

        assert.equal(v1, 0);
        assert.equal(k1, 0);
        assert.equal(v2, 1);
        assert.equal(k2, 1);
        assert.equal(size(m2), values.length - 2);
    });

    idRemove && test(`${ prefix } :: same reference when removing nonexistent elements`, () => {
        const emptyMap = emptyStringMap();
        assert.equal(remove('Joe Cocker', emptyMap), emptyMap);

        const [value, map] = unassoc('Joe Cocker', emptyMap);
        assert.equal(map, emptyMap);
        assert.equal(value, undefined);

        const count = Object.keys(testObj).length;
        for (let i = 0; i < count; ++i) {
            const key = generateUniqueKey(testObj);

            assert.equal(remove(key, testMap), testMap);

            const [value, map] = unassoc(key, testMap);
            assert.equal(map, testMap);
            assert.equal(value, undefined);
        }
    });
}
