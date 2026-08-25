
-- Emergency & Help: contacts, police stations, village mapping

CREATE TABLE police_stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  district TEXT,
  mandal TEXT,
  address TEXT,
  phone TEXT,
  alternate_phone TEXT,
  latitude REAL,
  longitude REAL,
  jurisdiction TEXT,
  is_active INTEGER DEFAULT 1,
  verified_at DATETIME,
  verified_by TEXT,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE village_police_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  district TEXT NOT NULL,
  mandal TEXT NOT NULL,
  village TEXT NOT NULL,
  police_station_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (police_station_id) REFERENCES police_stations(id)
);

CREATE TABLE emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  district TEXT,
  mandal TEXT,
  village TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  jurisdiction TEXT,
  scope TEXT NOT NULL DEFAULT 'VILLAGE',
  is_emergency INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  verified_at DATETIME,
  verified_by TEXT,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_service ON emergency_contacts(service_type);
CREATE INDEX idx_emergency_scope ON emergency_contacts(scope);
CREATE INDEX idx_emergency_district ON emergency_contacts(district);
CREATE INDEX idx_emergency_mandal ON emergency_contacts(mandal);
CREATE INDEX idx_emergency_village ON emergency_contacts(village);
CREATE INDEX idx_emergency_active ON emergency_contacts(is_active);
CREATE INDEX idx_village_police ON village_police_mapping(district, mandal, village);
CREATE INDEX idx_police_station_district ON police_stations(district);
