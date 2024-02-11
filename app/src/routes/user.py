from auth import get_student_id
from db import get_session
from fastapi import APIRouter, Depends, HTTPException
from models import User
from sqlmodel import Session

router = APIRouter()


@router.get("/user", response_model=User)
def get_user(*, session: Session = Depends(get_session), token: str) -> User:
    student_id = get_student_id(token)

    user = session.get(User, student_id)
    if not user:
        raise HTTPException(404)
    return user
