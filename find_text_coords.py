#!/usr/bin/env python3
"""
Helper script to find text coordinates in the receipt image.
"""

import sys
from PIL import Image, ImageDraw
import numpy as np

def analyze_image_for_text(image_path):
    """Analyze image to find text regions."""
    img = Image.open(image_path)
    img_array = np.array(img)
    
    # Convert to grayscale
    if len(img_array.shape) == 3:
        gray = np.mean(img_array[:, :, :3], axis=2).astype(np.uint8)
    else:
        gray = img_array
    
    img_width, img_height = img.size
    print(f"Image size: {img_width}x{img_height}")
    
    # Look for dark text on light background
    # Text typically has pixel values < 100 on background > 200
    
    # Scan for horizontal text lines (receipts have horizontal text)
    text_regions = []
    
    # Scan row by row to find text-like regions
    for y in range(0, img_height, 5):  # Sample every 5 pixels
        row = gray[y, :]
        # Find dark regions (potential text)
        dark_pixels = np.where(row < 100)[0]
        if len(dark_pixels) > 20:  # If we have a significant dark region
            x_start = dark_pixels[0]
            x_end = dark_pixels[-1]
            # Check if this looks like text (has some structure)
            if x_end - x_start > 50:  # Minimum text width
                text_regions.append((x_start, y, x_end - x_start, 20))
    
    # Print some potential text regions
    print("\nPotential text regions found:")
    for i, (x, y, w, h) in enumerate(text_regions[:20]):  # Show first 20
        # Extract region and check if it might contain our target text
        region = gray[max(0, y-10):min(img_height, y+30), max(0, x):min(img_width, x+w)]
        if region.size > 0:
            print(f"Region {i}: x={x}, y={y}, width={w}")
    
    return text_regions

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python find_text_coords.py <image_path>")
        sys.exit(1)
    
    analyze_image_for_text(sys.argv[1])

















