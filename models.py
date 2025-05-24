from . import db # Import db from the app package (app/__init__.py)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Asset(db.Model):
    __tablename__ = 'asset'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    location = db.Column(db.String)
    capacity = db.Column(db.String)
    status = db.Column(db.String, default='Operational')
    asset_type = db.Column(db.String, nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'asset',
        'polymorphic_on': asset_type
    }

class Dock(Asset):
    __tablename__ = 'dock'
    id = db.Column(db.Integer, db.ForeignKey('asset.id'), primary_key=True)
    water_depth = db.Column(db.Float)
    number_of_berths = db.Column(db.Integer)

    __mapper_args__ = {
        'polymorphic_identity': 'dock',
    }

class Yard(Asset):
    __tablename__ = 'yard'
    id = db.Column(db.Integer, db.ForeignKey('asset.id'), primary_key=True)
    area_sqm = db.Column(db.Float)
    surface_type = db.Column(db.String)

    __mapper_args__ = {
        'polymorphic_identity': 'yard',
    }

class Warehouse(Asset):
    __tablename__ = 'warehouse'
    id = db.Column(db.Integer, db.ForeignKey('asset.id'), primary_key=True)
    storage_capacity_cbm = db.Column(db.Float)
    has_climate_control = db.Column(db.Boolean, default=False)

    __mapper_args__ = {
        'polymorphic_identity': 'warehouse',
    }

class Inspection(db.Model):
    __tablename__ = 'inspection'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.id'), nullable=False)
    inspection_date = db.Column(db.DateTime, nullable=False, server_default=func.now())
    inspector_name = db.Column(db.String)
    notes = db.Column(db.Text)
    asset_relationship = relationship("Asset", backref="inspections")

class MaintenanceRecord(db.Model):
    __tablename__ = 'maintenance_record'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.id'), nullable=False)
    maintenance_date = db.Column(db.DateTime, nullable=False, server_default=func.now())
    description = db.Column(db.Text, nullable=False)
    cost = db.Column(db.Float)
    asset_relationship = relationship("Asset", backref="maintenance_records")
