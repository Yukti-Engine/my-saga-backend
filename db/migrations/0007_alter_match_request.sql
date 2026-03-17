ALTER table match_Requests drop column is_active;
ALTER table match_requests add column is_active boolean default true;