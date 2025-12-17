"""
Order Service
"""
import uuid
from datetime import datetime
from ..extensions import db
from ..models import Order, OrderItem, Product


class OrderService:
    """Order business logic."""
    
    @staticmethod
    def generate_order_number():
        """Generate unique order number."""
        return f"VAV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    @staticmethod
    def calculate_cart_total(items):
        """Calculate cart total from items."""
        subtotal = 0
        validated_items = []
        
        for item in items:
            product = Product.query.get(item.get('product_id'))
            if not product or not product.is_active:
                continue
            
            quantity = item.get('quantity', 1)
            item_total = float(product.price) * quantity
            subtotal += item_total
            
            validated_items.append({
                'product': product,
                'quantity': quantity,
                'price': float(product.price),
                'total': item_total
            })
        
        return subtotal, validated_items
    
    @staticmethod
    def create_order(user_id, items, **kwargs):
        """Create a new order."""
        subtotal, validated_items = OrderService.calculate_cart_total(items)
        
        if not validated_items:
            raise ValueError('No valid items in order')
        
        discount = kwargs.get('discount', 0)
        delivery_cost = kwargs.get('delivery_cost', 0)
        total = subtotal - discount + delivery_cost
        
        order = Order(
            order_number=OrderService.generate_order_number(),
            user_id=user_id,
            status='pending',
            payment_status='pending',
            payment_method=kwargs.get('payment_method'),
            delivery_method=kwargs.get('delivery_method'),
            delivery_address=kwargs.get('delivery_address'),
            delivery_cost=delivery_cost,
            subtotal=subtotal,
            discount=discount,
            total=total,
            promo_code=kwargs.get('promo_code'),
            customer_name=kwargs.get('customer_name'),
            customer_email=kwargs.get('customer_email'),
            customer_phone=kwargs.get('customer_phone'),
            customer_note=kwargs.get('customer_note')
        )
        
        db.session.add(order)
        db.session.flush()
        
        for item_data in validated_items:
            product = item_data['product']
            main_image = product.images.filter_by(is_main=True).first()
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                product_image=main_image.url if main_image else None,
                quantity=item_data['quantity'],
                price=item_data['price'],
                total=item_data['total']
            )
            db.session.add(order_item)
        
        db.session.commit()
        return order
    
    @staticmethod
    def update_status(order_id, status, user=None):
        """Update order status."""
        order = Order.query.get(order_id)
        if not order:
            raise ValueError('Order not found')
        
        order.status = status
        
        if status == 'shipped':
            order.shipped_at = datetime.utcnow()
        elif status == 'delivered':
            order.delivered_at = datetime.utcnow()
        
        db.session.commit()
        return order
    
    @staticmethod
    def update_payment_status(order_id, payment_status):
        """Update order payment status."""
        order = Order.query.get(order_id)
        if not order:
            raise ValueError('Order not found')
        
        order.payment_status = payment_status
        if payment_status == 'paid':
            order.paid_at = datetime.utcnow()
        
        db.session.commit()
        return order
    
    @staticmethod
    def cancel_order(order_id, user_id):
        """Cancel an order."""
        order = Order.query.get(order_id)
        if not order:
            raise ValueError('Order not found')
        
        if order.status not in ['pending', 'confirmed']:
            raise ValueError('Cannot cancel order in current status')
        
        order.status = 'cancelled'
        db.session.commit()
        return order
    
    @staticmethod
    def get_user_orders(user_id):
        """Get all orders for a user."""
        return Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()








