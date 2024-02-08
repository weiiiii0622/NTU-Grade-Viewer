// Reference: https://github.com/type-challenges/type-challenges

type NoInfer<T> = [T][T extends any?0:never]

/* ------------------------------ Type Checking ----------------------------- */

export type Expect<T extends true> = T;
export type ExpectTrue<T extends true> = T;
export type ExpectFalse<T extends false> = T;
export type IsTrue<T extends true> = T;
export type IsFalse<T extends false> = T;

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
   ? true
   : false;
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

/* ---------------------------------- Union --------------------------------- */

/**
 * Union to intersection/tuple (https://tsch.js.org/730/solutions)
 */

// 1. When `extends` a function, `arg` will be `&`
type A1 = ((arg: 1 | 2) => 0) | ((arg: 2 | 3) => 0) extends (arg: infer I) => 0 ? I : "never";
// A1 = 2

// 2. The type of overloading function is intersection
function f(arg: "a"): 1;
function f(arg: "b"): 2;
function f() {
   return 1;
}
type A2 = ((arg: "a") => 1) & ((arg: "b") => 2) extends typeof f ? true : false;
// A2 = true
// * Note that it is not args being &, but the function itself.

// 3. When `infer` the return type of an ovlerloading function, the last one will be inferred
type A3 = ReturnType<typeof f>;
// A3 = 2

// * Solution
// First convert to intersection of functions whose return type is one of U, then append to a tuple.
type UnionToIntersection<U> = (U extends U ? (arg: U) => 0 : "never1") extends (arg: infer I) => 0
   ? I
   : "never2";
type GetLast<U> = UnionToIntersection<U extends U ? () => U : "never3"> extends () => infer R
   ? R
   : "never4";
type UnionToTuple<U, L = GetLast<U>> = [U] extends [never]
   ? []
   : [...UnionToTuple<Exclude<U, L>>, L];

export type { UnionToTuple };

/**
 * Object to tuple
 */

export type ObjectToEntriesTuple<T extends {}, K = keyof T> = UnionToTuple<
   K extends keyof T ? [K, T[K]] : never
>;

/**
 * Index Union
 */

type IndexFromTuple<T, K> = T extends [infer F, ...infer R]
   ? (K extends keyof F ? F[K] : never) | IndexFromTuple<R, K>
   : never;

type IndexFromUnion<U, K> = IndexFromTuple<UnionToTuple<U>, K>;

export type { IndexFromTuple, IndexFromUnion };

type IndexFromTupleWithUnionKey<T, K, _K = K> = _K extends _K
   ? T extends [infer F, ...infer R]
      ? (_K extends keyof F ? F[_K] : never) | IndexFromTupleWithUnionKey<R, K>
      : never
   : [_K];
type IndexFromUnionWithUnionKey<U, K> = IndexFromTupleWithUnionKey<UnionToTuple<U>, K>;

export type { IndexFromTupleWithUnionKey, IndexFromUnionWithUnionKey };

/**
 * Join strings
 */

type JoinStringTuple<S extends readonly string[], D extends string, IsFirst = true> = S extends [
   infer F extends string,
   ...infer R extends string[]
]
   ? `${IsFirst extends true ? "" : D}${F}${JoinStringTuple<R, D, false>}`
   : "";

type JoinStringUnion<U extends string, D extends string, S = UnionToTuple<U>> = S extends string[]
   ? JoinStringTuple<S, D>
   : "never";

/**
 * URL Params
 */

// type StringToUnion<S extends string> = S extends `${infer F}${infer R}`
//     ? F | StringToUnion<R>
//     : never;

type DictParamsToURL<P extends Record<string, string>, K = keyof P> = [K] extends [never]
   ? ""
   : `?${JoinStringUnion<
        K extends keyof P & string ? JoinStringTuple<[K, P[K]], "="> : never,
        "&"
     >}`;

type UnionParamsToURL<P extends string> = [P] extends [never]
   ? ""
   : DictParamsToURL<{ [K in P]: string }>;

/**
 * Class
 */

type ClassMethod<T, P = T[keyof T]> = P extends (...args: any) => void ? P : never;
type ClassMethodName<T, K = keyof T> = K extends keyof T
   ? T[K] extends (...args: any) => void
      ? K
      : never
   : "never";

export type { ClassMethod, ClassMethodName };
