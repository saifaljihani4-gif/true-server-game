import { DiscordSDK } from '@discord/embedded-app-sdk';
import { useEffect, useState } from 'react';

export const DISCORD_CLIENT_ID = '1552416496179740715';

export interface DiscordUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isDiscord: boolean;
}

let cachedUser: DiscordUser | null = null;
let initPromise: Promise<DiscordUser> | null = null;
let discordSdkInstance: DiscordSDK | null = null;
let capturedReadyUser: any = null;

function cleanOldGuestProfile() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('real_player_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        !parsed.isDiscord ||
        parsed.id?.startsWith('guest_') ||
        parsed.displayName?.startsWith('لاعب_')
      ) {
        localStorage.removeItem('real_player_profile');
      }
    }
  } catch {
    localStorage.removeItem('real_player_profile');
  }
}
cleanOldGuestProfile();

export function isRunningInDiscord(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('frame_id') || params.get('instance_id'));
}

if (typeof window !== 'undefined' && isRunningInDiscord()) {
  try {
    discordSdkInstance = new DiscordSDK(DISCORD_CLIENT_ID);
    (discordSdkInstance as any).eventBus?.once('READY', (eventData: any) => {
      if (eventData?.user) {
        capturedReadyUser = eventData.user;
      }
    });
  } catch (e) {
    console.warn('DiscordSDK early init error:', e);
  }
}

function buildAvatarUrl(userId?: string, avatarHash?: string | null, discriminator: string = '0'): string {
  if (userId && avatarHash) {
    const isAnimated = avatarHash.startsWith('a_');
    const ext = isAnimated ? 'gif' : 'webp';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=256`;
  }
  let index = 0;
  if (userId) {
    try {
      index = Number((BigInt(userId) >> 22n) % 6n);
    } catch {
      index = 0;
    }
  } else {
    index = Number(discriminator) % 5 || 0;
  }
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function getStoredFallback(): DiscordUser {
  if (typeof window === 'undefined') {
    return { id: 'guest', username: 'لاعب', displayName: 'لاعب', avatar: '/images/icon.png', isDiscord: false };
  }
  try {
    const raw = localStorage.getItem('real_player_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.displayName && parsed.isDiscord) return parsed;
    }
  } catch {}
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const guest: DiscordUser = {
    id: `guest_${randomNum}`,
    username: `لاعب_${randomNum}`,
    displayName: `لاعب_${randomNum}`,
    avatar: '/images/icon.png',
    isDiscord: false
  };
  return guest;
}

export async function getDiscordUser(): Promise<DiscordUser> {
  if (cachedUser && cachedUser.isDiscord) return cachedUser;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    cleanOldGuestProfile();

    if (!isRunningInDiscord()) {
      cachedUser = getStoredFallback();
      return cachedUser;
    }

    try {
      if (!discordSdkInstance) {
        discordSdkInstance = new DiscordSDK(DISCORD_CLIENT_ID);
        (discordSdkInstance as any).eventBus?.once('READY', (eventData: any) => {
          if (eventData?.user) {
            capturedReadyUser = eventData.user;
          }
        });
      }
      const sdk = discordSdkInstance;

      const readyData: any = await Promise.race([
        sdk.ready(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Discord SDK ready timeout')), 10000))
      ]);
      if (!capturedReadyUser && readyData?.user) {
        capturedReadyUser = readyData.user;
      }

      // Method 1: Official OAuth2 Silent Authorize and Authenticate
      try {
        const authData = await sdk.commands.authorize({
          client_id: DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify']
        });

        if (authData?.code) {
          const tokenRes = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: authData.code })
          });

          if (tokenRes.ok) {
            const tokenJson = await tokenRes.json();
            if (tokenJson?.access_token) {
              const authenticateRes = await sdk.commands.authenticate({
                access_token: tokenJson.access_token
              });
              if (authenticateRes?.user) {
                const u = authenticateRes.user;
                const id = String(u.id);
                const username = String(u.username || 'لاعب');
                const displayName = String((u as any).global_name || username);
                const avatar = buildAvatarUrl(id, u.avatar, (u as any).discriminator || '0');

                cachedUser = {
                  id,
                  username,
                  displayName,
                  avatar,
                  isDiscord: true
                };
                try {
                  localStorage.setItem('real_player_profile', JSON.stringify(cachedUser));
                } catch {}
                return cachedUser;
              }
            }
          }
        }
      } catch (authErr) {
        console.warn('OAuth authorization note:', authErr);
      }

      // Method 2: Connected participants fallback
      let participants: any[] = [];
      try {
        const pRes = await sdk.commands.getActivityInstanceConnectedParticipants();
        participants = pRes?.participants || [];
      } catch (e) {
        console.warn('Could not fetch connected participants:', e);
      }

      let targetUser = capturedReadyUser;
      if (!targetUser && participants.length > 0) {
        targetUser = participants[0];
      }

      let fullUserDetails: any = null;
      if (targetUser?.id) {
        try {
          fullUserDetails = await sdk.commands.getUser({ id: targetUser.id });
        } catch (e) {
          console.warn('Could not fetch getUser from Discord:', e);
        }
      }

      const id = String(fullUserDetails?.id || targetUser?.id || '');
      const username = String(fullUserDetails?.username || targetUser?.username || 'لاعب');
      const matchedParticipant = participants.find((p: any) => p.id === id);
      const displayName = String(
        fullUserDetails?.global_name ||
        matchedParticipant?.global_name ||
        matchedParticipant?.nickname ||
        targetUser?.global_name ||
        targetUser?.nickname ||
        username
      );
      const avatarHash = fullUserDetails?.avatar || matchedParticipant?.avatar || targetUser?.avatar || null;
      const discriminator = String(fullUserDetails?.discriminator || targetUser?.discriminator || '0');
      const avatar = buildAvatarUrl(id, avatarHash, discriminator);

      if (id) {
        cachedUser = {
          id,
          username,
          displayName,
          avatar,
          isDiscord: true
        };
        try {
          localStorage.setItem('real_player_profile', JSON.stringify(cachedUser));
        } catch {}
        return cachedUser;
      }
    } catch (err) {
      console.warn('Failed to load Discord user profile:', err);
    }

    cachedUser = getStoredFallback();
    return cachedUser;
  })();

  return initPromise;
}

export function useDiscordUser() {
  const [user, setUser] = useState<DiscordUser | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);

  useEffect(() => {
    let mounted = true;
    getDiscordUser().then((u) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading, isDiscord: isRunningInDiscord() };
}
