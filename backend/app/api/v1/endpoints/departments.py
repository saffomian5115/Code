from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.services.academic_service import DepartmentService
from app.schemas.academic import DepartmentCreateRequest, DepartmentUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.post("")
def create_department(
    request: DepartmentCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    dept, error = DepartmentService.create(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": dept.id,
        "name": dept.name,
        "code": dept.code
    }, "Department created successfully", status_code=201)

@router.get("")
def get_departments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    departments = DepartmentService.get_all(db)
    data = [{
        "id": d.id,
        "name": d.name,
        "code": d.code,
        "description": d.description,
        "hod_name": d.hod.full_name if d.hod else None,
        "total_programs": len(d.programs)
    } for d in departments]

    return success_response({"departments": data}, "Departments retrieved")

@router.get("/{dept_id}")
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    dept = DepartmentService.get_by_id(db, dept_id)
    if not dept:
        return error_response("Department not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "description": dept.description,
        "hod_name": dept.hod.full_name if dept.hod else None,
        "programs": [{"id": p.id, "name": p.name, "code": p.code} for p in dept.programs]
    })

@router.put("/{dept_id}")
def update_department(
    dept_id: int,
    request: DepartmentUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    dept, error = DepartmentService.update(
        db, dept_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Department updated successfully")

@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    success, error = DepartmentService.delete(db, dept_id)
    if not success:
        return error_response(error, "DELETE_FAILED", status_code=400)

    return success_response(message="Department deleted successfully")