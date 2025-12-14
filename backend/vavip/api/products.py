"""
Products API
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Product, Category
from ..models.user import Favorite

bp = Blueprint('products', __name__)


@bp.route('/', methods=['GET'])
def get_products():
    """Get all products with filtering and pagination."""
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Filters
    category_slug = request.args.get('category')
    search = request.args.get('search')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    is_featured = request.args.get('featured', type=bool)
    
    # Sorting
    sort_by = request.args.get('sort', 'created_at')
    sort_order = request.args.get('order', 'desc')
    
    # Build query
    query = Product.query.filter_by(is_active=True)
    
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
    
    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    })


@bp.route('/<slug>', methods=['GET'])
def get_product(slug):
    """Get product by slug."""
    product = Product.query.filter_by(slug=slug, is_active=True).first_or_404()
    return jsonify(product.to_dict(include_details=True))


@bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get product by ID."""
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict(include_details=True))


@bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured products."""
    products = Product.query.filter_by(is_active=True, is_featured=True)\
        .order_by(Product.sort_order).limit(10).all()
    return jsonify([p.to_dict() for p in products])


@bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all active categories."""
    categories = Category.query.filter_by(is_active=True, parent_id=None)\
        .order_by(Category.sort_order).all()
    return jsonify([c.to_dict(include_children=True) for c in categories])


@bp.route('/categories/<slug>', methods=['GET'])
def get_category(slug):
    """Get category by slug."""
    category = Category.query.filter_by(slug=slug, is_active=True).first_or_404()
    return jsonify(category.to_dict(include_children=True))


# Admin endpoints (protected)
@bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product (admin only)."""
    from ..models import User
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    required = ['name', 'slug', 'price']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    if Product.query.filter_by(slug=data['slug']).first():
        return jsonify({'error': 'Product with this slug already exists'}), 409
    
    product = Product(
        name=data['name'],
        slug=data['slug'],
        sku=data.get('sku'),
        description=data.get('description'),
        short_description=data.get('short_description'),
        price=data['price'],
        old_price=data.get('old_price'),
        currency=data.get('currency', 'RUB'),
        category_id=data.get('category_id'),
        stock_quantity=data.get('stock_quantity', 0),
        is_active=data.get('is_active', True),
        is_featured=data.get('is_featured', False)
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict(include_details=True)), 201


@bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update a product (admin only)."""
    from ..models import User
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    for field in ['name', 'slug', 'sku', 'description', 'short_description', 
                  'price', 'old_price', 'currency', 'category_id', 
                  'stock_quantity', 'is_active', 'is_featured']:
        if field in data:
            setattr(product, field, data[field])
    
    db.session.commit()
    
    return jsonify(product.to_dict(include_details=True))


@bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete a product (admin only)."""
    from ..models import User
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'})


# Favorites
@bp.route('/<int:product_id>/favorite', methods=['POST'])
@jwt_required()
def add_favorite(product_id):
    """Add product to favorites."""
    user_id = get_jwt_identity()
    product = Product.query.get_or_404(product_id)
    
    existing = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({'message': 'Already in favorites'}), 200
    
    favorite = Favorite(user_id=user_id, product_id=product_id)
    db.session.add(favorite)
    db.session.commit()
    
    return jsonify({'message': 'Added to favorites'}), 201


@bp.route('/<int:product_id>/favorite', methods=['DELETE'])
@jwt_required()
def remove_favorite(product_id):
    """Remove product from favorites."""
    user_id = get_jwt_identity()
    
    favorite = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
    
    return jsonify({'message': 'Removed from favorites'})


@bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """Get user's favorite products."""
    user_id = get_jwt_identity()
    
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    products = [Product.query.get(f.product_id).to_dict() for f in favorites if Product.query.get(f.product_id)]
    
    return jsonify(products)






