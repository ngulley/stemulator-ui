/**
 * Local demo authentication backed by localStorage.
 *
 * Passwords are hashed with SHA-256 (via Web Crypto) before storage so that
 * plain-text credentials never touch localStorage.
 *
 * NOTE: This is a front-end-only demo layer. A production build must use a
 * backend auth service (e.g. Spring Security + JWTs) so that credentials are
 * validated server-side and passwords are hashed server-side with bcrypt/Argon2.
 */

const USERS_KEY = "stemulator_registered_users";
const SESSION_KEY = "stemulator_session";

export type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  /** SHA-256 hex digest of the password. */
  passwordHash: string;
  createdAt: string;
};

/** Public shape — never includes the password hash. */
export type PublicUser = Omit<StoredUser, "passwordHash">;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const { password } = input;

  if (!fullName || !email || !password) {
    return { ok: false, error: "Please fill in all fields." };
  }
  if (password.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }

  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const created: StoredUser = {
    id: crypto.randomUUID(),
    fullName,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(created);
  writeUsers(users);

  const publicUser: PublicUser = {
    id: created.id,
    fullName: created.fullName,
    email: created.email,
    createdAt: created.createdAt,
  };
  return { ok: true, user: publicUser };
}

export async function tryLogin(
  email: string,
  password: string,
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const users = readUsers();
  const passwordHash = await hashPassword(password);
  const u = users.find(
    (x) =>
      x.email.toLowerCase() === email.trim().toLowerCase() &&
      x.passwordHash === passwordHash,
  );
  if (!u) {
    return { ok: false, error: "Invalid email or password." };
  }
  const publicUser: PublicUser = {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    createdAt: u.createdAt,
  };
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
