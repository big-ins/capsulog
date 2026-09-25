-- Migration number: 0007 	 2026-09-25
-- リマインドは Web Push で送る。iCal の購読 URL に載せていたトークンは使わない

ALTER TABLE users DROP COLUMN icalToken;
