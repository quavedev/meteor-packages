export function persistable({ beforeInsert, beforeUpdate }?: {
    beforeInsert?: Function;
    beforeUpdate?: Function;
}): Function;
