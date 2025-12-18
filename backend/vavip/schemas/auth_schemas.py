"""
Authentication schemas for request validation.
"""
from marshmallow import Schema, fields, validate, ValidationError, validates_schema


class RegisterSchema(Schema):
    """Schema for user registration."""
    email = fields.Email(required=True, error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'})
    password = fields.Str(required=True, validate=validate.Length(min=8), error_messages={'required': 'Password is required'})
    first_name = fields.Str(allow_none=True, validate=validate.Length(max=50))
    last_name = fields.Str(allow_none=True, validate=validate.Length(max=50))
    phone = fields.Str(allow_none=True, validate=validate.Length(min=7, max=15))


class LoginSchema(Schema):
    """Schema for user login."""
    email = fields.Str(allow_none=True)
    phone = fields.Str(allow_none=True)
    password = fields.Str(required=True, error_messages={'required': 'Password is required'})
    
    @validates_schema
    def validate_credentials(self, data, **kwargs):
        """Ensure either email or phone is provided."""
        if not data.get('email') and not data.get('phone'):
            raise ValidationError('Either email or phone is required', field_name='credentials')


class OTPSendSchema(Schema):
    """Schema for OTP send request."""
    phone = fields.Str(required=True, validate=validate.Length(min=7, max=15), error_messages={'required': 'Phone is required'})


class OTPVerifySchema(Schema):
    """Schema for OTP verify request."""
    phone = fields.Str(required=True, validate=validate.Length(min=7, max=15), error_messages={'required': 'Phone is required'})
    code = fields.Str(required=True, validate=validate.Length(equal=6), error_messages={'required': 'Code is required'})
    first_name = fields.Str(allow_none=True, validate=validate.Length(max=50))


class UpdateProfileSchema(Schema):
    """Schema for profile update."""
    first_name = fields.Str(allow_none=True, validate=validate.Length(max=50))
    last_name = fields.Str(allow_none=True, validate=validate.Length(max=50))
    phone = fields.Str(allow_none=True, validate=validate.Length(min=7, max=15))
    email = fields.Email(allow_none=True, error_messages={'invalid': 'Invalid email format'})


class ChangePasswordSchema(Schema):
    """Schema for password change."""
    current_password = fields.Str(required=True, error_messages={'required': 'Current password is required'})
    new_password = fields.Str(required=True, validate=validate.Length(min=8), error_messages={'required': 'New password is required'})

