import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { VerifiedAuthenticationResponse } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/user';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, data } = body;

  if (!username || !data) {
    return NextResponse.json({ error: 'Missing username or data' }, { status: 400 });
  }

  const user = await getUser(username);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const expectedChallenge = user.currentChallenge;

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'No challenge found for user' }, { status: 400 });
  }

  const authenticator = user.authenticators ? user.authenticators.find(
    auth => auth.id === data.id
  ) : undefined;

  if (!authenticator) {
    return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
  }

  if (!authenticator) {
    return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
  }





  const credential = {
    ...authenticator,
    publicKey: authenticator.publicKey.slice(),
  };

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response: data,
      expectedChallenge,
      expectedOrigin: new URL(req.url).origin,
      expectedRPID: new URL(req.url).hostname,
      credential,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    const { newCounter } = authenticationInfo;
    authenticator.counter = newCounter;
    user.currentChallenge = undefined;
    await saveUser(user);
  }

  return NextResponse.json({ verified });
}
