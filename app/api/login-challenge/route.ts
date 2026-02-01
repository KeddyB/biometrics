import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/user';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const user = await getUser(username);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: new URL(req.url).hostname,
    allowCredentials: user.authenticators ? user.authenticators.map(auth => ({
      id: auth.id,
      type: 'public-key',
      transports: auth.transports,
    })) : [],
    userVerification: 'preferred',
  });

  user.currentChallenge = options.challenge;
  await saveUser(user);

  return NextResponse.json(options);
}
