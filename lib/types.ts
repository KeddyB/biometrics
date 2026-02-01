import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';

export interface Authenticator {
  id: string;
  publicKey: Uint8Array;
  counter: number;
  transports: AuthenticatorTransportFuture[];
}

export interface User {
  id: string;
  username: string;
  authenticators: Authenticator[];
  currentChallenge?: string;
}