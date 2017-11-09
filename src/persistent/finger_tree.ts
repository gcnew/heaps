
export {
    /* (private) Implementation types */
    FT, FT_Empty, FT_Single, FT_Deep,

    One, Two, Three, Four, Digit, SpineNode,

    Split,

    /* Public API */
    FingerTree, MeasureMonoid,

    newTree as mkTree, singleton, mkMeasureMonoidDict,
    isEmpty, cons, snoc, peekLeft, peekRight, popLeft, popRight,
    concat, split, search, splitLeft, splitRight, measure, map, foldr, foldl
}


/* Types */

interface FT_Empty      { kind: 'ft_empty'            }
interface FT_Single<T>  { kind: 'ft_single', value: T }

interface FT_Deep<T, V> {
    kind: 'ft_deep',
    v: V,
    left: Digit<T, V>,
    spine: FT<SpineNode<T, V>, V>,
    right: Digit<T, V>
}

type FT<T, V> = FT_Empty
              | FT_Single<T>
              | FT_Deep<T, V>

interface One<T>      { kind: 'one',                     value: T }
interface Two<T, V>   { kind: 'two',   v: V | undefined, value: T, value2: T }
interface Three<T, V> { kind: 'three', v: V | undefined, value: T, value2: T, value3: T }
interface Four<T, V>  { kind: 'four',  v: V | undefined, value: T, value2: T, value3: T, value4: T }

type Digit<T, V>     = One<T> | Two<T, V> | Three<T, V> | Four<T, V>
type SpineNode<T, V> = Two<T, V> | Three<T, V>

interface MeasureMonoid<T, V> {
    measure: (x: T) => V,

    empty: V,
    append: (x: V, y: V) => V,

    nodeMM: MeasureMonoid<SpineNode<T, V>, V> | undefined
}

interface FingerTree<T, V> {
    mmDict: MeasureMonoid<T, V>,
    tree: FT<T, V>
}

interface Split<T, F> {
    left: F,
    item: T,
    right: F
}

const FT_Empty: FT_Empty = { kind: 'ft_empty' }


/* API */

function mkMeasureMonoidDict<T, V>(measure: (x: T) => V, empty: V, append: (x: V, y: V) => V): MeasureMonoid<T, V> {
    return { measure, empty, append, nodeMM: undefined };
}

function newTree<T, V>(mm: MeasureMonoid<T, V>) {
    return mkTree(FT_Empty, mm);
}

function singleton<T, V>(item: T, mm: MeasureMonoid<T, V>) {
    return mkTree(mkSingle(item), mm);
}

function isEmpty<T, V>(ft: FingerTree<T, V>) {
    return ft.tree.kind === 'ft_empty';
}

function cons<T, V>(value: T, ft: FingerTree<T, V>) {
    return mkTree(consWorker(value, ft.tree, ft.mmDict), ft.mmDict);
}

function snoc<T, V>(value: T, ft: FingerTree<T, V>) {
    return mkTree(snocWorker(value, ft.tree, ft.mmDict), ft.mmDict);
}

function peekLeft<T, V>(ft: FingerTree<T, V>): T | undefined {
    switch (ft.tree.kind) {
        case 'ft_empty':  return undefined;
        case 'ft_single': return ft.tree.value;
        case 'ft_deep':   return peekLeftDigit(ft.tree.left);
    }
}

function peekRight<T, V>(ft: FingerTree<T, V>): T | undefined {
    switch (ft.tree.kind) {
        case 'ft_empty':  return undefined;
        case 'ft_single': return ft.tree.value;
        case 'ft_deep':   return peekRightDigit(ft.tree.right);
    }
}

function popLeft<T, V>(ft: FingerTree<T, V>): [T, FingerTree<T, V>] | undefined {
    return genericPop(ft, popLeftWorker);
}

function popRight<T, V>(ft: FingerTree<T, V>): [T, FingerTree<T, V>] | undefined {
    return genericPop(ft, popRightWorker);
}

function concat<T, V>(ft1: FingerTree<T, V>, ft2: FingerTree<T, V>) {
    return mkTree(concatWorker(ft1.tree, ft2.tree, ft1.mmDict), ft1.mmDict);
}

