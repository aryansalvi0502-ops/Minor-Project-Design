from datetime import datetime
from typing import Optional
from pydantic import ConfigDict, BaseModel, EmailStr, Field, model_validator

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(default="student", pattern="^(student|advisor|management|admin)$")
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(student|advisor|management|admin)$")

class Token(BaseModel):
    access_token: str
    token: Optional[str] = None
    token_type: str = "bearer"
    user: UserOut

    @model_validator(mode="before")
    @classmethod
    def set_token_alias(cls, data):
        if isinstance(data, dict):
            if "token" not in data and "access_token" in data:
                data["token"] = data["access_token"]
            elif "access_token" not in data and "token" in data:
                data["access_token"] = data["token"]
        return data

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
