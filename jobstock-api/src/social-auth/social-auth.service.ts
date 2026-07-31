import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

interface PendingLink {
  userId: string;
  expiresAt: number;
}

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Handles "Connect GitHub" / "Connect LinkedIn" account-linking OAuth flows for
 * candidate profiles. This is account *linking* (the candidate is already logged
 * in), not login-via-OAuth — so the flow is:
 *   1. Frontend calls GET /social-auth/github/start (authenticated) to get an
 *      authorize URL, which encodes a one-time `state` mapped to this user.
 *   2. Browser navigates to GitHub, user approves, GitHub redirects to our public
 *      callback with ?code=...&state=....
 *   3. Callback looks up which user the state belongs to, exchanges the code for
 *      an access token, fetches the GitHub profile, and saves it to that user's
 *      candidate profile.
 *
 * The pending-state map is in-memory, which is fine for a single-instance dev/demo
 * deployment — a production multi-instance deployment should back this with Redis
 * or a DB table instead so state survives across instances/restarts.
 */
@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly pendingLinks = new Map<string, PendingLink>();

  constructor(private readonly prisma: PrismaService) {}

  private get frontendOrigin(): string {
    return process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
  }

  private get backendOrigin(): string {
    return process.env.BACKEND_ORIGIN ?? 'http://localhost:4000';
  }

  private createState(userId: string): string {
    this.cleanupExpired();
    const state = crypto.randomBytes(24).toString('hex');
    this.pendingLinks.set(state, { userId, expiresAt: Date.now() + STATE_TTL_MS });
    return state;
  }

  private consumeState(state: string): string {
    const pending = this.pendingLinks.get(state);
    this.pendingLinks.delete(state);
    if (!pending || pending.expiresAt < Date.now()) {
      throw new BadRequestException('This connection request has expired — please try again.');
    }
    return pending.userId;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [state, pending] of this.pendingLinks) {
      if (pending.expiresAt < now) this.pendingLinks.delete(state);
    }
  }

  // ---------- GitHub ----------

  isGithubConfigured(): boolean {
    return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  }

  startGithub(userId: string): { url: string } {
    if (!this.isGithubConfigured()) {
      throw new InternalServerErrorException('GitHub integration is not configured yet.');
    }
    const state = this.createState(userId);
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: `${this.backendOrigin}/api/social-auth/github/callback`,
      scope: 'read:user',
      state,
    });
    return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  async handleGithubCallback(code: string, state: string): Promise<string> {
    const userId = this.consumeState(state);

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${this.backendOrigin}/api/social-auth/github/callback`,
      }),
    });
    const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenBody.access_token) {
      this.logger.error(`GitHub token exchange failed: ${tokenBody.error ?? 'unknown error'}`);
      return `${this.frontendOrigin}/candidate-profile?github=error`;
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/vnd.github+json' },
    });
    const profile = (await profileRes.json()) as { login?: string; html_url?: string; avatar_url?: string };
    if (!profile.login) {
      return `${this.frontendOrigin}/candidate-profile?github=error`;
    }

    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!candidate) {
      return `${this.frontendOrigin}/candidate-profile?github=error`;
    }

    await this.prisma.candidateProfile.update({
      where: { userId },
      data: {
        githubUsername: profile.login,
        githubProfileUrl: profile.html_url ?? `https://github.com/${profile.login}`,
        githubAvatarUrl: profile.avatar_url ?? null,
      },
    });

    return `${this.frontendOrigin}/candidate-profile?github=connected`;
  }

  async disconnectGithub(userId: string) {
    await this.prisma.candidateProfile.update({
      where: { userId },
      data: { githubUsername: null, githubProfileUrl: null, githubAvatarUrl: null },
    });
    return { success: true };
  }

  // ---------- LinkedIn ----------
  // Code path built and ready — inactive until a real LinkedIn OAuth app's Client
  // ID/Secret are supplied via env vars, same pattern used for Razorpay/GitHub.

  isLinkedinConfigured(): boolean {
    return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
  }

  startLinkedin(userId: string): { url: string } {
    if (!this.isLinkedinConfigured()) {
      throw new InternalServerErrorException('LinkedIn integration is not configured yet.');
    }
    const state = this.createState(userId);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: `${this.backendOrigin}/api/social-auth/linkedin/callback`,
      scope: 'openid profile email',
      state,
    });
    return { url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}` };
  }

  async handleLinkedinCallback(code: string, state: string): Promise<string> {
    const userId = this.consumeState(state);

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${this.backendOrigin}/api/social-auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenBody.access_token) {
      this.logger.error(`LinkedIn token exchange failed: ${tokenBody.error ?? 'unknown error'}`);
      return `${this.frontendOrigin}/candidate-profile?linkedin=error`;
    }

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });
    const profile = (await profileRes.json()) as { sub?: string };
    if (!profile.sub) {
      return `${this.frontendOrigin}/candidate-profile?linkedin=error`;
    }

    await this.prisma.candidateProfile.update({
      where: { userId },
      data: { linkedinProfileUrl: `https://www.linkedin.com/in/${profile.sub}` },
    });

    return `${this.frontendOrigin}/candidate-profile?linkedin=connected`;
  }

  async disconnectLinkedin(userId: string) {
    await this.prisma.candidateProfile.update({ where: { userId }, data: { linkedinProfileUrl: null } });
    return { success: true };
  }
}
