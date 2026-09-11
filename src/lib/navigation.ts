import { useLocation, useNavigate } from "@solidjs/router";
/** Small app binding; portable modules never import the router. */
export function usePathname() {
  const location = useLocation();
  return () => location.pathname;
}
export function useSearchParams() {
  const location = useLocation();
  return {
    get: (key: string) => new URLSearchParams(location.search).get(key),
    getAll: (key: string) => new URLSearchParams(location.search).getAll(key),
    toString: () => new URLSearchParams(location.search).toString(),
  };
}
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    refresh: () => window.location.reload(),
  };
}
