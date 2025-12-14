"""
Helper utilities
"""
import re
import unicodedata


def generate_slug(text, max_length=200):
    """Generate URL-friendly slug from text."""
    if not text:
        return ''
    
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Convert to lowercase and replace spaces with hyphens
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    
    return text[:max_length].strip('-')


def paginate_query(query, page=1, per_page=20, error_out=False):
    """Paginate a query and return formatted response."""
    pagination = query.paginate(page=page, per_page=per_page, error_out=error_out)
    
    return {
        'items': pagination.items,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }


def format_price(amount, currency='RUB'):
    """Format price with currency."""
    if currency == 'RUB':
        return f"{amount:,.2f} ₽"
    elif currency == 'USD':
        return f"${amount:,.2f}"
    elif currency == 'EUR':
        return f"€{amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"


def truncate_text(text, max_length=100, suffix='...'):
    """Truncate text to max length."""
    if not text or len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix






