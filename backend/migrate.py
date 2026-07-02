from app.database import get_db

db = next(get_db())
try:
    db.execute("ALTER TABLE events ADD COLUMN image TEXT DEFAULT 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000'")
    db.execute("ALTER TABLE events ADD COLUMN location VARCHAR(255) DEFAULT 'Main Campus'")
    db.execute("ALTER TABLE events ADD COLUMN category VARCHAR(100) DEFAULT 'Academic'")
    db.commit()
    print("Migration successful")
except Exception as e:
    db.rollback()
    print("Migration failed:", e)
