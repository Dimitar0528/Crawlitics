from urllib.parse import quote_plus

def get_site_configs(user_input, user_filters):
    """
    Get a list of site-specific configuration dictionaries used for web scraping.

    Args:
        user_input (str): The user's search query (e.g., product name)
        user_filters (dict): Dictionary of custom user-defined filters 

    Returns:
        list[dict]: A list of dictionaries containing configuration details for each target website. 
        """

    user_query = quote_plus(user_input)
    
    return [
        {
            "site_name": "Ozone.bg",
            "base_url": "https://www.ozone.bg",
            "search_url": f"https://www.ozone.bg/instantsearchplus/result/?q={user_query}",
            "breadcrumb_selector": 'nav.breadcrumbs',
            "search_product_card_selector": "a.isp_product_image_href",
            "category_product_card_selector": "a.product-box",
            "side_filter_selectors": {
                "sections": "div.drop-down.multiselect",
                "titles": "a.open-item",
                "values": "span.link.clever-link-filter",
                # if the site supports custom price ranges via inputs
                "support_custom_price_inputs": True,
                "custom_price_inputs_selector": ".price-slider-inputs input"
            },
            "pagination_next_button_selector": ".bottom-toolbar .toolbar .pager .pages .next",
            "user_input": user_input,
            "user_filters": user_filters,
        },
        {
            "site_name": "Emag.bg",
            "base_url": "https://www.emag.bg",
            "search_url": f"https://www.emag.bg/search/{user_query}",
            "breadcrumb_selector": "ol.breadcrumb li:not(.btn-product-page-back-to-category)",
            "search_product_card_selector": "a.card-v2-title",
            "category_product_card_selector": "a.card-v2-title",
            "side_filter_selectors": {
                "values": "a.js-filter-item",
                "sections": "div.filter.filter-default",
                "titles": "a.ph-widget span.filter-name",
                "support_custom_price_inputs": True,
                "custom_price_inputs_selector": "div.custom-price-slider-container div.input-group input"
            },
            "pagination_next_button_selector": "ul.pagination li a.js-change-page",
            "user_input": user_input,
            "user_filters": user_filters,
        },
         {
            "site_name": "Technomarket.bg",
            "base_url": "https://www.technomarket.bg",
            "search_url": f"https://www.technomarket.bg/search?query={user_query}",
            "breadcrumb_selector": "section.section.breadcrumb",
            "search_product_card_selector": "a.title",
            "category_product_card_selector": "a.title",
            "side_filter_selectors": {
                "values": "a.tm-button",
                "sections": "div.facet",
                "titles": "button.tm-button span.button-text",
                "support_custom_price_inputs": True,
                "custom_price_inputs_selector": "div.price-range input"
            },
            "pagination_next_button_selector": "div.pages > a:has(div.page-arrowN)",
            "user_input": user_input,
            "user_filters": user_filters,
        },
    ]
