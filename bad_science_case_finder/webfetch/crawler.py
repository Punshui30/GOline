"""Web crawler for fetching case documents from public URLs."""

import sys
import time
from dataclasses import dataclass
from typing import List, Optional, Set
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


@dataclass
class FetchedDocument:
    """Represents a document fetched from the web."""
    url: str
    content_type: str  # "html" or "pdf" or "unknown"
    text: str


class SimpleCrawler:
    """Simple web crawler that respects robots.txt and fetches documents."""
    
    def __init__(
        self,
        user_agent: str = "BadScienceCaseFinder/1.0",
        max_pages: int = 100,
        delay_seconds: float = 0.5,
    ):
        """
        Initialize the crawler.
        
        Args:
            user_agent: User agent string for HTTP requests.
            max_pages: Maximum number of pages to fetch.
            delay_seconds: Delay between requests in seconds.
        """
        self.user_agent = user_agent
        self.max_pages = max_pages
        self.delay_seconds = delay_seconds
        self.visited: Set[str] = set()
        self.robot_parsers: dict[str, RobotFileParser] = {}
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': user_agent})
    
    def _get_robot_parser(self, url: str) -> Optional[RobotFileParser]:
        """
        Get or create a RobotFileParser for the host of the given URL.
        
        Args:
            url: URL to get robots.txt for.
        
        Returns:
            RobotFileParser instance or None if robots.txt cannot be fetched.
        """
        parsed = urlparse(url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        
        if host not in self.robot_parsers:
            robots_url = urljoin(host, '/robots.txt')
            rp = RobotFileParser()
            rp.set_url(robots_url)
            try:
                rp.read()
            except Exception:
                # If robots.txt cannot be fetched, RobotFileParser
                # will allow all by default (can_fetch returns True)
                pass
            self.robot_parsers[host] = rp
        
        return self.robot_parsers[host]
    
    def can_fetch(self, url: str) -> bool:
        """
        Check robots.txt for the host and return whether we are allowed to fetch this URL.
        
        Args:
            url: URL to check.
        
        Returns:
            True if allowed by robots.txt, False otherwise.
        """
        rp = self._get_robot_parser(url)
        if rp is None:
            return True
        
        # Check if robots.txt allows this path
        try:
            allowed = rp.can_fetch(self.user_agent, url)
            if not allowed:
                print(f"Warning: robots.txt disallows fetching: {url}", file=sys.stderr)
            return allowed
        except Exception:
            # If there's an error, default to allowing
            return True
    
    def fetch_url(self, url: str) -> Optional[FetchedDocument]:
        """
        Fetch a single URL.
        
        If it's HTML, return content_type='html' and raw HTML text.
        If it is a PDF (content-type application/pdf or .pdf extension), use pdfplumber
        to extract text and return content_type='pdf'.
        Return None on HTTP errors or if not allowed by robots.txt.
        
        Args:
            url: URL to fetch.
        
        Returns:
            FetchedDocument if successful, None otherwise.
        """
        # Check robots.txt
        if not self.can_fetch(url):
            return None
        
        # Check if already visited
        if url in self.visited:
            return None
        
        try:
            response = self.session.get(url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Check content length (skip very large files, e.g., > 50MB)
            content_length = response.headers.get('Content-Length')
            if content_length and int(content_length) > 50 * 1024 * 1024:
                print(f"Warning: Skipping large file: {url} ({content_length} bytes)", file=sys.stderr)
                return None
            
            # Determine content type
            content_type = response.headers.get('Content-Type', '').lower()
            url_lower = url.lower()
            
            # Check if PDF
            is_pdf = (
                'application/pdf' in content_type or
                url_lower.endswith('.pdf')
            )
            
            if is_pdf:
                if not PDFPLUMBER_AVAILABLE:
                    print(f"Warning: pdfplumber not available, cannot extract text from PDF: {url}", file=sys.stderr)
                    return None
                
                # Download PDF and extract text
                try:
                    # Read content into memory
                    content = response.content
                    import io
                    pdf_file = io.BytesIO(content)
                    
                    text_parts = []
                    with pdfplumber.open(pdf_file) as pdf:
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text_parts.append(page_text)
                    
                    text = '\n\n'.join(text_parts)
                    return FetchedDocument(url=url, content_type='pdf', text=text)
                except Exception as e:
                    print(f"Warning: Error extracting text from PDF {url}: {e}", file=sys.stderr)
                    return None
            
            # Otherwise, treat as HTML/text
            text = response.text
            return FetchedDocument(url=url, content_type='html', text=text)
        
        except requests.exceptions.RequestException as e:
            print(f"Warning: Error fetching {url}: {e}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Warning: Unexpected error fetching {url}: {e}", file=sys.stderr)
            return None
    
    def _extract_links(self, html: str, base_url: str, url_pattern: Optional[str] = None) -> List[str]:
        """
        Extract links from HTML content.
        
        Args:
            html: HTML content.
            base_url: Base URL for resolving relative links.
            url_pattern: Optional substring to filter URLs.
        
        Returns:
            List of absolute URLs.
        """
        try:
            soup = BeautifulSoup(html, 'lxml')
            links = []
            
            for anchor in soup.find_all('a', href=True):
                href = anchor['href']
                absolute_url = urljoin(base_url, href)
                
                # Parse and normalize URL
                parsed = urlparse(absolute_url)
                if parsed.scheme not in ('http', 'https'):
                    continue
                
                # Remove fragment
                normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                if parsed.query:
                    normalized += f"?{parsed.query}"
                
                # Apply pattern filter if provided
                if url_pattern and url_pattern.lower() not in normalized.lower():
                    continue
                
                links.append(normalized)
            
            # Remove duplicates while preserving order
            seen = set()
            unique_links = []
            for link in links:
                if link not in seen:
                    seen.add(link)
                    unique_links.append(link)
            
            return unique_links
        
        except Exception as e:
            print(f"Warning: Error extracting links from {base_url}: {e}", file=sys.stderr)
            return []
    
    def crawl_from_start(
        self,
        start_url: str,
        url_pattern_substring: Optional[str] = None,
    ) -> List[FetchedDocument]:
        """
        Crawl starting from start_url, following links on that page and subsequent pages,
        up to max_pages, respecting robots.txt and delay_seconds between requests.
        
        If url_pattern_substring is provided, only follow/collect URLs that contain that substring
        (e.g. 'opinion', 'pdf', 'cases', etc.).
        
        For HTML pages, return FetchedDocument with the HTML text (we will still run the rule engine on it).
        For PDFs, download and extract text.
        
        Args:
            start_url: Starting URL for crawling.
            url_pattern_substring: Optional substring to filter URLs.
        
        Returns:
            List of FetchedDocument objects.
        """
        documents = []
        queue = [start_url]
        self.visited.clear()
        
        while queue and len(documents) < self.max_pages:
            current_url = queue.pop(0)
            
            if current_url in self.visited:
                continue
            
            self.visited.add(current_url)
            
            # Fetch the URL
            doc = self.fetch_url(current_url)
            if doc is None:
                continue
            
            documents.append(doc)
            print(f"Fetched ({len(documents)}/{self.max_pages}): {current_url}", file=sys.stderr)
            
            # If it's HTML, extract links and add to queue
            if doc.content_type == 'html':
                links = self._extract_links(doc.text, current_url, url_pattern_substring)
                for link in links:
                    if link not in self.visited and link not in queue:
                        queue.append(link)
            
            # Respect delay
            if len(documents) < self.max_pages and queue:
                time.sleep(self.delay_seconds)
        
        return documents


def fetch_from_url_list(urls: List[str]) -> List[FetchedDocument]:
    """
    Fetch a list of URLs without crawling (no following links).
    
    For each URL, use the same logic as fetch_url.
    
    Args:
        urls: List of URLs to fetch.
    
    Returns:
        List of FetchedDocument objects.
    """
    crawler = SimpleCrawler(max_pages=len(urls), delay_seconds=0.5)
    documents = []
    
    for url in urls:
        url = url.strip()
        if not url or url.startswith('#'):
            continue
        
        doc = crawler.fetch_url(url)
        if doc:
            documents.append(doc)
            print(f"Fetched ({len(documents)}/{len(urls)}): {url}", file=sys.stderr)
        
        time.sleep(crawler.delay_seconds)
    
    return documents