function split<T, V>(ft: FingerTree<T, V>, pred: (v: V) => boolean): [FingerTree<T, V>, FingerTree<T, V>] {
    if (ft.tree.kind === 'ft_empty') {
        return [ ft, ft ];
    }

    if (!pred(measureTree(ft.tree, ft.mmDict))) {
        return [ ft, mkTree(FT_Empty, ft.mmDict) ];
    }

    const split = splitWorker(ft.tree, ft.mmDict.empty, pred, ft.mmDict);
    return [
        mkTree(split.left, ft.mmDict),
        mkTree(consWorker(split.item, split.right, ft.mmDict), ft.mmDict)
    ];
}

/* Split specialisations */

// `search`, `splitLeft` and `splitRight` are all derivates of `split`, however,
// they have their own specialised implementations for performance reasons.

function search<T, V>(ft: FingerTree<T, V>, pred: (v: V) => boolean): T | undefined {
    if (ft.tree.kind === 'ft_empty') {
        return undefined;
    }

    if (!pred(measureTree(ft.tree, ft.mmDict))) {
        return undefined;
    }

    return searchWorker(ft.tree, ft.mmDict.empty, pred, ft.mmDict)[1];
}

function splitLeft<T, V>(ft: FingerTree<T, V>, pred: (v: V) => boolean): FingerTree<T, V> {
    if (ft.tree.kind === 'ft_empty') {
        return ft;
    }

    if (!pred(measureTree(ft.tree, ft.mmDict))) {
        return ft;
    }

    const split = splitLeftWorker(ft.tree, ft.mmDict.empty, pred, ft.mmDict);
    return mkTree(split[2], ft.mmDict);
}

function splitRight<T, V>(ft: FingerTree<T, V>, pred: (v: V) => boolean): FingerTree<T, V> {
    if (ft.tree.kind === 'ft_empty') {
        return ft;
    }

    if (!pred(measureTree(ft.tree, ft.mmDict))) {
        return mkTree(FT_Empty, ft.mmDict);
    }

    const split = splitRightWorker(ft.tree, ft.mmDict.empty, pred, ft.mmDict);
    return mkTree(consWorker(split[1], split[2], ft.mmDict), ft.mmDict);
}

function measure<T, V>(ft: FingerTree<T, V>) {
    return measureTree(ft.tree, ft.mmDict);
}

function map<A, B, V1, V2>(ft: FingerTree<A, V1>, f: (x: A) => B, mm: MeasureMonoid<B, V2>): FingerTree<B, V2> {
    return mkTree(mapWorker(ft.tree, f, mm), mm);
}

function foldr<A, B, V>(ft: FingerTree<A, V>, initial: B, f: (x: A, acc: B) => B): B {
    return foldrWorker(ft.tree, initial, f);
}

function foldl<A, B, V>(ft: FingerTree<A, V>, initial: B, f: (acc: B, x: A) => B): B {
    return foldlWorker(ft.tree, initial, f);
}


/* Workers */

function consWorker<T, V>(value: T, tree: FT<T, V>, mm: MeasureMonoid<T, V>): FT<T, V> {
    switch (tree.kind) {
        case 'ft_empty':  return mkSingle(value);
        case 'ft_single': return mkDeep(mkOne(value), FT_Empty, mkOne(tree.value), mm);

        case 'ft_deep': {
            if (tree.left.kind !== 'four') {
                return mkDeep(unshiftLeft(value, tree.left), tree.spine, tree.right, mm);
            }

            return mkDeep(
                mkTwo(value, peekLeftDigit(tree.left)),
                consWorker(slice3Right(tree.left), tree.spine, getNodeMM(mm)),
                tree.right,
                mm
            );
        }
    }
}

function snocWorker<T, V>(value: T, tree: FT<T, V>, mm: MeasureMonoid<T, V>): FT<T, V> {
    switch (tree.kind) {
        case 'ft_empty':  return mkSingle(value);
        case 'ft_single': return mkDeep(mkOne(tree.value), FT_Empty, mkOne(value), mm);

        case 'ft_deep': {
            if (tree.right.kind !== 'four') {
                return mkDeep(tree.left, tree.spine, unshiftRight(value, tree.right), mm);
            }

            return mkDeep(
                tree.left,
                snocWorker(slice3Left(tree.right), tree.spine, getNodeMM(mm)),
                mkTwo(peekRightDigit(tree.right), value),
                mm
            );
        }
    }
}

function genericPop<T, V>(
    ft: FingerTree<T, V>,
    helper: (tree: FT_Single<T> | FT_Deep<T, V>, mm: MeasureMonoid<T, V>) => [T, FT<T, V>]
): [T, FingerTree<T, V>] | undefined {
    if (ft.tree.kind === 'ft_empty') {
        return undefined;
    }

    const [item, tree] = helper(ft.tree, ft.mmDict);
    return [ item, mkTree(tree, ft.mmDict) ];
}

