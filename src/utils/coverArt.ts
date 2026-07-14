export function generateBase64SvgCover(title: string, accentColor: string = '#00f2fe'): string {
  const cleanTitle = (title || 'Aetheria').toUpperCase().slice(0, 22);
  const hash = cleanTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    ['#0a0f24', '#1f133e', '#00f2fe'],
    ['#140821', '#340a42', '#f43f5e'],
    ['#081d18', '#073324', '#10b981'],
    ['#1c1005', '#3d240a', '#f59e0b'],
    ['#0a1428', '#102a52', '#38bdf8']
  ];
  const [c1, c2, acc] = colors[hash % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bg-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="glow-${hash}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${acc}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg-${hash})"/>
    <circle cx="200" cy="200" r="155" fill="url(#glow-${hash})"/>
    <circle cx="200" cy="200" r="110" fill="none" stroke="${acc}" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="8 4"/>
    <circle cx="200" cy="200" r="75" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2"/>
    <circle cx="200" cy="200" r="28" fill="${c1}" stroke="${acc}" stroke-width="3"/>
    <circle cx="200" cy="200" r="8" fill="${acc}"/>
    <text x="200" y="335" font-family="sans-serif" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">${cleanTitle}</text>
    <text x="200" y="358" font-family="sans-serif" font-size="11" font-weight="500" fill="${acc}" text-anchor="middle" letter-spacing="1">HI-RES LOSSLESS AUDIO</text>
  </svg>`;

  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}
