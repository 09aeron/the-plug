// The Plug - build settings (Phase 0). v1
// One file on purpose: React, Tailwind, offline/installable (PWA), and the
// temporary app icons. Change settings here, not in the app code.

import fs from 'node:fs'
import zlib from 'node:zlib'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// The GitHub workflow sets VITE_BASE to "/<repo-name>/" so the app works
// under yourname.github.io/<repo-name>/ whatever the repo is called.
const base = process.env.VITE_BASE || '/'

// ---- Temporary app icons: plain solid squares in the accent color. ----
// Written into public/ every time the config loads, so no image files
// ever need uploading. Replace later with real artwork if wanted.
const ICON_COLOR = [15, 107, 92] // #0F6B5C, the prototype's ACCENT

const CRC_TABLE = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function solidPng(size, rgb) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 2 // color type: RGB
  const rowLength = 1 + size * 3
  const raw = Buffer.alloc(rowLength * size)
  for (let y = 0; y < size; y++) {
    const start = y * rowLength
    raw[start] = 0 // no row filter
    for (let x = 0; x < size; x++) {
      raw[start + 1 + x * 3] = rgb[0]
      raw[start + 2 + x * 3] = rgb[1]
      raw[start + 3 + x * 3] = rgb[2]
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

fs.mkdirSync('public', { recursive: true })
for (const size of [192, 512]) {
  fs.writeFileSync('public/pwa-' + size + 'x' + size + '.png', solidPng(size, ICON_COLOR))
}

export default defineConfig({
  base,
  css: {
    postcss: {
      plugins: [
        tailwindcss({ content: ['./index.html', './*.{js,jsx}'] }),
        autoprefixer(),
      ],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'The Plug',
        short_name: 'The Plug',
        description: 'Learn, organize and retain, offline.',
        theme_color: '#0F6B5C',
        background_color: '#0F6B5C',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Save the whole app on first visit so it opens with no internet.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // The prototype loads its fonts from Google at runtime. Keep copies
        // after the first online visit so fonts also work offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
