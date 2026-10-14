import { notFound } from "next/navigation";

// Any address that matches no page ends up here, so the translated 404 page (not-found.tsx) is shown.
export default function CatchAll() {
  notFound();
}
