"""
Utility for validating request data with Marshmallow schemas.
"""
from marshmallow import ValidationError as MarshmallowValidationError
from ..utils.errors import ValidationError


def validate_request(schema_class, data):
    """
    Validate request data using a Marshmallow schema.
    
    Args:
        schema_class: Marshmallow Schema class
        data: Request data to validate
    
    Returns:
        Validated and deserialized data
    
    Raises:
        ValidationError: If validation fails
    """
    schema = schema_class()
    try:
        return schema.load(data)
    except MarshmallowValidationError as err:
        # Convert Marshmallow validation errors to our format
        error_messages = []
        for field, messages in err.messages.items():
            if isinstance(messages, list):
                error_messages.extend([f"{field}: {msg}" for msg in messages])
            else:
                error_messages.append(f"{field}: {messages}")
        
        error_code = 'VALIDATION_ERROR'
        if 'email' in err.messages:
            error_code = 'EMAIL_INVALID'
        elif 'phone' in err.messages:
            error_code = 'PHONE_INVALID'
        elif 'password' in err.messages:
            error_code = 'PASSWORD_WEAK'
        
        raise ValidationError('; '.join(error_messages), error_code)



