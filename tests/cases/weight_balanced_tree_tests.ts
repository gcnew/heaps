
import { testMap, MapDict } from '../map_suite'

import * as WBT from '../../src/persistent/weight_balanced_tree'

function assertBalanced<F extends Function>(
    f: F,
    extractor: (x: any) => WBT.WeightBalancedTree<any, any> = (x => x)
): F {
    return <any> function() {
        const res  = f.apply(null, arguments);
        const wbt = extractor(res);

        if (!WBT.checkBalanced(wbt)) {
            throw new Error('Imbalance detected');
        }

        return res;
    };
}

const Dict: Record<keyof MapDict, any> = {
    mkMap:        assertBalanced(WBT.mkTree),
    singleton:    assertBalanced(WBT.singleton),
    isEmpty:      WBT.isEmpty,
    size:         WBT.size,
    member:       WBT.member,
    lookup:       WBT.lookup,
    insert:       assertBalanced(WBT.insert),
    remove:       assertBalanced(WBT.remove),
    unassoc:      assertBalanced(WBT.unassoc, x => x[1]),
    removeMin:    assertBalanced(WBT.removeMin, x => x[1]),
    removeMax:    assertBalanced(WBT.removeMax, x => x[1]),
    map:          assertBalanced(WBT.map),
    foldr:        WBT.foldr,
    foldl:        WBT.foldl
};

testMap('WeightBalancedTree', true, Dict);
