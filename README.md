#  Crawlitics

**Crawlitics** is an AI-powered, Python-based eCommerce web crawler, scraper, and data analyst.

It uses asynchronous parallel crawling and scraping techniques with Playwright and Crawl4AI respectively, fuzzy matching (via RapidFuzz), and customizable site configurations. Perfect for collecting, analyzing, and comparing product data across online retailers.

---

## Features

- Crawl multiple eCommerce websites (Ozone, Emag, Technomarket, etc.)
- Use Playwright for smart filtering and product matching and AI for structured data extraction and analysis
- Apply custom filters (only price ranges for now)
- Async scraping with dynamic concurrency tuning
- Export or analyze structured product data
- Built with Crawl4AI, Playwright, RapidFuzz, and Ollama

---

---

## Installation
1. Clone the repo
```bash
git clone https://github.com/Dimitar0528/crawlitics.git
cd crawlitics
```
2. Install dependencies with:

```bash
pip install -r requirements.txt
```
3. Run the main python file
```bash
python main.py
```

## Coming Soon
- More enhanced AI structured data extraction via dynamic JSON schemas []
- Support for multiple types of custom filters (e.g. categories, models, brands and others) []
- AI Data Analyst agent []
- CSV/JSON data export []

## License

This project is licensed under the [MIT License](https://github.com/Dimitar0528/Crawlitics?tab=MIT-1-ov-file)

It also includes components from the Crawl4AI project, which are licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

> This product includes software developed by UncleCode (https://x.com/unclecode) as part of the Crawl4AI project (https://github.com/unclecode/crawl4ai).

