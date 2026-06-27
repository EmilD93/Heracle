import os
from contextlib import contextmanager
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create a connection pool
# Note: we use dict_row so queries return dictionaries instead of tuples
pool = ConnectionPool(conninfo=DATABASE_URL, kwargs={"row_factory": dict_row}, min_size=1, max_size=10)

def get_db():
    with pool.connection() as conn:
        yield conn
