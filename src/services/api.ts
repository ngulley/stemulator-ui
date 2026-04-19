import { ScienceLab, SimStateSnapshot } from "../types";
import { CircuitBreaker, resilientFetch } from "./resilience";
import { registerCircuitBreaker } from "./healthCheck";
import { logger } from "./logger";

// API base URL - uses Vite proxy in development, can be overridden with VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "/stemulator/v1";

// ---------------------------------------------------------------------------
// Circuit breaker for the Labs / Guidance API
// ---------------------------------------------------------------------------
const labsCircuit = new CircuitBreaker({
  name: "labs",
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
});
registerCircuitBreaker("labs", labsCircuit);

/** Default resilience options for lab API calls. */
const LABS_RESILIENCE = {
  circuitBreaker: labsCircuit,
  maxAttempts: 3,
  timeoutMs: 15_000,
} as const;

// Request/Response types for AI guidance
export interface ScienceGuideRequest {
  studentName: string;
  setup: string[];
  observations: string[];
  evidence: string[];
  predictions: string[];
  /**
   * Full simulation state history from lab load → submission.
   * index 0 = initial state, index length-1 = state at time of submission.
   */
  history: SimStateSnapshot[];
}

export interface ScienceGuideResponse {
  guidance: string;
}

/** Validates that an ID is safe to interpolate into a URL path. */
function assertSafeId(id: string, label = "id"): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid ${label}: contains disallowed characters`);
  }
}

/**
 * Normalize a lab object from the backend API.
 * The backend uses `labId` as the identifier, but the frontend expects `_id`.
 */
function normalizeLab(data: Record<string, unknown>): ScienceLab {
  return {
    ...data,
    _id: (data._id as string) || (data.labId as string),
  } as ScienceLab;
}

/**
 * Fetch all available science labs
 */
export async function getLabs(): Promise<ScienceLab[]> {
  logger.info("Fetching all labs");
  const response = await resilientFetch(
    `${API_BASE_URL}/labs`,
    {},
    LABS_RESILIENCE,
  );
  if (!response.ok) {
    logger.error("Failed to fetch labs", { status: response.status });
    throw new Error(`Failed to fetch labs: ${response.statusText}`);
  }
  const data: Record<string, unknown>[] = await response.json();
  logger.info(`Fetched ${data.length} labs`);
  return data.map(normalizeLab);
}

/**
 * Fetch a specific science lab by ID
 */
export async function getLab(labId: string): Promise<ScienceLab | null> {
  assertSafeId(labId, "labId");
  logger.info(`Fetching lab ${labId}`);
  const response = await resilientFetch(
    `${API_BASE_URL}/labs/${labId}`,
    {},
    LABS_RESILIENCE,
  );
  if (response.status === 404) {
    logger.warn(`Lab ${labId} not found`);
    return null;
  }
  if (!response.ok) {
    logger.error(`Failed to fetch lab ${labId}`, { status: response.status });
    throw new Error(`Failed to fetch lab: ${response.statusText}`);
  }
  const data: Record<string, unknown> = await response.json();
  return normalizeLab(data);
}

/**
 * Get AI guidance for a lab part
 * @param labId - The lab identifier
 * @param partId - The lab part number
 * @param request - Student's responses (setup, observations, evidence, predictions)
 * @param evidenceFile - Optional CSV file with evidence data
 */
export async function getGuidance(
  labId: string,
  partId: number,
  request: ScienceGuideRequest,
  evidenceFile?: File,
): Promise<ScienceGuideResponse> {
  const formData = new FormData();
  formData.append("scienceGuideRequest", JSON.stringify(request));

  if (evidenceFile) {
    formData.append("evidence", evidenceFile);
  }

  assertSafeId(labId, "labId");
  logger.info(`Requesting guidance for lab ${labId} part ${partId}`);
  const response = await resilientFetch(
    `${API_BASE_URL}/guides/lab/${labId}/part/${partId}`,
    {
      method: "POST",
      body: formData,
    },
    { ...LABS_RESILIENCE, timeoutMs: 30_000 },
  );

  if (!response.ok) {
    logger.error("Guidance request failed", {
      labId,
      partId,
      status: response.status,
    });
    throw new Error(`Failed to get guidance: ${response.statusText}`);
  }

  logger.info("Guidance received successfully");
  return response.json();
}

/**
 * Create a new science lab (requires multipart form data with screenshot)
 */
export async function createLab(
  labId: string,
  discipline: string,
  topic: string,
  subTopic: string,
  expertise: string,
  simulation: string,
  screenshot: File,
): Promise<ScienceLab> {
  const formData = new FormData();
  formData.append("labId", labId);
  formData.append("discipline", discipline);
  formData.append("topic", topic);
  formData.append("subTopic", subTopic);
  formData.append("expertise", expertise);
  formData.append("simulation", simulation);
  formData.append("screenshot", screenshot);

  logger.info("Creating new lab", { labId });
  const response = await resilientFetch(
    `${API_BASE_URL}/labs`,
    {
      method: "POST",
      body: formData,
    },
    LABS_RESILIENCE,
  );

  if (!response.ok) {
    logger.error("Failed to create lab", { labId, status: response.status });
    throw new Error(`Failed to create lab: ${response.statusText}`);
  }

  logger.info("Lab created successfully", { labId });
  return response.json();
}

/**
 * Check if the backend API is available.
 * @deprecated Use {@link import("./healthCheck").checkHealth} instead for
 * comprehensive status including circuit-breaker state and latency.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/labs`, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    logger.debug("API health check", { ok: response.ok });
    return response.ok;
  } catch (err) {
    logger.warn("API health check failed", { error: (err as Error).message });
    return false;
  }
}
