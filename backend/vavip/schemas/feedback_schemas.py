"""
Feedback schemas for request validation.
"""
from marshmallow import Schema, fields, validate


class CreateFeedbackSchema(Schema):
    """Schema for feedback creation."""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100), error_messages={'required': 'Name is required'})
    email = fields.Email(required=True, error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'})
    phone = fields.Str(allow_none=True, validate=validate.Length(min=7, max=15))
    subject = fields.Str(allow_none=True, validate=validate.Length(max=200))
    message = fields.Str(required=True, validate=validate.Length(min=1), error_messages={'required': 'Message is required'})
    source_page = fields.Str(allow_none=True, validate=validate.Length(max=100))



