from datetime import datetime, time
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.services.attendance_service import month_bounds, parse_month


def _hours(check_in: time | None, check_out: time | None) -> float:
    if check_in is None or check_out is None:
        return 0.0
    base = datetime(2000, 1, 1)
    delta = datetime.combine(base, check_out) - datetime.combine(base, check_in)
    return round(delta.total_seconds() / 3600, 2)


def export_month_xlsx(db: Session, month: str) -> tuple[bytes, str]:
    month_first = parse_month(month)
    start, end = month_bounds(month_first)

    rows = (
        db.query(AttendanceRecord, User)
        .join(User, User.id == AttendanceRecord.user_id)
        .filter(AttendanceRecord.date >= start, AttendanceRecord.date <= end)
        .order_by(User.full_name, AttendanceRecord.date)
        .all()
    )

    wb = Workbook()
    ws = wb.active
    ws.title = month_first.strftime("%Y-%m")

    headers = [
        "Employee",
        "Email",
        "Department",
        "Date",
        "Day Type",
        "Check In",
        "Check Out",
        "Hours",
        "Status",
        "Note",
    ]
    ws.append(headers)
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="2F4F8A")
    for cell in ws[1]:
        cell.font = header_font
        cell.fill = header_fill

    for rec, user in rows:
        ws.append(
            [
                user.full_name,
                user.email,
                user.department or "",
                rec.date.isoformat(),
                rec.day_type,
                rec.check_in.isoformat() if rec.check_in else "",
                rec.check_out.isoformat() if rec.check_out else "",
                _hours(rec.check_in, rec.check_out),
                rec.status,
                rec.note or "",
            ]
        )

    for col_idx, header in enumerate(headers, start=1):
        max_len = max(
            [len(str(header))]
            + [len(str(ws.cell(row=r, column=col_idx).value or "")) for r in range(2, ws.max_row + 1)]
        )
        ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = min(
            max_len + 2, 40
        )

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"cybrella-time-{month_first.strftime('%Y-%m')}.xlsx"
    return buf.read(), filename
