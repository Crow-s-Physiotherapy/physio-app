# Fisio Data Manager

A comprehensive command-line tool for managing data in the Online Physiotherapy Platform. This tool provides utilities for managing exercise videos, viewing appointment data, handling donations, and performing database maintenance tasks.

## Features

- **Exercise Video Management**: Add, update, delete, and list exercise videos and categories
- **Batch CSV Import**: Import multiple videos from CSV files with validation and error handling
- **Donation Management**: View donation statistics and export data
- **Cross-Platform**: Builds to native executables for Windows, macOS, and Linux
- **Multiple Output Formats**: Support for table, JSON, and CSV output formats
- **Database Seeding**: Populate database with sample data for testing

## Installation

### Pre-built Binaries

Download the appropriate binary for your operating system from the releases page:

- **Linux**: `fisio-data-manager-linux-amd64`
- **macOS**: `fisio-data-manager-darwin-amd64` (Intel) or `fisio-data-manager-darwin-arm64` (Apple Silicon)
- **Windows**: `fisio-data-manager-windows-amd64.exe`

### Build from Source

Requirements:
- Go 1.21 or later
- Access to the project database

```bash
# Clone the repository
git clone <repository-url>
cd scripts/data-manager

# Install dependencies
make deps

# Build for your platform
make build-local

# Or build for all platforms
make build-all
```

## Configuration

The tool requires database connection information. You can provide this in several ways:

### Environment Variables

Create a `.env` file in the project root or set these environment variables:

```bash
VITE_SUPABASE_DB_URL=postgresql://user:password@host:port/database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Command Line Flags

```bash
./fisio-data-manager --db-url "postgresql://user:password@host:port/database" videos list
```

### Configuration File

You can specify a custom configuration file:

```bash
./fisio-data-manager --config /path/to/config.env videos list
```

## Usage

### CSV Import Format

For batch video imports, the CSV file should have the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| title | Yes | Video title | "Back Stretch Routine" |
| description | No | Video description | "Gentle stretching for lower back" |
| youtube_url | Yes | Full YouTube URL | "https://youtube.com/watch?v=abc123" |
| category_name | Yes | Category name (must exist) | "Back & Spine" |
| difficulty | No | Difficulty level | "beginner", "intermediate", "advanced" |
| duration | No | Duration in minutes | "10" |
| equipment | No | Semicolon-separated list | "Yoga Mat;Resistance Bands" |
| body_parts | No | Semicolon-separated list | "Back;Core;Legs" |
| tags | No | Semicolon-separated list | "stretching;back pain" |
| active | No | Is active (default: true) | "true", "false" |

**Example CSV:**
```csv
title,description,youtube_url,category_name,difficulty,duration,equipment,body_parts,tags,active
"Back Stretch Routine","Gentle stretching for lower back","https://youtube.com/watch?v=abc123","Back & Spine",beginner,10,"Yoga Mat","Back;Core","stretching;back pain",true
"Shoulder Mobility","Improve shoulder range of motion","https://youtube.com/watch?v=def456","Neck & Shoulders",intermediate,15,"None","Shoulders;Arms","mobility;shoulders",true
```

### Exercise Videos

#### List Videos

```bash
# List all videos
./fisio-data-manager videos list

# Filter by category
./fisio-data-manager videos list --category "category-id"

# Filter by difficulty
./fisio-data-manager videos list --difficulty beginner

# Output as JSON
./fisio-data-manager videos list --format json

# Output as CSV
./fisio-data-manager videos list --format csv
```

#### Add Video

```bash
./fisio-data-manager videos add \
  --title "Back Stretch Routine" \
  --description "A gentle stretching routine for lower back pain" \
  --url "https://www.youtube.com/watch?v=abc123" \
  --category-id "category-uuid" \
  --difficulty beginner \
  --duration 10 \
  --equipment "Yoga Mat" \
  --body-parts "Back,Core" \
  --tags "stretching,back pain"
```

#### Update Video

```bash
./fisio-data-manager videos update video-id \
  --title "Updated Title" \
  --difficulty intermediate
```

#### Delete Video

```bash
# Delete by video ID
./fisio-data-manager videos delete video-id

# Delete by YouTube URL (auto-detected)
./fisio-data-manager videos delete "https://youtube.com/watch?v=abc123"

# Explicitly delete by URL
./fisio-data-manager videos delete "https://youtube.com/watch?v=abc123" --by-url
```

#### List Categories

```bash
# List all categories
./fisio-data-manager videos categories

# Output as JSON
./fisio-data-manager videos categories --format json
```

#### Seed Sample Data

```bash
./fisio-data-manager videos seed
```

#### Batch Import from CSV

```bash
# Generate a CSV template
./fisio-data-manager videos template --output videos.csv

# Generate template with examples
./fisio-data-manager videos template --output videos.csv --with-examples

# Import videos from CSV (dry run first)
./fisio-data-manager videos import videos.csv --dry-run

# Import videos from CSV
./fisio-data-manager videos import videos.csv

