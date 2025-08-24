# Fisio Data Manager - Cross-platform build system
# This Makefile builds executables for multiple operating systems

# Application name
APP_NAME = fisio-data-manager

# Version (can be overridden)
VERSION ?= 1.0.0

# Build directory
BUILD_DIR = build

# Go build flags
LDFLAGS = -ldflags "-X main.version=$(VERSION) -s -w"

# Default target
.PHONY: all
all: clean build-all

# Clean build directory
.PHONY: clean
clean:
	@echo "🧹 Cleaning build directory..."
	@rm -rf $(BUILD_DIR)
	@mkdir -p $(BUILD_DIR)

# Build for all platforms
.PHONY: build-all
build-all: build-linux build-windows build-macos

# Build for Linux (amd64)
.PHONY: build-linux
build-linux:
	@echo "🐧 Building for Linux (amd64)..."
	@GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-linux-amd64 .

# Build for Linux (arm64)
.PHONY: build-linux-arm64
build-linux-arm64:
	@echo "🐧 Building for Linux (arm64)..."
	@GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-linux-arm64 .

# Build for Windows (amd64)
.PHONY: build-windows
build-windows:
	@echo "🪟 Building for Windows (amd64)..."
	@GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-windows-amd64.exe .

# Build for macOS (amd64)
.PHONY: build-macos
build-macos:
	@echo "🍎 Building for macOS (amd64)..."
	@GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-darwin-amd64 .

# Build for macOS (arm64 - Apple Silicon)
.PHONY: build-macos-arm64
build-macos-arm64:
	@echo "🍎 Building for macOS (arm64)..."
	@GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-darwin-arm64 .

# Build for current platform only
.PHONY: build-local
build-local:
	@echo "🔨 Building for current platform..."
	@go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME) .

# Install dependencies
.PHONY: deps
deps:
	@echo "📦 Installing dependencies..."
	@go mod download
	@go mod tidy

# Run tests
.PHONY: test
test:
	@echo "🧪 Running tests..."
	@go test -v ./...

# Run linter
.PHONY: lint
lint:
	@echo "🔍 Running linter..."
	@golangci-lint run

# Format code
.PHONY: fmt
fmt:
	@echo "✨ Formatting code..."
	@go fmt ./...

# Create release archives
.PHONY: package
package: build-all
	@echo "📦 Creating release packages..."
	@cd $(BUILD_DIR) && \
	tar -czf $(APP_NAME)-linux-amd64.tar.gz $(APP_NAME)-linux-amd64 && \
	tar -czf $(APP_NAME)-darwin-amd64.tar.gz $(APP_NAME)-darwin-amd64 && \
	zip $(APP_NAME)-windows-amd64.zip $(APP_NAME)-windows-amd64.exe
	@echo "✅ Release packages created in $(BUILD_DIR)/"

# Show build info
.PHONY: info
info:
	@echo "📋 Build Information:"
	@echo "  App Name: $(APP_NAME)"
	@echo "  Version:  $(VERSION)"
	@echo "  Go Version: $(shell go version)"
	@echo "  Build Dir: $(BUILD_DIR)"

# Development build (with debug info)
.PHONY: dev
dev:
	@echo "🔧 Building development version..."
	@go build -o $(BUILD_DIR)/$(APP_NAME)-dev .

# Install locally (requires sudo on some systems)
.PHONY: install
install: build-local
	@echo "📥 Installing $(APP_NAME) to /usr/local/bin..."
	@sudo cp $(BUILD_DIR)/$(APP_NAME) /usr/local/bin/
	@echo "✅ Installation complete!"

# Uninstall
.PHONY: uninstall
uninstall:
	@echo "🗑️  Uninstalling $(APP_NAME)..."
	@sudo rm -f /usr/local/bin/$(APP_NAME)
	@echo "✅ Uninstallation complete!"

# Help
.PHONY: help
help:
	@echo "🚀 Fisio Data Manager Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  all           - Clean and build for all platforms"
	@echo "  build-all     - Build for all platforms"
	@echo "  build-linux   - Build for Linux (amd64)"
	@echo "  build-windows - Build for Windows (amd64)"
	@echo "  build-macos   - Build for macOS (amd64)"
	@echo "  build-local   - Build for current platform"
	@echo "  clean         - Clean build directory"
	@echo "  deps          - Install dependencies"
	@echo "  test          - Run tests"
	@echo "  lint          - Run linter"
	@echo "  fmt           - Format code"
	@echo "  package       - Create release packages"
	@echo "  dev           - Build development version"
	@echo "  install       - Install locally"
	@echo "  uninstall     - Uninstall"
	@echo "  info          - Show build information"
	@echo "  help          - Show this help"
	@echo ""
	@echo "Examples:"
	@echo "  make all                    # Build for all platforms"
	@echo "  make build-local            # Build for current platform"
	@echo "  make VERSION=1.2.0 package # Build and package version 1.2.0"