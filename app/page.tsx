"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSupport = async () => {
      if (!window.isSecureContext) {
        setIsSecureContext(false);
        return;
      }
      if (window.navigator.credentials && typeof window.navigator.credentials.get === "function") {
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  const handleLogin = async () => {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // Should be a random challenge from the server
          rp: { name: "Gemini CLI" },
          user: {
            id: new Uint8Array(16),
            name: "user@gemini.com",
            displayName: "User",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            requireResidentKey: true,
          },
          timeout: 60000,
        },
      });

      if (credential) {
        // In a real app, you would send the credential to the server for verification
        // and session creation.
        router.push("/home");
      }
    } catch (error) {
      console.error("Fingerprint authentication failed:", error);
      alert("Fingerprint authentication failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">
          Fingerprint Authentication
        </h1>
        {!isSecureContext ? (
          <p className="text-center text-red-500">
            Fingerprint authentication requires a secure (HTTPS) connection.
            Please access this page from a secure URL.
          </p>
        ) : isSupported ? (
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Login with Fingerprint
          </button>
        ) : (
          <p className="text-center text-red-500">
            Fingerprint sensor not available. Please make sure you have a
            fingerprint registered on your device, or try a different browser.
          </p>
        )}
      </div>
    </div>
  );
}
