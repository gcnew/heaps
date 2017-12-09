
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
    let hash = 0 | 0;

    for (let i = 0; i < str.length; ++i) {
        hash = Math.imul(hash, 5) + str.charCodeAt(i) | 0;
    }

    return hash;
}

function mkHashEqDict<T>(hash: HashFunc<T>, eq: Eq<T>): HashEqDict<T> {
    return { hash, eq };
}
