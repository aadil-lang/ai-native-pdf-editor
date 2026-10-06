"""
PDF Coordinate Utilities

PDF Coordinate System:
- Origin (0,0) is at the TOP-LEFT (or standard PyMuPDF top-left) in 72 points per inch (DPI).
- Bounding Box: [x0, y0, x1, y1] where (x0,y0) is top-left and (x1,y1) is bottom-right.

Screen / Canvas Coordinate System:
- DOM Pixels scaled by CSS zoom level and DPI scale factor.
"""

from typing import Tuple, Dict, Any
from app.schemas.document import BoundingBox

def pdf_to_screen_rect(bbox: BoundingBox, scale: float) -> Dict[str, float]:
    """
    Converts a PDF BoundingBox (in points) to screen/DOM pixel coordinates at a given zoom scale.
    """
    return {
        "left": bbox.x0 * scale,
        "top": bbox.y0 * scale,
        "width": (bbox.x1 - bbox.x0) * scale,
        "height": (bbox.y1 - bbox.y0) * scale
    }

def screen_to_pdf_rect(screen_left: float, screen_top: float, screen_width: float, screen_height: float, scale: float) -> BoundingBox:
    """
    Converts screen/DOM pixel dimensions back to PDF BoundingBox in 72 DPI point space.
    """
    return BoundingBox(
        x0=screen_left / scale,
        y0=screen_top / scale,
        x1=(screen_left + screen_width) / scale,
        y1=(screen_top + screen_height) / scale
    )

def hex_to_rgb_float(hex_color: str) -> Tuple[float, float, float]:
    """
    Converts '#RRGGBB' hex string to PyMuPDF RGB float tuple (0.0 to 1.0).
    """
    hex_clean = hex_color.lstrip('#')
    if len(hex_clean) == 3:
        hex_clean = ''.join([c*2 for c in hex_clean])
    if len(hex_clean) != 6:
        return (0.0, 0.0, 0.0)
    r = int(hex_clean[0:2], 16) / 255.0
    g = int(hex_clean[2:4], 16) / 255.0
    b = int(hex_clean[4:6], 16) / 255.0
    return (r, g, b)

def rgb_float_to_hex(r: float, g: float, b: float) -> str:
    """
    Converts RGB float tuple (0.0 to 1.0) or int tuple (0-255) to hex string #RRGGBB.
    """
    if isinstance(r, float) and r <= 1.0:
        r = int(r * 255)
        g = int(g * 255)
        b = int(b * 255)
    return f"#{r:02x}{g:02x}{b:02x}"
