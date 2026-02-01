import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';

export interface Authenticator {
  id: string;
  publicKey: Buffer;
  counter: number;
  transports: AuthenticatorTransportFuture[];
}
