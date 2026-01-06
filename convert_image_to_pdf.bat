@echo off
REM Batch script to convert image to searchable PDF
REM Usage: convert_image_to_pdf.bat <image_path> [output_path]

if "%~1"=="" (
    echo Usage: convert_image_to_pdf.bat ^<image_path^> [output_path]
    echo.
    echo Example:
    echo   convert_image_to_pdf.bat screenshot.png
    echo   convert_image_to_pdf.bat screenshot.png output.pdf
    exit /b 1
)

python image_to_pdf_ocr.py %*

















