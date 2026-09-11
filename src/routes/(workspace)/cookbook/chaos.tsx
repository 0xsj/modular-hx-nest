import { useLocation } from "@solidjs/router";
import Page from "~/examples/(workspace)/cookbook/(recipes)/chaos/page";
import { Guard } from "~/lib/app/guard";
export default function Route() {
  const location = useLocation();
  return (
    <Guard>
      {() => (
        <Page
          underChaos={
            import.meta.env.DEV &&
            new URLSearchParams(location.search).has("chaos")
          }
        />
      )}
    </Guard>
  );
}
