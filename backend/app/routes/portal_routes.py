"""
Portal routes for student and parent access
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.models.student import (
    InterventionModel,
    MeetingScheduleModel,
    PredictionHistoryModel,
    StudentModel,
)

bp = Blueprint('portal', __name__, url_prefix='/api/portal')


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _build_alerts(student, history, meetings):
    alerts = []
    attendance = _safe_float(student.get('attendance'))
    marks = _safe_float(student.get('marks'))
    risk_score = _safe_float(student.get('risk_score'))
    risk_level = student.get('dropout_risk') or ('High' if risk_score >= 0.5 else 'Low')

    if risk_level == 'High' or risk_score >= 0.67:
        alerts.append({
            'severity': 'high',
            'title': 'High dropout risk',
            'message': 'Immediate support is recommended to improve attendance and academic performance.'
        })

    if attendance < 75:
        alerts.append({
            'severity': 'medium' if attendance >= 60 else 'high',
            'title': 'Attendance is below target',
            'message': f'Attendance is {attendance:.1f}%. The school target is 75% or above.'
        })

    if marks < 50:
        alerts.append({
            'severity': 'medium',
            'title': 'Marks need improvement',
            'message': f'Current marks are {marks:.1f}. Extra academic support is advised.'
        })

    upcoming_meetings = []
    now = datetime.now(timezone.utc)
    for meeting in meetings:
        meeting_date = meeting.get('meeting_date')
        try:
            parsed = datetime.fromisoformat(meeting_date.replace('Z', '+00:00'))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
        except (AttributeError, ValueError):
            continue
        if parsed >= now:
            upcoming_meetings.append(meeting)

    if upcoming_meetings:
        next_meeting = upcoming_meetings[0]
        alerts.append({
            'severity': 'info',
            'title': 'Upcoming school meeting',
            'message': f"Next meeting is scheduled on {next_meeting.get('meeting_date')}"
        })

    if not alerts and history:
        alerts.append({
            'severity': 'success',
            'title': 'Progress is stable',
            'message': 'No urgent alerts at the moment. Continue regular follow-up.'
        })

    return alerts


def _build_recommendations(student):
    recommendations = []
    attendance = _safe_float(student.get('attendance'))
    marks = _safe_float(student.get('marks'))
    income = student.get('income')
    location = student.get('location')

    if attendance < 75:
        recommendations.append({
            'title': 'Improve attendance',
            'description': 'Track daily attendance and speak with the school if travel or health issues are causing absences.'
        })

    if marks < 50:
        recommendations.append({
            'title': 'Get study support',
            'description': 'Plan extra practice time, revision sessions, or teacher support for weaker subjects.'
        })

    if income == 'Low':
        recommendations.append({
            'title': 'Check support schemes',
            'description': 'Ask the school about scholarship, uniform, transport, or other financial support schemes.'
        })

    if location == 'Rural':
        recommendations.append({
            'title': 'Plan school commute',
            'description': 'Travel issues often affect attendance. Build a clear commute routine with backup options.'
        })

    if not recommendations:
        recommendations.append({
            'title': 'Keep monitoring progress',
            'description': 'Attendance and marks are in a healthy range. Continue the current study routine and school follow-up.'
        })

    return recommendations


def _build_summary(student, history, interventions, meetings):
    attendance = _safe_float(student.get('attendance'))
    marks = _safe_float(student.get('marks'))
    risk_score = _safe_float(student.get('risk_score'))

    return {
        'attendance': round(attendance, 2),
        'marks': round(marks, 2),
        'risk_score': round(risk_score, 4),
        'risk_label': student.get('dropout_risk') or ('High' if risk_score >= 0.5 else 'Low'),
        'history_count': len(history),
        'active_interventions': len([item for item in interventions if item.get('status') in ['Planned', 'In Progress']]),
        'upcoming_meetings': len([
            item for item in meetings
            if item.get('status') in ['Scheduled', 'Rescheduled']
        ]),
    }


def _build_portal_payload(student):
    history = PredictionHistoryModel.get_student_prediction_history(student['student_id'])
    interventions = InterventionModel.get_student_interventions(student['student_id'])
    meetings = MeetingScheduleModel.get_student_meetings(student['student_id'])

    return {
        'student': student,
        'summary': _build_summary(student, history, interventions, meetings),
        'alerts': _build_alerts(student, history, meetings),
        'recommendations': _build_recommendations(student),
        'prediction_history': history,
        'interventions': interventions,
        'meetings': meetings,
    }


@bp.route('/student/access', methods=['POST'])
def student_access():
    """Validate student access using student_id and password."""
    try:
        data = request.get_json() or {}
        student_id = data.get('student_id')
        password = data.get('password')

        if not student_id or not password:
            return jsonify({
                'success': False,
                'error': 'student_id and password are required'
            }), 400

        student = StudentModel.get_student_by_student_id(student_id)
        if not student:
            return jsonify({
                'success': False,
                'error': 'Student not found'
            }), 404

        stored_password = str(student.get('password_hash') or '')
        if stored_password != str(password):
            return jsonify({
                'success': False,
                'error': 'Invalid student credentials'
            }), 401

        return jsonify({
            'success': True,
            'data': _build_portal_payload(student)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/parent/access', methods=['POST'])
def parent_access():
    """Validate parent access using child student details."""
    try:
        data = request.get_json() or {}
        student_id = data.get('student_id')
        roll_no = data.get('roll_no')
        admission_year = data.get('admission_year')

        if not student_id or roll_no is None or admission_year is None:
            return jsonify({
                'success': False,
                'error': 'student_id, roll_no, and admission_year are required'
            }), 400

        student = StudentModel.get_student_by_student_id(student_id)
        if not student:
            return jsonify({
                'success': False,
                'error': 'Student not found'
            }), 404

        if int(student.get('roll_no')) != int(roll_no) or int(student.get('admission_year')) != int(admission_year):
            return jsonify({
                'success': False,
                'error': 'Student details do not match'
            }), 401

        return jsonify({
            'success': True,
            'data': _build_portal_payload(student)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/student/<student_id>/overview', methods=['GET'])
def get_student_overview(student_id):
    """Get student portal overview."""
    try:
        student = StudentModel.get_student_by_student_id(student_id)
        if not student:
            return jsonify({
                'success': False,
                'error': 'Student not found'
            }), 404

        return jsonify({
            'success': True,
            'data': _build_portal_payload(student)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/parent/<student_id>/overview', methods=['GET'])
def get_parent_overview(student_id):
    """Get parent portal overview for a student."""
    try:
        student = StudentModel.get_student_by_student_id(student_id)
        if not student:
            return jsonify({
                'success': False,
                'error': 'Student not found'
            }), 404

        return jsonify({
            'success': True,
            'data': _build_portal_payload(student)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500