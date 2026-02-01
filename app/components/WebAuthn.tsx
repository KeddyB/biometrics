'use client';

import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function WebAuthn() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isMedianReady, setIsMedianReady] = useState(
    typeof window !== 'undefined' && (window as any).Median
  );
  const router = useRouter();

  const handleRegister = useCallback(async () => {
    if (!username) {
      setMessage('Please enter a username');
      return;
    }

    try {
      const challengeRes = await fetch('/api/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const options = await challengeRes.json();
      if (options.error) {
        throw new Error(options.error);
      }

      const attestation = await startRegistration(options);

      const verificationRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, data: attestation }),
      });

      const verificationJSON = await verificationRes.json();

      if (verificationJSON && verificationJSON.verified) {
        setMessage('Registration successful! Redirecting...');
        // Assuming your /api/register returns an auth token, save it for biometrics
        if (isMedianReady && verificationJSON.authToken) {
          await (window as any).Median.biometric.saveSecret(verificationJSON.authToken);
        }
        router.push('/home');
      } else {
        throw new Error('Registration failed.');
      }
    } catch (error) {
      setMessage((error as Error).message);
    }
  }, [username, router, isMedianReady]);

  const handleLogin = useCallback(async () => {
    if (!username) {
      setMessage('Please enter a username');
      return;
    }

    try {
      const challengeRes = await fetch('/api/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const options = await challengeRes.json();
      if (options.error) {
        throw new Error(options.error);
      }

      const assertion = await startAuthentication(options);

      const verificationRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, data: assertion }),
      });

      const verificationJSON = await verificationRes.json();

      if (verificationJSON && verificationJSON.verified) {
        setMessage('Login successful! Redirecting...');
        // Assuming your /api/login returns an auth token, save it for biometrics
        if (isMedianReady && verificationJSON.authToken) {
          await (window as any).Median.biometric.saveSecret(verificationJSON.authToken);
        }
        router.push('/home');
      } else {
        throw new Error('Login failed.');
      }
    } catch (error) {
      setMessage((error as Error).message);
    }
  }, [username, router, isMedianReady]);

  const handleBiometricLogin = useCallback(async () => {
    setMessage('Attempting biometric login...');
    try {
      if (!isMedianReady) {
        throw new Error('Median.co SDK not available.');
      }

      // Check if biometrics are available on the device
      const isAvailable = await (window as any).Median.biometric.isAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device.');
      }

      // Retrieve the stored secret (e.g., an authentication token)
      const secret = await (window as any).Median.biometric.getSecret();

      if (secret) {
        // Send the secret to your backend for verification
        const response = await fetch('/api/biometric-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: secret }),
        });

        const result = await response.json();

        if (result && result.verified) {
          setMessage('Biometric login successful! Redirecting...');
          router.push('/home');
        } else {
          throw new Error(result.error || 'Biometric login failed.');
        }
      } else {
        throw new Error('No biometric secret found. Please log in normally first.');
      }
    } catch (error) {
      setMessage(`Biometric login error: ${(error as Error).message}`);
    }
  }, [isMedianReady, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">
          WebAuthn Fingerprint Authentication
        </h1>
        <div className="flex flex-col w-72">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 px-4 py-2 border rounded"
          />
          <button
            onClick={handleRegister}
            className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Register
          </button>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Login
          </button>
          {isMedianReady && (
            <button
              onClick={handleBiometricLogin}
              className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Biometric Login
            </button>
          )}
          {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
      </main>
    </div>
  );
}
