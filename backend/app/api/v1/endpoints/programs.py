from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.services.academic_service import ProgramService
from app.schemas.academic import ProgramCreateRequest, ProgramUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/programs", tags=["Programs"])

@router.post("")
def create_program(
    request: ProgramCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    program, error = ProgramService.create(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": program.id,
        "name": program.name,
        "code": program.code,
        "department_id": program.department_id
    }, "Program created successfully", status_code=201)

@router.get("")
def get_programs(
    department_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    programs = ProgramService.get_all(db, department_id)
    data = [{
        "id": p.id,
        "name": p.name,
        "code": p.code,
        "department_id": p.department_id,
        "department_name": p.department.name if p.department else None,
        "duration_years": p.duration_years,
        "total_credit_hours": p.total_credit_hours,
        "degree_type": p.degree_type
    } for p in programs]

    return success_response({"programs": data}, "Programs retrieved")

@router.get("/{program_id}")
def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    program = ProgramService.get_by_id(db, program_id)
    if not program:
        return error_response("Program not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": program.id,
        "name": program.name,
        "code": program.code,
        "department_name": program.department.name if program.department else None,
        "duration_years": program.duration_years,
        "total_credit_hours": program.total_credit_hours,
        "degree_type": program.degree_type,
        "total_courses": len(program.courses)
    })

@router.put("/{program_id}")
def update_program(
    program_id: int,
    request: ProgramUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    program, error = ProgramService.update(
        db, program_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Program updated successfully")

@router.delete("/{program_id}")
def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    program = ProgramService.get_by_id(db, program_id)
    if not program:
        return error_response("Program not found", "NOT_FOUND", status_code=404)
    
    try:
        db.delete(program)
        db.commit()
        return success_response(message="Program deleted successfully")
    except Exception as e:
        db.rollback()
        return error_response("Cannot delete — program may have enrolled students", "DELETE_FAILED", status_code=400)