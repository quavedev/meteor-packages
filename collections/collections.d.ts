export function createCollection({ name, schema, collection, helpers, apply, composers, instance: instanceParam, options, }: {
    name?: string;
    schema?: any;
    collection?: any;
    helpers?: any;
    apply?: Function;
    composers?: Array<Function>;
    instance?: Mongo.Collection;
    options?: any;
}): Mongo.Collection;
