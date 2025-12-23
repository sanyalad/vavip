"""
Products API
Thin controller layer - delegates to ProductService for business logic
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..utils.errors import NotFoundError, ValidationError
from ..utils.response_utils import success_response, paginated_response
from ..utils.decorators import manager_required, validate_pagination
from ..utils.schema_validator import validate_request
from ..schemas.product_schemas import CreateProductSchema, UpdateProductSchema
from ..services.product_service import ProductService, CategoryService, FavoriteService

bp = Blueprint('products', __name__)


@bp.route('/', methods=['GET'])
@validate_pagination(max_per_page=100)
def get_products(page, per_page):
    """Get all products with filtering and pagination."""
    # Extract filters from request
    products, pagination = ProductService.get_products(
        page=page,
        per_page=per_page,
        category_slug=request.args.get('category'),
        search=request.args.get('search'),
        min_price=request.args.get('min_price', type=float),
        max_price=request.args.get('max_price', type=float),
        is_featured=request.args.get('featured', type=bool),
        sort_by=request.args.get('sort', 'created_at'),
        sort_order=request.args.get('order', 'desc'),
    )
    
    return paginated_response([p.to_dict() for p in products], pagination, data_key='products')


@bp.route('/<slug>', methods=['GET'])
def get_product(slug):
    """Get product by slug."""
    product = ProductService.get_product_by_slug(slug)
    
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    return success_response(product.to_dict(include_details=True))


@bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get product by ID."""
    product = ProductService.get_product_by_id(product_id)
    
    if not product:
        raise NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    
    return success_response(product.to_dict(include_details=True))


@bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured products."""
    products = ProductService.get_featured_products(limit=10)
    return success_response(products)


@bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all active categories."""
    categories = CategoryService.get_all_categories()
    return success_response(categories)


@bp.route('/categories/<slug>', methods=['GET'])
def get_category(slug):
    """Get category by slug."""
    category = CategoryService.get_category_by_slug(slug)
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
    
    try:
        product = ProductService.create_product(validated_data)
        return success_response(product.to_dict(include_details=True), status_code=201)
    except ValueError as e:
        raise ValidationError(str(e), 'SLUG_EXISTS')


@bp.route('/<int:product_id>', methods=['PUT'])
@manager_required
def update_product(product_id):
    """Update a product (admin/manager only)."""
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(UpdateProductSchema, data)
    
    try:
        product = ProductService.update_product(product_id, validated_data)
        return success_response(product.to_dict(include_details=True))
    except ValueError as e:
        error_msg = str(e)
        if 'not found' in error_msg.lower():
            raise NotFoundError(error_msg, 'PRODUCT_NOT_FOUND')
        raise ValidationError(error_msg, 'SLUG_EXISTS')


@bp.route('/<int:product_id>', methods=['DELETE'])
@manager_required
def delete_product(product_id):
    """Delete a product (admin/manager only)."""
    try:
        ProductService.delete_product(product_id)
        return success_response(message='Product deleted successfully')
    except ValueError as e:
        raise NotFoundError(str(e), 'PRODUCT_NOT_FOUND')


# Favorites
@bp.route('/<int:product_id>/favorite', methods=['POST'])
@jwt_required()
def add_favorite(product_id):
    """Add product to favorites."""
    user_id = get_jwt_identity()
    
    try:
        added = FavoriteService.add_favorite(user_id, product_id)
        if added:
            return success_response(message='Added to favorites', status_code=201)
        return success_response(message='Already in favorites')
    except ValueError as e:
        raise NotFoundError(str(e), 'PRODUCT_NOT_FOUND')


@bp.route('/<int:product_id>/favorite', methods=['DELETE'])
@jwt_required()
def remove_favorite(product_id):
    """Remove product from favorites."""
    user_id = get_jwt_identity()
    FavoriteService.remove_favorite(user_id, product_id)
    return success_response(message='Removed from favorites')


@bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """Get user's favorite products."""
    user_id = get_jwt_identity()
    products = FavoriteService.get_user_favorites(user_id)
    return success_response(products)









