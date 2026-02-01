import { Authenticator } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface User {
  id: string;
  username: string;
  authenticators: Authenticator[];
  currentChallenge?: string;
}

const usersPath = path.join(process.cwd(), 'lib', 'users.json');

function readUsers(): Map<string, User> {
  console.log('Reading users...');
  try {
    const data = fs.readFileSync(usersPath, 'utf-8');
    const users: Map<string, User> = new Map(Object.entries(JSON.parse(data)));
    
    // Convert publicKey from a plain object back to a Buffer
    for (const user of users.values()) {
      user.authenticators.forEach(auth => {
        if (auth.publicKey && (auth.publicKey as any).type === 'Buffer' && Array.isArray((auth.publicKey as any).data)) {
          auth.publicKey = Buffer.from((auth.publicKey as any).data);
        }
      });
    }
    
    return users;
  } catch (error) {
    return new Map();
  }
}

function writeUsers(users: Map<string, User>) {
    console.log('Writing users...');
    const usersObject = Array.from(users.entries()).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as { [key: string]: User });
  
    fs.writeFileSync(usersPath, JSON.stringify(usersObject, null, 2), 'utf-8');
}
  

export function getUser(username: string): User | undefined {
  const users = readUsers();
  return users.get(username);
}

export function createUser(username:string): User {
    const users = readUsers();
    const user: User = {
        id: `user_${Date.now()}`,
        username,
        authenticators: [],
    }
    users.set(username, user)
    writeUsers(users)
    return user
}

export function saveUser(user: User) {
    const users = readUsers();
    users.set(user.username, user);
    writeUsers(users);
}
