"""
Analytics and statistics routes
"""

from flask import Blueprint, jsonify, request
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


@bp.route('/clusters', methods=['GET'])
def get_student_clusters():
    """Return fast risk-band clusters for analytics UI.

    This route intentionally avoids heavy ML compute at request time to keep
    dashboard responses fast and predictable.
    """
    try:
        limit = request.args.get('limit', default=500, type=int)
        limit = max(50, min(limit, 2000))
        students = StudentModel.get_all_students(limit=limit, offset=0) or []

        if len(students) < 3:
            return jsonify({
                'success': True,
                'data': {
                    'message': 'Need at least 3 students for clustering',
                    'clusters': [],
                    'cluster_summary': {}
                }
            }), 200

        n_clusters = 3

        cluster_summary = {}
        clusters = []

        def compute_risk_band(student):
            """Assign 0/1/2 band from existing risk fields quickly."""
            risk_score = float(student.get('risk_score') or 0)
            attendance = float(student.get('attendance') or 0)
            marks = float(student.get('marks') or 0)

            if risk_score >= 0.67 or attendance < 50 or marks < 40:
                return 2  # high-risk band
            if risk_score >= 0.34 or attendance < 75 or marks < 60:
                return 1  # medium-risk band
            return 0      # low-risk band

        for student in students:
            label = compute_risk_band(student)
            cluster_key = str(label)

            if cluster_key not in cluster_summary:
                cluster_summary[cluster_key] = {
                    'count': 0,
                    'high_risk': 0,
                    'avg_attendance': 0,
                    'avg_marks': 0,
                }

            cluster_summary[cluster_key]['count'] += 1
            if student.get('dropout_risk') == 'High':
                cluster_summary[cluster_key]['high_risk'] += 1
            cluster_summary[cluster_key]['avg_attendance'] += float(student.get('attendance') or 0)
            cluster_summary[cluster_key]['avg_marks'] += float(student.get('marks') or 0)

            clusters.append({
                'student_id': student.get('student_id'),
                'student_name': student.get('student_name'),
                'class': student.get('class'),
                'cluster': label,
                'dropout_risk': student.get('dropout_risk'),
                'risk_score': student.get('risk_score')
            })

        for key, summary in cluster_summary.items():
            count = summary['count'] or 1
            summary['avg_attendance'] = round(summary['avg_attendance'] / count, 2)
            summary['avg_marks'] = round(summary['avg_marks'] / count, 2)
            summary['high_risk_percentage'] = round(summary['high_risk'] * 100.0 / count, 2)

        return jsonify({
            'success': True,
            'data': {
                'k': n_clusters,
                'clusters': clusters,
                'cluster_summary': cluster_summary,
                'centroids': []
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
