from urllib.parse import quote_plus

def get_site_configs(user_input, user_filters):
    user_query = quote_plus(user_input)
    
    return [
        {
            "site_name": "Ozone.bg",
            "base_url": "https://www.ozone.bg",
            "search_url": f"https://www.ozone.bg/instantsearchplus/result/?q={user_query}",
            "product_card_selector": "a.isp_product_image_href",
            "site_side_filter_selectors": {
                "values": ".isp_facet_value_name",
                "sections": ".isp_single_facet_wrapper",
                "titles": ".isp_facet_title span.isp_facet_title_name"
            },
            "pagination_next_button_selector": ".page-item.next .page-link",
            "user_input": user_input,
            "user_filters": user_filters,
        },
    ]
