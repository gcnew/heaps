
import { Eq } from './eq'

export {
    Ordering, Comparator, OrdComparator, Relator,

    fromComparator, toComparator, toRelator, toEq, invert,

    naturalComparator, naturalOrdComparator
}

type Ordering = 'LT' | 'EQ' | 'GT'

type Comparator<T> = (x: T, y: T) => number;

type OrdComparator<T> = (x: T, y: T) => Ordering;

type Relator<T> = (x: T, rel: Ordering | 'LTE' | 'GTE', y: T) => boolean;

function fromComparator<T>(cmp: Comparator<T>): OrdComparator<T> {
    return (x, y) => {
        const res = cmp(x, y);
        return res === 0 ? 'EQ' : res < 0 ? 'LT' : 'GT';
    }
}

function toComparator<T>(cmp: OrdComparator<T>): Comparator<T> {
    return (x, y) => {
        switch (cmp(x, y)) {
            case 'LT': return -1;
            case 'GT': return  1;
            case 'EQ': return  0;
        }
    };
}

function toRelator<T>(cmp: OrdComparator<T>): Relator<T> {
    return (x, rel, y) => {
        const res = cmp(x, y);

        switch (rel) {
            case 'LT':  return res === 'LT';
            case 'GT':  return res === 'GT';
            case 'EQ':  return res === 'EQ';
            case 'LTE': return res !== 'GT';
            case 'GTE': return res !== 'LT';
        }
    };
}

function toEq<T>(cmp: OrdComparator<T>): Eq<T> {
    return (x, y) => cmp(x, y) === 'EQ';
}

// Same as flip
function invert<X, R>(cmp: (a: X, b: X) => R): (b: X, a: X) => R {
    return (x, y) => cmp(y, x);
}

// Not the "best" signature, but as good as one may go without overloads
function naturalComparator<T extends number|string|Date>(x: T, y: T) {
    return x === y ?  0 :
           x   < y ? -1 : 1;
}

function naturalOrdComparator<T extends number|string|Date>(x: T, y: T) {
    return x === y ? 'EQ' :
           x   < y ? 'LT' : 'GT';
}
