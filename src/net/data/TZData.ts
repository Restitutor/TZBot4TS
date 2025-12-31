export type RequestType =
    | "PING"
    | "TIMEZONE_FROM_IP"
    | "TIMEZONE_FROM_USERID"
    | "TIMEZONE_FROM_UUID"
    | "USER_ID_FROM_UUID"
    | "UUID_FROM_USER_ID"

export interface TZData {
    getRequestType(): RequestType;
}