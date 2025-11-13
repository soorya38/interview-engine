```mermaid
    USERS ||--o{ INTERVIEW_SESSIONS : "has"
    USERS ||--o{ SCORES : "receives"
    USERS ||--o{ TOPIC_CATEGORIES : "creates"
    USERS ||--o{ TESTS : "creates"
    USERS ||--o{ QUESTIONS : "creates"
    
    TOPIC_CATEGORIES ||--o{ QUESTIONS : "contains"
    
    TESTS ||--o{ INTERVIEW_SESSIONS : "used_in"
    
    INTERVIEW_SESSIONS ||--o{ INTERVIEW_TURNS : "contains"
    INTERVIEW_SESSIONS ||--|| SCORES : "has"
    
    QUESTIONS ||--o{ INTERVIEW_TURNS : "answered_in"

    USERS {
        uuid id PK
        varchar username UK "unique"
        text password "bcrypt hashed"
        varchar role "user|admin|instructor"
        text full_name
        varchar email
        jsonb profile_data "bio, skills, experience, education"
        timestamp created_at
    }

    TOPIC_CATEGORIES {
        uuid id PK
        varchar name
        text description
        varchar icon_name
        uuid created_by FK
        timestamp created_at
    }

    TESTS {
        uuid id PK
        varchar name
        text description
        jsonb question_ids "array of question UUIDs"
        integer duration "minutes"
        varchar difficulty "easy|medium|hard"
        boolean is_active
        uuid created_by FK
        timestamp created_at
    }

    QUESTIONS {
        uuid id PK
        uuid topic_category_id FK
        text question_text
        varchar difficulty "easy|medium|hard"
        jsonb expected_key_points "array of strings"
        uuid created_by FK
        timestamp created_at
    }

    INTERVIEW_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid test_id FK
        varchar status "in_progress|completed|abandoned"
        integer current_question_index
        jsonb question_ids "array of question UUIDs"
        timestamp started_at
        timestamp completed_at
    }

    INTERVIEW_TURNS {
        uuid id PK
        uuid session_id FK
        uuid question_id FK
        integer turn_number
        text user_answer
        text ai_response
        jsonb evaluation "grammar, technical, depth, communication, feedback, strengths, areasToImprove, recommendations"
        timestamp created_at
    }

    SCORES {
        uuid id PK
        uuid session_id FK "unique"
        uuid user_id FK
        integer grammar_score "0–100"
        integer technical_score "0–100"
        integer depth_score "0–100"
        integer communication_score "0–100"
        integer total_score "0–100"
        varchar grade "A|B|C|D|F"
        jsonb detailed_feedback "strengths, improvements, recommendations"
        timestamp created_at
    }
```