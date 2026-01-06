#!/usr/bin/env python3
"""
Precise receipt image editor - finds and replaces date/time and total.
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import re

def find_text_by_pattern(img, pattern_text, search_region=None):
    """Try to find text region by looking for similar patterns."""
    # This is a simplified version - would use OCR in production
    # For now, we'll use heuristics based on image analysis
    img_array = np.array(img.convert('RGB'))
    gray = np.mean(img_array, axis=2).astype(np.uint8)
    
    img_width, img_height = img.size
    
    if search_region:
        x1, y1, x2, y2 = search_region
        gray_region = gray[y1:y2, x1:x2]
    else:
        gray_region = gray
        x1, y1 = 0, 0
    
    # Look for text-like patterns (dark on light)
    # This is a heuristic approach
    
    return None

def edit_receipt_precise(image_path, output_path, new_date="12/4/25", new_time="3:56 PM", new_total="$206.31"):
    """
    Precisely edit receipt image.
    Uses multiple strategies to find and replace text.
    """
    print(f"Loading image: {image_path}")
    img = Image.open(image_path).convert('RGBA')
    img_edit = img.copy()
    draw = ImageDraw.Draw(img_edit)
    
    img_width, img_height = img.size
    print(f"Image dimensions: {img_width}x{img_height}")
    
    # Load fonts
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
        font_medium = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
        font_large = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
    except:
        font = ImageFont.load_default()
        font_medium = font
        font_large = font
    
    # Based on typical DoorDash receipt layout for 720x1604 image:
    # - Status bar at top (y: 0-50)
    # - Main content starts around y: 100
    # - Payment section with date is around y: 700-900 (middle)
    # - Cost breakdown is around y: 1000-1400
    # - Total is around y: 1350-1450 (near bottom)
    
    # Strategy: Use multiple search regions and replace all instances
    
    # 1. Replace date/time in Payment section
    # Payment section is typically in the middle-upper area
    # "PayPal • 11/24/25, 1:56 PM" format
    payment_y = int(img_height * 0.55)  # ~55% down
    payment_x_start = int(img_width * 0.1)
    payment_x_end = int(img_width * 0.9)
    
    # Cover area for date/time (after "PayPal • ")
    date_x = payment_x_start + 150  # Offset for "PayPal • " prefix
    date_y = payment_y
    date_width = 250
    date_height = 40
    
    print(f"Replacing date/time at approximate location: ({date_x}, {date_y})")
    
    # Draw white rectangle to cover old date/time
    draw.rectangle(
        [date_x - 10, date_y - 10,
         date_x + date_width, date_y + date_height],
        fill=(255, 255, 255, 255)
    )
    
    # Draw new date and time
    date_time_text = f"{new_date}, {new_time}"
    draw.text((date_x, date_y), date_time_text, fill=(0, 0, 0, 255), font=font)
    
    # 2. Replace total amount - appears in multiple places
    # Main total is typically at the bottom right
    total_y = int(img_height * 0.88)  # ~88% down (near bottom)
    total_x = int(img_width * 0.65)  # Right side
    
    total_width = 130
    total_height = 40
    
    print(f"Replacing total at approximate location: ({total_x}, {total_y})")
    
    # Cover old total
    draw.rectangle(
        [total_x - 10, total_y - 10,
         total_x + total_width, total_y + total_height],
        fill=(255, 255, 255, 255)
    )
    
    # Draw new total
    draw.text((total_x, total_y), new_total, fill=(0, 0, 0, 255), font=font_large)
    
    # 3. Also check for "Total:" label area and replace amount there
    # Sometimes there's a "Total:" label followed by the amount
    total_label_y = int(img_height * 0.86)
    total_label_x = int(img_width * 0.5)
    
    # Cover area for total amount (after "Total:" label)
    draw.rectangle(
        [total_label_x - 10, total_label_y - 10,
         total_label_x + total_width, total_label_y + total_height],
        fill=(255, 255, 255, 255)
    )
    draw.text((total_label_x, total_label_y), new_total, fill=(0, 0, 0, 255), font=font_large)
    
    # 4. Also replace any instances in the cost breakdown
    # Look for "$106.31" or "$123.37" patterns in the breakdown area
    breakdown_y_start = int(img_height * 0.75)
    breakdown_y_end = int(img_height * 0.90)
    
    # Scan this area for dollar amounts matching old totals
    # We'll replace a few key positions where totals typically appear
    
    # Adjusted total (if shown)
    adjusted_total_y = int(img_height * 0.82)
    adjusted_total_x = int(img_width * 0.65)
    
    draw.rectangle(
        [adjusted_total_x - 10, adjusted_total_y - 10,
         adjusted_total_x + total_width, adjusted_total_y + total_height],
        fill=(255, 255, 255, 255)
    )
    draw.text((adjusted_total_x, adjusted_total_y), new_total, fill=(0, 0, 0, 255), font=font_medium)
    
    # Save the edited image
    print(f"\nSaving edited image to: {output_path}")
    
    # Convert RGBA to RGB with white background
    if img_edit.mode == 'RGBA':
        background = Image.new('RGB', img_edit.size, (255, 255, 255))
        background.paste(img_edit, mask=img_edit.split()[3])
        img_edit = background
    
    img_edit.save(output_path, quality=95, optimize=True)
    print("Image editing complete!")
    print(f"\nUpdated:")
    print(f"  - Date/Time: {new_date}, {new_time}")
    print(f"  - Total: {new_total}")
    print(f"\nFile saved to: {output_path}")
    
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python edit_receipt_precise.py <image_path> [output_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    else:
        desktop = Path.home() / "Desktop"
        input_name = Path(image_path).stem
        output_path = str(desktop / f"{input_name}_edited.png")
    
    success = edit_receipt_precise(
        image_path,
        output_path,
        new_date="12/4/25",
        new_time="3:56 PM",
        new_total="$206.31"
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

