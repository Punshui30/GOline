"""File loading functionality for text and PDF files."""

from pathlib import Path

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


def load_text_from_file(path: str) -> str:
    """
    Load text from a file (supports .txt and .pdf).
    
    Args:
        path: Path to the file.
    
    Returns:
        Extracted text as a single string.
    
    Raises:
        FileNotFoundError: If the file doesn't exist.
        ValueError: If the file type is not supported.
        ImportError: If pdfplumber is not installed for PDF files.
    """
    file_path = Path(path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    
    suffix = file_path.suffix.lower()
    
    if suffix == '.txt':
        return _load_txt(file_path)
    elif suffix == '.pdf':
        return _load_pdf(file_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}. Only .txt and .pdf are supported.")


def _load_txt(file_path: Path) -> str:
    """Load text from a .txt file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # Try with different encoding
        with open(file_path, 'r', encoding='latin-1') as f:
            return f.read()


def _load_pdf(file_path: Path) -> str:
    """Load text from a .pdf file using pdfplumber."""
    if not PDFPLUMBER_AVAILABLE:
        raise ImportError(
            "pdfplumber is required for PDF files. "
            "Install it with: pip install pdfplumber"
        )
    
    text_parts = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as e:
        raise ValueError(f"Error reading PDF file {file_path}: {e}")
    
    return '\n\n'.join(text_parts)
















