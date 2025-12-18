"""
WebSocket Handlers
"""
import logging
from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token

logger = logging.getLogger(__name__)


def register_handlers(socketio):
    """Register WebSocket event handlers."""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection."""
        try:
            logger.info('WebSocket client connected')
            emit('connected', {'message': 'Connected to Vavip WebSocket'})
        except Exception as e:
            logger.exception('Error in connect handler')
            emit('error', {'error': 'Connection error'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection."""
        try:
            logger.info('WebSocket client disconnected')
        except Exception as e:
            logger.exception('Error in disconnect handler')
    
    @socketio.on('authenticate')
    def handle_authenticate(data):
        """Authenticate WebSocket connection and join user room."""
        token = data.get('token')
        if not token:
            emit('auth_error', {'error': 'Token required'})
            return
        
        try:
            decoded = decode_token(token)
            user_id = decoded.get('sub')
            
            if not user_id:
                emit('auth_error', {'error': 'Invalid token'})
                return
            
            # Join user-specific room
            join_room(f'user_{user_id}')
            
            # If admin, join admin room
            from ..models import User
            user = User.query.get(user_id)
            if user and user.role in ['admin', 'manager']:
                join_room('admins')
            
            logger.info(f'WebSocket authenticated for user {user_id}')
            emit('authenticated', {'user_id': user_id})
        except Exception as e:
            logger.exception('Error in authenticate handler')
            emit('auth_error', {'error': str(e)})
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """Join a specific room."""
        try:
            room = data.get('room')
            if room:
                join_room(room)
                emit('joined_room', {'room': room})
        except Exception as e:
            logger.exception('Error in join_room handler')
            emit('error', {'error': 'Failed to join room'})
    
    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Leave a specific room."""
        try:
            room = data.get('room')
            if room:
                leave_room(room)
                emit('left_room', {'room': room})
        except Exception as e:
            logger.exception('Error in leave_room handler')
            emit('error', {'error': 'Failed to leave room'})
    
    @socketio.on('subscribe_order')
    def handle_subscribe_order(data):
        """Subscribe to order updates."""
        try:
            order_id = data.get('order_id')
            if order_id:
                join_room(f'order_{order_id}')
                emit('subscribed_order', {'order_id': order_id})
        except Exception as e:
            logger.exception('Error in subscribe_order handler')
            emit('error', {'error': 'Failed to subscribe to order'})
    
    @socketio.on('unsubscribe_order')
    def handle_unsubscribe_order(data):
        """Unsubscribe from order updates."""
        try:
            order_id = data.get('order_id')
            if order_id:
                leave_room(f'order_{order_id}')
        except Exception as e:
            logger.exception('Error in unsubscribe_order handler')
            emit('error', {'error': 'Failed to unsubscribe from order'})


def emit_order_update(order_id, data):
    """Emit order update to subscribers."""
    from ..extensions import socketio
    socketio.emit('order_update', data, room=f'order_{order_id}')


def emit_to_user(user_id, event, data):
    """Emit event to specific user."""
    from ..extensions import socketio
    socketio.emit(event, data, room=f'user_{user_id}')


def emit_to_admins(event, data):
    """Emit event to all admins."""
    from ..extensions import socketio
    socketio.emit(event, data, room='admins')









