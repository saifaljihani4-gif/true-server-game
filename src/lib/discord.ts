import { DiscordSDK, Events } from '@discord/embedded-app-sdk';
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

function buildAvatarUrl(userId?: string, avatarHash?: string | null, discriminator: string = '0'): string {
  if (userId && avatarHash) {
    const isAnimated = avatarHash.startsWith('a_');
    const ext = isAnimated ? 'gif' : 'webp';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=128`;
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
      if (parsed && parsed.displayName) return parsed;
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
  try {
    localStorage.setItem('real_player_profile', JSON.stringify(guest));
  } catch {}
  return guest;
}

export function isRunningInDiscord(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('frame_id'));
}

export async function getDiscordUser(): Promise<DiscordUser> {
  if (cachedUser) return cachedUser;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isRunningInDiscord()) {
      cachedUser = getStoredFallback();
      return cachedUser;
    }

    try {
      if (!discordSdkInstance) {
        discordSdkInstance = new DiscordSDK(DISCORD_CLIENT_ID);
      }
      const sdk = discordSdkInstance;

      let readyUser: any = null;
      sdk.subscribe(Events.READY as any, (eventData: any) => {
        if (eventData?.user) {
          readyUser = eventData.user;
        }
      });

      await Promise.race([
        sdk.ready(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Discord SDK ready timeout')), 7000))
      ]);

      let participants: any[] = [];
      try {
        const pRes = await sdk.commands.getActivityInstanceConnectedParticipants();
        participants = pRes?.participants || [];
      } catch (e) {
        console.warn('Could not fetch connected participants:', e);
      }

      let targetUser = readyUser;
      if (!targetUser && participants.length > 0) {
        targetUser = participants[0];
      }

      if (targetUser) {
        const id = String(targetUser.id || '');
        const username = String(targetUser.username || 'لاعب');
        const displayName = String(targetUser.global_name || targetUser.nickname || username);
        const avatar = buildAvatarUrl(id, targetUser.avatar, targetUser.discriminator || '0');

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
