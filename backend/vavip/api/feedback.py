"""
Feedback API
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db, socketio
from ..models import Feedback, User

bp = Blueprint('feedback', __name__)


@bp.route('/', methods=['POST'])
def create_feedback():
    """Submit feedback form (public endpoint)."""
    data = request.get_json()
    
    required = ['name', 'email', 'message']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    feedback = Feedback(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        subject=data.get('subject'),
        message=data['message'],
        source_page=data.get('source_page')
    )
    
    db.session.add(feedback)
    db.session.commit()
    
    # Notify admins via WebSocket
    socketio.emit('new_feedback', {
        'id': feedback.id,
        'name': feedback.name,
        'subject': feedback.subject,
        'created_at': feedback.created_at.isoformat()
    }, room='admins')
    
    return jsonify({
        'message': 'Thank you for your feedback!',
        'id': feedback.id
    }), 201


# Admin endpoints
@bp.route('/', methods=['GET'])
@jwt_required()
def get_feedback_list():
    """Get all feedback (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Filters
    status = request.args.get('status')
    is_read = request.args.get('is_read', type=bool)
    
    query = Feedback.query.order_by(Feedback.created_at.desc())
    
    if status:
        query = query.filter_by(status=status)
    
    if is_read is not None:
        query = query.filter_by(is_read=is_read)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'feedback': [f.to_dict() for f in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'unread_count': Feedback.query.filter_by(is_read=False).count()
    })


@bp.route('/<int:feedback_id>', methods=['GET'])
@jwt_required()
def get_feedback(feedback_id):
    """Get feedback by ID (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    feedback = Feedback.query.get_or_404(feedback_id)
    
    # Mark as read
    if not feedback.is_read:
        feedback.is_read = True
        db.session.commit()
    
    return jsonify(feedback.to_dict())


@bp.route('/<int:feedback_id>', methods=['PUT'])
@jwt_required()
def update_feedback(feedback_id):
    """Update feedback status (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    feedback = Feedback.query.get_or_404(feedback_id)
    data = request.get_json()
    
    if 'status' in data:
        feedback.status = data['status']
    
    if 'admin_note' in data:
        feedback.admin_note = data['admin_note']
    
    if 'is_read' in data:
        feedback.is_read = data['is_read']
    
    db.session.commit()
    
    return jsonify(feedback.to_dict())


@bp.route('/<int:feedback_id>', methods=['DELETE'])
@jwt_required()
def delete_feedback(feedback_id):
    """Delete feedback (admin only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    feedback = Feedback.query.get_or_404(feedback_id)
    db.session.delete(feedback)
    db.session.commit()
    
    return jsonify({'message': 'Feedback deleted successfully'})






