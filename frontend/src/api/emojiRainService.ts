import { Subject } from 'rxjs';

/**
 * Broadcasts an emoji "rain" event — UI subscribes and renders
 * a shower of the given emoji falling from the top of the screen.
 */
export const emojiRainSubject = new Subject<{ emoji: string; count?: number; durationMs?: number }>();

export function rainEmoji(emoji: string, opts: { count?: number; durationMs?: number } = {}) {
  emojiRainSubject.next({ emoji, count: opts.count ?? 40, durationMs: opts.durationMs ?? 3500 });
}
