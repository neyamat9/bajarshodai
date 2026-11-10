"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "302074665927-ku2ajdtkae2kj8or8ph5e9kgrjdkn9gj.apps.googleusercontent.com";

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
