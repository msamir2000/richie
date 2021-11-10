import { useMutation } from 'react-query';
import API from 'utils/api/joanie';

export const usePayment = () => {
  const creationHandler = useMutation(API().payments.create);
  const abortHandler = useMutation(API().payments.abort);

  return {
    methods: {
      create: creationHandler.mutateAsync,
      abort: abortHandler.mutateAsync,
    },
  };
};
