-- Database Schema for Student Dropout Prediction System
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    auth_uid VARCHAR(255) UNIQUE, -- Supabase Auth UID
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL, -- Generated ID: JP{YEAR}{CLASS}{ROLL}
    student_name VARCHAR(255) NOT NULL,
    roll_no INTEGER NOT NULL,
    admission_year INTEGER NOT NULL,
    date_of_birth DATE,
    password_hash VARCHAR(255) DEFAULT 'PASS@2026', -- Default password
    attendance DECIMAL(5,2) DEFAULT 0 CHECK (attendance >= 0 AND attendance <= 100),
    marks DECIMAL(5,2) DEFAULT 0 CHECK (marks >= 0 AND marks <= 100),
    income VARCHAR(50) CHECK (income IN ('Low', 'Medium', 'High')),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female')),
    class VARCHAR(10) NOT NULL,
    parent_occupation VARCHAR(100),
    location VARCHAR(50) CHECK (location IN ('Rural', 'Urban', 'City')),
    dropout_risk VARCHAR(20) CHECK (dropout_risk IN ('Low', 'High')),
    risk_score DECIMAL(5,4) CHECK (risk_score >= 0 AND risk_score <= 1),
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(admission_year, class, roll_no)
);

-- Document Uploads Table
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('admission', 'attendance', 'results')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    class VARCHAR(10) NOT NULL,
    admission_year INTEGER,
    records_processed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prediction History Table
CREATE TABLE IF NOT EXISTS prediction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL,
    dropout_risk VARCHAR(20) NOT NULL CHECK (dropout_risk IN ('Low', 'High')),
    risk_score DECIMAL(5,4) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Interventions Table
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL,
    intervention_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Meeting Schedule Table (SDPS)
CREATE TABLE IF NOT EXISTS meeting_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES teachers(id),
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_auth_uid ON teachers(auth_uid);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_dropout_risk ON students(dropout_risk);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_admission_year ON students(admission_year);
CREATE INDEX IF NOT EXISTS idx_students_location ON students(location);
CREATE INDEX IF NOT EXISTS idx_prediction_history_student_id ON prediction_history(student_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at ON prediction_history(created_at);
CREATE INDEX IF NOT EXISTS idx_interventions_student_id ON interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_document_uploads_teacher_id ON document_uploads(teacher_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(status);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_student_id ON meeting_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_teacher_id ON meeting_schedules(teacher_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at
    BEFORE UPDATE ON interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_schedules_updated_at
    BEFORE UPDATE ON meeting_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for teachers table
CREATE POLICY "Allow public read access to teachers" 
    ON teachers FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert teachers" 
    ON teachers FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update teachers" 
    ON teachers FOR UPDATE 
    USING (true);

-- Policies for students table
CREATE POLICY "Allow public read access to students" 
    ON students FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert students" 
    ON students FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update students" 
    ON students FOR UPDATE 
    USING (true);

CREATE POLICY "Allow authenticated users to delete students" 
    ON students FOR DELETE 
    USING (true);

-- Policies for document_uploads table
CREATE POLICY "Allow teachers to read their own uploads" 
    ON document_uploads FOR SELECT 
    USING (true);

CREATE POLICY "Allow teachers to insert uploads" 
    ON document_uploads FOR INSERT 
    WITH CHECK (true);

-- Policies for meeting_schedules table
CREATE POLICY "Allow public read access to meeting_schedules" 
    ON meeting_schedules FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert meetings" 
    ON meeting_schedules FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update meetings" 
    ON meeting_schedules FOR UPDATE 
    USING (true);

-- Policies for prediction_history table
CREATE POLICY "Allow public read access to prediction_history" 
    ON prediction_history FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert prediction_history" 
    ON prediction_history FOR INSERT 
    WITH CHECK (true);

-- Policies for interventions table
CREATE POLICY "Allow public read access to interventions" 
    ON interventions FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to insert interventions" 
    ON interventions FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update interventions" 
    ON interventions FOR UPDATE 
    USING (true);

CREATE POLICY "Allow authenticated users to delete interventions" 
    ON interventions FOR DELETE 
    USING (true);

-- Views for common queries

-- Views for common queries

-- View for high-risk students
CREATE OR REPLACE VIEW high_risk_students AS
SELECT 
    s.*,
    COUNT(ph.id) as prediction_count,
    MAX(ph.created_at) as last_prediction_date
FROM students s
LEFT JOIN prediction_history ph ON s.student_id = ph.student_id
WHERE s.dropout_risk = 'High'
GROUP BY s.id, s.student_id, s.student_name, s.roll_no, s.admission_year, s.date_of_birth, 
         s.password_hash, s.attendance, s.marks, s.income, s.gender, s.class, 
         s.parent_occupation, s.location, s.dropout_risk, s.risk_score, 
         s.created_by, s.created_at, s.updated_at;

-- View for student statistics by class
CREATE OR REPLACE VIEW class_statistics AS
SELECT 
    class,
    COUNT(*) as total_students,
    COUNT(CASE WHEN dropout_risk = 'High' THEN 1 END) as high_risk_count,
    COUNT(CASE WHEN dropout_risk = 'Low' THEN 1 END) as low_risk_count,
    AVG(attendance) as avg_attendance,
    AVG(marks) as avg_marks
FROM students
GROUP BY class
ORDER BY class;

-- View for location-wise statistics
CREATE OR REPLACE VIEW location_statistics AS
SELECT 
    location,
    COUNT(*) as total_students,
    COUNT(CASE WHEN dropout_risk = 'High' THEN 1 END) as high_risk_count,
    ROUND(COUNT(CASE WHEN dropout_risk = 'High' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as risk_percentage
FROM students
GROUP BY location
ORDER BY high_risk_count DESC;