function popLeftWorker<T, V>(tree: FT_Single<T> | FT_Deep<T, V>, mm: MeasureMonoid<T, V>): [T, FT<T, V>] {
    switch (tree.kind) {
        case 'ft_single': return [ tree.value, FT_Empty ];

        case 'ft_deep': {
            const item = peekLeftDigit(tree.left);

            if (tree.left.kind !== 'one') {
                const newTree = mkDeep(shiftLeft(tree.left), tree.spine, tree.right, mm);
                return [ item, newTree ];
            }

            if (tree.spine.kind === 'ft_empty') {
                const newTree = digitToTree(tree.right, mm);
                return [ item, newTree ];
            }

            const [left, spine] = popLeftWorker(tree.spine, getNodeMM(mm));
            return [ item, mkDeep(left, spine, tree.right, mm) ];
        }
    }
}

function popRightWorker<T, V>(tree: FT_Single<T> | FT_Deep<T, V>, mm: MeasureMonoid<T, V>): [T, FT<T, V>] {
    switch (tree.kind) {
        case 'ft_single': return [ tree.value, FT_Empty ];

        case 'ft_deep': {
            const item = peekRightDigit(tree.right);

            if (tree.right.kind !== 'one') {
                const newTree = mkDeep(shiftRight(tree.right), tree.spine, tree.right, mm);
                return [ item, newTree ];
            }

            if (tree.spine.kind === 'ft_empty') {
                const newTree = digitToTree(tree.left, mm);
                return [ item, newTree ];
            }

            const [right, spine] = popRightWorker(tree.spine, getNodeMM(mm));
            return [ item, mkDeep(tree.left, spine, right, mm) ];
        }
    }
}

function concatWorker<T, V>(t1: FT<T, V>, t2: FT<T, V>, mm: MeasureMonoid<T, V>) {
    if (t1.kind === 'ft_empty') return t2;
    if (t2.kind === 'ft_empty') return t1;

    if (t1.kind === 'ft_single') return consWorker(t1.value, t2, mm);
    if (t2.kind === 'ft_single') return snocWorker(t2.value, t1, mm);

    const newSpine = concatGo(t1.spine, concatDigits(t1.right, t2.left), t2.spine, getNodeMM(mm));
    return mkDeep(t1.left, newSpine, t2.right, mm);
}

function concatGo<T, V>(t1: FT<T, V>, extra: T[], t2: FT<T, V>, mm: MeasureMonoid<T, V>): FT<T, V> {
    if (t1.kind === 'ft_empty') {
        return extra.reduceRight((acc, x) => consWorker(x, acc, mm), t2);
    }

    if (t2.kind === 'ft_empty') {
        return extra.reduce((acc, x) => snocWorker(x, acc, mm), t1 as FT<T, V>); // TYH
    }

    if (t1.kind === 'ft_single') {
        return consWorker(t1.value, extra.reduceRight((acc, x) => consWorker(x, acc, mm), t2 as FT<T, V>), mm); // TYH
    }

    if (t2.kind === 'ft_single') {
        return consWorker(t2.value, extra.reduce((acc, x) => snocWorker(x, acc, mm), t1 as FT<T, V>), mm); // TYH
    }

    // INFO: this can be unrolled, but it's quite long, unreadble and ugly
    const left = digitToList(t1.right);
    const right = digitToList(t2.left);
    const newSpine = concatGo(t1.spine, mkNodes(left.concat(extra, right)), t2.spine, getNodeMM(mm));

    return mkDeep(t1.left, newSpine, t2.right, mm);
}

function mkNodes<T, V>(xs: T[]): SpineNode<T, V>[] {
    let offset = 0;
    const retval: SpineNode<T, V>[] = [];

    while (true) {
        if (xs.length > offset + 4) {
            retval.push(mkThree(xs[offset], xs[offset + 1], xs[offset + 2]));
            offset += 3;
            continue;
        }

        if (xs.length === offset + 2) {
            retval.push(mkTwo(xs[offset], xs[offset + 1]));
        }
        else if (xs.length === offset + 3) {
            retval.push(mkThree(xs[offset], xs[offset + 1], xs[offset + 2]));
        }
        else if (xs.length === offset + 4) {
            retval.push(mkTwo(xs[offset + 0], xs[offset + 1]));
            retval.push(mkTwo(xs[offset + 3], xs[offset + 4]));
        }

        return retval;
    }
}

