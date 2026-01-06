# Image to Searchable PDF Converter

This tool converts images to searchable PDFs using OCR (Optical Character Recognition).

## Prerequisites

### 1. Install Tesseract OCR

**Windows:**
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (e.g., `tesseract-ocr-w64-setup-5.x.x.exe`)
3. During installation, make sure to check "Add to PATH" option
4. Or manually add Tesseract to your PATH (usually installed to `C:\Program Files\Tesseract-OCR`)

**Alternative (using Chocolatey):**
```powershell
choco install tesseract
```

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

### 2. Python Packages

The required Python packages are already installed:
- Pillow
- pytesseract
- reportlab

## Usage

### Basic Usage

```bash
python image_to_pdf_ocr.py <image_path> [output_path]
```

**Examples:**
```bash
# Convert image.png to image.pdf (in same directory)
python image_to_pdf_ocr.py image.png

# Convert with custom output name
python image_to_pdf_ocr.py screenshot.jpg output.pdf
```

### What it does

1. Loads your image file
2. Performs OCR to detect all text in the image
3. Creates a PDF with:
   - The original image as the visual layer
   - Invisible but searchable/selectable text layer on top
4. The resulting PDF allows you to:
   - Search for text
   - Select and copy text
   - Edit text in PDF editors

## Troubleshooting

**Error: "tesseract is not installed or it's not in your PATH"**
- Make sure Tesseract OCR is installed (see Prerequisites)
- Restart your terminal/command prompt after installation
- Verify installation: `tesseract --version`

**Error: "Image file not found"**
- Check that the image path is correct
- Use absolute path if relative path doesn't work
- Make sure the image file exists

## Notes

- The text layer is nearly transparent (alpha=0.01) so it's invisible but still searchable
- OCR accuracy depends on image quality - clearer images produce better results
- Processing time depends on image size and complexity

















