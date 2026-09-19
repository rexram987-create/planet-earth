# TERRA — Earth / Tierra Simulator

Hebrew, mobile-friendly 3D Earth PWA. Built with Three.js and Vite. Uses the actual mesh and embedded textures from the user-supplied EarthTierra.blend, converted for browser use; no substitute Earth asset.

## Run and build

Node 22.12+ recommended. `npm ci`, `npm run dev`, `npm run build`, `npm run preview`.

Deploy by importing this repository in Vercel: Vite preset, `npm run build`, output `dist`. No API keys, server, database or environment variables required. The build generates a content-versioned offline cache. Updates wait until existing tabs close to avoid mixing asset versions.

## Model

`public/model/earth.glb` preserves the uploaded model's mesh and UVs. Blender-specific shader nodes are reconstructed in Three.js: day texture, bump, water specular, night lights only on the dark hemisphere, clouds, and a visual atmospheric rim. Textures resized to 2048–4096 px for mobile use. `scripts/export_blender.py` extracts the original geometry and packed textures; run with Blender 4.2 and the original .blend file. `scripts/prepare_assets.py` optimizes extracted textures and creates PWA icons.

The user-supplied Blend Swap screenshot identifies Earth/Tierra and a CC0 license. Full author name and exact model page URL are not legible, so no unverified author attribution is invented. Original source attachment stays with the user.

## Scientific source

NASA Earth Facts: https://science.nasa.gov/earth/facts/ — checked 2026-09-19.
Equatorial diameter 12,756 km; sidereal rotation ~23.9 h; year ~365.25 d; axial tilt 23.4 degrees relative to the orbital normal; mean Sun distance ~150 million km; mean Moon distance 384,400 km. These are rounded educational reference values.

Rotation is intentionally accelerated (one turn in 20, 60 or 120 seconds). It is not an ephemeris: orientation, lighting and clouds do not represent current conditions. Axis tilt is depicted relative to the scene's reference vertical. Star background is decorative and is not a mapped star catalog.

## Interaction and accessibility

Mouse/touch drag rotates; wheel/pinch zooms; explicit zoom/rotation/reset buttons and keyboard arrow/plus/minus controls are available. Auto-rotation is off by default. Responsive RTL interface, labeled controls, visible focus, load failures, install help and standalone PWA icons included. Offline use requires one successful full initial load and browser storage availability.
