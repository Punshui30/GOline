#!/usr/bin/env python3
"""
Create optimized OG image for Facebook preview
Crops and resizes hero-image to 1200x630 with face centered
"""

from PIL import Image
import os

def create_og_image():
    input_path = "public/images/media/hero-image.jpeg"
    output_path = "public/images/media/og-image.jpeg"
    
    # Target dimensions for Facebook OG image
    target_width = 1200
    target_height = 630
    target_ratio = target_width / target_height  # 1.91:1
    
    print(f"Loading image: {input_path}")
    img = Image.open(input_path)
    
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    original_width, original_height = img.size
    original_ratio = original_width / original_height
    
    print(f"Original size: {original_width}x{original_height} (ratio: {original_ratio:.2f})")
    print(f"Target size: {target_width}x{target_height} (ratio: {target_ratio:.2f})")
    
    # Strategy: Center crop to focus on the face, then resize
    # If image is taller than target ratio, crop top/bottom
    # If image is wider than target ratio, crop left/right
    
    if original_ratio > target_ratio:
        # Image is wider - crop left/right (keep center)
        new_width = int(original_height * target_ratio)
        new_height = original_height
        left = (original_width - new_width) // 2
        top = 0
        right = left + new_width
        bottom = original_height
        print(f"Cropping width: keeping center {new_width}x{new_height}")
    else:
        # Image is taller - crop from top to show lower portion (face should be lower in frame)
        new_width = original_width
        new_height = int(original_width / target_ratio)
        left = 0
        # Crop from top - take the bottom portion, skipping top 20% to push face down
        top_skip = int(original_height * 0.20)  # Skip top 20%
        top = top_skip
        right = original_width
        bottom = top + new_height
        # Make sure we don't go past the image
        if bottom > original_height:
            bottom = original_height
            top = original_height - new_height
        print(f"Cropping height: taking lower portion (skipping top {top_skip}px), keeping {new_width}x{new_height}")
    
    # Crop to center
    cropped = img.crop((left, top, right, bottom))
    print(f"Cropped size: {cropped.size[0]}x{cropped.size[1]}")
    
    # Resize to target dimensions using high-quality resampling
    og_image = cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # Save the optimized image
    og_image.save(output_path, "JPEG", quality=95, optimize=True)
    print(f"Created OG image: {output_path}")
    print(f"   Final size: {target_width}x{target_height}")
    
    # Get file size
    file_size = os.path.getsize(output_path) / 1024  # KB
    print(f"   File size: {file_size:.1f} KB")
    
    return True

if __name__ == "__main__":
    try:
        create_og_image()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

