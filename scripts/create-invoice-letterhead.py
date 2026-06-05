from pathlib import Path
from typing import Any, cast
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "app" / "favicon.ico"
target = ROOT / "public" / "images" / "invoices" / "letterhead.png"
invoice_accent = (10, 122, 92)

target.parent.mkdir(parents=True, exist_ok=True)

icon = Image.open(source).convert("RGBA")
canvas_size = 512
padding = 86
transparent: Any = (0, 0, 0, 0)
canvas = Image.new("RGBA", (canvas_size, canvas_size), cast(int, transparent))

# Preserve the favicon mark itself, but render it large enough for crisp invoice PDFs.
mark_size = canvas_size - padding * 2
mark = icon.resize((mark_size, mark_size), Image.Resampling.LANCZOS)

# Match the invoice accent text color while preserving the favicon alpha mask.
alpha = mark.getchannel("A")
accent_fill: Any = (*invoice_accent, 255)
mark = Image.new("RGBA", mark.size, cast(int, accent_fill))
mark.putalpha(alpha)

x = (canvas_size - mark.width) // 2
y = (canvas_size - mark.height) // 2
canvas.alpha_composite(mark, (x, y))

canvas.save(target)
print(target)
