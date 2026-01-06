#!/usr/bin/env python3
"""
Edit receipt image to update date and total amount.
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import pytesseract
from datetime import datetime

def find_text_location(img, search_text, ocr_data):
    """Find the location of text in the image using OCR data."""
    locations = []
    n_boxes = len(ocr_data['text'])
    
    for i in range(n_boxes):
        text = ocr_data['text'][i].strip()
        if search_text.lower() in text.lower():
            x = ocr_data['left'][i]
            y = ocr_data['top'][i]
            w = ocr_data['width'][i]
            h = ocr_data['height'][i]
            conf = int(ocr_data['conf'][i])
            if conf > 0:
                locations.append({
                    'text': text,
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'conf': conf
                })
    
    return locations

def edit_receipt_image(image_path, output_path, new_date="12/4/25", new_time="3:56 PM", new_total="$206.31"):
    """
    Edit receipt image to update date, time, and total.
    
    Args:
        image_path: Path to input image
        output_path: Path to save edited image
        new_date: New date string (e.g., "12/4/25")
        new_time: New time string (e.g., "3:56 PM")
        new_total: New total amount (e.g., "$206.31")
    """
    print(f"Loading image: {image_path}")
    img = Image.open(image_path)
    
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Create a copy for editing
    img_edit = img.copy()
    draw = ImageDraw.Draw(img_edit)
    
    # Get image dimensions
    img_width, img_height = img.size
    
    # Perform OCR to find text locations
    print("Performing OCR to locate text...")
    try:
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    except Exception as e:
        print(f"OCR error: {e}")
        print("Trying to proceed with manual text placement...")
        ocr_data = None
    
    # Try to load a font (use default if system font not available)
    try:
        # Try to use a system font that matches receipt style
        font_size = 20
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Find and replace date/time
    if ocr_data:
        # Look for date patterns
        date_locations = []
        time_locations = []
        total_locations = []
        
        # Search for various date/time patterns
        date_patterns = ["11/24/25", "11/24/2025", "11-24-25", "Nov 24", "11/24"]
        time_patterns = ["1:56 PM", "1:56PM", "13:56", "1:56"]
        total_patterns = ["$106.31", "$123.37", "Total", "TOTAL"]
        
        n_boxes = len(ocr_data['text'])
        for i in range(n_boxes):
            text = ocr_data['text'][i].strip()
            if not text:
                continue
                
            # Check for date
            for pattern in date_patterns:
                if pattern in text:
                    date_locations.append({
                        'x': ocr_data['left'][i],
                        'y': ocr_data['top'][i],
                        'width': ocr_data['width'][i],
                        'height': ocr_data['height'][i],
                        'text': text
                    })
                    break
            
            # Check for time
            for pattern in time_patterns:
                if pattern in text:
                    time_locations.append({
                        'x': ocr_data['left'][i],
                        'y': ocr_data['top'][i],
                        'width': ocr_data['width'][i],
                        'height': ocr_data['height'][i],
                        'text': text
                    })
                    break
            
            # Check for total
            if "$" in text and ("106.31" in text or "123.37" in text or "106" in text or "123" in text):
                total_locations.append({
                    'x': ocr_data['left'][i],
                    'y': ocr_data['top'][i],
                    'width': ocr_data['width'][i],
                    'height': ocr_data['height'][i],
                    'text': text
                })
        
        # Replace date
        if date_locations:
            # Use the first/best match
            loc = date_locations[0]
            print(f"Found date at ({loc['x']}, {loc['y']}): {loc['text']}")
            # Draw white rectangle to cover old text
            padding = 5
            draw.rectangle(
                [loc['x'] - padding, loc['y'] - padding, 
                 loc['x'] + loc['width'] + padding, loc['y'] + loc['height'] + padding],
                fill=(255, 255, 255)
            )
            # Draw new date
            draw.text((loc['x'], loc['y']), new_date, fill=(0, 0, 0), font=font)
        
        # Replace time
        if time_locations:
            loc = time_locations[0]
            print(f"Found time at ({loc['x']}, {loc['y']}): {loc['text']}")
            padding = 5
            draw.rectangle(
                [loc['x'] - padding, loc['y'] - padding,
                 loc['x'] + loc['width'] + padding, loc['y'] + loc['height'] + padding],
                fill=(255, 255, 255)
            )
            draw.text((loc['x'], loc['y']), new_time, fill=(0, 0, 0), font=font)
        
        # Replace total
        if total_locations:
            # Find the actual total amount (usually the largest value)
            total_loc = None
            for loc in total_locations:
                if "$" in loc['text'] and any(char.isdigit() for char in loc['text']):
                    if total_loc is None or len(loc['text']) > len(total_loc['text']):
                        total_loc = loc
            
            if total_loc:
                print(f"Found total at ({total_loc['x']}, {total_loc['y']}): {total_loc['text']}")
                padding = 5
                draw.rectangle(
                    [total_loc['x'] - padding, total_loc['y'] - padding,
                     total_loc['x'] + total_loc['width'] + padding, total_loc['y'] + total_loc['height'] + padding],
                    fill=(255, 255, 255)
                )
                draw.text((total_loc['x'], total_loc['y']), new_total, fill=(0, 0, 0), font=font)
    else:
        # Manual placement if OCR fails - based on typical receipt layout
        print("Using manual text placement...")
        # These are approximate positions - may need adjustment
        # Date/time typically in top area
        draw.text((50, 100), f"{new_date}, {new_time}", fill=(0, 0, 0), font=font)
        # Total typically at bottom
        draw.text((img_width - 200, img_height - 150), new_total, fill=(0, 0, 0), font=font)
    
    # Save the edited image
    print(f"Saving edited image to: {output_path}")
    img_edit.save(output_path, quality=95)
    print("Image editing complete!")
    return True

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python edit_receipt_image.py <image_path> [output_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Default output to desktop if not specified
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    else:
        desktop = Path.home() / "Desktop"
        input_name = Path(image_path).stem
        output_path = str(desktop / f"{input_name}_edited.png")
    
    # Check if Tesseract is available
    try:
        pytesseract.get_tesseract_version()
        ocr_available = True
    except:
        print("Warning: Tesseract OCR not found. Will use manual text placement.")
        ocr_available = False
    
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

