function concatDigits<T, V>(d1: Digit<T, V>, d2: Digit<T, V>): SpineNode<T, V>[] {
    switch (d1.kind) {
        case 'one': {
            switch (d2.kind) {
                case 'one':   return [ mkTwo(d1.value, d2.value) ];
                case 'two':   return [ mkThree(d1.value, d2.value, d2.value2) ];
                case 'three': return [ mkTwo(d1.value, d2.value), mkTwo(d2.value2, d2.value3) ];
                case 'four':  return [ mkThree(d1.value, d2.value, d2.value2), mkTwo(d2.value3, d2.value4) ];
            }

            return assertNever(d2);
        }

        case 'two': {
            // TODO: can share more: 2-3, 2-4
            switch (d2.kind) {
                case 'one':   return [ mkThree(d1.value, d1.value2, d2.value) ];
                case 'two':   return [ d1, d2 ];
                case 'three': return [ mkThree(d1.value, d1.value2, d2.value), mkTwo(d2.value2, d2.value3) ];
                case 'four':  return [ mkThree(d1.value, d1.value2, d2.value), mkThree(d2.value2, d2.value3, d2.value4) ];
            }

            return assertNever(d2);
        }

        case 'three': {
            switch (d2.kind) {
                case 'one':   return [ mkTwo(d1.value, d1.value2), mkTwo(d1.value3, d2.value) ];
                case 'two':   return [ d1, d2 ];
                case 'three': return [ d1, d2 ];
                case 'four':  return [ d1, mkTwo(d2.value, d2.value2), mkTwo(d2.value3, d2.value4) ];
            }

            return assertNever(d2);
        }

        case 'four': {
            // TODO: can share more: 4-2, 4-3
            switch (d2.kind) {
                case 'one':   return [ mkThree(d1.value, d1.value2, d1.value3), mkTwo(d1.value4, d2.value) ];
                case 'two':   return [ mkThree(d1.value, d1.value2, d1.value3), mkThree(d1.value4, d2.value, d2.value2) ];
                case 'three': return [ mkThree(d1.value, d1.value2, d1.value3), mkTwo(d1.value4, d2.value), mkTwo(d2.value2, d2.value3) ];
                case 'four':  return [ mkThree(d1.value, d1.value2, d1.value3), mkThree(d1.value4, d2.value, d2.value2), mkTwo(d2.value3, d2.value4) ];
            }

            return assertNever(d2);
        }
    }
}

function splitWorker<T, V>(tree: FT_Single<T> | FT_Deep<T, V>, v: V, p: (v: V) => boolean, mm: MeasureMonoid<T, V>): Split<T, FT<T, V>> {
    if (tree.kind === 'ft_single') {
        return mkSplit(FT_Empty, tree.value, FT_Empty);
    }

    const vl = mm.append(v, measureDigit(tree.left, mm));
    if (p(vl)) {
        const split = splitDigit(tree.left, v, p, mm);
        const left = split.left ? digitToTree(split.left, mm) : FT_Empty

        return mkSplit(left, split.item, mkDeepL(split.right, tree.spine, tree.right, mm));
    }

    const vlm = mm.append(vl, measureTree(tree.spine, getNodeMM(mm)));
    if (p(vlm)) {
        if (tree.spine.kind === 'ft_empty') {
            throw new Error('Bad Measure/Monoid');
        }

        const spineSplit = splitWorker(tree.spine, vl, p, getNodeMM(mm));

        const vli = mm.append(vl, measureTree(spineSplit.left, getNodeMM(mm)));
        const itemSplit = splitDigit(spineSplit.item, vli, p, mm);

        return mkSplit<T, FT<T, V>>(
            mkDeepR(tree.left, spineSplit.left, itemSplit.left, mm),
            itemSplit.item,
            mkDeepL(itemSplit.right, spineSplit.right, tree.right, mm)
        );
    }

    const split = splitDigit(tree.right, vlm, p, mm);
    const right = split.right ? digitToTree(split.right, mm) : FT_Empty;

    return mkSplit(mkDeepR(tree.left, tree.spine, split.left, mm), split.item, right);
}

