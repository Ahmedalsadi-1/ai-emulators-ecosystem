-- Initialize databases for AI ecosystem services
-- This script runs during PostgreSQL container initialization

-- Create databases for each service
CREATE DATABASE aios;
CREATE DATABASE bytebot;
CREATE DATABASE factif;
CREATE DATABASE postiz;
CREATE DATABASE onlysnarf;

-- Create users for each service
CREATE USER aios WITH PASSWORD 'password';
CREATE USER bytebot WITH PASSWORD 'password';
CREATE USER factif WITH PASSWORD 'password';
CREATE USER postiz WITH PASSWORD 'password';
CREATE USER onlysnarf WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aios TO aios;
GRANT ALL PRIVILEGES ON DATABASE bytebot TO bytebot;
GRANT ALL PRIVILEGES ON DATABASE factif TO factif;
GRANT ALL PRIVILEGES ON DATABASE postiz TO postiz;
GRANT ALL PRIVILEGES ON DATABASE onlysnarf TO onlysnarf;

-- Grant privileges on unified_framework for admin access
GRANT ALL PRIVILEGES ON DATABASE unified_framework TO aios;
GRANT ALL PRIVILEGES ON DATABASE unified_framework TO bytebot;
GRANT ALL PRIVILEGES ON DATABASE factif TO factif;
GRANT ALL PRIVILEGES ON DATABASE postiz TO postiz;
GRANT ALL PRIVILEGES ON DATABASE unified_framework TO onlysnarf;