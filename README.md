#  Crawlitics

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Local LLM Integration (Ollama)](#local-llm-integration-ollama)
- [Roadmap](#roadmap)
- [License](#license)

## Introduction

**Crawlitics** is an AI-powered eCommerce intelligence platform, built with a modern Next.js and Python stack. It is designed to autonomously crawl, extract, and analyze product data from multiple online retailers, transforming chaotic web information into structured, actionable insights.

The platform leverages a powerful Python backend for asynchronous web automation using Playwright, enhanced NLP-powered matching via sentence-transformers, cosine similarity, and fuzzy matching, with modular scraping powered by Crawl4AI. 
It also features structured data extraction and multiple product analysis AI agents, implemented using the Agno framework and powered by the Qwen3 local LLM model (via Ollama). 

The fast, responsive Next.js frontend provides a sophisticated and intuitive UI for searching, data visualization and product comparison, featuring interactive charts, dynamic forms, and more. On the backend, a combination of Next.js API Routes and Server Actions serves as the powerful orchestration layer, used to handle data orchestration, ensuring seamless communication with the Python backend.

Crawlitics is purpose-built for collecting, analyzing, and comparing product data at scale, providing users with unparalleled market clarity.

---

## Features
- Full-stack Next.js 15 app with React frontend (using TailwindCSS and shadcn/ui components) and a robust backend layer for data fetching, API routes, and Server Actions.
- Robust data validation & typing via Zod, which is used as the single source of truth for all data structures, providing end-to-end type safety and runtime validation.
- Asynchronous crawling & Ssraping, which employs Crawl4AI and Playwright to efficiently crawl and process multiple eCommerce platforms concurrently.
- Automated and intelligent UI interaction via Playwright, including dynamic handling of user-defined filters (brand, model, RAM, storage, color, price range), sliders, pagination, and more.
- Seamless integration with Ollama’s Qwen3 model for extracting structured data and performing product analysis, using the Ollama API combined with the Agno framework.
- Secure and scalable foundation for storing product data using PostgreSQL
- Dynamic concurrency and auto-throttling
- Extensible architecture logic with site-specific configs and selectors
---

## Installation
1. Clone the repo
```bash
git clone https://github.com/Dimitar0528/Crawlitics.git
cd Crawlitics
```
2. Install Python dependencies:
```bash
cd python-backend
pip install -r requirements.txt
```
3. Create a .env file with the following data needed to set up your PostgreSQL database:
```bash
DB_HOST=YOUR_HOST
DB_PORT=YOUR_PORT
DB_NAME=YOUR_DB_NAME
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
```
4. Start the FastAPI server (on port 8000):
``` bash
uvicorn main:app --reload
```
5. Install Next.js dependencies:
```bash
cd..
cd nextjs-full-stack
npm install
```
6. Start the Next.js frontend (on port 3000):
```bash
npm run dev
```

##  Local LLM Integration (Ollama)
Crawlitics supports local large language model inference using Ollama. There are two main ways to install and use Ollama:
### Option 1: Native Install
- Download Ollama from https://ollama.com
- Install and / or run a LLM model (e.g. Qwen3, Gemma3 or others) with:
```bash
ollama run qwen3:4b
```
### Option 2: Docker
- Download Ollama Docker Image via:
```bash
docker pull ollama/ollama
```
- Start the Docker container (providing GPU acess) with:
```bash
docker run --rm --gpus=all -d -v ollama_data:/root/.ollama -p 11434:11434 --name ollama ollama/ollama 
```
- Install and / or run a LLM model with:
```bash
docker exec -it ollama ollama run qwen3:4b 
```

## Roadmap
- [✅] Semantic matching for multiple types of user filters (brand, RAM, storage, color, etc.)
- [✅] Dynamic JSON schema generation for structured product output
- [✅] LLM-powered AI agent for interactive product data analysis
- [🔜] Enable users to create accounts, save searches, and track their favorite products and alerts.
- [🔜] Show historical price charts to help users decide when to buy based on past trends.

## License

This project is licensed under the [MIT License](https://github.com/Dimitar0528/Crawlitics?tab=MIT-1-ov-file)

It also includes components from the Crawl4AI project, which are licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

> This product includes software developed by UncleCode (https://x.com/unclecode) as part of the Crawl4AI project (https://github.com/unclecode/crawl4ai).
