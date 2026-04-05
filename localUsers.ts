/**
 * Local demo accounts in localStorage. Passwords stored in plain text for testing only.
 */
const USERS_KEY = "stemulator_registered_users";
const SESSION_KEY = "stemulator_session";

export type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
};

export type PublicUser = Omit<StoredUser, "password">;

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; error: string } {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!fullName || !email || !password) {
    return { ok: false, error: "Please fill in all fields." };
  }

  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const created: StoredUser = {
    id: crypto.randomUUID(),
    fullName,
    email,
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(created);
  writeUsers(users);
  const { password: _, ...publicUser } = created;
  return { ok: true, user: publicUser };
}

export function tryLogin(
  email: string,
  password: string,
): { ok: true; user: PublicUser } | { ok: false; error: string } {
  const users = readUsers();
  const u = users.find(
    (x) => x.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!u || u.password !== password) {
    return { ok: false, error: "Invalid email or password." };
  }
  const { password: _, ...publicUser } = u;
  return { ok: true, user: publicUser };
}

export function setSession(user: PublicUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): PublicUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
