import React, { createContext, useContext } from 'react';
import { useQuery, QueryObserverBaseResult } from 'react-query';
import { Maybe } from 'types/utils';
import { Course } from 'types/Joanie';
import API from 'utils/api/joanie';
import { useSession } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS } from 'settings';

interface CourseContext {
  item: Maybe<Course>;
  methods: {
    refetch: QueryObserverBaseResult['refetch'];
  };
  states: {
    fetching: boolean;
  };
}

const Context = createContext<Maybe<CourseContext>>(undefined);

export const CourseProvider: React.FC<{ code: string }> = ({ code, children }) => {
  const { user } = useSession();
  const queryKey = user ? ['user', 'course', code] : ['course', code];
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

  return (
    <Context.Provider
      value={{ item: course, methods: { refetch }, states: { fetching: isLoading } }}
    >
      {children}
    </Context.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useCourse must be used within a component wrapped by a <CourseProvider />.');
  }
  return context;
};
