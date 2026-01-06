#!/usr/bin/env python3
"""
Accurate receipt image editor using detected text block coordinates.
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def edit_receipt_accurate(image_path, output_path, new_date="12/4/25", new_time="3:56 PM", new_total="$206.31"):
    """
    Accurately edit receipt image using detected text block coordinates.
    """
    print(f"Loading image: {image_path}")
    img = Image.open(image_path).convert('RGBA')
    img_edit = img.copy()
    draw = ImageDraw.Draw(img_edit)
    
    img_width, img_height = img.size
    print(f"Image dimensions: {img_width}x{img_height}")
    
    # Load fonts - try to match receipt font size
    try:
        font_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
        font_medium = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
        font_large = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
    except:
        font_small = ImageFont.load_default()
        font_medium = font_small
        font_large = font_small
    
    # Based on analysis, text blocks found:
    # Block 13: y=856, x=42 to 687 - This is likely the Payment section with date/time
    # Block 14: y=884, x=129 to 602 - Also in payment area
    # Block 23: y=1476, x=14 to 653 - This is likely the Total at bottom
    
    # 1. Replace date/time in Payment section (Block 13 area)
    # The date/time "11/24/25, 1:56 PM" is likely in block 13 or 14
    # Based on typical layout, date comes after "PayPal • "
    
    payment_block_y = 856
    payment_block_x_start = 42
    payment_block_x_end = 687
    
    # Date/time typically starts around x=200-250 (after "PayPal • " text)
    # Let's cover a wider area to be sure we get it
    date_x = 200  # Approximate start of date text
    date_y = payment_block_y
    date_width = 280  # Wide enough to cover "11/24/25, 1:56 PM"
    date_height = 30
    
    print(f"Replacing date/time at: ({date_x}, {date_y})")
    
    # Draw white rectangle to cover old date/time
    # Make it slightly larger to ensure full coverage
    draw.rectangle(
        [date_x - 5, date_y - 5,
         date_x + date_width + 5, date_y + date_height + 5],
        fill=(255, 255, 255, 255)
    )
    
    # Draw new date and time
    date_time_text = f"{new_date}, {new_time}"
    draw.text((date_x, date_y), date_time_text, fill=(0, 0, 0, 255), font=font_medium)
    
    # 2. Replace total amount (Block 23 area - bottom)
    total_block_y = 1476
    total_block_x_start = 14
    total_block_x_end = 653
    
    # Total is typically on the right side of the block
    # The "$106.31" is likely at the right end
    total_x = total_block_x_end - 120  # Right side, leave room for text
    total_y = total_block_y + 5  # Slightly below block start
    total_width = 130
    total_height = 40
    
    print(f"Replacing total at: ({total_x}, {total_y})")
    
    # Cover old total - make rectangle larger
    draw.rectangle(
        [total_x - 15, total_y - 5,
         total_x + total_width + 5, total_y + total_height + 5],
        fill=(255, 255, 255, 255)
    )
    
    # Draw new total
    draw.text((total_x, total_y), new_total, fill=(0, 0, 0, 255), font=font_large)
    
    # 3. Also check Block 14 area (y=884) - might have another instance
    # This could be the adjusted total or another reference
    block14_y = 884
    block14_x_start = 129
    block14_x_end = 602
    
    # Check if there's a dollar amount in this area
    # Cover a potential total amount here too
    alt_total_x = block14_x_end - 100
    alt_total_y = block14_y
    
    draw.rectangle(
        [alt_total_x - 10, alt_total_y - 5,
         alt_total_x + total_width, alt_total_y + total_height],
        fill=(255, 255, 255, 255)
    )
    draw.text((alt_total_x, alt_total_y), new_total, fill=(0, 0, 0, 255), font=font_medium)
    
    # 4. Look for other instances in cost breakdown area
    # Blocks 9-12 are in the cost breakdown (y=608-752)
    # Check if any of these contain the old total
    
    # Block 11 (y=704) might have an adjusted total
    breakdown_y = 704
    breakdown_x = 500  # Right side where amounts typically are
    
    draw.rectangle(
        [breakdown_x - 10, breakdown_y - 5,
         breakdown_x + total_width, breakdown_y + total_height],
        fill=(255, 255, 255, 255)
    )
    draw.text((breakdown_x, breakdown_y), new_total, fill=(0, 0, 0, 255), font=font_medium)
    
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
        print("Usage: python edit_receipt_accurate.py <image_path> [output_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    else:
        desktop = Path.home() / "Desktop"
        input_name = Path(image_path).stem
        output_path = str(desktop / f"{input_name}_edited.png")
    
    success = edit_receipt_accurate(
        image_path,
        output_path,
        new_date="12/4/25",
        new_time="3:56 PM",
        new_total="$206.31"
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

















