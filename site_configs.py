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
            "product_card_selector": "a.isp_product_image_href",
            "side_filter_selectors": {
                "values": ".isp_facet_value_name",
                "sections": ".isp_single_facet_wrapper",
                "titles": ".isp_facet_title span.isp_facet_title_name",
                "support_custom_price_inputs": False,
            },
            "pagination_next_button_selector": ".page-item.next .page-link",
            "user_input": user_input,
            "user_filters": user_filters,
        },
        {
            "site_name": "Emag.bg",
            "base_url": "https://www.emag.bg",
            "search_url": f"https://www.emag.bg/search/{user_query}",
            "product_card_selector": "a.card-v2-title",
            "side_filter_selectors": {
                "values": "a.js-filter-item.filter-item",
                "sections": "div.filter.filter-default",
                "titles": "a.ph-widget span.filter-name",
                # if the site supports custom price ranges via inputs
                "support_custom_price_inputs": True,
                "custom_price_inputs_selector": "div.custom-price-slider-container div.input-group input"
            },
            "pagination_next_button_selector": "ul.pagination li a.js-change-page",
            "user_input": user_input,
            "user_filters": user_filters,
        },
    ]
