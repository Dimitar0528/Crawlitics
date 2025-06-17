#  Crawlitics

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Local LLM Integration](#local-llm-integration)
- [Roadmap](#roadmap)
- [License](#license)
## Introduction

**Crawlitics** is an AI-powered, Python-based eCommerce web crawler, scraper, and data analyst.

It combines asynchronous web automation using Playwright, NLP-powered matching via sentence-transformers, cosine similarity and fuzzy matching, modular scraping powered by Crawl4AI and structured data extraction provided by the Gemma3 local LLM model (via Ollama). Crawlitics is purpose-built for collecting, analyzing, and comparing product data across online retailers.

---

## Features
- Asynchronous crawling and scraping across multiple eCommerce platforms (e.g. Ozone, Emag, Technomarket)
- Automated and intelligent UI interaction using Playwright (filters, price sliders, next pages, etc.)
- Support for custom user-defined filters (e.g. brand, model, RAM, storage, color, price range, etc.)
- Semantic and accurate filter matching via SentenceTransformers, cosine similarity and fuzzy matching
- Seamless integration with Ollama (and the Gemma3 model) for structured data extraction and analysis (in the future) and PostgreSQL for data storing
- Dynamic concurrency and auto-throttling
- Extensible scraping logic with site-specific configs and selectors
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
3. Create a .env file with the following data needed to set up your local PostgreSQL database:
```bash
DB_HOST=YOUR_HOST
DB_PORT=YOUR_PORT
DB_NAME=YOUR_DB_NAME
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
```
4. Run the main python file
```bash
python main.py
```

##  Local LLM Integration (Ollama)
Crawlitics supports local large language model inference using Ollama. There are two main ways to install and use Ollama:
### Option 1: Native Install
- Download Ollama from https://ollama.com
- Install and / or run a LLM model (e.g. gemma3, llama3.1, mistral or others) with:
```bash
ollama run gemma3:latest
```
### Option 2: Docker
- Download Ollama Docker Image via:
```bash
docker pull ollama/ollama
```
- Start the Docker container with:
```bash
docker run --rm --gpus=all -d -v ollama_data:/root/.ollama -p 11434:11434 --name ollama ollama/ollama 
```
- Install and / or run a LLM model with:
```bash
docker exec -it ollama ollama run gemma3 
```

## Roadmap
- [✅] Semantic matching for multiple types of user filters (brand, RAM, storage, color, etc.)
- [✅] Dynamic JSON schema generation for structured product output
- [🔜] LLM-powered AI agent for interactive product data analysis
- [🔜] Export to CSV/JSON with rich metadata

## License

This project is licensed under the [MIT License](https://github.com/Dimitar0528/Crawlitics?tab=MIT-1-ov-file)

It also includes components from the Crawl4AI project, which are licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

> This product includes software developed by UncleCode (https://x.com/unclecode) as part of the Crawl4AI project (https://github.com/unclecode/crawl4ai).
