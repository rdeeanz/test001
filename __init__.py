# This file makes the root directory a Python package.
from flask_sqlalchemy import SQLAlchemy

# Define db here. It will be initialized in app.py using app.init_app()
db = SQLAlchemy()

# Import the Flask app instance from app.py.
# This will also execute app.py, which configures the app and initializes db with it.
from .app import app
