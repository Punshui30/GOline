#!/usr/bin/env python3
"""
Convert an image to a searchable PDF with OCR text recognition.
This script uses Tesseract OCR to extract text and embed it in a PDF.
"""

import sys
import os
from pathlib import Path
from PIL import Image
import pytesseract
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io

def image_to_searchable_pdf(image_path, output_path=None):
    """
    Convert an image to a searchable PDF with OCR.
    
    Args:
        image_path: Path to the input image file
        output_path: Path for the output PDF (optional, defaults to image_path with .pdf extension)
    """
    # Validate input file
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        return False
    
    # Set output path
    if output_path is None:
        output_path = str(Path(image_path).with_suffix('.pdf'))
    
    try:
        # Open and process the image
        print(f"Loading image: {image_path}")
        img = Image.open(image_path)
        
        # Convert to RGB if necessary (for PDF compatibility)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get image dimensions
        img_width, img_height = img.size
        
        # Perform OCR to extract text with bounding boxes
        print("Performing OCR...")
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        
        # Also get full text for better text layer
        full_text = pytesseract.image_to_string(img)
        
        # Create PDF with embedded image and text layer
        print("Creating PDF with searchable text layer...")
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=(img_width, img_height))
        
        # Draw the image as background
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        c.drawImage(ImageReader(img_buffer), 0, 0, width=img_width, height=img_height)
        
        # Add invisible text layer for searchability
        # Process OCR data to add text at detected locations
        n_boxes = len(ocr_data['text'])
        text_objects = []
        
        for i in range(n_boxes):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            
            # Only process text with reasonable confidence and non-empty
            if text and conf > 0:
                x = ocr_data['left'][i]
                y = img_height - ocr_data['top'][i] - ocr_data['height'][i]  # Flip Y coordinate
                w = ocr_data['width'][i]
                h = ocr_data['height'][i]
                
                # Store text object for placement
                text_objects.append({
                    'text': text,
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h
                })
        
        # Add text objects to PDF (invisible but searchable)
        c.setFillColorRGB(1, 1, 1, alpha=0.01)  # Nearly transparent
        c.setStrokeColorRGB(1, 1, 1, alpha=0.01)
        
        for obj in text_objects:
            # Use appropriate font size based on detected height
            font_size = max(obj['height'] * 0.8, 6)  # Scale down slightly, minimum 6pt
            c.setFont("Helvetica", font_size)
            
            # Create text box for better text selection
            text_obj = c.beginText(obj['x'], obj['y'])
            text_obj.setFont("Helvetica", font_size)
            text_obj.setFillColorRGB(1, 1, 1, alpha=0.01)
            text_obj.textLine(obj['text'])
            c.drawText(text_obj)
        
        # Also add full text as a hidden layer for better searchability
        # This ensures all text is searchable even if positioning isn't perfect
        c.setFillColorRGB(1, 1, 1, alpha=0.01)
        c.setFont("Helvetica", 1)  # Very small font
        full_text_obj = c.beginText(0, 0)
        full_text_obj.setFont("Helvetica", 1)
        full_text_obj.setFillColorRGB(1, 1, 1, alpha=0.01)
        # Add text line by line
        for line in full_text.split('\n'):
            if line.strip():
                full_text_obj.textLine(line.strip())
        c.drawText(full_text_obj)
        
        c.save()
        
        # Write PDF to file
        pdf_buffer.seek(0)
        with open(output_path, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"Successfully created searchable PDF: {output_path}")
        print(f"PDF contains {len(text_objects)} text elements for searching/editing")
        return True
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 2:
        print("Usage: python image_to_pdf_ocr.py <image_path> [output_path]")
        print("\nExample:")
        print("  python image_to_pdf_ocr.py screenshot.png")
        print("  python image_to_pdf_ocr.py screenshot.png output.pdf")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Check if Tesseract is installed
    try:
        pytesseract.get_tesseract_version()
    except Exception:
        print("Error: Tesseract OCR is not installed or not in PATH.")
        print("Please install Tesseract OCR:")
        print("  Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
        print("  macOS: brew install tesseract")
        print("  Linux: sudo apt-get install tesseract-ocr")
        sys.exit(1)
    
    success = image_to_searchable_pdf(image_path, output_path)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

