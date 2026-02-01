import { supabase } from './supabase';
import type { User } from './types';

export async function getUser(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  if (data && data.authenticators) {
    data.authenticators.forEach((auth: any) => {
      if (auth.id && auth.id.type === 'Buffer') {
        auth.id = Buffer.from(auth.id.data);
      }
      if (auth.publicKey && auth.publicKey.type === 'Buffer') {
        auth.publicKey = Buffer.from(auth.publicKey.data);
      }
    });
  }

  return data;
}

export async function createUser(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, id: `user_${Date.now()}` }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return data;
}

export async function saveUser(user: User): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(user)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error saving user:', error);
    return null;
  }

  return data;
}