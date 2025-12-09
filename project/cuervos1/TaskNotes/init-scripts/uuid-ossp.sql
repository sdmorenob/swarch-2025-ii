-- Enable uuid-ossp extension in the default database for this container
-- This script is mounted into /docker-entrypoint-initdb.d/ for each Postgres service
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";