# Import with error handling (continue on errors)
./fisio-data-manager videos import videos.csv --skip-errors
```



### Donations

#### List Donations

```bash
# List all donations
./fisio-data-manager donations list

# Filter by date range
./fisio-data-manager donations list --from 2024-01-01 --to 2024-01-31

# Filter by status
./fisio-data-manager donations list --status completed

# Limit results
./fisio-data-manager donations list --limit 10
```

#### Donation Statistics

```bash
./fisio-data-manager donations stats
```

#### Top Donors

```bash
# Top 10 donors (default)
./fisio-data-manager donations top-donors

# Top 25 donors
./fisio-data-manager donations top-donors --limit 25
```

#### Search Donations

```bash
./fisio-data-manager donations search "john doe"
```

#### Export Donations

```bash
# Export all donations to CSV
./fisio-data-manager donations export

# Export with date filter
./fisio-data-manager donations export --from 2024-01-01 --to 2024-01-31

# Export by status
./fisio-data-manager donations export --status completed
```

## Output Formats

The tool supports multiple output formats:

- **table** (default): Human-readable table format
- **json**: JSON format for programmatic use
- **csv**: CSV format for spreadsheet applications

Example:
```bash
./fisio-data-manager videos list --format json > videos.json
./fisio-data-manager donations export --format csv > donations.csv
```

## Examples

### Daily Operations

```bash
# View recent donations
./fisio-data-manager donations list --limit 5

# Add a new exercise video
./fisio-data-manager videos add \
  --title "Shoulder Mobility" \
  --url "https://youtube.com/watch?v=xyz789" \
  --category-id "shoulders-category-id" \
  --difficulty beginner

# Import videos from CSV
./fisio-data-manager videos import my_videos.csv

# Delete video by URL
./fisio-data-manager videos delete "https://youtube.com/watch?v=abc123"
```

### Data Analysis

```bash
# Export video data for analysis
./fisio-data-manager videos list --format csv > videos.csv

# Get donation statistics
./fisio-data-manager donations stats

# Export donations for accounting
./fisio-data-manager donations export --from 2024-01-01 --to 2024-12-31 > donations-2024.csv
```

### Database Maintenance

```bash
# Seed database with sample videos
./fisio-data-manager videos seed

# Generate CSV template for batch import
./fisio-data-manager videos template --with-examples

# Import videos from CSV file
./fisio-data-manager videos import videos.csv --dry-run  # Preview first
./fisio-data-manager videos import videos.csv            # Actual import

# List all video categories
./fisio-data-manager videos categories

# Check donation statistics
./fisio-data-manager donations stats
```

## Development

### Building

```bash
# Install dependencies
make deps

# Build for current platform
make build-local

# Build for all platforms
make build-all

# Create release packages
make package
```

### Testing

```bash
# Run tests
make test

# Format code
make fmt

# Run linter (requires golangci-lint)
make lint
```

## Troubleshooting

### Quick Configuration Test

Run the configuration test script to diagnose issues:

```bash
cd scripts/data-manager
./test-config.sh
```

This will check:
- .env file locations and contents
- Environment variables
- Executable availability
- Database connectivity

### Database Connection Issues

**Error: "database URL not provided"**

The tool looks for database URLs in this order:
1. `VITE_SUPABASE_DB_URL` environment variable
2. `DATABASE_URL` environment variable  
3. `SUPABASE_DB_URL` environment variable
4. `DB_URL` environment variable
5. `--db-url` command line flag

**Solutions:**
1. Create a `.env` file in the project root:
   ```bash
   VITE_SUPABASE_DB_URL=postgresql://postgres:password@host:5432/database
   ```

2. Or use the command line flag:
   ```bash
   ./fisio-data-manager --db-url "postgresql://user:password@host:port/database" videos list
   ```

3. Or set environment variable directly:
   ```bash
   export VITE_SUPABASE_DB_URL="postgresql://user:password@host:port/database"
   ./fisio-data-manager videos list
   ```

**Environment File Locations:**

The tool searches for `.env` files in these locations (in order):
- Current directory (`.env`)
- Parent directory (`../.env`) 
- Two levels up (`../../.env`)
- Local overrides (`.env.local`, `../.env.local`)
- Executable directory

### Permission Errors

If you get permission errors when running the tool:

```bash
# Make the binary executable (Linux/macOS)
chmod +x fisio-data-manager

# Or run with explicit permissions
./fisio-data-manager --help
```

### Build Issues

If executables are missing:

```bash
# Build for all platforms
./build-data-manager.sh

# Or build for current platform only
cd scripts/data-manager
make build-local
```

### Verbose Output

Use the `--verbose` flag for detailed debugging information:

```bash
./fisio-data-manager --verbose videos list
```

This will show:
- Which .env files are loaded
- Which environment variables are used
- Database connection details
- Detailed error messages

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Verify your database connection and permissions
3. Use the `--verbose` flag for detailed output
4. Check the application logs for error messages

## License

This tool is part of the Online Physiotherapy Platform project.