function splitDigit<T, V>(
    d: Digit<T, V>,
    v: V,
    p: (v: V) => boolean,
    mm: MeasureMonoid<T, V>
): Split<T, One<T> | Two<T, V> | Three<T, V> | undefined> {
    switch (d.kind) {
        case 'one': return mkSplit(undefined, d.value, undefined);

        case 'two': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return mkSplit(undefined, d.value, mkOne(d.value2));
            }

            return mkSplit(mkOne(d.value), d.value2, undefined);
        }

        case 'three': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return mkSplit(undefined, d.value, mkTwo<T, V>(d.value2, d.value3)); //TYH
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return mkSplit(mkOne(d.value), d.value2, mkOne(d.value3));
            }

            return mkSplit(mkTwo(d.value, d.value2), d.value3, undefined);
        }

        case 'four': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return mkSplit(undefined, d.value, mkThree<T, V>(d.value2, d.value3, d.value4)); //TYH
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return mkSplit<T, One<T>|Two<T, V>>(mkOne(d.value), d.value2, mkTwo(d.value3, d.value4)); //TYH
            }

            const v123 = mm.append(v12, mm.measure(d.value3));
            if (p(v123)) {
                return mkSplit<T, One<T>|Two<T, V>>(mkTwo(d.value, d.value2), d.value3, mkOne(d.value4)); //TYH
            }

            return mkSplit(mkThree(d.value, d.value2, d.value3), d.value4, undefined);
        }
    }
}

/* Split specialisations */

function searchWorker<T, V>(tree: FT_Single<T> | FT_Deep<T, V>, v: V, p: (v: V) => boolean, mm: MeasureMonoid<T, V>): [V, T] {
    if (tree.kind === 'ft_single') {
        return [ v, tree.value ];
    }

    const vl = mm.append(v, measureDigit(tree.left, mm));
    if (p(vl)) {
        return searchDigit(tree.left, v, p, mm);
    }

    const vlm = mm.append(vl, measureTree(tree.spine, getNodeMM(mm)));
    if (p(vlm)) {
        if (tree.spine.kind === 'ft_empty') {
            throw new Error('Bad Measure/Monoid');
        }

        const [vlTree, spineDigit] = searchWorker(tree.spine, vl, p, getNodeMM(mm));
        return searchDigit(spineDigit, vlTree, p, mm);
    }

    return searchDigit(tree.right, vlm, p, mm);
}

function searchDigit<T, V>(d: Digit<T, V>, v: V, p: (v: V) => boolean, mm: MeasureMonoid<T, V>): [V, T] {
    switch (d.kind) {
        case 'one': return [v, d.value];

        case 'two': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value];
            }

            return [v1, d.value2];
        }

        case 'three': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value];
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return [v1, d.value2];
            }

            return [v12, d.value3];
        }

        case 'four': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value];
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return [v1, d.value2];
            }

            const v123 = mm.append(v12, mm.measure(d.value3));
            if (p(v123)) {
                return [v12, d.value3];
            }

            return [v123, d.value4];
        }
    }
}

function splitLeftWorker<T, V>(
    tree: FT_Single<T> | FT_Deep<T, V>,
    v: V,
    p: (v: V) => boolean,
    mm: MeasureMonoid<T, V>
): [V, T, FT<T, V>] {
    if (tree.kind === 'ft_single') {
        return [v, tree.value, FT_Empty];
    }

    const vl = mm.append(v, measureDigit(tree.left, mm));
    if (p(vl)) {
        const split = splitDigitLeft(tree.left, v, p, mm);
        const left = split[2] ? digitToTree(split[2]!, mm) : FT_Empty; // TYH

        return [ split[0], split[1], left ];
    }

    const vlm = mm.append(vl, measureTree(tree.spine, getNodeMM(mm)));
    if (p(vlm)) {
        if (tree.spine.kind === 'ft_empty') {
            throw new Error('Bad Measure/Monoid');
        }

        const spineSplit = splitLeftWorker(tree.spine, vl, p, getNodeMM(mm));
        const itemSplit = splitDigitLeft(spineSplit[1], spineSplit[0], p, mm);

        return [itemSplit[0], itemSplit[1], mkDeepR(tree.left, spineSplit[2], itemSplit[2], mm)];
    }

    const split = splitDigitLeft(tree.right, vlm, p, mm);
    return [ split[0], split[1], mkDeepR(tree.left, tree.spine, split[2], mm) ];
}

