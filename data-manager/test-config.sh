#!/bin/bash

# Test configuration script for Fisio Data Manager
# This script helps debug environment variable and database connection issues

set -e

echo "🔧 Fisio Data Manager - Configuration Test"
echo "=========================================="

# Check if .env files exist
echo ""
echo "📁 Checking for .env files:"
ENV_FILES=(".env" "../.env" "../../.env" ".env.local" "../.env.local")

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        echo "  ✅ Found: $env_file"
        echo "     Size: $(wc -c < "$env_file") bytes"
        echo "     Modified: $(stat -f "%Sm" "$env_file" 2>/dev/null || stat -c "%y" "$env_file" 2>/dev/null || echo "unknown")"
    else
        echo "  ❌ Not found: $env_file"
    fi
done

echo ""
echo "🔍 Checking environment variables:"

# Check common database environment variables
DB_VARS=("VITE_SUPABASE_DB_URL" "DATABASE_URL" "SUPABASE_DB_URL" "DB_URL")

for var in "${DB_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        # Mask the password in the URL for security
        masked_url=$(echo "${!var}" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
        echo "  ✅ $var = $masked_url"
    else
        echo "  ❌ $var = (not set)"
    fi
done

echo ""
echo "📍 Current working directory: $(pwd)"
echo "🏠 Home directory: $HOME"

# Check if Go is available
echo ""
echo "🔧 Go environment:"
if command -v go &> /dev/null; then
    echo "  ✅ Go version: $(go version)"
else
    echo "  ❌ Go not found in PATH"
fi

# Check if the executable exists
echo ""
echo "📦 Checking executables:"
EXECUTABLES=(
    "build/fisio-data-manager-linux-amd64"
    "build/fisio-data-manager-darwin-amd64"
    "build/fisio-data-manager-darwin-arm64"
    "build/fisio-data-manager-windows-amd64.exe"
    "fisio-data-manager"
)

for exe in "${EXECUTABLES[@]}"; do
    if [ -f "$exe" ]; then
        echo "  ✅ Found: $exe"
        echo "     Size: $(wc -c < "$exe") bytes"
    else
        echo "  ❌ Not found: $exe"
    fi
done

# Try to determine the correct executable for this platform
echo ""
echo "🎯 Platform detection:"
PLATFORM=$(uname -s)
ARCH=$(uname -m)
echo "  Platform: $PLATFORM"
echo "  Architecture: $ARCH"

case "$PLATFORM" in
    "Linux")
        if [ "$ARCH" = "x86_64" ]; then
            RECOMMENDED_EXE="build/fisio-data-manager-linux-amd64"
        else
            RECOMMENDED_EXE="build/fisio-data-manager-linux-$ARCH"
        fi
        ;;
    "Darwin")
        if [ "$ARCH" = "x86_64" ]; then
            RECOMMENDED_EXE="build/fisio-data-manager-darwin-amd64"
        elif [ "$ARCH" = "arm64" ]; then
            RECOMMENDED_EXE="build/fisio-data-manager-darwin-arm64"
        else
            RECOMMENDED_EXE="build/fisio-data-manager-darwin-amd64"
        fi
        ;;
    *)
        RECOMMENDED_EXE="build/fisio-data-manager-windows-amd64.exe"
        ;;
esac

echo "  Recommended executable: $RECOMMENDED_EXE"

# Test the executable if it exists
if [ -f "$RECOMMENDED_EXE" ]; then
    echo ""
    echo "🧪 Testing executable:"
    echo "  Command: $RECOMMENDED_EXE --help"
    
    if "$RECOMMENDED_EXE" --help > /dev/null 2>&1; then
        echo "  ✅ Executable runs successfully"
        
        # Test database connection
        echo ""
        echo "🗄️  Testing database connection:"
        echo "  Command: $RECOMMENDED_EXE videos categories --verbose"
        
        if "$RECOMMENDED_EXE" videos categories --verbose 2>&1; then
            echo "  ✅ Database connection successful"
        else
            echo "  ❌ Database connection failed"
            echo ""
            echo "💡 Troubleshooting tips:"
            echo "  1. Check that your .env file contains VITE_SUPABASE_DB_URL"
            echo "  2. Verify the database URL format: postgresql://user:password@host:port/database"
            echo "  3. Ensure the database is accessible from your network"
            echo "  4. Check that the service role key has the necessary permissions"
        fi
    else
        echo "  ❌ Executable failed to run"
    fi
else
    echo ""
    echo "❌ Recommended executable not found. Please build the project first:"
    echo "   ./build-data-manager.sh"
fi

echo ""
echo "📋 Summary:"
echo "  - Check that you have a .env file with VITE_SUPABASE_DB_URL"
echo "  - Build the project if executables are missing"
echo "  - Use --verbose flag for detailed output"
echo "  - Use --db-url flag to override environment variables"
echo ""
echo "🔗 For more help, see README.md"