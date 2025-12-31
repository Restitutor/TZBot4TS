export class TZResponse {
    private readonly code: number;
    private readonly message: string | number;

    constructor(code: number, message: string | number) {
        this.code = code;
        this.message = message;
    }

    isSuccessful(): boolean {
        const sCode = this.code.toString();
        return (sCode.startsWith("2") || sCode.startsWith("3")) && sCode.length === 3;
    }
    getMessage(): string | number {
        return this.message;
    }

    static fromJSON(json: any): TZResponse {
        return new TZResponse(json.code, json.message);
    }
}