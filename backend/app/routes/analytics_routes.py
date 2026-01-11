"""
Analytics and statistics routes
"""

from flask import Blueprint, jsonify
from app.models.student import StudentModel, SupabaseClient

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    """Get overall dashboard statistics"""
    try:
        client = SupabaseClient.get_instance()
        
        # Total students
        total_students_response = client.table('students').select('count', count='exact').execute()
        total_students = total_students_response.count
        
        # High risk students
        high_risk_response = client.table('students').select('count', count='exact').eq('dropout_risk', 'High').execute()
        high_risk_count = high_risk_response.count
        
        # Low risk students
        low_risk_count = total_students - high_risk_count
        
        # Risk percentage
        risk_percentage = (high_risk_count / total_students * 100) if total_students > 0 else 0
        
        # Class-wise distribution
        class_distribution = {}
        classes = ['5th', '6th', '7th', '8th', '9th', '10th']
        for cls in classes:
            response = client.table('students').select('count', count='exact').eq('class', cls).execute()
            class_distribution[cls] = response.count
        
        # Location-wise distribution
        location_response = client.table('students').select('location, dropout_risk').execute()
        location_stats = {}
        for record in location_response.data:
            loc = record['location']
            if loc not in location_stats:
                location_stats[loc] = {'total': 0, 'high_risk': 0}
            location_stats[loc]['total'] += 1
            if record.get('dropout_risk') == 'High':
                location_stats[loc]['high_risk'] += 1
        
        return jsonify({
            'success': True,
            'data': {
                'total_students': total_students,
                'high_risk_count': high_risk_count,
                'low_risk_count': low_risk_count,
                'risk_percentage': round(risk_percentage, 2),
                'class_distribution': class_distribution,
                'location_stats': location_stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/risk-factors', methods=['GET'])
def get_risk_factors():
    """Get common risk factors among high-risk students"""
    try:
        high_risk_students = StudentModel.get_high_risk_students()
        
        if not high_risk_students:
            return jsonify({
                'success': True,
                'data': {
                    'message': 'No high-risk students found'
                }
            }), 200
        
        # Analyze risk factors
        total = len(high_risk_students)
        low_attendance = sum(1 for s in high_risk_students if s.get('attendance', 100) < 75)
        low_marks = sum(1 for s in high_risk_students if s.get('marks', 100) < 50)
        low_income = sum(1 for s in high_risk_students if s.get('income') == 'Low')
        rural_location = sum(1 for s in high_risk_students if s.get('location') == 'Rural')
        
        risk_factors = {
            'low_attendance': {
                'count': low_attendance,
                'percentage': round(low_attendance / total * 100, 2)
            },
            'low_marks': {
                'count': low_marks,
                'percentage': round(low_marks / total * 100, 2)
            },
            'low_income': {
                'count': low_income,
                'percentage': round(low_income / total * 100, 2)
            },
            'rural_location': {
                'count': rural_location,
                'percentage': round(rural_location / total * 100, 2)
            }
        }
        
        return jsonify({
            'success': True,
            'data': risk_factors
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@bp.route('/trends', methods=['GET'])
def get_trends():
    """Get dropout risk trends over time"""
    try:
        client = SupabaseClient.get_instance()
        
        # Get prediction history
        response = client.table('prediction_history').select('*').order('created_at').execute()
        
        # Group by date and calculate risk trends
        trends = {}
        for record in response.data:
            date = record['created_at'][:10]  # Extract date
            if date not in trends:
                trends[date] = {'high_risk': 0, 'low_risk': 0}
            
            if record['dropout_risk'] == 'High':
                trends[date]['high_risk'] += 1
            else:
                trends[date]['low_risk'] += 1
        
        return jsonify({
            'success': True,
            'data': trends
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
