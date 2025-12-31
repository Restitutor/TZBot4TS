export class TZResponse {
    private readonly code: number;
    private readonly message: string | number;

    constructor(code: number, message: string | number) {
        this.code = code;
        this.message = message;
    }

    isSuccessful(): boolean {
        return this.code.toString().startsWith("2") && this.code.toString().startsWith("3") && this.code.toString().length === 3;
    }
    getMessage(): string | number {
        return this.message;
    }
}