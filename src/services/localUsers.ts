/**
 * Authentication layer backed by localStorage.
 *
 * Supports two providers:
 *   - "local"  — email/password with SHA-256 hashed credentials (demo only;
 *                replace with bcrypt/Argon2 on the backend for production)
 *   - "google" — Google OAuth via @react-oauth/google; the credential JWT is
 *                decoded client-side and the public profile is persisted here
 *
 * NOTE: This is a front-end-only demo layer. A production build must validate
 * tokens server-side (Spring Security + Google token introspection endpoint).
 */

const USERS_KEY = "stemulator_registered_users";
const SESSION_KEY = "stemulator_session";

export type AuthProvider = "local" | "google";

export type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  /** SHA-256 hex digest of the password. Only set for local accounts. */
  passwordHash: string;
  createdAt: string;
};

/** Public shape — never includes the password hash. */
export type PublicUser = Omit<StoredUser, "passwordHash"> & {
  provider: AuthProvider;
  /** Profile picture URL — populated for Google accounts. */
  picture?: string;
};

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
    provider: "local",
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
    provider: "local",
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

// ---------------------------------------------------------------------------
// Google OAuth helpers
// ---------------------------------------------------------------------------

/** Payload shape decoded from a Google credential JWT. */
export type GoogleCredentialPayload = {
  sub: string; // Google user ID
  name: string;
  email: string;
  picture: string;
  iat: number;
  exp: number;
};

/**
 * Persist a Google-authenticated session.
 * The raw credential JWT is decoded by the caller (via jwt-decode) and passed here.
 */
export function setGoogleSession(payload: GoogleCredentialPayload): PublicUser {
  const user: PublicUser = {
    id: payload.sub,
    fullName: payload.name,
    email: payload.email,
    picture: payload.picture,
    provider: "google",
    createdAt: new Date().toISOString(),
  };
  setSession(user);
  return user;
}
