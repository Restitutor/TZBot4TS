import {TZData} from "./TZData.js";

export class PingData implements TZData {
    public getRequestType(): string {
        return "PING";
    }
}

export class TimezoneFromIPData implements TZData {
    getRequestType(): string {
        return "TIMEZONE_FROM_IP";
    }

    private readonly ip: string;
    constructor(ip: string) {
        this.ip = ip;
    }
}

export class TimezoneFromUserIDData implements TZData {
    getRequestType(): string {
        return "TIMEZONE_FROM_USERID";
    }

    private readonly userId: string | number;
    constructor(userId: string | number) {
        this.userId = userId;
    }
}

export class TimezoneFromUUIDData implements TZData{
    public getRequestType(): string {
        return "TIMEZONE_FROM_UUID";
    }

    private readonly uuid: string;

    constructor(uuid: string) {
        this.uuid = uuid;
    }
}

export class UserIDFromUUIDData implements TZData {
    getRequestType(): string {
        return "USER_ID_FROM_UUID";
    }

    private readonly uuid: string;
    constructor(uuid: string) {
        this.uuid = uuid;
    }
}

export class UUIDFromUserIDData implements TZData {
    getRequestType(): string {
        return "UUID_FROM_USER_ID";
    }

    private readonly userId: string | number
    constructor(userId: string | number) {
        this.userId = userId;
    }
}