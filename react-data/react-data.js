import { useFind, useSubscribe } from 'meteor/react-meteor-data';
import {methodCall, QuaveReactData} from "./common";

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


export const useMethod = (options) => {
  return {
    async method(name, arg) {
      return methodCall(name, arg, options);
    },
  };
};
