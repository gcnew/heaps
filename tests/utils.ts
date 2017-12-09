
import { toComparator } from '../src/ordering'

export {
    numComp, numOrdCmp, mkRandomArray, replicate, inplaceShuffle, assertFail
}


const numComp = toComparator(numOrdCmp);

function numOrdCmp(x: number, y: number) {
    return x < y ? 'LT' :
           x > y ? 'GT' : 'EQ';
}

function mkRandomArray(length: number, randRange = 1000) {
    const retval = [];

    for (let i = length; i > 0; --i) {
        retval.push((Math.random() * randRange) | 0);
    }

    return retval;
}

function replicate<T>(x: T, n: number) {
    const retval = [];

    for (; n > 0; --n) {
        retval.push(x);
    }

    return retval;
}

// see https://stackoverflow.com/a/12646864
function inplaceShuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.random() * (i + 1) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function assertFail(): never {
    throw new Error('assert: fail');
}
