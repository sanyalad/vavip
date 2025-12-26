"""
Product schemas for request validation.
"""
from marshmallow import Schema, fields, validate


class CreateProductSchema(Schema):
    """Schema for product creation."""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200), error_messages={'required': 'Name is required'})
    slug = fields.Str(required=True, validate=validate.Length(min=1, max=200), error_messages={'required': 'Slug is required'})
    sku = fields.Str(allow_none=True, validate=validate.Length(max=50))
    description = fields.Str(allow_none=True)
    short_description = fields.Str(allow_none=True, validate=validate.Length(max=500))
    price = fields.Decimal(required=True, validate=validate.Range(min=0), error_messages={'required': 'Price is required'})
    old_price = fields.Decimal(allow_none=True, validate=validate.Range(min=0))
    currency = fields.Str(allow_none=True, validate=validate.Length(equal=3), missing='RUB')
    category_id = fields.Int(allow_none=True)
    stock_quantity = fields.Int(allow_none=True, validate=validate.Range(min=0), missing=0)
    is_active = fields.Bool(allow_none=True, missing=True)
    is_featured = fields.Bool(allow_none=True, missing=False)


class UpdateProductSchema(Schema):
    """Schema for product update."""
    name = fields.Str(allow_none=True, validate=validate.Length(min=1, max=200))
    slug = fields.Str(allow_none=True, validate=validate.Length(min=1, max=200))
    sku = fields.Str(allow_none=True, validate=validate.Length(max=50))
    description = fields.Str(allow_none=True)
    short_description = fields.Str(allow_none=True, validate=validate.Length(max=500))
    price = fields.Decimal(allow_none=True, validate=validate.Range(min=0))
    old_price = fields.Decimal(allow_none=True, validate=validate.Range(min=0))
    currency = fields.Str(allow_none=True, validate=validate.Length(equal=3))
    category_id = fields.Int(allow_none=True)
    stock_quantity = fields.Int(allow_none=True, validate=validate.Range(min=0))
    is_active = fields.Bool(allow_none=True)
    is_featured = fields.Bool(allow_none=True)




