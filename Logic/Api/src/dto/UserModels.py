from pydantic import BaseModel


class User(BaseModel):
    username: str
    enabled: bool
    role: str


class UserInDB(User):
    hashed_password: str
