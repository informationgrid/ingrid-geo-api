export function throwHttpError(status: string | number, msg: string): never {
    throw new Error(msg, { cause: status });
}