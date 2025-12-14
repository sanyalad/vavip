"""
Application entry point for Gunicorn
"""
from vavip import create_app
import os

# Create app instance for Gunicorn
app = create_app()

if __name__ == '__main__':
    # Development mode
    from vavip.extensions import socketio
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)