function splitDigitLeft<T, V>(
    d: Digit<T, V>,
    v: V,
    p: (v: V) => boolean,
    mm: MeasureMonoid<T, V>
): [V, T, One<T> | Two<T, V> | Three<T, V> | undefined] {
    switch (d.kind) {
        case 'one': return [v, d.value, undefined];

        case 'two': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value, undefined];
            }

            return [v1, d.value2, mkOne(d.value)];
        }

        case 'three': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value, undefined];
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return [v1, d.value2, mkOne(d.value)]
            }

            return [v12, d.value3, mkTwo(d.value, d.value2)];
        }

        case 'four': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value, undefined];
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return [v1, d.value2, mkOne(d.value)];
            }

            const v123 = mm.append(v12, mm.measure(d.value3));
            if (p(v123)) {
                return [v12, d.value3, mkTwo(d.value, d.value2)];
            }

            return [v123, d.value4, mkThree(d.value, d.value2, d.value3)];
        }
    }
}

function splitRightWorker<T, V>(
    tree: FT_Single<T> | FT_Deep<T, V>,
    v: V,
    p: (v: V) => boolean,
    mm: MeasureMonoid<T, V>
): [V, T, FT<T, V>] {
    if (tree.kind === 'ft_single') {
        return [v, tree.value, FT_Empty];
    }

    const vl = mm.append(v, measureDigit(tree.left, mm));
    if (p(vl)) {
        const split = splitDigitRight(tree.left, v, p, mm);
        return [ split[0], split[1], mkDeepL(split[2], tree.spine, tree.right, mm) ];
    }

    const vlm = mm.append(vl, measureTree(tree.spine, getNodeMM(mm)));
    if (p(vlm)) {
        if (tree.spine.kind === 'ft_empty') {
            throw new Error('Bad Measure/Monoid');
        }

        const spineSplit = splitRightWorker(tree.spine, vl, p, getNodeMM(mm));
        const itemSplit = splitDigitRight(spineSplit[1], spineSplit[0], p, mm);

        return [itemSplit[0], itemSplit[1], mkDeepL(itemSplit[2], spineSplit[2], tree.right, mm)];
    }

    const split = splitDigitRight(tree.right, vlm, p, mm);
    const right = split[2] ? digitToTree(split[2]!, mm) : FT_Empty; // TYH

    return [split[0], split[1], right];
}

function splitDigitRight<T, V>(
    d: Digit<T, V>,
    v: V,
    p: (v: V) => boolean,
    mm: MeasureMonoid<T, V>
): [V, T, One<T> | Two<T, V> | Three<T, V> | undefined] {
    switch (d.kind) {
        case 'one': return [v, d.value, undefined];

        case 'two': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value, mkOne(d.value2)];
            }

            return [v1, d.value2, undefined];
        }

        case 'three': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value, mkTwo(d.value2, d.value3)];
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return [v1, d.value2, mkOne(d.value3)]
            }

            return [v12, d.value3, undefined];
        }

        case 'four': {
            const v1 = mm.append(v, mm.measure(d.value));
            if (p(v1)) {
                return [v, d.value, mkThree(d.value2, d.value3, d.value4)];
            }

            const v12 = mm.append(v1, mm.measure(d.value2));
            if (p(v12)) {
                return [v1, d.value2, mkTwo(d.value3, d.value4)];
            }

            const v123 = mm.append(v12, mm.measure(d.value3));
            if (p(v123)) {
                return [v12, d.value3, mkOne(d.value4)];
            }

            return [v123, d.value4, undefined];
        }
    }
}

/* Mapping & Folding */

function mapWorker<A, B, V1, V2>(tree: FT<A, V1>, f: (x: A) => B, mm: MeasureMonoid<B, V2>): FT<B, V2> {
    switch (tree.kind) {
        case 'ft_empty':  return FT_Empty;
        case 'ft_single': return mkSingle(f(tree.value));

        case 'ft_deep': {
            return mkDeep(
                mapDigit(tree.left, f),
                mapWorker(tree.spine, d => mapDigit(d, f) as SpineNode<B, V2>, getNodeMM(mm)),
                mapDigit(tree.right, f),
                mm
            );
        }
    }
}

function mapDigit<A, B, V1, V2>(d: Digit<A, V1>, f: (x: A) => B): Digit<B, V2> {
    switch (d.kind) {
        case 'one':   return mkOne(f(d.value));
        case 'two':   return mkTwo(f(d.value), f(d.value2));
        case 'three': return mkThree(f(d.value), f(d.value2), f(d.value3));
        case 'four':  return mkFour(f(d.value), f(d.value2), f(d.value3), f(d.value4));
    }
}

