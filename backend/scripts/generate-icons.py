import os
import struct
import subprocess

PUBLIC_DIR = "/Users/arpit/Desktop/Major Project/frontend/public"

SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Dark Navy / Charcoal Rounded Container -->
  <rect width="512" height="512" rx="104" fill="#111827"/>
  
  <!-- Miner's Safety Helmet Dome -->
  <path d="M256 112 C248 112 244 116 244 122 V140 C176 148 124 200 120 262 H392 C388 200 336 148 268 140 V122 C268 116 264 112 256 112 Z" fill="#f59e0b"/>
  
  <!-- Center Ridge / Spine -->
  <path d="M249 116 C249 114 252 113 256 113 C260 113 263 114 263 116 V186 H249 Z" fill="#d97706"/>
  
  <!-- Helmet Brim -->
  <rect x="94" y="260" width="324" height="26" rx="13" fill="#f59e0b"/>
  <rect x="100" y="278" width="312" height="8" rx="4" fill="#d97706" opacity="0.6"/>

  <!-- Mining Headlamp Outer Ring & Center Bulb -->
  <circle cx="256" cy="214" r="26" fill="#1e293b" stroke="#d97706" stroke-width="4"/>
  <circle cx="256" cy="214" r="16" fill="#ffffff"/>
  
  <!-- Safety Verified Green Checkmark -->
  <path d="M192 352 L238 398 L320 318" fill="none" stroke="#22c55e" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
</svg>"""

# 1. Write icon.svg and favicon.svg
icon_svg_path = os.path.join(PUBLIC_DIR, "icon.svg")
favicon_svg_path = os.path.join(PUBLIC_DIR, "favicon.svg")

with open(icon_svg_path, "w") as f:
    f.write(SVG_CONTENT)
with open(favicon_svg_path, "w") as f:
    f.write(SVG_CONTENT)

print(f"Wrote {icon_svg_path} and {favicon_svg_path}")

# 2. Rasterize 512x512 PNG using macOS sips
icon_512_path = os.path.join(PUBLIC_DIR, "icon-512.png")
subprocess.run(["sips", "-s", "format", "png", icon_svg_path, "--out", icon_512_path], check=True)

# 3. Generate all sizes from icon-512.png
sizes = [
    (192, "icon-192.png"),
    (180, "apple-touch-icon.png"),
    (64, "favicon-64x64.png"),
    (48, "favicon-48x48.png"),
    (32, "favicon-32x32.png"),
    (16, "favicon-16x16.png"),
]

for dim, filename in sizes:
    dest_path = os.path.join(PUBLIC_DIR, filename)
    subprocess.run(["sips", "-z", str(dim), str(dim), icon_512_path, "--out", dest_path], check=True)
    print(f"Generated {filename} ({dim}x{dim})")

# 4. Generate multi-resolution favicon.ico containing 16, 32, 48, 64
ico_dims = [16, 32, 48, 64]
ico_files = [os.path.join(PUBLIC_DIR, f"favicon-{d}x{d}.png") for d in ico_dims]

images = []
for p in ico_files:
    with open(p, "rb") as fp:
        images.append(fp.read())

count = len(images)
header = struct.pack("<HHH", 0, 1, count)
offset = 6 + 16 * count
entries = []

for i, data in enumerate(images):
    w = ico_dims[i]
    h = ico_dims[i]
    size = len(data)
    entry = struct.pack("<BBBBHHII", w if w < 256 else 0, h if h < 256 else 0, 0, 0, 1, 32, size, offset)
    entries.append(entry)
    offset += size

favicon_ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
with open(favicon_ico_path, "wb") as out:
    out.write(header)
    for e in entries:
        out.write(e)
    for d in images:
        out.write(d)

print(f"Generated {favicon_ico_path} with resolutions: {ico_dims}")
