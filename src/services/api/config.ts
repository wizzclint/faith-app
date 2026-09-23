/**
 * The FAITH RUN backend's base URL.
 *
 * "localhost" from a phone means the phone itself, not this dev machine —
 * use this machine's current LAN IP instead (changes when the network
 * changes; keep this in sync with whatever `ipconfig` reports). Swap for
 * the real deployed URL once faith-server is actually hosted somewhere
 * reachable.
 */
export const API_BASE_URL = "http://192.168.1.193:4000";