function foldrWorker<A, B, V>(tree: FT<A, V>, init: B, f: (x: A, acc: B) => B): B {
    switch (tree.kind) {
        case 'ft_empty':  return init;
        case 'ft_single': return f(tree.value, init);

        case 'ft_deep': {
            const r = foldrDigit(tree.right, init, f);
            const m = foldrWorker(tree.spine, r, (d, acc) => foldrDigit(d, acc, f));

            return foldrDigit(tree.left, m, f);
        }
    }
}

function foldrDigit<A, B, V>(d: Digit<A, V>, init: B, f: (x: A, acc: B) => B): B {
    switch (d.kind) {
        case 'one':   return f(d.value, init);
        case 'two':   return f(d.value, f(d.value2, init));
        case 'three': return f(d.value, f(d.value2, f(d.value3, init)));
        case 'four':  return f(d.value, f(d.value2, f(d.value3, f(d.value4, init))));
    }
}

function foldlWorker<A, B, V>(tree: FT<A, V>, init: B, f: (acc: B, x: A) => B): B {
    switch (tree.kind) {
        case 'ft_empty':  return init;
        case 'ft_single': return f(init, tree.value);

        case 'ft_deep': {
            const l = foldlDigit(tree.left, init, f);
            const m = foldlWorker(tree.spine, l, (acc, d) => foldlDigit(d, acc, f));

            return foldlDigit(tree.right, m, f);
        }
    }
}

function foldlDigit<A, B, V>(d: Digit<A, V>, init: B, f: (acc: B, x: A) => B): B {
    switch (d.kind) {
        case 'one':   return f(init, d.value);
        case 'two':   return f(f(init, d.value), d.value2);
        case 'three': return f(f(f(init, d.value), d.value2), d.value3);
        case 'four':  return f(f(f(f(init, d.value), d.value2), d.value3), d.value4);
    }
}


/* Helpers */

function peekLeftDigit<T, V>(d: Digit<T, V>) {
    return d.value;
}

function shiftLeft<T, V>(d: Two<T, V> | Three<T, V> | Four<T, V>) {
    switch (d.kind) {
        case 'two':   return mkOne(d.value2);
        case 'three': return mkTwo<T, V>(d.value2, d.value3);
        case 'four':  return mkThree<T, V>(d.value2, d.value3, d.value4);
    }
}

function unshiftLeft<T, V>(value: T, d: One<T> | Two<T, V> | Three<T, V>) {
    switch (d.kind) {
        case 'one':   return mkTwo<T, V>(value, d.value);
        case 'two':   return mkThree<T, V>(value, d.value, d.value2);
        case 'three': return mkFour<T, V>(value, d.value, d.value2, d.value3);
    }
}

function slice3Left<T, V>(d: Four<T, V>) {
    return mkThree<T, V>(d.value, d.value2, d.value3);
}

function peekRightDigit<T, V>(d: Digit<T, V>) {
    switch (d.kind) {
        case 'one':   return d.value;
        case 'two':   return d.value2;
        case 'three': return d.value3;
        case 'four':  return d.value4;
    }
}

function shiftRight<T, V>(d: Two<T, V> | Three<T, V> | Four<T, V>) {
    switch (d.kind) {
        case 'two':   return mkOne(d.value);
        case 'three': return mkTwo<T, V>(d.value, d.value2);
        case 'four':  return mkThree<T, V>(d.value, d.value2, d.value3);
    }
}

function unshiftRight<T, V>(value: T, d: One<T> | Two<T, V> | Three<T, V>) {
    switch (d.kind) {
        case 'one':   return mkTwo<T, V>(d.value, value);
        case 'two':   return mkThree<T, V>(d.value, d.value2, value);
        case 'three': return mkFour<T, V>(d.value, d.value2, d.value3, value);
    }
}

function slice3Right<T, V>(d: Four<T, V>) {
    return mkThree<T, V>(d.value2, d.value3, d.value4);
}

function digitToTree<T, V>(d: Digit<T, V>, mm: MeasureMonoid<T, V>): FT_Single<T> | FT_Deep<T, V> {
    switch (d.kind) {
        case 'one':   return mkSingle(d.value);
        case 'two':   return mkDeep(mkOne(d.value), FT_Empty, mkOne(d.value2), mm);
        case 'three': return mkDeep(mkTwo(d.value, d.value2), FT_Empty, mkOne(d.value3), mm);
        case 'four':  return mkDeep(mkTwo(d.value, d.value2), FT_Empty, mkTwo(d.value3, d.value4), mm);
    }
}

