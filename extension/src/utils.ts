function getHashCode(s: string): number {
  const MAGIC = "TH3_M5G1C_OF_NTU".repeat(3);

  const magic_idx = [];
  let cur = 0;
  for (let i = 0; i < MAGIC.length; i++) {
    cur += MAGIC.charCodeAt(i);
    magic_idx.push(cur);
  }

  const a = [];
  let h = 0;
  for (const idx of magic_idx) {
    const c = s.charCodeAt(idx);
    a.push(c);
    h = (h << 5) - h + c;
    h &= 1 << (63 - 1);
  }
  return h + 1;
}

export { getHashCode };

async function waitUntil(pred: () => boolean, timeout = 60) {
  return new Promise<void>((res, rej) => {
    const st = Date.now();
    const f = () => {
      if (Date.now() - st < timeout * 1000)
        if (pred()) res();
        else requestIdleCallback(f);
      else rej();
    };
    requestIdleCallback(f);
  });
}

export { waitUntil };

function toURLQueryString<T extends Record<string, string | number>>(data: T) {
  return Object.entries(data)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

export { toURLQueryString };
