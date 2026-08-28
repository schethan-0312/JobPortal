"use client";

import { GoogleLogin } from "@react-oauth/google";

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export default function GoogleAuthButton({ onSuccess, onError, text = "continue_with" }: GoogleAuthButtonProps) {
  return (
    <div className="w-100 d-flex justify-content-center mb-4">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential);
          } else {
            onError();
          }
        }}
        onError={onError}
        useOneTap={false}
        text={text}
        theme="outline"
        size="large"
        width="100%"
      />
    </div>
  );
}
