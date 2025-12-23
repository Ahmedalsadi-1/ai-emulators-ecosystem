export type KeyInfo = {
  name: string;
  isPrintable: boolean;
  string?: string;
  shiftString?: string;
};

// Empty key map for ARM64 compatibility - input tracking disabled
export const keyInfoMap: Record<number, KeyInfo> = {};