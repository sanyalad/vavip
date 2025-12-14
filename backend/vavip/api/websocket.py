"""
WebSocket Handlers
"""
from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token


def register_handlers(socketio):
    """Register WebSocket event handlers."""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection."""
        emit('connected', {'message': 'Connected to Vavip WebSocket'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection."""
        pass
    
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
            
            # Join user-specific room
            join_room(f'user_{user_id}')
            
            # If admin, join admin room
            from ..models import User
            user = User.query.get(user_id)
            if user and user.role in ['admin', 'manager']:
                join_room('admins')
            
            emit('authenticated', {'user_id': user_id})
        except Exception as e:
            emit('auth_error', {'error': str(e)})
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """Join a specific room."""
        room = data.get('room')
        if room:
            join_room(room)
            emit('joined_room', {'room': room})
    
    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Leave a specific room."""
        room = data.get('room')
        if room:
            leave_room(room)
            emit('left_room', {'room': room})
    
    @socketio.on('subscribe_order')
    def handle_subscribe_order(data):
        """Subscribe to order updates."""
        order_id = data.get('order_id')
        if order_id:
            join_room(f'order_{order_id}')
            emit('subscribed_order', {'order_id': order_id})
    
    @socketio.on('unsubscribe_order')
    def handle_unsubscribe_order(data):
        """Unsubscribe from order updates."""
        order_id = data.get('order_id')
        if order_id:
            leave_room(f'order_{order_id}')


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






