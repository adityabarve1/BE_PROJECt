"""
Flask Application Factory
"""

from flask import Flask
from flask_cors import CORS
from config import Config


def create_app(config_class=Config):
    """Create and configure Flask application"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    from app.routes import (
        prediction_routes,
        student_routes,
        analytics_routes,
        auth_routes,
        document_routes
    )
    
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(document_routes.bp)
    app.register_blueprint(prediction_routes.bp)
    app.register_blueprint(student_routes.bp)
    app.register_blueprint(analytics_routes.bp)
    
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Dropout Prediction API is running'}, 200
    
    return app
