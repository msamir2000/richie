import { FC, createContext, useContext, useMemo } from 'react';
import { QueryObserverBaseResult, useQueryClient, useQuery } from 'react-query';
import { Maybe } from 'types/utils';
import { Course } from 'types/Joanie';
import API from 'utils/api/joanie';
import { useLocalizedQueryKey } from 'utils/react-query/useLocalizedQueryKey';
import { useSession } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { APIResponseError } from 'types/api';

interface CourseContext {
  item: Maybe<Course>;
  methods: {
    invalidate: () => void;
    refetch: QueryObserverBaseResult['refetch'];
  };
  states: {
    fetching: boolean;
  };
}

const Context = createContext<Maybe<CourseContext>>(undefined);

export const CourseProvider: FC<{ code: string }> = ({ code, children }) => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const QUERY_KEY = useLocalizedQueryKey(user ? ['user', 'course', code] : ['course', code]);
  const {
    data: course,
    refetch,
    isLoading,
  } = useQuery(QUERY_KEY, () => API().courses.get(code), {
    staleTime: user
      ? REACT_QUERY_SETTINGS.staleTimes.sessionItems
      : REACT_QUERY_SETTINGS.staleTimes.default,
    onError: (error: APIResponseError) => {
      if (error.code === 401) {
        queryClient.invalidateQueries('user');
      }
    },
  });

  const invalidate = async () => {
    // Invalidate all course's queries no matter the locale
    const unlocalizedQueryKey = QUERY_KEY.slice(0, -1);
    await queryClient.invalidateQueries(unlocalizedQueryKey);
  };

  const context = useMemo(
    () => ({
      item: course,
      methods: {
        invalidate,
        refetch,
      },
      states: { fetching: isLoading },
    }),
    [course, invalidate, refetch, isLoading],
  );

  return <Context.Provider value={context}>{children}</Context.Provider>;
};

export const useCourse = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useCourse must be used within a component wrapped by a <CourseProvider />.');
  }
  return context;
};
