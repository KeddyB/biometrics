import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';

export interface Authenticator {
  id: Buffer;
  publicKey: Buffer;
  counter: number;
  transports: AuthenticatorTransportFuture[];
}

export interface User {
  id: string;
  username: string;
  authenticators: Authenticator[];
  currentChallenge?: string;
}