/**
 * Server-only GitHub REST helpers used by the publishing system.
 *
 * Content lives in the repo (content/*.json, public/images/uploads/**,
 * data/*.json). Publishing and data writes commit through the GitHub REST API
 * using the GITHUB_TOKEN environment variable. The token is never imported
 * from client code ("use client"), so it stays server-side only.
 *
 * No SDK dependency: every call is a plain fetch.
 */

import { createHash } from "crypto";

interface GithubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

/** Read the configured owner/repo/branch/token from the environment. */
export function githubConfig(): GithubConfig | null {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!owner || !repo || !token) return null;
  return { owner, repo, branch, token };
}

export function isGithubConfigured(): boolean {
  return githubConfig() !== null;
}

export class GitHubError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const config = githubConfig();
  if (!config) {
    throw new GitHubError(
      "GitHub is not configured. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO.",
      0
    );
  }

  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: init?.cache,
    next: init?.next,
  });

  if (!response.ok) {
    let message = `GitHub request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = `${message}: ${body.message}`;
    } catch {
      // keep the generic message
    }
    throw new GitHubError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Reading files                                                       */
/* ------------------------------------------------------------------ */

interface ContentsFileResponse {
  type: "file" | "dir";
  sha: string;
  content?: string;
  encoding?: string;
  size: number;
}

export interface RepoFile {
  /** Git blob sha of the current file content. */
  blobSha: string;
  base64: string;
}

/**
 * Fetch the current raw content of a file on the branch.
 * Files larger than ~1 MB do not inline their bytes in the contents API
 * response, in which case we follow up with the git blobs API.
 */
export async function readRepoFile(
  path: string,
  options?: { revalidate?: number }
): Promise<RepoFile | null> {
  const config = githubConfig();
  if (!config) return null;
  const isFresh = options?.revalidate === undefined;

  try {
    const contents = await gh<ContentsFileResponse>(
      `/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`,
      isFresh
        ? { cache: "no-store" }
        : { next: { revalidate: options?.revalidate ?? 60 } }
    );
    if (contents.type !== "file") return null;

    if (contents.content && contents.encoding === "base64") {
      return { blobSha: contents.sha, base64: contents.content.replace(/\n/g, "") };
    }

    // Large files: the bytes have to come from the blobs API.
    const blob = await gh<{ content: string; encoding: string }>(
      `/git/blobs/${contents.sha}`,
      { cache: "no-store" }
    );
    if (!blob.content) return null;
    return { blobSha: contents.sha, base64: blob.content.replace(/\n/g, "") };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }
}

/** Read a JSON file from the branch. Returns null when the file does not exist. */
export async function readRepoJson<T>(
  path: string,
  options?: { revalidate?: number }
): Promise<T | null> {
  const file = await readRepoFile(path, options);
  if (!file) return null;
  try {
    return JSON.parse(Buffer.from(file.base64, "base64").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Committing files                                                    */
/* ------------------------------------------------------------------ */

export type CommitFile =
  | { path: string; text: string }
  | { path: string; base64: string };

function fileBuffer(file: CommitFile): Buffer {
  return "text" in file
    ? Buffer.from(file.text, "utf8")
    : Buffer.from(file.base64, "base64");
}

/** Git blob sha (sha1 of `blob <len>\0<content>`), same value the API reports. */
function gitBlobSha(buffer: Buffer): string {
  const header = Buffer.from(`blob ${buffer.byteLength}\0`);
  return createHash("sha1").update(Buffer.concat([header, buffer])).digest("hex");
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

interface RefResponse {
  object: { sha: string };
}
interface CommitResponse {
  sha: string;
  tree: { sha: string };
}
interface TreeResponse {
  sha: string;
}
interface BlobResponse {
  sha: string;
}

interface CommitAttempt {
  refSha: string;
  baseTreeSha: string;
  blobs: Array<{ path: string; sha: string }>;
}

async function prepareCommit(
  changed: CommitFile[]
): Promise<CommitAttempt> {
  const config = githubConfig();
  if (!config) {
    throw new GitHubError(
      "GitHub is not configured. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO.",
      0
    );
  }
  // One extra grace attempt against momentary API failures.
  const ref = await gh<RefResponse>(
    `/git/ref/heads/${encodeURIComponent(config.branch)}`,
    { cache: "no-store" }
  );
  const headSha = ref.object.sha;
  const head = await gh<CommitResponse>(`/git/commits/${headSha}`, {
    cache: "no-store",
  });

  const blobs: Array<{ path: string; sha: string }> = [];
  for (const file of changed) {
    const buffer = fileBuffer(file);
    const blob = await gh<BlobResponse>(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: buffer.toString("base64"),
        encoding: "base64",
      }),
    });
    blobs.push({ path: file.path, sha: blob.sha });
  }

  const tree = await gh<TreeResponse>(`/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: head.tree.sha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });

  return { refSha: headSha, baseTreeSha: tree.sha, blobs };
}

async function finishCommit(
  message: string,
  attempt: CommitAttempt
): Promise<string> {
  const config = githubConfig();
  if (!config) {
    throw new GitHubError(
      "GitHub is not configured. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO.",
      0
    );
  }
  const commit = await gh<CommitResponse>(`/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: attempt.baseTreeSha,
      parents: [attempt.refSha],
    }),
  });

  await gh(`/git/refs/heads/${encodeURIComponent(config.branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return commit.sha;
}

/**
 * Commit one or more files atomically (blob -> tree -> commit -> ref).
 *
 * Returns the new commit sha. When `expected` is provided the commit is
 * skipped entirely (no new build triggered on Vercel) and `skipped` is true.
 */
export async function commitFiles(
  message: string,
  files: CommitFile[],
  options?: { onConflictRetry?: number }
): Promise<{ commitSha: string | null; skipped: boolean }> {
  if (files.length === 0) return { commitSha: null, skipped: true };

  const maxAttempts = Math.max(1, options?.onConflictRetry ?? 3);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const prepared = await prepareCommit(files);
      const commitSha = await finishCommit(message, prepared);
      return { commitSha, skipped: false };
    } catch (error) {
      const retryable =
        error instanceof GitHubError &&
        (error.status === 409 ||
          error.status === 422 ||
          (error.status >= 500 && error.status < 600));
      if (!retryable || attempt === maxAttempts) throw error;
      // Another publish raced us; loop to re-read the updated branch tip.
    }
  }
  throw new GitHubError("Commit failed after retries.", 0);
}

/** True when the buffer already matches the file currently on the branch. */
export async function fileUnchanged(
  path: string,
  buffer: Buffer
): Promise<boolean> {
  const current = await readRepoFile(path);
  return current !== null && current.blobSha === gitBlobSha(buffer);
}

export { gitBlobSha };
