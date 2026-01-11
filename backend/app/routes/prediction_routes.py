"""
Prediction routes for dropout risk assessment
"""

from flask import Blueprint, request, jsonify
import sys
import os

# Add model path to system path
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'model', 'src')
sys.path.append(MODEL_PATH)

from app.services.prediction_service import PredictionService
from app.models.student import PredictionHistoryModel

bp = Blueprint('prediction', __name__, url_prefix='/api/prediction')

# Initialize prediction service
prediction_service = PredictionService()


@bp.route('/predict', methods=['POST'])
def predict_dropout():
    """
    Predict dropout risk for a single student
    
    Expected JSON body:
    {
        "attendance": 65.5,
        "marks": 45.0,
        "income": "Low",
        "gender": "Male",
        "class": "8th",
        "parent_occupation": "Farmer",
        "location": "Rural"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['attendance', 'marks', 'income', 'gender', 'class', 'parent_occupation', 'location']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Make prediction
        result = prediction_service.predict(data)
        
        # Save to prediction history if student_id provided
        if 'student_id' in data:
            history_data = {
                'student_id': data['student_id'],
                **result
            }
            PredictionHistoryModel.create_prediction_record(history_data)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/predict-batch', methods=['POST'])
def predict_batch():
    """
    Predict dropout risk for multiple students
    
    Expected JSON body:
    {
        "students": [
            {...student_data_1...},
            {...student_data_2...}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if 'students' not in data or not isinstance(data['students'], list):
            return jsonify({
                'error': 'Expected "students" field with list of student data'
            }), 400
        
        # Make batch predictions
        results = prediction_service.predict_batch(data['students'])
        
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/explain', methods=['POST'])
def explain_prediction():
    """
    Get feature importance for a prediction
    
    Expected JSON body: Same as /predict
    """
    try:
        data = request.get_json()
        
        # Get feature importance
        importance = prediction_service.explain(data)
        
        return jsonify({
            'success': True,
            'data': importance
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/history/<student_id>', methods=['GET'])
def get_prediction_history(student_id):
    """Get prediction history for a student"""
    try:
        history = PredictionHistoryModel.get_student_prediction_history(student_id)
        
        return jsonify({
            'success': True,
            'data': history,
            'count': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
