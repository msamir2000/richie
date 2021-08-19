import { lazy, PropsWithChildren, Suspense, useContext } from 'react';
import { isJoanieEnabled } from 'utils/api/joanie';
import { AuthenticationApi } from 'utils/api/authentication';
import { handle } from 'utils/errors/handle';
import { Session } from './SessionContext';

/**
 * useSession
 *
 * An utils to manage user session in Richie
 * User session information are extracted from OpenEdX cookies.
 * This means that OpenEdX and Richie must be accessible through the same domain and
 * OpenEdX must be configured to share cookies to Richie subdomain.
 *
 * "edxloggedin" cookie is used to know if an OpenEdX session is active or not,
 * then user information are extracted from "edx-user-info" cookie.
 *
 * useSession use a context to dispatch any change to all react widgets.
 *
 */

const LazyBaseSessionProvider = lazy(() => import('./BaseSessionProvider'));
const LazyJoanieSessionProvider = lazy(() => import('./JoanieSessionProvider'));

export const SessionProvider = ({ children, ...props }: PropsWithChildren<any>) => {
  if (!AuthenticationApi) return children;

  return (
    <Suspense fallback="loading...">
      {isJoanieEnabled ? (
        <LazyJoanieSessionProvider {...props}>{children}</LazyJoanieSessionProvider>
      ) : (
        <LazyBaseSessionProvider {...props}>{children}</LazyBaseSessionProvider>
      )}
    </Suspense>
  );
};

export const useSession = () => {
  if (!AuthenticationApi) {
    handle(
      new Error(
        'You attempt to use `useSession` hook but there is no authentication backend configured.',
      ),
    );
  }
  return useContext(Session);
};
