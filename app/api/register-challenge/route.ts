import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getUser, createUser, saveUser } from '@/lib/user';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  let user = await getUser(username);
  if (!user) {
    user = await createUser(username);
  }

  if (!user) {
    return NextResponse.json({ error: 'Could not create or find user' }, { status: 500 });
  }

  const options = await generateRegistrationOptions({
    rpName: 'Gemini Biometrics Demo',
    rpID: new URL(req.url).hostname,
    userID: Buffer.from(user.id, 'utf-8'),
    userName: user.username,
    attestationType: 'none',
    excludeCredentials: user.authenticators ? user.authenticators.map(auth => ({
      id: auth.id,
      type: 'public-key',
      transports: auth.transports,
    })) : [],
  });

  user.currentChallenge = options.challenge;
  await saveUser(user);

  return NextResponse.json(options);
}
