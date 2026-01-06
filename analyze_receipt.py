#!/usr/bin/env python3
"""
Analyze receipt image to find exact text coordinates.
"""

import sys
from PIL import Image, ImageDraw
import numpy as np

def analyze_image(image_path):
    """Analyze image to find text regions and their coordinates."""
    img = Image.open(image_path).convert('RGB')
    img_array = np.array(img)
    gray = np.mean(img_array, axis=2).astype(np.uint8)
    
    img_width, img_height = img.size
    print(f"Image size: {img_width}x{img_height}")
    
    # Look for text by finding regions with high contrast
    # Text typically has dark pixels (low values) on light background (high values)
    
    # Method: Find horizontal lines with text-like patterns
    # Scan for rows that have alternating light/dark patterns
    
    print("\nScanning for text regions...")
    
    # Find rows with significant dark content (potential text)
    text_rows = []
    for y in range(0, img_height, 2):  # Sample every 2 pixels
        row = gray[y, :]
        # Count dark pixels (potential text)
        dark_count = np.sum(row < 120)
        if dark_count > 30:  # If row has significant dark content
            # Find the extent of dark regions
            dark_indices = np.where(row < 120)[0]
            if len(dark_indices) > 0:
                x_start = dark_indices[0]
                x_end = dark_indices[-1]
                width = x_end - x_start
                if width > 50:  # Minimum text width
                    text_rows.append((x_start, y, width, np.mean(row[x_start:x_end+1])))
    
    # Group nearby rows into text blocks
    text_blocks = []
    current_block = None
    
    for x, y, w, avg in text_rows:
        if current_block is None:
            current_block = {'x': x, 'y': y, 'x_end': x + w, 'y_end': y, 'rows': 1}
        else:
            # Check if this row is part of the same block
            if abs(y - current_block['y_end']) < 5 and abs(x - current_block['x']) < 50:
                # Same block
                current_block['y_end'] = y
                current_block['x'] = min(current_block['x'], x)
                current_block['x_end'] = max(current_block['x_end'], x + w)
                current_block['rows'] += 1
            else:
                # New block
                if current_block['rows'] > 3:  # Only keep blocks with multiple rows
                    text_blocks.append(current_block)
                current_block = {'x': x, 'y': y, 'x_end': x + w, 'y_end': y, 'rows': 1}
    
    if current_block and current_block['rows'] > 3:
        text_blocks.append(current_block)
    
    print(f"\nFound {len(text_blocks)} text blocks:")
    for i, block in enumerate(text_blocks[:30]):  # Show first 30
        print(f"Block {i}: x={block['x']}, y={block['y']}, width={block['x_end']-block['x']}, height={block['y_end']-block['y']}")
    
    # Now try to identify specific regions
    # Look for patterns that might indicate date/time or total
    
    # Date/time is likely in a block around middle-upper area
    # Total is likely in a block near the bottom
    
    print("\n" + "="*60)
    print("Potential regions for date/time (middle area):")
    middle_y = img_height // 2
    for i, block in enumerate(text_blocks):
        if middle_y - 200 < block['y'] < middle_y + 200:
            print(f"  Block {i}: y={block['y']}, x={block['x']} to {block['x_end']}")
    
    print("\nPotential regions for total (bottom area):")
    bottom_y = img_height - 200
    for i, block in enumerate(text_blocks):
        if block['y'] > bottom_y:
            print(f"  Block {i}: y={block['y']}, x={block['x']} to {block['x_end']}")
    
    return text_blocks

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_receipt.py <image_path>")
        sys.exit(1)
    
    analyze_image(sys.argv[1])

















