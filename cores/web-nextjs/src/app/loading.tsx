import type { ReactElement } from "react";
import { LoadingState } from "../shared/components/loading-state.js";

/** UI de chargement de segment (App Router). */
export default function Loading(): ReactElement {
  return <LoadingState label="Chargement du socle…" />;
}
