from abc import ABC, abstractmethod
import time
import requests
from scraper.models import Listing
from scraper.config import USER_AGENT, REQUEST_DELAY, REQUEST_TIMEOUT


class BaseScraper(ABC):
    name: str = ""
    base_url: str = ""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self._last_request_time = 0

    def _rate_limited_get(self, url: str, **kwargs) -> requests.Response:
        elapsed = time.time() - self._last_request_time
        if elapsed < REQUEST_DELAY:
            time.sleep(REQUEST_DELAY - elapsed)
        self._last_request_time = time.time()
        kwargs.setdefault("timeout", REQUEST_TIMEOUT)
        response = self.session.get(url, **kwargs)
        response.raise_for_status()
        return response

    @abstractmethod
    def scrape(self) -> list[Listing]:
        pass
