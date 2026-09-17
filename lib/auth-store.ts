"use client";

export type AuthUser = { id: string; name: string; email: string; createdAt: string };
type StoredUser = AuthUser & { passwordHash: string; onboardingComplete: boolean };

const usersKey = "pathwise-users";
const sessionKey = "pathwise-session";

function readUsers(): StoredUser[] { try { return JSON.parse(localStorage.getItem(usersKey) || "[]"); } catch { return []; } }
function saveUsers(users: StoredUser[]) { localStorage.setItem(usersKey, JSON.stringify(users)); }
async function hash(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(item => item.toString(16).padStart(2, "0")).join("");
}

export function currentUser(): AuthUser | null { try { return JSON.parse(localStorage.getItem(sessionKey) || "null"); } catch { return null; } }
export function logout() { localStorage.removeItem(sessionKey); }
export async function signup(name: string, email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  if (users.some(user => user.email === normalizedEmail)) return { error: "An account with this email already exists." };
  const user: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, passwordHash: await hash(password), createdAt: new Date().toISOString(), onboardingComplete: false };
  saveUsers([...users, user]);
  const session: AuthUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  localStorage.setItem(sessionKey, JSON.stringify(session));
  return { user: session };
}
export async function login(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  const user = readUsers().find(item => item.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== await hash(password)) return { error: "Incorrect email or password." };
  const session: AuthUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  localStorage.setItem(sessionKey, JSON.stringify(session));
  return { user: session };
}
export function markOnboardingComplete() {
  const session = currentUser();
  if (!session) return;
  saveUsers(readUsers().map(user => user.id === session.id ? { ...user, onboardingComplete: true } : user));
}
export function hasCompletedOnboarding() {
  const session = currentUser();
  return Boolean(session && readUsers().find(user => user.id === session.id)?.onboardingComplete);
}
