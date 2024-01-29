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
   return h;
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

const createIcon = () => {
    // Create the button element
    var buttonElement = document.createElement('button');

    // Add classes to the button
    buttonElement.className = 'MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textInherit MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorInherit MuiButton-disableElevation MuiButton-root MuiButton-text MuiButton-textInherit MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-colorInherit MuiButton-disableElevation mui-ahcpjm';

    // Set the tabindex and type attributes
    buttonElement.tabIndex = 0;
    buttonElement.type = 'button';

    // Create the span for the start icon
    var startIconSpan = document.createElement('span');
    startIconSpan.className = 'MuiButton-startIcon MuiButton-iconSizeSmall mui-fv0pue';

    // Create the SVG icon
    var svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('width', '18');
    svgIcon.setAttribute('height', '18');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('fill', 'none');
    svgIcon.setAttribute('stroke', 'currentColor');
    svgIcon.setAttribute('stroke-width', '2');
    svgIcon.setAttribute('stroke-linecap', 'round');
    svgIcon.setAttribute('stroke-linejoin', 'round');
    // svgIcon.className = 'lucide lucide-heart';

    // Create the path element inside the SVG
    var pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z');

    // Append the path element to the SVG
    svgIcon.appendChild(pathElement);

    // Append the SVG icon to the startIconSpan
    startIconSpan.appendChild(svgIcon);

    // Create the span for the TouchRipple
    var touchRippleSpan = document.createElement('span');
    touchRippleSpan.className = 'MuiTouchRipple-root mui-w0pj6f';

    // Append the startIconSpan and touchRippleSpan to the button
    buttonElement.appendChild(startIconSpan);
    buttonElement.appendChild(touchRippleSpan);

    return buttonElement
}

export { createIcon };