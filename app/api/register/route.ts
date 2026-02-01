import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { VerifiedRegistrationResponse } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/user';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, data } = body;

  if (!username || !data) {
    return NextResponse.json({ error: 'Missing username or data' }, { status: 400 });
  }

  const user = getUser(username);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const expectedChallenge = user.currentChallenge;

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'No challenge found for user' }, { status: 400 });
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response: data,
      expectedChallenge,
      expectedOrigin: new URL(req.url).origin,
      expectedRPID: new URL(req.url).hostname,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credential } = registrationInfo;
    const newAuthenticator = {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: data.response.transports || [],
    };
    user.authenticators.push(newAuthenticator);
    user.currentChallenge = undefined;
    saveUser(user);
  }

  return NextResponse.json({ verified });
}
