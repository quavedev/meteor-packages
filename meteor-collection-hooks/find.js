import { CollectionHooks } from './collection-hooks';

/**
 * With Meteor v3 this behaves differently than with Meteor v2.
 * We cannot use async hooks on find() directly because in Meteor it is a sync method that returns cursor instance.
 *
 * That's why we need to wrap all async methods of cursor instance. We're doing this by creating another cursor
 * within these wrapped methods with selector and options updated by before hooks.
 */
CollectionHooks.defineAdvice(
  'find',
  function (
    userId,
    _super,
    instance,
    aspects,
    getTransform,
    args,
    suppressAspects
  ) {
    const selector = CollectionHooks.normalizeSelector(
      instance._getFindSelector(args)
    );
    const options = instance._getFindOptions(args);

    return _super.call(this, selector, options);
  }
);
