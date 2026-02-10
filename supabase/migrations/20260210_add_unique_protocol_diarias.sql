-- Add unique constraint to protocol column in service_requests table
ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_protocol_key UNIQUE (protocol);
