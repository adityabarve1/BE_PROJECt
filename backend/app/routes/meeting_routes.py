"""
Meeting and follow-up publication routes for teacher workflows
"""

import json
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request

from app.models.student import MeetingScheduleModel, StudentModel

bp = Blueprint('meetings', __name__, url_prefix='/api/meetings')


def _extract_meta_and_notes(outcome_value):
    outcome = str(outcome_value or '')
    if not outcome.startswith('META:'):
        return {}, outcome

    first_line, _, tail = outcome.partition('\n')
    raw_meta = first_line.replace('META:', '', 1)
    try:
        meta = json.loads(raw_meta)
    except json.JSONDecodeError:
        meta = {}
    return meta, tail


def _build_outcome_with_meta(meta, notes=''):
    encoded = json.dumps(meta, separators=(',', ':'))
    return f"META:{encoded}" + (f"\n{notes}" if notes else '')


def _parse_iso_datetime(value):
    if not value:
        return datetime.utcnow().isoformat()

    try:
        # Accept datetime-local format and standard ISO strings.
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return parsed.isoformat()
    except ValueError:
        raise ValueError('Invalid meeting_date format. Use ISO date-time format.')


@bp.route('/publish', methods=['POST'])
def publish_meeting_notice():
    """Publish meeting/follow-up info to all, class, or specific student."""
    try:
        data = request.get_json() or {}

        scope = data.get('scope')
        teacher_id = data.get('teacher_id')
        meeting_type = data.get('meeting_type', 'Follow-up')
        description = data.get('description')
        status = data.get('status', 'Scheduled')

        if scope not in ['all', 'class', 'student']:
            return jsonify({
                'success': False,
                'error': 'scope must be one of: all, class, student'
            }), 400

        if not teacher_id:
            return jsonify({
                'success': False,
                'error': 'teacher_id is required'
            }), 400

        if not description:
            return jsonify({
                'success': False,
                'error': 'description is required'
            }), 400

        meeting_date = _parse_iso_datetime(data.get('meeting_date'))

        target_students = []

        if scope == 'student':
            student_id = data.get('student_id')
            if not student_id:
                return jsonify({
                    'success': False,
                    'error': 'student_id is required for student scope'
                }), 400

            student = StudentModel.get_student_by_student_id(student_id)
            if not student:
                return jsonify({
                    'success': False,
                    'error': 'Student not found'
                }), 404
            target_students = [student]

        elif scope == 'class':
            class_name = data.get('class')
            admission_year = data.get('admission_year')

            if not class_name:
                return jsonify({
                    'success': False,
                    'error': 'class is required for class scope'
                }), 400

            if admission_year:
                target_students = StudentModel.get_students_by_class_and_year(class_name, int(admission_year))
            else:
                target_students = StudentModel.get_students_by_class(class_name)

        else:
            limit = int(data.get('limit', 2000))
            target_students = StudentModel.get_all_students(limit=limit, offset=0)

        if not target_students:
            return jsonify({
                'success': False,
                'error': 'No target students found for this scope'
            }), 404

        publication_id = str(uuid.uuid4())
        audience = 'all-students'
        if scope == 'class':
            audience = f"{data.get('class')}:{data.get('admission_year') or 'all'}"
        if scope == 'student':
            audience = data.get('student_id')

        meta = {
            'publication_id': publication_id,
            'scope': scope,
            'audience': audience,
            'published_at': datetime.utcnow().isoformat(),
        }

        records = [
            {
                'student_id': student['student_id'],
                'teacher_id': teacher_id,
                'meeting_date': meeting_date,
                'meeting_type': meeting_type,
                'description': description,
                'status': status,
                'outcome': _build_outcome_with_meta(meta),
            }
            for student in target_students
        ]

        inserted = MeetingScheduleModel.bulk_create_meetings(records)

        return jsonify({
            'success': True,
            'message': 'Meeting/follow-up published successfully',
            'data': {
                'publication_id': publication_id,
                'scope': scope,
                'meeting_type': meeting_type,
                'description': description,
                'meeting_date': meeting_date,
                'published_count': len(inserted),
                'target_student_ids': [student['student_id'] for student in target_students[:25]],
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/teacher/<teacher_id>', methods=['GET'])
def get_teacher_publications(teacher_id):
    """Get all published meetings/follow-ups by teacher."""
    try:
        limit = request.args.get('limit', 100, type=int)
        records = MeetingScheduleModel.get_teacher_meetings(teacher_id, limit=limit)

        grouped = {}
        for record in records:
            meta, _ = _extract_meta_and_notes(record.get('outcome'))
            publication_id = meta.get('publication_id') or f"single:{record.get('id')}"

            if publication_id not in grouped:
                grouped[publication_id] = {
                    'id': publication_id,
                    'publication_id': publication_id,
                    'scope': meta.get('scope', 'student'),
                    'audience': meta.get('audience', record.get('student_id')),
                    'meeting_type': record.get('meeting_type'),
                    'description': record.get('description'),
                    'meeting_date': record.get('meeting_date'),
                    'status': record.get('status'),
                    'created_at': record.get('created_at'),
                    'target_count': 0,
                    'acknowledged_count': 0,
                    'target_student_ids': [],
                }

            grouped_record = grouped[publication_id]
            grouped_record['target_count'] += 1
            student_id = record.get('student_id')
            if student_id and len(grouped_record['target_student_ids']) < 25:
                grouped_record['target_student_ids'].append(student_id)

            outcome_text = str(record.get('outcome') or '').lower()
            if 'acknowledged by' in outcome_text:
                grouped_record['acknowledged_count'] += 1

        publications = sorted(
            grouped.values(),
            key=lambda item: item.get('created_at') or '',
            reverse=True,
        )

        return jsonify({
            'success': True,
            'data': publications,
            'count': len(publications)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/teacher/<teacher_id>/summary', methods=['GET'])
def get_teacher_publication_summary(teacher_id):
    """Get professional-level summary for teacher communication analytics."""
    try:
        limit = request.args.get('limit', 2000, type=int)
        records = MeetingScheduleModel.get_teacher_meetings(teacher_id, limit=limit)

        by_status = {}
        by_type = {}
        by_class = {}
        acknowledged_count = 0

        for record in records:
            status = record.get('status') or 'Unknown'
            meeting_type = record.get('meeting_type') or 'Unknown'
            student_id = record.get('student_id')
            outcome = str(record.get('outcome') or '')

            by_status[status] = by_status.get(status, 0) + 1
            by_type[meeting_type] = by_type.get(meeting_type, 0) + 1

            if 'acknowledged' in outcome.lower():
                acknowledged_count += 1

            if student_id:
                student = StudentModel.get_student_by_student_id(student_id)
                class_name = (student or {}).get('class', 'Unknown')
                by_class[class_name] = by_class.get(class_name, 0) + 1

        total = len(records)

        return jsonify({
            'success': True,
            'data': {
                'total_published': total,
                'acknowledged_count': acknowledged_count,
                'pending_ack_count': max(total - acknowledged_count, 0),
                'acknowledgement_rate': round((acknowledged_count / total * 100), 2) if total else 0,
                'by_status': by_status,
                'by_type': by_type,
                'by_class': by_class,
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/teacher/<teacher_id>/publication/<publication_id>', methods=['DELETE'])
def delete_teacher_publication(teacher_id, publication_id):
    """Delete one teacher publication (all linked student rows for grouped publications)."""
    try:
        records = MeetingScheduleModel.get_teacher_meetings(teacher_id, limit=5000)
        to_delete = []

        for record in records:
            meta, _ = _extract_meta_and_notes(record.get('outcome'))
            record_publication_id = meta.get('publication_id') or f"single:{record.get('id')}"
            if record_publication_id == publication_id:
                to_delete.append(record.get('id'))

        if not to_delete:
            return jsonify({
                'success': False,
                'error': 'Publication not found'
            }), 404

        deleted = MeetingScheduleModel.delete_meetings_by_ids(to_delete)
        return jsonify({
            'success': True,
            'message': 'Publication deleted successfully',
            'data': {
                'deleted_count': len(deleted)
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/student/<student_id>/acknowledge', methods=['POST'])
def acknowledge_meeting(student_id):
    """Allow student/parent to acknowledge a meeting/follow-up item."""
    try:
        data = request.get_json() or {}
        meeting_id = data.get('meeting_id')
        acknowledged_by = data.get('acknowledged_by', 'parent')
        note = data.get('note', '')

        if not meeting_id:
            return jsonify({
                'success': False,
                'error': 'meeting_id is required'
            }), 400

        meeting = MeetingScheduleModel.get_meeting_by_id(meeting_id)
        if not meeting:
            return jsonify({
                'success': False,
                'error': 'Meeting record not found'
            }), 404

        if meeting.get('student_id') != student_id:
            return jsonify({
                'success': False,
                'error': 'Meeting does not belong to this student'
            }), 403

        ack_time = datetime.utcnow().isoformat()
        ack_text = f"Acknowledged by {acknowledged_by} at {ack_time}"
        if note:
            ack_text = f"{ack_text}. Note: {note}"

        meta, notes = _extract_meta_and_notes(meeting.get('outcome'))
        merged_notes = f"{notes}\n{ack_text}".strip() if notes else ack_text
        merged_outcome = _build_outcome_with_meta(meta, merged_notes) if meta else merged_notes

        updated = MeetingScheduleModel.update_meeting(
            meeting_id,
            {
                'status': 'Completed' if meeting.get('status') in ['Scheduled', 'Rescheduled'] else meeting.get('status'),
                'outcome': merged_outcome,
            }
        )

        return jsonify({
            'success': True,
            'message': 'Acknowledgement recorded',
            'data': updated
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500