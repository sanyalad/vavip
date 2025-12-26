"""
Product Service - Business logic for products and categories
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import joinedload
from ..extensions import db
from ..models import Product, Category
from ..models.user import Favorite


class ProductService:
    """Product business logic layer."""
    
    @staticmethod
    def get_products(
        page: int = 1,
        per_page: int = 12,
        category_slug: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort_by: str = 'created_at',
        sort_order: str = 'desc',
        active_only: bool = True
    ) -> tuple:
        """
        Get paginated products with filters.
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page
            category_slug: Filter by category slug
            search: Search term for name/description/sku
            min_price: Minimum price filter
            max_price: Maximum price filter
            is_featured: Filter featured products only
            sort_by: Column to sort by
            sort_order: 'asc' or 'desc'
            active_only: Only return active products
            
        Returns:
            Tuple of (products list, pagination info)
        """
        # Build query with eager loading
        query = Product.query.options(joinedload(Product.category))
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        # Category filter
        if category_slug:
            category = Category.query.filter_by(slug=category_slug).first()
            if category:
                query = query.filter_by(category_id=category.id)
        
        # Search filter
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.sku.ilike(search_term)
                )
            )
        
        # Price filters
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        # Featured filter
        if is_featured:
            query = query.filter_by(is_featured=True)
        
        # Sorting
        sort_column = getattr(Product, sort_by, Product.created_at)
        if sort_order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return pagination.items, pagination
    
    @staticmethod
    def get_product_by_slug(slug: str, active_only: bool = True) -> Optional[Product]:
        """
        Get product by slug with full details.
        
        Args:
            slug: Product slug
            active_only: Only return if product is active
            
        Returns:
            Product instance or None
        """
        query = Product.query.options(
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.attributes)
        )
        
        if active_only:
            query = query.filter_by(slug=slug, is_active=True)
        else:
            query = query.filter_by(slug=slug)
        
        return query.first()
    
    @staticmethod
    def get_product_by_id(product_id: int, active_only: bool = False) -> Optional[Product]:
        """
        Get product by ID with full details.
        
        Args:
            product_id: Product ID
            active_only: Only return if product is active
            
        Returns:
            Product instance or None
        """
        query = Product.query.options(
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.attributes)
        )
        
        if active_only:
            query = query.filter_by(id=product_id, is_active=True)
        else:
            query = query.filter_by(id=product_id)
        
        return query.first()
    
    @staticmethod
    def get_featured_products(limit: int = 10) -> List[Product]:
        """
        Get featured products.
        
        Args:
            limit: Maximum number of products to return
            
        Returns:
            List of featured products
        """
        from ..utils.cache import cache_result
        
        @cache_result(ttl=1800, prefix='featured_products')
        def _get_featured():
            products = Product.query.options(joinedload(Product.category))\
                .filter_by(is_active=True, is_featured=True)\
                .order_by(Product.sort_order).limit(limit).all()
            return [p.to_dict() for p in products]
        
        return _get_featured()
    
    @staticmethod
    def create_product(data: Dict[str, Any]) -> Product:
        """
        Create a new product.
        
        Args:
            data: Validated product data
            
        Returns:
            Created product instance
            
        Raises:
            ValueError: If slug already exists
        """
        # Check slug uniqueness
        existing = Product.query.filter_by(slug=data['slug']).first()
        if existing:
            raise ValueError('Product with this slug already exists')
        
        product = Product(**data)
        db.session.add(product)
        db.session.commit()
        
        return product
    
    @staticmethod
    def update_product(product_id: int, data: Dict[str, Any]) -> Product:
        """
        Update a product.
        
        Args:
            product_id: Product ID
            data: Validated update data
            
        Returns:
            Updated product instance
            
        Raises:
            ValueError: If product not found or slug conflict
        """
        product = Product.query.get(product_id)
        if not product:
            raise ValueError('Product not found')
        
        # Check slug uniqueness if changed
        if 'slug' in data and data['slug'] != product.slug:
            existing = Product.query.filter_by(slug=data['slug']).first()
            if existing:
                raise ValueError('Product with this slug already exists')
        
        # Update fields
        for field, value in data.items():
            if value is not None:
                setattr(product, field, value)
        
        db.session.commit()
        return product
    
    @staticmethod
    def delete_product(product_id: int) -> bool:
        """
        Delete a product.
        
        Args:
            product_id: Product ID
            
        Returns:
            True if deleted successfully
            
        Raises:
            ValueError: If product not found
        """
        product = Product.query.get(product_id)
        if not product:
            raise ValueError('Product not found')
        
        db.session.delete(product)
        db.session.commit()
        return True
    
    @staticmethod
    def check_stock(product_id: int, quantity: int) -> bool:
        """
        Check if product has sufficient stock.
        
        Args:
            product_id: Product ID
            quantity: Requested quantity
            
        Returns:
            True if stock is sufficient or unlimited
        """
        product = Product.query.get(product_id)
        if not product:
            return False
        
        # If stock is None, it's unlimited
        if product.stock_quantity is None:
            return True
        
        return product.stock_quantity >= quantity
    
    @staticmethod
    def update_stock(product_id: int, quantity_change: int) -> Product:
        """
        Update product stock.
        
        Args:
            product_id: Product ID
            quantity_change: Amount to add/subtract (negative to decrease)
            
        Returns:
            Updated product
            
        Raises:
            ValueError: If insufficient stock
        """
        product = Product.query.get(product_id)
        if not product:
            raise ValueError('Product not found')
        
        if product.stock_quantity is not None:
            new_quantity = product.stock_quantity + quantity_change
            if new_quantity < 0:
                raise ValueError(f'Insufficient stock for product {product.name}')
            product.stock_quantity = new_quantity
            db.session.commit()
        
        return product


class CategoryService:
    """Category business logic layer."""
    
    @staticmethod
    def get_all_categories(active_only: bool = True, include_children: bool = True) -> List[Dict]:
        """
        Get all categories.
        
        Args:
            active_only: Only return active categories
            include_children: Include child categories
            
        Returns:
            List of category dictionaries
        """
        from ..utils.cache import cache_result
        
        @cache_result(ttl=3600, prefix='categories')
        def _get_categories():
            query = Category.query
            if active_only:
                query = query.filter_by(is_active=True, parent_id=None)
            else:
                query = query.filter_by(parent_id=None)
            
            categories = query.order_by(Category.sort_order).all()
            return [c.to_dict(include_children=include_children) for c in categories]
        
        return _get_categories()
    
    @staticmethod
    def get_category_by_slug(slug: str, active_only: bool = True) -> Optional[Category]:
        """
        Get category by slug.
        
        Args:
            slug: Category slug
            active_only: Only return if active
            
        Returns:
            Category instance or None
        """
        query = Category.query.filter_by(slug=slug)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.first()
    
    @staticmethod
    def create_category(data: Dict[str, Any]) -> Category:
        """
        Create a new category.
        
        Args:
            data: Validated category data
            
        Returns:
            Created category instance
        """
        category = Category(**data)
        db.session.add(category)
        db.session.commit()
        return category
    
    @staticmethod
    def update_category(category_id: int, data: Dict[str, Any]) -> Category:
        """
        Update a category.
        
        Args:
            category_id: Category ID
            data: Validated update data
            
        Returns:
            Updated category instance
        """
        category = Category.query.get(category_id)
        if not category:
            raise ValueError('Category not found')
        
        for field, value in data.items():
            if value is not None:
                setattr(category, field, value)
        
        db.session.commit()
        return category
    
    @staticmethod
    def delete_category(category_id: int) -> bool:
        """
        Delete a category.
        
        Args:
            category_id: Category ID
            
        Returns:
            True if deleted successfully
        """
        category = Category.query.get(category_id)
        if not category:
            raise ValueError('Category not found')
        
        db.session.delete(category)
        db.session.commit()
        return True


class FavoriteService:
    """Favorites business logic layer."""
    
    @staticmethod
    def add_favorite(user_id: int, product_id: int) -> bool:
        """
        Add product to user favorites.
        
        Args:
            user_id: User ID
            product_id: Product ID
            
        Returns:
            True if added, False if already exists
            
        Raises:
            ValueError: If product not found
        """
        product = Product.query.get(product_id)
        if not product:
            raise ValueError('Product not found')
        
        existing = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            return False
        
        favorite = Favorite(user_id=user_id, product_id=product_id)
        db.session.add(favorite)
        db.session.commit()
        return True
    
    @staticmethod
    def remove_favorite(user_id: int, product_id: int) -> bool:
        """
        Remove product from user favorites.
        
        Args:
            user_id: User ID
            product_id: Product ID
            
        Returns:
            True if removed, False if not found
        """
        favorite = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
        if favorite:
            db.session.delete(favorite)
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def get_user_favorites(user_id: int) -> List[Dict]:
        """
        Get user's favorite products.
        
        Args:
            user_id: User ID
            
        Returns:
            List of product dictionaries
        """
        favorites = Favorite.query.filter_by(user_id=user_id)\
            .options(joinedload(Favorite.product)).all()
        
        return [f.product.to_dict() for f in favorites if f.product and f.product.is_active]


