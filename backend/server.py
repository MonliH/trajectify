from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache


from linkedin_api import Linkedin
import dotenv
import os

dotenv.load_dotenv(".env")

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = Linkedin(os.getenv("OUTLOOK_EMAIL"), os.getenv("OUTLOOK_PASSWORD"))

@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

@app.get("/get_profile")
@cache(expire=600)
async def get_profile(username: str):
    profile = api.get_profile(username)
    return profile

# class Profile(BaseModel):
#     experiences: Value

# @app.post("/predict_experience")
# async def predict_experience(data: Profile):
#     return {}
