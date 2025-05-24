from app.models import Asset, Dock, Yard, Warehouse
from flask import url_for

def test_home_route(client):
    """Test the home route returns 200 OK."""
    response = client.get(url_for('hello_world'))
    assert response.status_code == 200
    assert b"Port Asset Monitoring System" in response.data

def test_assets_route_empty(client):
    """Test /assets displays 'No assets found' when DB is empty."""
    response = client.get(url_for('list_assets'))
    assert response.status_code == 200
    assert b"No assets found" in response.data

def test_assets_route_with_data(client, db_session):
    """Test /assets displays asset information when assets exist."""
    dock = Dock(name="Test Dock", location="Test Port", capacity="100", water_depth=10, number_of_berths=1)
    db_session.add(dock)
    db_session.commit()

    response = client.get(url_for('list_assets'))
    assert response.status_code == 200
    assert b"No assets found" not in response.data
    assert b"Test Dock" in response.data
    assert b"Dock" in response.data # Asset Type
    assert b"Test Port" in response.data

def test_asset_detail_route_exists(client, db_session):
    """Test /asset/<asset_id> returns 200 and correct data for an existing asset."""
    yard = Yard(name="Test Yard", location="Test Zone", capacity="200", area_sqm=5000, surface_type="Gravel")
    db_session.add(yard)
    db_session.commit()

    response = client.get(url_for('view_asset', asset_id=yard.id))
    assert response.status_code == 200
    assert b"Test Yard" in response.data
    assert b"Yard" in response.data # Asset Type
    assert b"Test Zone" in response.data
    assert b"5000" in response.data # Area

def test_asset_detail_route_not_found(client):
    """Test /asset/<asset_id> returns 404 for a non-existent asset."""
    response = client.get(url_for('view_asset', asset_id=999))
    assert response.status_code == 404

def test_add_asset_get_route(client):
    """Test GET /asset/add returns 200 OK."""
    response = client.get(url_for('add_asset'))
    assert response.status_code == 200
    assert b"Add New Asset" in response.data

# Basic test for POST /asset/add (further tests would require form data and CSRF handling if enabled)
def test_add_asset_post_redirects(client):
    """Test POST /asset/add redirects (basic, no form data)."""
    # This test assumes the POST request will be made without actual form data,
    # and the route's current behavior is to redirect.
    # More complex tests would involve submitting form data.
    response = client.post(url_for('add_asset'))
    assert response.status_code == 302 # Expecting a redirect
    assert response.headers['Location'] == url_for('list_assets')

# Example of how you might test specific asset types if needed
def test_view_dock_details(client, db_session):
    dock = Dock(name="Specific Dock", location="Dock Port", capacity="300", water_depth=12.5, number_of_berths=3)
    db_session.add(dock)
    db_session.commit()
    
    response = client.get(url_for('view_asset', asset_id=dock.id))
    assert response.status_code == 200
    assert b"Specific Dock" in response.data
    assert b"12.5 m" in response.data # Water depth
    assert b"3" in response.data # Number of berths

def test_view_warehouse_details(client, db_session):
    warehouse = Warehouse(name="Specific Warehouse", location="Warehouse Area", capacity="400", storage_capacity_cbm=2000, has_climate_control=True)
    db_session.add(warehouse)
    db_session.commit()

    response = client.get(url_for('view_asset', asset_id=warehouse.id))
    assert response.status_code == 200
    assert b"Specific Warehouse" in response.data
    assert b"2000.0 cbm" in response.data # Storage Capacity
    assert b"Yes" in response.data # Climate Controlled
    
def test_view_yard_details(client, db_session):
    yard = Yard(name="Specific Yard", location="Yard Zone", capacity="500", area_sqm=10000, surface_type="Concrete")
    db_session.add(yard)
    db_session.commit()

    response = client.get(url_for('view_asset', asset_id=yard.id))
    assert response.status_code == 200
    assert b"Specific Yard" in response.data
    assert b"10000.0 sq m" in response.data # Area
    assert b"Concrete" in response.data # Surface Type
