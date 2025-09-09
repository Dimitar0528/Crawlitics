from enum import Enum

class TaskStatus(str, Enum):
    CRAWLING = "CRAWLING"
    SCRAPING = "SCRAPING"
    ANALYZING = "ANALYZING"
    COMPLETE = "COMPLETE"
    ERROR = "ERROR"

class SubStatus(str, Enum):
    INITIALIZING = "INITIALIZING"
    SUCCESS = "SUCCESS"
    
    STARTING_SITES = "STARTING_SITES"
    COLLECTING_URLS = "COLLECTING_URLS"
    FILTERING_URLS = "FILTERING_URLS"
    
    GENERATING_SCHEMA = "GENERATING_SCHEMA"
    EXTRACTING_DATA = "EXTRACTING_DATA"
    EXTRACTION_COMPLETE = "EXTRACTION_COMPLETE"

    GROUPING_PRODUCTS = "GROUPING_PRODUCTS"
    GROUPING_COMPLETE = "GROUPING_COMPLETE"
    SAVING_TO_DB = "SAVING_TO_DB"


STATUS_MESSAGES = {
    (TaskStatus.CRAWLING, SubStatus.INITIALIZING): "Инициализиране на търсенето...",
    (TaskStatus.CRAWLING, SubStatus.STARTING_SITES): "Стартиране на сканиране на {count} магазина...",
    (TaskStatus.CRAWLING, SubStatus.COLLECTING_URLS): "Приключи събирането на продуктови връзки.",
    (TaskStatus.CRAWLING, SubStatus.FILTERING_URLS): "Открити {count} релевантни продукта за анализ.",
    
    (TaskStatus.SCRAPING, SubStatus.INITIALIZING): "Започва извличане на детайлна информация...",
    (TaskStatus.SCRAPING, SubStatus.GENERATING_SCHEMA): "Няма съществуваща схема. Генериране на нова схема за данни...",
    (TaskStatus.SCRAPING, SubStatus.EXTRACTING_DATA): "Извличане на данни от {count} продукта...",
    (TaskStatus.SCRAPING, SubStatus.EXTRACTION_COMPLETE): "Извличането на данни приключи.",

    (TaskStatus.ANALYZING, SubStatus.GROUPING_PRODUCTS): "Започва групиране на намерените продукти по сходство...",
    (TaskStatus.ANALYZING, SubStatus.GROUPING_COMPLETE): "Открити {count} уникални продуктови групи.",
    (TaskStatus.ANALYZING, SubStatus.SAVING_TO_DB): "Записване и актуализиране на анализираните данни...",

    (TaskStatus.COMPLETE, SubStatus.SUCCESS): "Анализът приключи успешно!",
    (TaskStatus.ERROR, None): "Възникна грешка по време на анализа.",
}