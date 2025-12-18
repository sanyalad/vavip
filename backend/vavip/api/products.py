"""
Products API
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from ..extensions import db
from ..models import Product, Category
from ..models.user import Favorite
from ..utils.errors import NotFoundError, ForbiddenError, ValidationError
from ..utils.response_utils import success_response, paginated_response
from ..utils.decorators import manager_required, validate_pagination
from ..utils.schema_validator import validate_request
from ..schemas.product_schemas import CreateProductSchema, UpdateProductSchema

bp = Blueprint('products', __name__)


@bp.route('/', methods=['GET'])
@validate_pagination(max_per_page=100)
def get_products(page, per_page):
    """Get all products with filtering and pagination."""
    # Filters
    category_slug = request.args.get('category')
    search = request.args.get('search')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    is_featured = request.args.get('featured', type=bool)
    
    # Sorting
    sort_by = request.args.get('sort', 'created_at')
    sort_order = request.args.get('order', 'desc')
    
    # Build query with eager loading for category
    query = Product.query.options(joinedload(Product.category)).filter_by(is_active=True)
    
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter_by(category_id=category.id)
    
    if search:
        query = query.filter(
            db.or_(
                Product.name.ilike(f'%{search}%'),
                Product.description.ilike(f'%{search}%'),
                Product.sku.ilike(f'%{search}%')
            )
        )
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if is_featured:
        query = query.filter_by(is_featured=True)
    
    # Apply sorting
    sort_column = getattr(Product, sort_by, Product.created_at)
    if sort_order == 'desc':
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return paginated_response([p.to_dict() for p in pagination.items], pagination, data_key='products')


@bp.route('/<slug>', methods=['GET'])
def get_product(slug):
    """Get product by slug."""
    product = Product.query.options(
        joinedload(Product.category),
        joinedload(Product.images),
        joinedload(Product.attributes)
    ).filter_by(slug=slug, is_active=True).first()
    
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    return success_response(product.to_dict(include_details=True))


@bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get product by ID."""
    product = Product.query.options(
        joinedload(Product.category),
        joinedload(Product.images),
        joinedload(Product.attributes)
    ).get(product_id)
    
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    return success_response(product.to_dict(include_details=True))


@bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured products."""
    from ..utils.cache import cache_result
    
    @cache_result(ttl=1800, prefix='featured_products')
    def _get_featured():
        products = Product.query.options(joinedload(Product.category))\
            .filter_by(is_active=True, is_featured=True)\
            .order_by(Product.sort_order).limit(10).all()
        return [p.to_dict() for p in products]
    
    products = _get_featured()
    return success_response(products)


@bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all active categories."""
    from ..utils.cache import cache_result
    
    @cache_result(ttl=3600, prefix='categories')
    def _get_categories():
        categories = Category.query.filter_by(is_active=True, parent_id=None)\
            .order_by(Category.sort_order).all()
        return [c.to_dict(include_children=True) for c in categories]
    
    categories = _get_categories()
    return success_response(categories)


@bp.route('/categories/<slug>', methods=['GET'])
def get_category(slug):
    """Get category by slug."""
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    if not category:
        raise NotFoundError('Category not found', 'CATEGORY_NOT_FOUND')
    return success_response(category.to_dict(include_children=True))


# Admin endpoints (protected)
@bp.route('/', methods=['POST'])
@manager_required
def create_product():
    """Create a new product (admin/manager only)."""
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(CreateProductSchema, data)
    
    # Check if slug already exists
    if Product.query.filter_by(slug=validated_data['slug']).first():
        raise ValidationError('Product with this slug already exists', 'SLUG_EXISTS')
    
    product = Product(**validated_data)
    
    db.session.add(product)
    db.session.commit()
    
    return success_response(product.to_dict(include_details=True), status_code=201)


@bp.route('/<int:product_id>', methods=['PUT'])
@manager_required
def update_product(product_id):
    """Update a product (admin/manager only)."""
    product = Product.query.get(product_id)
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(UpdateProductSchema, data)
    
    # Check slug uniqueness if changed
    if 'slug' in validated_data and validated_data['slug'] != product.slug:
        if Product.query.filter_by(slug=validated_data['slug']).first():
            raise ValidationError('Product with this slug already exists', 'SLUG_EXISTS')
    
    # Update fields
    for field, value in validated_data.items():
        if value is not None:
            setattr(product, field, value)
    
    db.session.commit()
    
    return success_response(product.to_dict(include_details=True))


@bp.route('/<int:product_id>', methods=['DELETE'])
@manager_required
def delete_product(product_id):
    """Delete a product (admin/manager only)."""
    product = Product.query.get(product_id)
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    db.session.delete(product)
    db.session.commit()
    
    return success_response(message='Product deleted successfully')


# Favorites
@bp.route('/<int:product_id>/favorite', methods=['POST'])
@jwt_required()
def add_favorite(product_id):
    """Add product to favorites."""
    user_id = get_jwt_identity()
    product = Product.query.get(product_id)
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    existing = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return success_response(message='Already in favorites')
    
    favorite = Favorite(user_id=user_id, product_id=product_id)
    db.session.add(favorite)
    db.session.commit()
    
    return success_response(message='Added to favorites', status_code=201)


@bp.route('/<int:product_id>/favorite', methods=['DELETE'])
@jwt_required()
def remove_favorite(product_id):
    """Remove product from favorites."""
    user_id = get_jwt_identity()
    
    favorite = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
    
    return success_response(message='Removed from favorites')


@bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """Get user's favorite products."""
    from sqlalchemy.orm import joinedload
    
    user_id = get_jwt_identity()
    
    # Optimize query with eager loading to avoid N+1
    favorites = Favorite.query.filter_by(user_id=user_id)\
        .options(joinedload(Favorite.product)).all()
    
    products = [f.product.to_dict() for f in favorites if f.product and f.product.is_active]
    
    return success_response(products)









