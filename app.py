from flask import Flask, render_template, request, redirect, url_for
import os

# Import db from the app package (__init__.py)
from . import db
# Import models - they need db to be defined (but not necessarily initialized)
from .models import Asset, Dock, Yard, Warehouse, Inspection, MaintenanceRecord

app = Flask(__name__)

# Ensure instance_path is set
# Note: app.root_path might not be what's expected if app is created elsewhere (e.g. tests)
# For now, assuming app.py is the entry point or root_path is correctly set.
instance_path = os.path.join(app.root_path, 'instance')
if not os.path.exists(instance_path):
    try:
        os.makedirs(instance_path)
    except OSError as e:
        if not os.path.isdir(instance_path):
            raise
app.instance_path = instance_path

# Configure the app
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Recommended to disable

# Initialize db with the app
db.init_app(app)


@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/assets')
def list_assets():
    assets = Asset.query.all()
    return render_template('assets.html', assets=assets)

@app.route('/asset/<int:asset_id>')
def view_asset(asset_id):
    # Using get_or_404 to automatically return a 404 if asset not found
    asset = db.get_or_404(Asset, asset_id)
    return render_template('asset_detail.html', asset=asset)

@app.route('/asset/add', methods=['GET', 'POST'])
def add_asset():
    if request.method == 'POST':
        # Logic for processing the form and adding to DB will be implemented later
        # For now, redirect to assets list
        return redirect(url_for('list_assets'))
    return render_template('add_asset_form.html')

def create_tables():
    with app.app_context():
        db.create_all()
    print("Database tables created.")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'create_db':
        create_tables()
    else:
        app.run(debug=True)
