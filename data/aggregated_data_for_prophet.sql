-- started database 7-22-2025 5:55 PM
CREATE SCHEMA capstone_smart_vehicle_detection;

USE capstone_smart_vehicle_detection;

SHOW TABLES;

-- drop kasi test plng
-- DROP TABLE IF EXISTS vehicle_aggregated;

SELECT COUNT(*) FROM vehicle_aggregated as v WHERE v.y = 30;

-- bawasan pa y value, divide by 2
-- SET SQL_SAFE_UPDATES = 0;

UPDATE vehicle_aggregated AS v
SET y = v.y / 2
WHERE v.y > 0;

-- SET SQL_SAFE_UPDATES = 1;

-- check entry
SELECT * FROM vehicle_aggregated;
-- check datatypes
SHOW CREATE TABLE vehicle_aggregated;