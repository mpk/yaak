import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActiveWorkspace } from './useActiveWorkspace';
import { useCookieJars } from './useCookieJars';
import { useKeyValue } from './useKeyValue';

export const QUERY_COOKIE_JAR_ID = 'cookie_jar_id';

export function useActiveCookieJar() {
  const [activeCookieJarId, setActiveCookieJarId] = useActiveCookieJarId();
  const cookieJars = useCookieJars();

  const activeCookieJar = useMemo(() => {
    if (cookieJars.data == null) return undefined;
    return cookieJars.data.find((cookieJar) => cookieJar.id === activeCookieJarId) ?? null;
  }, [activeCookieJarId, cookieJars.data]);

  return [activeCookieJar ?? null, setActiveCookieJarId] as const;
}

export function useEnsureActiveCookieJar() {
  const cookieJars = useCookieJars();
  const [activeCookieJarId, setActiveCookieJarId] = useActiveCookieJarId();
  useEffect(() => {
    if (cookieJars.data == null) return;

    if (cookieJars.data.find((j) => j.id === activeCookieJarId)) {
      return; // There's an active jar
    }

    const firstJar = cookieJars.data[0];
    if (firstJar == null) {
      console.log("Workspace doesn't have any cookie jars to activate");
      return;
    }

    // There's no active jar, so set it to the first one
    console.log('Setting active cookie jar to', firstJar.id);
    setActiveCookieJarId(firstJar.id);
  }, [activeCookieJarId, cookieJars, cookieJars.data, setActiveCookieJarId]);
}

export function useMigrateActiveCookieJarId() {
  const workspace = useActiveWorkspace();
  const [, setActiveCookieJarId] = useActiveCookieJarId();
  const {
    set: setLegacyActiveCookieJarId,
    value: legacyActiveCookieJarId,
    isLoading: isLoadingLegacyActiveCookieJarId,
  } = useKeyValue<string | null>({
    namespace: 'global',
    key: ['activeCookieJar', workspace?.id ?? 'n/a'],
    fallback: null,
  });

  useEffect(() => {
    if (legacyActiveCookieJarId == null || isLoadingLegacyActiveCookieJarId) return;

    console.log('Migrating active cookie jar ID to query param', legacyActiveCookieJarId);
    setActiveCookieJarId(legacyActiveCookieJarId);
    setLegacyActiveCookieJarId(null).catch(console.error);
  }, [
    workspace,
    isLoadingLegacyActiveCookieJarId,
    legacyActiveCookieJarId,
    setActiveCookieJarId,
    setLegacyActiveCookieJarId,
  ]);
}

function useActiveCookieJarId() {
  // NOTE: This query param is accessed from Rust side, so do not change
  const [params, setParams] = useSearchParams();
  const id = params.get(QUERY_COOKIE_JAR_ID);

  const setId = useCallback(
    (id: string) => {
      setParams((p) => {
        const existing = Object.fromEntries(p);
        return { ...existing, [QUERY_COOKIE_JAR_ID]: id };
      });
    },
    [setParams],
  );

  return [id, setId] as const;
}
