import { describe, it, expect, beforeEach } from 'vitest';
import {
  GoogleIntegrationService,
  AUTHORIZED_DIRECTOR_EMAIL,
} from '../googleIntegrationService';

describe('GoogleIntegrationService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('gets and sets OAuth client ID correctly with trimming', () => {
    expect(GoogleIntegrationService.getClientId()).toBe('');

    GoogleIntegrationService.setClientId('  test-client-id-12345.apps.googleusercontent.com  ');
    expect(GoogleIntegrationService.getClientId()).toBe('test-client-id-12345.apps.googleusercontent.com');
  });

  it('returns default signed-out status when no token is present', () => {
    const status = GoogleIntegrationService.getAuthStatus();
    expect(status.isSignedIn).toBe(false);
    expect(status.accessToken).toBeNull();
    expect(status.userEmail).toBeNull();
  });

  it('throws descriptive error on requestToken when client ID is missing', async () => {
    await expect(GoogleIntegrationService.requestToken()).rejects.toThrow(
      /Please enter your Google Cloud OAuth Client ID first/
    );
  });

  it('clears credentials on signOut', () => {
    localStorage.setItem('oldalex_google_access_token', 'mock-token');
    localStorage.setItem('oldalex_google_expires_at', String(Date.now() + 3600000));
    localStorage.setItem('oldalex_google_user_profile', JSON.stringify({ email: AUTHORIZED_DIRECTOR_EMAIL }));

    expect(GoogleIntegrationService.getAuthStatus().isSignedIn).toBe(true);

    GoogleIntegrationService.signOut();
    expect(GoogleIntegrationService.getAuthStatus().isSignedIn).toBe(false);
  });
});
