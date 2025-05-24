import pytest
from app import app as flask_app, db as _db
from app.models import Asset, Dock, Yard, Warehouse, Inspection, MaintenanceRecord

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application."""
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing forms if any

    with flask_app.app_context():
        _db.create_all()

    yield flask_app

    with flask_app.app_context():
        _db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Creates a new database session for a test."""
    with app.app_context():
        # _db.session.begin_nested() # if using begin/commit/rollback per test
        yield _db.session
        _db.session.remove() # Clean up session
        # _db.session.rollback() # if using begin/commit/rollback per test
        # _db.drop_all() # This might be too slow if done for every test
        # _db.create_all() # Recreate schema if dropped per test, or ensure clean state
    
    # A more robust way to ensure a clean state for each test, if needed:
    # with app.app_context():
    #     _db.drop_all()
    #     _db.create_all()

# Fixture to clean database tables before each test that uses it
@pytest.fixture(autouse=True)
def clean_tables(db_session):
    """Ensure tables are clean before each test using this fixture."""
    # This might be redundant if db_session already handles this,
    # but can be used explicitly by tests needing a guaranteed clean state.
    for table in reversed(_db.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()
