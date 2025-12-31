import {TZData} from "./data/TZData.js";

export class TZRequest {
    private readonly requestType: string;
    private apiKey: string;
    private readonly data: TZData;

    constructor(data: TZData) {
        this.requestType = data.getRequestType();
        this.apiKey = "";
        this.data = data;
    }

    setAPIKey(apiKey: string) {
        this.apiKey = apiKey;
    }
}