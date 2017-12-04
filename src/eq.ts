
export {
    Eq,

    strictEq, coercingEq, invert
}

type Eq<T> = (x: T, y: T) => boolean;

function strictEq<T>(x: T, y: T): boolean {
    return x === y;
}

function coercingEq<T>(x: T, y: T): boolean {
    return x == y;
}

function invert<T>(eq: Eq<T>): Eq<T> {
    return (x, y) => !eq(x, y);
}
