"""
Flask application entry point
"""

from app import create_app
from config import config
import os

# Get configuration from environment variable
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config[config_name])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
