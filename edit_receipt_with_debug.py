#!/usr/bin/env python3
"""
Receipt editor with visual debugging - shows exactly where text is placed.
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def edit_with_debug(image_path, output_path, new_date="12/4/25", new_time="3:56 PM", new_total="$206.31", show_debug=True):
    """Edit receipt with visual debugging markers."""
    img = Image.open(image_path).convert('RGBA')
    img_edit = img.copy()
    draw = ImageDraw.Draw(img_edit)
    
    img_width, img_height = img.size
    
    # Load fonts
    try:
        font_medium = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
        font_large = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
    except:
        font_medium = ImageFont.load_default()
        font_large = font_medium
    
    # Analyze image to find text regions more precisely
    img_array = np.array(img.convert('RGB'))
    gray = np.mean(img_array, axis=2).astype(np.uint8)
    
    # Find the payment section more precisely
    # Look for the area around y=856-900 which should contain "PayPal • 11/24/25, 1:56 PM"
    payment_y_start = 850
    payment_y_end = 920
    
    # Scan this region for text patterns
    payment_region = gray[payment_y_start:payment_y_end, :]
    
    # Find where text actually starts in this region
    # Look for the date pattern area (after "PayPal • ")
    date_x = None
    date_y = None
    
    # Method: Find the rightmost text in payment section (likely the date/time)
    for y_offset in range(payment_y_end - payment_y_start):
        y = payment_y_start + y_offset
        row = gray[y, :]
        # Find text in this row (dark pixels)
        dark_pixels = np.where(row < 100)[0]
        if len(dark_pixels) > 50:
            # This row has text
            # Find the rightmost text cluster (date/time is usually on the right)
            # Look for a cluster around x=200-500
            for x in range(200, min(500, img_width - 100)):
                if row[x] < 100:  # Dark pixel (text)
                    # Check if this is part of a text cluster
                    cluster_end = x
                    for check_x in range(x, min(x + 200, img_width)):
                        if row[check_x] < 120:
                            cluster_end = check_x
                        else:
                            break
                    
                    if cluster_end - x > 100:  # Significant text cluster
                        date_x = x
                        date_y = y
                        break
            if date_x:
                break
    
    # If we didn't find it, use fallback coordinates
    if date_x is None:
        date_x = 200
        date_y = 856
    
    print(f"Date/time location: ({date_x}, {date_y})")
    
    # Find total location - look at bottom area (y=1476)
    total_y_start = 1450
    total_y_end = 1520
    
    total_x = None
    total_y = None
    
    # Look for dollar amounts in the bottom area
    # Total is usually on the right side
    for y in range(total_y_start, total_y_end):
        row = gray[y, :]
        # Look for "$" pattern - dollar amounts are usually on the right
        # Scan from right to left
        for x in range(img_width - 50, 400, -1):
            if row[x] < 100:  # Dark pixel
                # Check if this might be a dollar amount
                # Look for pattern: dark pixels followed by numbers
                cluster_start = x
                for check_x in range(max(0, x - 100), x):
                    if row[check_x] < 120:
                        cluster_start = check_x
                    else:
                        break
                
                if x - cluster_start > 50:  # Significant cluster
                    total_x = cluster_start
                    total_y = y
                    break
        if total_x:
            break
    
    # Fallback
    if total_x is None:
        total_x = 500
        total_y = 1476
    
    print(f"Total location: ({total_x}, {total_y})")
    
    # Now do the replacements
    
    # 1. Replace date/time
    date_time_text = f"{new_date}, {new_time}"
    date_width = 250
    date_height = 30
    
    # Cover old text
    draw.rectangle(
        [date_x - 10, date_y - 10,
         date_x + date_width, date_y + date_height],
        fill=(255, 255, 255, 255)
    )
    
    # Draw new text
    draw.text((date_x, date_y), date_time_text, fill=(0, 0, 0, 255), font=font_medium)
    
    # Debug: Draw red box to show where we placed it
    if show_debug:
        draw.rectangle(
            [date_x - 10, date_y - 10,
             date_x + date_width, date_y + date_height],
            outline=(255, 0, 0, 255), width=2
        )
    
    # 2. Replace total
    total_width = 130
    total_height = 35
    
    # Cover old total
    draw.rectangle(
        [total_x - 15, total_y - 10,
         total_x + total_width, total_y + total_height],
        fill=(255, 255, 255, 255)
    )
    
    # Draw new total
    draw.text((total_x, total_y), new_total, fill=(0, 0, 0, 255), font=font_large)
    
    # Debug: Draw red box
    if show_debug:
        draw.rectangle(
            [total_x - 15, total_y - 10,
             total_x + total_width, total_y + total_height],
            outline=(255, 0, 0, 255), width=2
        )
    
    # Save
    if img_edit.mode == 'RGBA':
        background = Image.new('RGB', img_edit.size, (255, 255, 255))
        background.paste(img_edit, mask=img_edit.split()[3])
        img_edit = background
    
    img_edit.save(output_path, quality=95)
    print(f"\nSaved to: {output_path}")
    if show_debug:
        print("Red boxes show where text was placed.")
    
    return True

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not image_path:
        print("Usage: python edit_receipt_with_debug.py <image_path>")
        sys.exit(1)
    
    desktop = Path.home() / "Desktop"
    input_name = Path(image_path).stem
    output_path = str(desktop / f"{input_name}_edited.png")
    
    edit_with_debug(
        image_path,
        output_path,
        new_date="12/4/25",
        new_time="3:56 PM",
        new_total="$206.31",
        show_debug=True
    )

















