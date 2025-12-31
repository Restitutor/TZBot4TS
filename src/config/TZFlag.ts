export enum TZFlag {
    ENCRYPT = 'e',
    GUNZIP = 'g',
    MSGPACK = 'p'
}

export namespace TZFlag {
    export function fromValue(value: string): TZFlag | null {
        return (Object.values(TZFlag) as string[]).includes(value) ? (value as TZFlag) : null;
    }
}
