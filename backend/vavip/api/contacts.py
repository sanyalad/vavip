"""
Contacts API
"""
from flask import Blueprint, request
from ..extensions import db
from ..models import Contact
from ..utils.errors import NotFoundError, ForbiddenError
from ..utils.response_utils import success_response
from ..utils.decorators import manager_required
from ..utils.cache import cache_result

bp = Blueprint('contacts', __name__)


@bp.route('/', methods=['GET'])
def get_contacts():
    """Get all active contacts grouped by country."""
    from ..utils.cache import cache_result
    
    @cache_result(ttl=3600, prefix='contacts')
    def _get_contacts():
        contacts = Contact.query.filter_by(is_active=True).order_by(Contact.sort_order).all()
        
        # Group by country
        grouped = {}
        for contact in contacts:
            country = contact.country
            if country not in grouped:
                grouped[country] = {
                    'country': country,
                    'country_code': contact.country_code,
                    'map_image_url': contact.map_image_url,
                    'offices': []
                }
            grouped[country]['offices'].append(contact.to_dict())
        
        return list(grouped.values())
    
    contacts = _get_contacts()
    return success_response(contacts)


@bp.route('/countries', methods=['GET'])
def get_countries():
    """Get list of countries with offices."""
    from ..utils.cache import cache_result
    
    @cache_result(ttl=3600, prefix='countries')
    def _get_countries():
        contacts = Contact.query.filter_by(is_active=True)\
            .with_entities(Contact.country, Contact.country_code, Contact.map_image_url)\
            .distinct().all()
        
        return [{
            'country': c.country,
            'country_code': c.country_code,
            'map_image_url': c.map_image_url
        } for c in contacts]
    
    countries = _get_countries()
    return success_response(countries)


@bp.route('/country/<country_code>', methods=['GET'])
def get_contacts_by_country(country_code):
    """Get contacts for a specific country."""
    contacts = Contact.query.filter_by(
        country_code=country_code.upper(), 
        is_active=True
    ).order_by(Contact.sort_order).all()
    
    return success_response([c.to_dict() for c in contacts])


@bp.route('/city/<city>', methods=['GET'])
def get_contact_by_city(city):
    """Get contact for a specific city."""
    contact = Contact.query.filter_by(city=city, is_active=True).first()
    if not contact:
        raise NotFoundError('Contact not found', 'CONTACT_NOT_FOUND')
    return success_response(contact.to_dict())


# Admin endpoints
@bp.route('/', methods=['POST'])
@manager_required
def create_contact():
    """Create a new contact (admin/manager only)."""
    from ..utils.errors import ValidationError
    
    data = request.get_json() or {}
    
    required = ['country', 'city', 'address']
    for field in required:
        if not data.get(field):
            raise ValidationError(f'{field} is required', 'FIELD_REQUIRED')
    
    contact = Contact(
        country=data['country'],
        country_code=data.get('country_code'),
        city=data['city'],
        address=data['address'],
        phone=data.get('phone'),
        email=data.get('email'),
        working_hours=data.get('working_hours'),
        map_lat=data.get('map_lat'),
        map_lng=data.get('map_lng'),
        photo_url=data.get('photo_url'),
        map_image_url=data.get('map_image_url'),
        is_headquarters=data.get('is_headquarters', False),
        is_active=data.get('is_active', True),
        sort_order=data.get('sort_order', 0)
    )
    
    db.session.add(contact)
    db.session.commit()
    
    # Invalidate cache
    from ..utils.cache import invalidate_cache
    invalidate_cache('contacts')
    invalidate_cache('countries')
    
    return success_response(contact.to_dict(), status_code=201)


@bp.route('/<int:contact_id>', methods=['PUT'])
@manager_required
def update_contact(contact_id):
    """Update a contact (admin/manager only)."""
    contact = Contact.query.get(contact_id)
    if not contact:
        raise NotFoundError('Contact not found', 'CONTACT_NOT_FOUND')
    
    data = request.get_json() or {}
    
    for field in ['country', 'country_code', 'city', 'address', 'phone', 'email',
                  'working_hours', 'map_lat', 'map_lng', 'photo_url', 'map_image_url',
                  'is_headquarters', 'is_active', 'sort_order']:
        if field in data:
            setattr(contact, field, data[field])
    
    db.session.commit()
    
    # Invalidate cache
    from ..utils.cache import invalidate_cache
    invalidate_cache('contacts')
    invalidate_cache('countries')
    
    return success_response(contact.to_dict())


@bp.route('/<int:contact_id>', methods=['DELETE'])
@manager_required
def delete_contact(contact_id):
    """Delete a contact (admin/manager only)."""
    contact = Contact.query.get(contact_id)
    if not contact:
        raise NotFoundError('Contact not found', 'CONTACT_NOT_FOUND')
    
    db.session.delete(contact)
    db.session.commit()
    
    # Invalidate cache
    from ..utils.cache import invalidate_cache
    invalidate_cache('contacts')
    invalidate_cache('countries')
    
    return success_response(message='Contact deleted successfully')









