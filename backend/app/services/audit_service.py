from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.audit import AuditEvent

def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> None:
    try:
        event = AuditEvent(
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            user_id=user_id,
            ip_address=ip_address,
            details=details or {}
        )
        db.add(event)
        db.commit()
    except Exception as e:
        db.rollback()
        # In audit systems, failures are logged rather than blocking operational threads
        print(f"[AUDIT LOG WARNING] Failed to record audit event '{action}': {e}")
