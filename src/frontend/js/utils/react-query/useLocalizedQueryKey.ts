import { QueryKey } from 'react-query';
import { useIntl } from 'react-intl';

/**
 * Append the active locale to the query key to invalidate queries when
 * language changes.
 */
const useLocalizedQueryKey = (queryKey: QueryKey) => {
  const { locale } = useIntl();

  if (Array.isArray(queryKey)) {
    queryKey = [...queryKey, locale];
  } else if (typeof queryKey === 'string') {
    queryKey = [queryKey, locale];
  }

  return queryKey;
};

export { useLocalizedQueryKey };
