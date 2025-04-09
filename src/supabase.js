import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeexhybosnfwlzzwxnzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZXhoeWJvc25md2x6end4bnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjA1NzMsImV4cCI6MjA1OTM5NjU3M30.BrbStqJAXsJqywZlscY2sM0vvr8rrccM7jx4s3yYHd4'; // 기존 anon 키 그대로 사용

export const supabase = createClient(supabaseUrl, supabaseKey);
