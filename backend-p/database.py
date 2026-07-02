"""
Shared database connection pool and FastAPI dependency.
Mirrors the pattern from backend/app/database.py on the main branch.
"""
import os
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

# Load .env from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# Create a connection pool (dict_row so queries return dictionaries)
pool = ConnectionPool(
    conninfo=DATABASE_URL,
    kwargs={"row_factory": dict_row},
    min_size=1,
    max_size=10,
)


def get_db():
    """FastAPI dependency that yields a database connection from the pool."""
    with pool.connection() as conn:
        yield conn
