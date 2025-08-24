package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

type DB struct {
	*sql.DB
}

// Connect establishes a connection to the PostgreSQL database
func Connect() (*DB, error) {
	// Try multiple environment variable names in order of preference
	var dbURL string
	envVars := []string{
		"VITE_SUPABASE_DB_URL",
		"DATABASE_URL",
		"SUPABASE_DB_URL",
		"DB_URL",
		"db_url", // From command line flag
	}

	for _, envVar := range envVars {
		dbURL = viper.GetString(envVar)
		if dbURL != "" {
			if viper.GetBool("verbose") {
				log.Printf("Using database URL from %s", envVar)
			}
			break
		}
	}
	
	if dbURL == "" {
		return nil, fmt.Errorf(`database URL not provided. Please set one of the following:
  Environment variables: VITE_SUPABASE_DB_URL, DATABASE_URL, SUPABASE_DB_URL, or DB_URL
  Command line flag: --db-url "postgresql://user:password@host:port/database"
  Config file: Create a .env file with VITE_SUPABASE_DB_URL=your_database_url

Current working directory: %s
Checked environment variables: %v`, getCurrentDir(), envVars)
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if viper.GetBool("verbose") {
		log.Println("Successfully connected to database")
	}

	return &DB{db}, nil
}

// getCurrentDir returns a placeholder for the current directory
func getCurrentDir() string {
	return "current directory"
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}