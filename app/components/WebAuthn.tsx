'use client';

import { useState, useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function WebAuthn() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
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
        router.push('/home');
      } else {
        throw new Error('Registration failed.');
      }
    } catch (error) {
      setMessage((error as Error).message);
    }
  }, [username, router]);

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
        router.push('/home');
      } else {
        throw new Error('Login failed.');
      }
    } catch (error) {
      setMessage((error as Error).message);
    }
  }, [username, router]);

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
          {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
      </main>
    </div>
  );
}
