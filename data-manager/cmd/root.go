package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "fisio-data-manager",
	Short: "Data management tool for the Online Physiotherapy Platform",
	Long: `A comprehensive data management tool for the Online Physiotherapy Platform.
	
This tool provides utilities for:
- Managing exercise videos and categories
- Exporting data for analysis
- Database seeding and maintenance
- Batch importing videos from CSV files

Examples:
  fisio-data-manager videos list
  fisio-data-manager videos add --title "Back Stretch" --url "https://youtube.com/watch?v=abc123"
  fisio-data-manager videos import videos.csv`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is .env)")
	rootCmd.PersistentFlags().String("db-url", "", "Database connection URL")
	rootCmd.PersistentFlags().String("supabase-url", "", "Supabase project URL")
	rootCmd.PersistentFlags().String("supabase-key", "", "Supabase service role key")
	rootCmd.PersistentFlags().Bool("verbose", false, "Enable verbose output")

	// Bind flags to viper
	viper.BindPFlag("db_url", rootCmd.PersistentFlags().Lookup("db-url"))
	viper.BindPFlag("supabase_url", rootCmd.PersistentFlags().Lookup("supabase-url"))
	viper.BindPFlag("supabase_key", rootCmd.PersistentFlags().Lookup("supabase-key"))
	viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	// Load .env files first (before viper config)
	loadEnvFiles()

	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Search for .env file in current directory and parent directories
		viper.AddConfigPath(".")
		viper.AddConfigPath("../..")
		viper.AddConfigPath("../../..")
		viper.SetConfigName(".env")
		viper.SetConfigType("env")
	}

	// Read in environment variables (this reads from system env, not .env files)
	viper.AutomaticEnv()

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil && viper.GetBool("verbose") {
		fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
	}
}

// loadEnvFiles loads .env files from multiple possible locations
func loadEnvFiles() {
	// Possible .env file locations (in order of preference)
	envPaths := []string{
		".env",                    // Current directory
		"../.env",                 // Parent directory (project root when running from scripts/data-manager)
		"../../.env",              // Two levels up
		".env.local",              // Local override
		"../.env.local",           // Parent local override
	}

	for _, envPath := range envPaths {
		if _, err := os.Stat(envPath); err == nil {
			if err := godotenv.Load(envPath); err == nil {
				if viper.GetBool("verbose") {
					fmt.Fprintf(os.Stderr, "Loaded environment file: %s\n", envPath)
				}
				// Don't break here - we want to load multiple .env files if they exist
				// Later files can override earlier ones
			}
		}
	}

	// Also try to find .env in the executable's directory
	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		envInExecDir := filepath.Join(execDir, ".env")
		if _, err := os.Stat(envInExecDir); err == nil {
			if err := godotenv.Load(envInExecDir); err == nil {
				if viper.GetBool("verbose") {
					fmt.Fprintf(os.Stderr, "Loaded environment file: %s\n", envInExecDir)
				}
			}
		}
	}
}