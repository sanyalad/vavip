"""
Order schemas for request validation.
"""
from marshmallow import Schema, fields, validate


class OrderItemSchema(Schema):
    """Schema for order item."""
    product_id = fields.Int(required=True, error_messages={'required': 'Product ID is required'})
    quantity = fields.Int(required=True, validate=validate.Range(min=1), error_messages={'required': 'Quantity is required'})


class CreateOrderSchema(Schema):
    """Schema for order creation."""
    items = fields.List(fields.Nested(OrderItemSchema), required=True, validate=validate.Length(min=1), error_messages={'required': 'Items are required'})
    payment_method = fields.Str(allow_none=True)
    delivery_method = fields.Str(allow_none=True)
    delivery_address = fields.Str(allow_none=True)
    delivery_cost = fields.Decimal(allow_none=True, validate=validate.Range(min=0))
    discount = fields.Decimal(allow_none=True, validate=validate.Range(min=0))
    promo_code = fields.Str(allow_none=True, validate=validate.Length(max=50))
    customer_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    customer_email = fields.Email(allow_none=True, error_messages={'invalid': 'Invalid email format'})
    customer_phone = fields.Str(allow_none=True, validate=validate.Length(min=7, max=15))
    customer_note = fields.Str(allow_none=True)


class UpdateOrderStatusSchema(Schema):
    """Schema for order status update."""
    status = fields.Str(allow_none=True, validate=validate.OneOf(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']))
    payment_status = fields.Str(allow_none=True, validate=validate.OneOf(['pending', 'paid', 'failed', 'refunded']))
    admin_note = fields.Str(allow_none=True)



