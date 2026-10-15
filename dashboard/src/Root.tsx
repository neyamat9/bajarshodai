import { useSyncExternalStore } from "react";
import { RouterProvider } from "react-router";
import i18n, { lang } from "./i18n";
import { router } from "./router";

// Changing the language rebuilds the pages (the texts and the digits are read while drawing); the sign-in and the data stay
const subscribe = (cb: () => void) => {
  i18n.on("languageChanged", cb);
  return () => i18n.off("languageChanged", cb);
};

export default function Root() {
  const current = useSyncExternalStore(subscribe, lang);
  return <RouterProvider key={current} router={router} />;
}
