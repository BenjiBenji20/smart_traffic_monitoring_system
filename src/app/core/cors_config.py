from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.app.core.address import CLIENT_ORIGINS

def cors_middleware(app: FastAPI):
  app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], # GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["Authorization", "Content-Type"] # Authorization, Content-Type, etc.
  )