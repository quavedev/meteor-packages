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

const methodCall = async (methodName, arg, { openAlert } = {}) =>
  new Promise((resolve, reject) => {
    const argWithAdditionalArgs = {
      ...(arg || {}),
      ...QuaveReactData.getAdditionalArgs(),
    };
    Meteor.call(methodName, argWithAdditionalArgs, (error, result) => {
      if (error) {
        if (openAlert && error.error === EXPECTED_ERROR) {
          openAlert(error.reason || expectedErrorReason);
        }
        reject(error);
        return;
      }
      resolve(result);
    });
  });

export const useMethod = ({ openAlert } = {}) => {
  return {
    async method(name, arg) {
      return methodCall(name, arg, { openAlert });
    },
  };
};
