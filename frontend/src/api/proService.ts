/**
 * Pro tier state management.
 * Tracks AI usage count in localStorage so it persists across sessions on the same device.
 * The server enforces the hard limit by IP; this drives the frontend nag screen.
 */

import { ref, computed } from 'vue';

const STORAGE_KEY = 'pp_ai_uses';
const FREE_LIMIT  = 5;

// Reactive state
const _uses = ref<number>(parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10));

export const aiUsesCount   = computed(() => _uses.value);
export const aiUsesLeft    = computed(() => Math.max(0, FREE_LIMIT - _uses.value));
export const isProUser     = ref<boolean>(false);   // will be set after account/auth is implemented
export const showProNag    = ref<boolean>(false);

export function recordAiUse() {
    if (isProUser.value) return;
    _uses.value += 1;
    localStorage.setItem(STORAGE_KEY, String(_uses.value));
    if (_uses.value >= FREE_LIMIT) {
        showProNag.value = true;
    }
}

export function dismissProNag() {
    showProNag.value = false;
}

/** Called before attempting an AI command. Returns false and shows nag if limit reached. */
export function canUseAi(): boolean {
    if (isProUser.value) return true;
    if (_uses.value >= FREE_LIMIT) {
        showProNag.value = true;
        return false;
    }
    return true;
}
