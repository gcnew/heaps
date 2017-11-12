
import { OrdComparator, toComparator } from '../src/ordering'

export {
    numComp, numOrdCmp, mkRandomArray, replicate
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
