from db.helpers import SessionLocal
from db.crud import get_all_categories_from_product_schemas

def get_user_selectable_categories():
    """
    Returns a list of category names that can be selected by a user.
    """
    with SessionLocal() as session:
        categories = get_all_categories_from_product_schemas(session)
        categories.append("Unknown")
        return categories

USER_SELECTABLE_CATEGORIES = get_user_selectable_categories()