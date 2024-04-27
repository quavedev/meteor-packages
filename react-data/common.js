import { Meteor } from 'meteor/meteor';

export const EXPECTED_ERROR = 'quave:expected-error';

let expectedErrorReason = 'Unknown error';

export const QuaveReactData = {
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

export const meteorCallPromisified = (methodName, ...args) =>
  new Promise((resolve, reject) => {
    Meteor.call(methodName, ...args, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

const nonOp = () => {};
export const methodCall = async (
  methodName,
  arg,
  {
    openAlert,
    onExpectedError,
    onError = nonOp,
    onSuccess = nonOp,
    onFinally = nonOp,
  } = {}
) =>
  new Promise((resolve, reject) => {
    const argWithAdditionalArgs = {
      ...(arg || {}),
      ...QuaveReactData.getAdditionalArgs(),
    };

    const onExpectedErrorFinal = openAlert || onExpectedError;
    Meteor.call(methodName, argWithAdditionalArgs, (error, result) => {
      if (error) {
        if (onExpectedErrorFinal && error.error === EXPECTED_ERROR) {
          const expectedReason = error.reason || expectedErrorReason;
          onExpectedErrorFinal(expectedReason, { methodName, arg, error });
          onFinally({ methodName, arg, error, expectedReason });
          reject(error);
          return;
        }
        onError({ error, methodName, arg });
        onFinally({ methodName, arg, error });
        reject(error);
        return;
      }
      onSuccess({ result, methodName, arg });
      onFinally({ result, methodName, arg });
      resolve(result);
    });
  });
