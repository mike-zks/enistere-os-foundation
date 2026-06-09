import type { ReactElement } from "react";
import { NotFoundState } from "../shared/components/not-found-state.js";

/** UI 404 (App Router). */
export default function NotFound(): ReactElement {
  return <NotFoundState />;
}
