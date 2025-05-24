from app.models import Asset, Dock, Yard, Warehouse, Inspection, MaintenanceRecord
from datetime import datetime

def test_create_dock(db_session):
    """Test creating a Dock instance and saving to DB."""
    dock = Dock(
        name="Main Dock",
        location="Port A",
        capacity="1000 TEUs",
        status="Operational",
        water_depth=15.5,
        number_of_berths=4
    )
    db_session.add(dock)
    db_session.commit()

    retrieved_dock = Dock.query.filter_by(name="Main Dock").first()
    assert retrieved_dock is not None
    assert retrieved_dock.asset_type == "dock"
    assert retrieved_dock.water_depth == 15.5
    assert retrieved_dock.number_of_berths == 4
    assert retrieved_dock.status == "Operational"

def test_create_yard(db_session):
    """Test creating a Yard instance and saving to DB."""
    yard = Yard(
        name="Container Yard 1",
        location="Zone B",
        capacity="5000 TEUs",
        status="Operational",
        area_sqm=20000.0,
        surface_type="Concrete"
    )
    db_session.add(yard)
    db_session.commit()

    retrieved_yard = Yard.query.filter_by(name="Container Yard 1").first()
    assert retrieved_yard is not None
    assert retrieved_yard.asset_type == "yard"
    assert retrieved_yard.area_sqm == 20000.0
    assert retrieved_yard.surface_type == "Concrete"

def test_create_warehouse(db_session):
    """Test creating a Warehouse instance and saving to DB."""
    warehouse = Warehouse(
        name="Warehouse Alpha",
        location="Zone C",
        capacity="10000 CBM",
        status="Maintenance",
        storage_capacity_cbm=10000.0,
        has_climate_control=True
    )
    db_session.add(warehouse)
    db_session.commit()

    retrieved_warehouse = Warehouse.query.filter_by(name="Warehouse Alpha").first()
    assert retrieved_warehouse is not None
    assert retrieved_warehouse.asset_type == "warehouse"
    assert retrieved_warehouse.storage_capacity_cbm == 10000.0
    assert retrieved_warehouse.has_climate_control is True
    assert retrieved_warehouse.status == "Maintenance"

def test_create_inspection(db_session):
    """Test creating an Inspection and linking it to an Asset."""
    dock = Dock(name="Test Dock for Inspection", location="Test Port", capacity="N/A", water_depth=10.0, number_of_berths=2)
    db_session.add(dock)
    db_session.commit()

    inspection = Inspection(
        asset_id=dock.id,
        inspection_date=datetime.utcnow(),
        inspector_name="John Doe",
        notes="Routine check, all clear."
    )
    db_session.add(inspection)
    db_session.commit()

    retrieved_inspection = Inspection.query.filter_by(inspector_name="John Doe").first()
    assert retrieved_inspection is not None
    assert retrieved_inspection.asset_id == dock.id
    assert retrieved_inspection.notes == "Routine check, all clear."
    assert len(dock.inspections) == 1
    assert dock.inspections[0].inspector_name == "John Doe"

def test_create_maintenance_record(db_session):
    """Test creating a MaintenanceRecord and linking it to an Asset."""
    yard = Yard(name="Test Yard for Maintenance", location="Test Zone", capacity="N/A", area_sqm=5000.0, surface_type="Asphalt")
    db_session.add(yard)
    db_session.commit()

    maintenance = MaintenanceRecord(
        asset_id=yard.id,
        maintenance_date=datetime.utcnow(),
        description="Pothole repair",
        cost=500.00
    )
    db_session.add(maintenance)
    db_session.commit()

    retrieved_maintenance = MaintenanceRecord.query.filter_by(description="Pothole repair").first()
    assert retrieved_maintenance is not None
    assert retrieved_maintenance.asset_id == yard.id
    assert retrieved_maintenance.cost == 500.00
    assert len(yard.maintenance_records) == 1
    assert yard.maintenance_records[0].cost == 500.00

def test_polymorphic_asset_query(db_session):
    """Test querying Asset returns instances of Dock, Yard, Warehouse."""
    dock = Dock(name="PolyDock", location="PolyPort", asset_type="dock") # Explicitly set for clarity, though ORM handles it
    yard = Yard(name="PolyYard", location="PolyZone", asset_type="yard")
    warehouse = Warehouse(name="PolyWarehouse", location="PolyArea", asset_type="warehouse")

    db_session.add_all([dock, yard, warehouse])
    db_session.commit()

    assets = Asset.query.order_by(Asset.name).all()
    assert len(assets) == 3
    assert isinstance(assets[0], Dock)
    assert assets[0].name == "PolyDock"
    assert isinstance(assets[1], Warehouse) # Order by name: PolyDock, PolyWarehouse, PolyYard
    assert assets[1].name == "PolyWarehouse"
    assert isinstance(assets[2], Yard)
    assert assets[2].name == "PolyYard"

    # Verify asset_type is correctly set
    assert assets[0].asset_type == "dock"
    assert assets[1].asset_type == "warehouse"
    assert assets[2].asset_type == "yard"
