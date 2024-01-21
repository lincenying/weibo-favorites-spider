/**
 * Null 或者 Undefined 或者 T
 */
declare type Nullable<T> = T | null | undefined
/**
 * 数组<T> 或者 T
 */
declare type Arrayable<T> = T | T[]
/**
 * 键为字符串, 值为 Any 的对象
 */
declare type Obj = Record<string, any>
/**
 * 键为字符串, 值为 T 的对象
 */
declare type ObjT<T> = Record<string, T>
/**
 * Function
 */
declare type Fn<T = void> = () => T
/**
 * 任意函数
 */
declare type AnyFn<T = any> = (...args: any[]) => T
/**
 * Promise, or maybe not
 */
declare type Awaitable<T> = T | PromiseLike<T>
