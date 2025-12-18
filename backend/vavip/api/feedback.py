"""
Feedback API
"""
from flask import Blueprint, request
from ..extensions import db, socketio
from ..models import Feedback
from ..utils.errors import NotFoundError, ForbiddenError
from ..utils.response_utils import success_response, paginated_response
from ..utils.decorators import manager_required, validate_pagination
from ..utils.schema_validator import validate_request
from ..schemas.feedback_schemas import CreateFeedbackSchema

bp = Blueprint('feedback', __name__)


@bp.route('/', methods=['POST'])
def create_feedback():
    """Submit feedback form (public endpoint)."""
    data = request.get_json() or {}
    
    # Validate with schema
    validated_data = validate_request(CreateFeedbackSchema, data)
    
    feedback = Feedback(**validated_data)
    
    db.session.add(feedback)
    db.session.commit()
    
    # Notify admins via WebSocket
    socketio.emit('new_feedback', {
        'id': feedback.id,
        'name': feedback.name,
        'subject': feedback.subject,
        'created_at': feedback.created_at.isoformat() if feedback.created_at else None
    }, room='admins')
    
    return success_response({
        'id': feedback.id
    }, status_code=201, message='Thank you for your feedback!')


# Admin endpoints
@bp.route('/', methods=['GET'])
@manager_required
@validate_pagination(max_per_page=100)
def get_feedback_list(page, per_page):
    """Get all feedback (admin/manager only)."""
    # Filters
    status = request.args.get('status')
    is_read = request.args.get('is_read', type=bool)
    
    query = Feedback.query.order_by(Feedback.created_at.desc())
    
    if status:
        query = query.filter_by(status=status)
    
    if is_read is not None:
        query = query.filter_by(is_read=is_read)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    unread_count = Feedback.query.filter_by(is_read=False).count()
    
    feedback_list = [f.to_dict() for f in pagination.items]
    
    # Return with unread_count in response
    response = {
        'feedback': feedback_list,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
        'unread_count': unread_count
    }
    
    return success_response(response)


@bp.route('/<int:feedback_id>', methods=['GET'])
@manager_required
def get_feedback(feedback_id):
    """Get feedback by ID (admin/manager only)."""
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        raise NotFoundError('Feedback not found', 'FEEDBACK_NOT_FOUND')
    
    # Mark as read
    if not feedback.is_read:
        feedback.is_read = True
        db.session.commit()
    
    return success_response(feedback.to_dict())


@bp.route('/<int:feedback_id>', methods=['PUT'])
@manager_required
def update_feedback(feedback_id):
    """Update feedback status (admin/manager only)."""
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        raise NotFoundError('Feedback not found', 'FEEDBACK_NOT_FOUND')
    
    data = request.get_json() or {}
    
    if 'status' in data:
        feedback.status = data['status']
    
    if 'admin_note' in data:
        feedback.admin_note = data['admin_note']
    
    if 'is_read' in data:
        feedback.is_read = data['is_read']
    
    db.session.commit()
    
    return success_response(feedback.to_dict())


@bp.route('/<int:feedback_id>', methods=['DELETE'])
@manager_required
def delete_feedback(feedback_id):
    """Delete feedback (admin/manager only)."""
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        raise NotFoundError('Feedback not found', 'FEEDBACK_NOT_FOUND')
    
    db.session.delete(feedback)
    db.session.commit()
    
    return success_response(message='Feedback deleted successfully')









