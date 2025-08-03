-- started database 7-22-2025 5:55 PM
CREATE SCHEMA capstone_smart_vehicle_detection;

USE capstone_smart_vehicle_detection;

SHOW TABLES;

-- drop kasi test plng
-- DROP TABLE IF EXISTS prophet_trainig_data;

SELECT COUNT(*) FROM prophet_trainig_data as v WHERE v.y = 30;

-- bawasan pa y value, divide by 2
-- SET SQL_SAFE_UPDATES = 0;

UPDATE prophet_trainig_data AS v
SET y = v.y / 2
WHERE v.y > 0;

-- SET SQL_SAFE_UPDATES = 1;

-- check entry
SELECT * FROM prophet_trainig_data;
-- check datatypes
SHOW CREATE TABLE prophet_trainig_data;
SHOW TABLEs;
SELECT * FROM users;