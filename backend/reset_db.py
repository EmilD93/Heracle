import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def main():
    if not DATABASE_URL:
        print("DATABASE_URL not found in .env")
        return

    print("Connecting to database...")
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            print("Dropping existing tables...")
            cur.execute("DROP TABLE IF EXISTS notification_logs, notification_jobs, registrations, events, users CASCADE;")
            
            print("Running init.sql...")
            with open("init.sql", "r", encoding="utf-8") as f:
                cur.execute(f.read())
                
            print("Running seed.sql...")
            with open("seed.sql", "r", encoding="utf-8") as f:
                cur.execute(f.read())
                
            conn.commit()
    print("Database reset successfully.")

if __name__ == "__main__":
    main()
