-- started database 7-22-2025 5:55 PM
CREATE SCHEMA capstone_smart_vehicle_detection;

USE capstone_smart_vehicle_detection;

SHOW TABLES;

-- drop kasi test plng
-- DROP TABLE IF EXISTS vehicle_aggregated;

SELECT COUNT(*) FROM vehicle_aggregated as v WHERE v.y = 30;

-- check entry
SELECT * FROM vehicle_aggregated;
-- check datatypes
SHOW CREATE TABLE vehicle_aggregated;