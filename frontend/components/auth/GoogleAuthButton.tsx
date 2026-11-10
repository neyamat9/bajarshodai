"use client";

import { GoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface GoogleAuthButtonProps {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (errMessage: string) => void;
  disabled?: boolean;
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) return null;

  return (
    <div className="relative flex w-full flex-col items-center justify-center">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-background/80 backdrop-blur-xs">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <div
        className={`w-full flex justify-center [&>div]:w-full ${
          disabled || loading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <GoogleLogin
          onSuccess={async (res) => {
            if (!res.credential) {
              onError?.("No Google credential returned");
              return;
            }
            setLoading(true);
            try {
              await onSuccess(res.credential);
            } finally {
              setLoading(false);
            }
          }}
          onError={() => {
            onError?.("Google sign-in was cancelled or failed");
          }}
          theme="outline"
          size="large"
          width="100%"
          text="continue_with"
          shape="rectangular"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}