function digitToList<T, V>(d: Digit<T, V>) {
    switch (d.kind) {
        case 'one':   return [ d.value ];
        case 'two':   return [ d.value, d.value2 ];
        case 'three': return [ d.value, d.value2, d.value3 ];
        case 'four':  return [ d.value, d.value2, d.value3, d.value4 ];
    }
}


/* Measurement */

function measureDigit<T, V>(d: Digit<T, V>, mmDict: MeasureMonoid<T, V>): V {
    if (d.kind === 'one') {
        return mmDict.measure(d.value);
    }

    return d.v || (d.v = measureDigitWorker(d, mmDict));
}

function measureDigitWorker<T, V>(d: Two<T, V> | Three<T, V> | Four<T, V>, mm: MeasureMonoid<T, V>): V {
    switch (d.kind) {
        case 'two':
            return mm.append(mm.measure(d.value), mm.measure(d.value2));

        case 'three':
            return mm.append(mm.append(mm.measure(d.value), mm.measure(d.value2)), mm.measure(d.value3));

        case 'four':
            return mm.append(mm.append(mm.append(mm.measure(d.value), mm.measure(d.value2)), mm.measure(d.value3)), mm.measure(d.value4));
    }
}

function measureTree<T, V>(tree: FT<T, V>, mm: MeasureMonoid<T, V>) {
    switch (tree.kind) {
        case 'ft_empty':  return mm.empty;
        case 'ft_single': return mm.measure(tree.value);

        case 'ft_deep': {
            return mm.append(
                mm.append(measureDigit(tree.left, mm), tree.v),
                measureDigit(tree.right, mm)
          );
        }
    }
}

function getNodeMM<T, V>(mm: MeasureMonoid<T, V>) {
    return mm.nodeMM
        || (mm.nodeMM = mkMeasureMonoidDict(value => measureDigit(value, mm), mm.empty, mm.append));
}


/* Constructors */

function mkOne<T>(value: T): One<T> {
    return { kind: 'one', value };
}

function mkTwo<T, V>(value: T, value2: T): Two<T, V> {
    return { kind: 'two', v: undefined, value, value2 };
}

function mkThree<T, V>(value: T, value2: T, value3: T): Three<T, V> {
    return { kind: 'three', v: undefined, value, value2, value3 };
}

function mkFour<T, V>(value: T, value2: T, value3: T, value4: T): Four<T, V> {
    return { kind: 'four', v: undefined, value, value2, value3, value4 };
}

function mkTree<T, V>(tree: FT<T, V>, mm: MeasureMonoid<T, V>): FingerTree<T, V> {
    return { tree, mmDict: mm };
}

function mkSplit<T, F>(left: F, item: T, right: F): Split<T, F> {
    return { left, item, right };
}

function mkSingle<T>(value: T): FT_Single<T> {
    return { kind: 'ft_single', value };
}

function mkDeep<T, V>(left: Digit<T, V>, spine: FT<SpineNode<T, V>, V>, right: Digit<T, V>, mm: MeasureMonoid<T, V>): FT_Deep<T, V> {
    const sv = measureTree(spine, getNodeMM(mm));
    const v = mm.append(
        mm.append(measureDigit(left, mm), sv),
        measureDigit(right, mm)
    );

    return { kind: 'ft_deep', v, left, spine, right };
}

function mkDeepL<T, V>(
    left: Digit<T, V> | undefined,
    spine: FT<SpineNode<T, V>, V>,
    right: Digit<T, V>,
    mm: MeasureMonoid<T, V>
): FT_Single<T> | FT_Deep<T, V> {
    if (!left) {
        if (spine.kind === 'ft_empty') {
            return digitToTree(right, mm);
        }

        const [newLeft, newSpine] = popLeftWorker(spine, getNodeMM(mm));
        return mkDeep(newLeft, newSpine, right, mm);
    }

    return mkDeep(left, spine, right, mm);
}

function mkDeepR<T, V>(
    left: Digit<T, V>,
    spine: FT<SpineNode<T, V>, V>,
    right: Digit<T, V> | undefined,
    mm: MeasureMonoid<T, V>
): FT_Single<T> | FT_Deep<T, V> {
    if (!right) {
        if (spine.kind === 'ft_empty') {
            return digitToTree(left, mm);
        }

        const [newRight, newSpine] = popRightWorker(spine, getNodeMM(mm));
        return mkDeep(left, newSpine, newRight, mm);
    }

    return mkDeep(left, spine, right, mm);
}


/* Utilities */

function assertNever(x: never): never {
    throw new Error(`Not a never: ${ x }`);
}
