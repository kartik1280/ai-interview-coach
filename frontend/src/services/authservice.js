import { supabase } from '../lib/supabase'

export async function signUp(email, password, options = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/create-interview`,
      data: options.data || {}
    }
  })

  if (error) {
    throw error
  }

  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}