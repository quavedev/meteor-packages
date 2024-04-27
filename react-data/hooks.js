import { useFind, useSubscribe } from 'meteor/react-meteor-data';
import { methodCall, QuaveReactData } from './common';

export const useDataSubscribe = ({
  publicationName,
  arg,
  skip,
  shouldSkip,
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

  if (isLoading()) {
    return {
      loading: true,
    };
  }

  return { loading: false };
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

const emptyCursor = () => ({
  fetch: () => [],
  observe: () => {},
  stop: () => {},
});
export const useFindData = ({ find, skip, deps = [] }) =>
  useFind(skip ? emptyCursor : find, deps);

export const useFindOneData = ({ find, skip, deps = [] }) =>
  useFind(skip ? emptyCursor : find, deps)?.[0];

export const useMethod = (options) => ({
  async method(name, arg) {
    return methodCall(name, arg, options);
  },
});
