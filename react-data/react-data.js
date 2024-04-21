import { Meteor } from 'meteor/meteor';
import { useFind, useSubscribe } from 'meteor/react-meteor-data';
import { EXPECTED_ERROR } from './common';

let expectedErrorReason = 'Unknown error';
const QuaveReactData = {
  getAdditionalArgs() {
    return {};
  },
  setDefaultExpectedErrorReason(defaultExpectedErrorReason) {
    expectedErrorReason = defaultExpectedErrorReason;
  },
};

export const setGetAdditionalArgsFunction = (fn) => {
  QuaveReactData.getAdditionalArgs = fn;
};

export const useData = ({
  publicationName,
  arg,
  find,
  skip,
  shouldSkip,
  dataReturnWhenLoading,
  deps = [],
}) => {
  const argWithAdditionalArgs = {
    ...(arg || {}),
    ...QuaveReactData.getAdditionalArgs(),
  };
  const isSkip = skip || (shouldSkip && shouldSkip());
  const isLoading = useSubscribe(
    isSkip ? null : publicationName,
    argWithAdditionalArgs
  );
  const result = useFind(find, deps);

  if (isLoading()) {
    return {
      loading: true,
      data: dataReturnWhenLoading || undefined,
    };
  }

  // is findOne? so no fetch
  return { data: result?.fetch ? result.fetch() : result };
};

export const meteorCallPromisified = (methodName, ...args) =>
    new Promise((resolve, reject) => {
      Meteor.call(methodName, ...args, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

const methodCall = async (methodName, arg, { openAlert, onExpectedError, onError, onSuccess } = {}) =>
  new Promise((resolve, reject) => {
    const argWithAdditionalArgs = {
      ...(arg || {}),
      ...QuaveReactData.getAdditionalArgs(),
    };

    const onExpectedErrorFinal = openAlert || onExpectedError;
    Meteor.call(methodName, argWithAdditionalArgs, (error, result) => {
      if (error) {
        if (onExpectedErrorFinal && error.error === EXPECTED_ERROR) {
          onExpectedErrorFinal(error.reason || expectedErrorReason, { methodName, arg, error });
        }
        onError({ error, methodName, arg });
        reject(error);
        return;
      }
      onSuccess({ result, methodName, arg });
      resolve(result);
    });
  });

export const useMethod = (options) => {
  return {
    async method(name, arg) {
      return methodCall(name, arg, options);
    },
  };
};
