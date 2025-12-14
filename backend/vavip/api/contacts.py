"""
Contacts API
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Contact, User

bp = Blueprint('contacts', __name__)


@bp.route('/', methods=['GET'])
def get_contacts():
    """Get all active contacts grouped by country."""
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
    
    return jsonify(list(grouped.values()))


@bp.route('/countries', methods=['GET'])
def get_countries():
    """Get list of countries with offices."""
    contacts = Contact.query.filter_by(is_active=True)\
        .with_entities(Contact.country, Contact.country_code, Contact.map_image_url)\
        .distinct().all()
    
    return jsonify([{
        'country': c.country,
        'country_code': c.country_code,
        'map_image_url': c.map_image_url
    } for c in contacts])


@bp.route('/country/<country_code>', methods=['GET'])
def get_contacts_by_country(country_code):
    """Get contacts for a specific country."""
    contacts = Contact.query.filter_by(
        country_code=country_code.upper(), 
        is_active=True
    ).order_by(Contact.sort_order).all()
    
    return jsonify([c.to_dict() for c in contacts])


@bp.route('/city/<city>', methods=['GET'])
def get_contact_by_city(city):
    """Get contact for a specific city."""
    contact = Contact.query.filter_by(city=city, is_active=True).first_or_404()
    return jsonify(contact.to_dict())


# Admin endpoints
@bp.route('/', methods=['POST'])
@jwt_required()
def create_contact():
    """Create a new contact (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    required = ['country', 'city', 'address']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
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
    
    return jsonify(contact.to_dict()), 201


@bp.route('/<int:contact_id>', methods=['PUT'])
@jwt_required()
def update_contact(contact_id):
    """Update a contact (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    contact = Contact.query.get_or_404(contact_id)
    data = request.get_json()
    
    for field in ['country', 'country_code', 'city', 'address', 'phone', 'email',
                  'working_hours', 'map_lat', 'map_lng', 'photo_url', 'map_image_url',
                  'is_headquarters', 'is_active', 'sort_order']:
        if field in data:
            setattr(contact, field, data[field])
    
    db.session.commit()
    
    return jsonify(contact.to_dict())


@bp.route('/<int:contact_id>', methods=['DELETE'])
@jwt_required()
def delete_contact(contact_id):
    """Delete a contact (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    contact = Contact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    
    return jsonify({'message': 'Contact deleted successfully'})






