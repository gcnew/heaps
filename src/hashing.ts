
import { Eq } from './eq'

export {
    HashFunc, HashEqDict,

    stringHash, mkHashEqDict
}

type HashFunc<T> = (x: T) => number;

type HashEqDict<T> = {
    hash: HashFunc<T>,
    eq: Eq<T>
}

function stringHash(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; ++i) {
        hash = hash * 31 + str.charCodeAt(i);
    }

    return hash & 0x0FFFFFFFF;
}

function mkHashEqDict<T>(hash: HashFunc<T>, eq: Eq<T>): HashEqDict<T> {
    return { hash, eq };
}
