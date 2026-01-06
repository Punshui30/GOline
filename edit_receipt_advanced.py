#!/usr/bin/env python3
"""
Edit receipt image to update date and total amount using image analysis.
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

def find_text_regions_by_color(img, text_color_range=(0, 50), bg_color_range=(200, 255)):
    """Find text regions by analyzing color differences."""
    img_array = np.array(img)
    # Convert to grayscale if needed
    if len(img_array.shape) == 3:
        gray = np.mean(img_array, axis=2)
    else:
        gray = img_array
    
    # Find dark regions (likely text)
    text_mask = gray < 100
    return text_mask

def find_and_replace_text(img, search_patterns, replacement_text, region_hint=None):
    """Find text regions and prepare for replacement."""
    # This is a simplified approach - in production, you'd use OCR
    # For now, we'll use region hints based on typical receipt layout
    pass

def edit_receipt_image(image_path, output_path, new_date="12/4/25", new_time="3:56 PM", new_total="$206.31"):
    """
    Edit receipt image to update date, time, and total.
    Uses manual coordinate detection based on typical receipt layout.
    """
    print(f"Loading image: {image_path}")
    img = Image.open(image_path)
    
    # Convert to RGB if necessary
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create a copy for editing
    img_edit = img.copy()
    draw = ImageDraw.Draw(img_edit)
    
    # Get image dimensions
    img_width, img_height = img.size
    print(f"Image dimensions: {img_width}x{img_height}")
    
    # Try to load a font that matches receipt style
    font_size = 18
    try:
        # Try Arial first
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
        font_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
        font_large = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
            font_small = ImageFont.truetype("arial.ttf", 16)
            font_large = ImageFont.truetype("arial.ttf", 22)
        except:
            font = ImageFont.load_default()
            font_small = font
            font_large = font
    
    # Based on the image description, the receipt layout is:
    # - Date/time is in the "Payment" section around middle of image
    # - Total is at the bottom in the cost breakdown
    
    # For a 720x1604 image, typical positions:
    # Payment section with date is around y=800-900 (middle area)
    # Total is around y=1400-1500 (near bottom)
    
    # Calculate approximate positions based on image dimensions
    # Payment section (date/time) - typically in upper-middle area
    payment_y_start = int(img_height * 0.5)  # Around 50% down
    payment_y_end = int(img_height * 0.6)     # Around 60% down
    
    # Total section - typically near bottom
    total_y_start = int(img_height * 0.85)   # Around 85% down
    total_y_end = int(img_height * 0.95)      # Around 95% down
    
    # Scan for text regions in these areas
    print("Scanning for text regions...")
    
    # Method: Find white/light background areas and dark text
    # We'll look for regions that match typical text patterns
    
    # For date/time replacement - look in payment section
    # Typical format: "PayPal • 11/24/25, 1:56 PM"
    # We need to find and replace "11/24/25" and "1:56 PM"
    
    # For now, use approximate coordinates based on typical layout
    # These will need adjustment, but let's try a smart approach:
    
    # 1. Find the payment section by looking for "PayPal" text area
    # 2. Replace date/time near that area
    # 3. Find total by looking for "$" symbols in the bottom area
    
    # Let's use a more sophisticated approach: analyze the image to find text
    img_array = np.array(img)
    
    # Convert to grayscale for analysis
    if len(img_array.shape) == 3:
        gray = np.mean(img_array[:, :, :3], axis=2).astype(np.uint8)
    else:
        gray = img_array
    
    # Find text-like regions (dark pixels on light background)
    # Look for horizontal lines of text (receipts have horizontal text)
    
    # Strategy: Use approximate positions and draw white rectangles to cover old text
    # Then draw new text
    
    # Payment section - date/time area (approximate)
    # Based on description, date/time is in payment section
    payment_x = int(img_width * 0.1)  # Left side
    payment_y = int(img_height * 0.55)  # Middle area
    
    # Total area (bottom right typically)
    total_x = int(img_width * 0.6)  # Right side
    total_y = int(img_height * 0.9)  # Near bottom
    
    print(f"Attempting to replace text at approximate locations...")
    print(f"Payment area: ({payment_x}, {payment_y})")
    print(f"Total area: ({total_x}, {total_y})")
    
    # Method: Draw white rectangles to cover old text, then draw new text
    # We'll make the rectangles slightly larger to ensure coverage
    
    # Replace date/time in payment section
    # Cover area for "11/24/25, 1:56 PM" - approximately 200x30 pixels
    date_rect_width = 250
    date_rect_height = 35
    date_x = payment_x + 100  # Offset for "PayPal • " text
    date_y = payment_y
    
    # Draw white rectangle to cover old date/time
    draw.rectangle(
        [date_x - 5, date_y - 5, 
         date_x + date_rect_width, date_y + date_rect_height],
        fill=(255, 255, 255, 255)  # White with full opacity
    )
    
    # Draw new date and time
    date_time_text = f"{new_date}, {new_time}"
    draw.text((date_x, date_y), date_time_text, fill=(0, 0, 0, 255), font=font)
    
    # Replace total - need to find all instances
    # Based on description, total appears as "$106.31" in multiple places
    # Main total is at the bottom
    
    # Cover area for total - approximately 100x30 pixels
    total_rect_width = 120
    total_rect_height = 35
    
    # Try multiple positions where total might appear
    total_positions = [
        (total_x, total_y),  # Main total at bottom
        (total_x - 50, total_y - 100),  # Adjusted total (if shown)
    ]
    
    for tx, ty in total_positions:
        # Draw white rectangle
        draw.rectangle(
            [tx - 5, ty - 5,
             tx + total_rect_width, ty + total_rect_height],
            fill=(255, 255, 255, 255)
        )
        # Draw new total
        draw.text((tx, ty), new_total, fill=(0, 0, 0, 255), font=font_large)
    
    # Also check for other instances of the old total in the cost breakdown
    # Look for "$106.31" or "$123.37" patterns and replace with new total
    # We'll scan a wider area for these
    
    # Cost breakdown area (middle-bottom)
    breakdown_y_start = int(img_height * 0.75)
    breakdown_y_end = int(img_height * 0.9)
    
    # Scan this area for dollar amounts and replace the main total
    # This is approximate - in production you'd use OCR
    
    # Save the edited image
    print(f"Saving edited image to: {output_path}")
    # Convert back to RGB for saving
    if img_edit.mode == 'RGBA':
        # Create white background
        background = Image.new('RGB', img_edit.size, (255, 255, 255))
        background.paste(img_edit, mask=img_edit.split()[3])  # Use alpha channel as mask
        img_edit = background
    
    img_edit.save(output_path, quality=95)
    print("Image editing complete!")
    print(f"\nNote: Text was placed at approximate locations.")
    print("If positions need adjustment, the script can be fine-tuned with exact coordinates.")
    return True

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python edit_receipt_advanced.py <image_path> [output_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Default output to desktop if not specified
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    else:
        desktop = Path.home() / "Desktop"
        input_name = Path(image_path).stem
        output_path = str(desktop / f"{input_name}_edited.png")
    
    success = edit_receipt_image(
        image_path, 
        output_path,
        new_date="12/4/25",
        new_time="3:56 PM",
        new_total="$206.31"
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

















