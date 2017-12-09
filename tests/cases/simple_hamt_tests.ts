
import { testMap, MapDict } from '../map_suite'

import * as HAMT from '../../src/persistent/simple_hamt'

const Dict: Record<keyof MapDict, any> = {
    mkMap:        (_: any, dict: any) => HAMT.mkTrie(dict),
    singleton:    (key: any, value: any, _: any, dict: any) => HAMT.singleton(key, value, dict),
    isEmpty:      HAMT.isEmpty,
    size:         HAMT.size,
    member:       HAMT.member,
    lookup:       HAMT.lookup,
    insert:       HAMT.insert,
    remove:       HAMT.remove,
    unassoc:      HAMT.unassoc,
    removeMin:    undefined,
    removeMax:    undefined,
    map:          HAMT.map,
    foldr:        HAMT.foldr,
    foldl:        HAMT.foldl
};

testMap(
    'HAMT',
    { hashed: true, ordered: false, idRemove: true },
    Dict
);
