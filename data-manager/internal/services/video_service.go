package services

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"

	"fisio-data-manager/internal/database"
	"fisio-data-manager/internal/models"
	"github.com/lib/pq"
)

type VideoService struct {
	db *database.DB
}

func NewVideoService(db *database.DB) *VideoService {
	return &VideoService{db: db}
}

// GetCategories retrieves all video categories
func (s *VideoService) GetCategories() ([]models.VideoCategory, error) {
	query := `
		SELECT id, name, description, icon, sort_order, created_at, updated_at
		FROM video_categories
		ORDER BY sort_order, name
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query categories: %w", err)
	}
	defer rows.Close()

	var categories []models.VideoCategory
	for rows.Next() {
		var category models.VideoCategory
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Description,
			&category.Icon,
			&category.SortOrder,
			&category.CreatedAt,
			&category.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// GetCategoryByID retrieves a category by ID
func (s *VideoService) GetCategoryByID(id string) (*models.VideoCategory, error) {
	query := `
		SELECT id, name, description, icon, sort_order, created_at, updated_at
		FROM video_categories
		WHERE id = $1
	`
	
	var category models.VideoCategory
	err := s.db.QueryRow(query, id).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Icon,
		&category.SortOrder,
		&category.CreatedAt,
		&category.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("category not found")
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return &category, nil
}

// CreateCategory creates a new video category
func (s *VideoService) CreateCategory(data models.CategoryFormData) (*models.VideoCategory, error) {
	if err := data.Validate(); err != nil {
		return nil, err
	}

	query := `
		INSERT INTO video_categories (name, description, icon, sort_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, description, icon, sort_order, created_at, updated_at
	`
	
	var category models.VideoCategory
	err := s.db.QueryRow(query, data.Name, data.Description, data.Icon, data.SortOrder).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Icon,
		&category.SortOrder,
		&category.CreatedAt,
		&category.UpdatedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return &category, nil
}

// UpdateCategory updates an existing video category
func (s *VideoService) UpdateCategory(id string, data models.CategoryFormData) (*models.VideoCategory, error) {
	if err := data.Validate(); err != nil {
		return nil, err
	}

	query := `
		UPDATE video_categories SET
			name = $2, description = $3, icon = $4, sort_order = $5,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, description, icon, sort_order, created_at, updated_at
	`
	
	var category models.VideoCategory
	err := s.db.QueryRow(query, id, data.Name, data.Description, data.Icon, data.SortOrder).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Icon,
		&category.SortOrder,
		&category.CreatedAt,
		&category.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("category not found")
		}
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return &category, nil
}

// DeleteCategory deletes a category (hard delete)
func (s *VideoService) DeleteCategory(id string) error {
	query := `DELETE FROM video_categories WHERE id = $1`
	
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("category not found")
	}

	return nil
}

// GetVideos retrieves exercise videos with optional filters
func (s *VideoService) GetVideos(categoryID string, difficulty string) ([]models.ExerciseVideo, error) {
	query := `
		SELECT 
			ev.id, ev.title, ev.description, ev.youtube_id, ev.youtube_url,
			ev.category_id, ev.duration, ev.difficulty_level, ev.equipment_required,
			ev.body_parts, ev.tags, ev.thumbnail_url,
			ev.created_at, ev.updated_at,
			vc.name as category_name, vc.description as category_description
		FROM exercise_videos ev
		JOIN video_categories vc ON ev.category_id = vc.id
		WHERE 1=1
	`
	
	var args []interface{}
	argIndex := 1

	if categoryID != "" {
		query += fmt.Sprintf(" AND ev.category_id = $%d", argIndex)
		args = append(args, categoryID)
		argIndex++
	}

	if difficulty != "" {
		query += fmt.Sprintf(" AND ev.difficulty_level = $%d", argIndex)
		args = append(args, difficulty)
		argIndex++
	}

	query += " ORDER BY vc.sort_order, ev.title"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query videos: %w", err)
	}
	defer rows.Close()

	var videos []models.ExerciseVideo
	for rows.Next() {
		var video models.ExerciseVideo
		// Initialize slices to avoid nil pointer issues
		video.EquipmentRequired = make([]string, 0)
		video.BodyParts = make([]string, 0)
		video.Tags = make([]string, 0)
		
		err := rows.Scan(
			&video.ID,
			&video.Title,
			&video.Description,
			&video.YoutubeID,
			&video.YoutubeURL,
			&video.CategoryID,
			&video.Duration,
			&video.DifficultyLevel,
			pq.Array(&video.EquipmentRequired),
			pq.Array(&video.BodyParts),
			pq.Array(&video.Tags),
			&video.ThumbnailURL,
			&video.CreatedAt,
			&video.UpdatedAt,
			&video.CategoryName,
			&video.CategoryDescription,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan video: %w", err)
		}
		videos = append(videos, video)
	}

	return videos, nil
}

// GetVideoByID retrieves a video by ID
func (s *VideoService) GetVideoByID(id string) (*models.ExerciseVideo, error) {
	query := `
		SELECT 
			ev.id, ev.title, ev.description, ev.youtube_id, ev.youtube_url,
			ev.category_id, ev.duration, ev.difficulty_level, ev.equipment_required,
			ev.body_parts, ev.tags, ev.thumbnail_url,
			ev.created_at, ev.updated_at,
			vc.name as category_name, vc.description as category_description
		FROM exercise_videos ev
		JOIN video_categories vc ON ev.category_id = vc.id
		WHERE ev.id = $1
	`
	
	var video models.ExerciseVideo
	// Initialize slices to avoid nil pointer issues
	video.EquipmentRequired = make([]string, 0)
	video.BodyParts = make([]string, 0)
	video.Tags = make([]string, 0)
	
	err := s.db.QueryRow(query, id).Scan(
		&video.ID,
		&video.Title,
		&video.Description,
		&video.YoutubeID,
		&video.YoutubeURL,
		&video.CategoryID,
		&video.Duration,
		&video.DifficultyLevel,
		pq.Array(&video.EquipmentRequired),
		pq.Array(&video.BodyParts),
		pq.Array(&video.Tags),
		&video.ThumbnailURL,
		&video.CreatedAt,
		&video.UpdatedAt,
		&video.CategoryName,
		&video.CategoryDescription,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("video not found")
		}
		return nil, fmt.Errorf("failed to get video: %w", err)
	}

	return &video, nil
}

// CreateVideo creates a new exercise video
func (s *VideoService) CreateVideo(data models.VideoFormData) (*models.ExerciseVideo, error) {
	if err := data.Validate(); err != nil {
		return nil, err
	}

	// Extract YouTube ID from URL
	youtubeID, err := s.extractYouTubeID(data.YoutubeURL)
	if err != nil {
		return nil, err
	}

	// Generate thumbnail URL
	thumbnailURL := fmt.Sprintf("https://img.youtube.com/vi/%s/maxresdefault.jpg", youtubeID)

	query := `
		INSERT INTO exercise_videos (
			title, description, youtube_url, category_id, duration, difficulty_level,
			equipment_required, body_parts, tags, thumbnail_url
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, title, description, youtube_id, youtube_url, category_id, duration,
		          difficulty_level, equipment_required, body_parts, tags, thumbnail_url,
		          created_at, updated_at
	`
	
	var video models.ExerciseVideo
	// Initialize slices to avoid nil pointer issues
	video.EquipmentRequired = make([]string, 0)
	video.BodyParts = make([]string, 0)
	video.Tags = make([]string, 0)
	
	err = s.db.QueryRow(
		query,
		data.Title,
		data.Description,
		data.YoutubeURL,
		data.CategoryID,
		data.Duration,
		data.DifficultyLevel,
		pq.Array(data.EquipmentRequired),
		pq.Array(data.BodyParts),
		pq.Array(data.Tags),
		thumbnailURL,
	).Scan(
		&video.ID,
		&video.Title,
		&video.Description,
		&video.YoutubeID,
		&video.YoutubeURL,
		&video.CategoryID,
		&video.Duration,
		&video.DifficultyLevel,
		pq.Array(&video.EquipmentRequired),
		pq.Array(&video.BodyParts),
		pq.Array(&video.Tags),
		&video.ThumbnailURL,
		&video.CreatedAt,
		&video.UpdatedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to create video: %w", err)
	}

	return &video, nil
}

// UpdateVideo updates an existing exercise video
func (s *VideoService) UpdateVideo(id string, data models.VideoFormData) (*models.ExerciseVideo, error) {
	if err := data.Validate(); err != nil {
		return nil, err
	}

	// Generate thumbnail URL if YouTube URL changed
	thumbnailURL := ""
	if data.YoutubeURL != "" {
		youtubeID, err := s.extractYouTubeID(data.YoutubeURL)
		if err != nil {
			return nil, err
		}
		thumbnailURL = fmt.Sprintf("https://img.youtube.com/vi/%s/maxresdefault.jpg", youtubeID)
	}

	query := `
		UPDATE exercise_videos SET
			title = $2, description = $3, youtube_url = $4, category_id = $5,
			duration = $6, difficulty_level = $7, equipment_required = $8,
			body_parts = $9, tags = $10, thumbnail_url = $11,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, description, youtube_id, youtube_url, category_id, duration,
		          difficulty_level, equipment_required, body_parts, tags, thumbnail_url,
		          created_at, updated_at
	`
	
	var video models.ExerciseVideo
	// Initialize slices to avoid nil pointer issues
	video.EquipmentRequired = make([]string, 0)
	video.BodyParts = make([]string, 0)
	video.Tags = make([]string, 0)
	
	err := s.db.QueryRow(
		query,
		id,
		data.Title,
		data.Description,
		data.YoutubeURL,
		data.CategoryID,
		data.Duration,
		data.DifficultyLevel,
		pq.Array(data.EquipmentRequired),
		pq.Array(data.BodyParts),
		pq.Array(data.Tags),
		thumbnailURL,
	).Scan(
		&video.ID,
		&video.Title,
		&video.Description,
		&video.YoutubeID,
		&video.YoutubeURL,
		&video.CategoryID,
		&video.Duration,
		&video.DifficultyLevel,
		pq.Array(&video.EquipmentRequired),
		pq.Array(&video.BodyParts),
		pq.Array(&video.Tags),
		&video.ThumbnailURL,
		&video.CreatedAt,
		&video.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("video not found")
		}
		return nil, fmt.Errorf("failed to update video: %w", err)
	}

	return &video, nil
}

// DeleteVideo deletes a video (hard delete)
func (s *VideoService) DeleteVideo(id string) error {
	query := `DELETE FROM exercise_videos WHERE id = $1`
	
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete video: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("video not found")
	}

	return nil
}

// DeleteVideoByURL deletes a video by its YouTube URL (hard delete)
func (s *VideoService) DeleteVideoByURL(url string) error {
	query := `DELETE FROM exercise_videos WHERE youtube_url = $1`
	
	result, err := s.db.Exec(query, url)
	if err != nil {
		return fmt.Errorf("failed to delete video by URL: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("video with URL '%s' not found", url)
	}

	return nil
}

// extractYouTubeID extracts the YouTube video ID from various URL formats
func (s *VideoService) extractYouTubeID(url string) (string, error) {
	patterns := []string{
		`youtube\.com/watch\?v=([a-zA-Z0-9_-]+)`,
		`youtu\.be/([a-zA-Z0-9_-]+)`,
		`youtube\.com/embed/([a-zA-Z0-9_-]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1], nil
		}
	}

	return "", fmt.Errorf("invalid YouTube URL format")
}

// SeedSampleVideos seeds the database with sample exercise videos
func (s *VideoService) SeedSampleVideos() error {
	// Get categories first
	categories, err := s.GetCategories()
	if err != nil {
		return fmt.Errorf("failed to get categories: %w", err)
	}

	if len(categories) == 0 {
		return fmt.Errorf("no categories found. Please create categories first")
	}

	// Sample videos data
	sampleVideos := []models.VideoFormData{
		{
			Title:             "Basic Back Stretch Routine",
			Description:       "A gentle stretching routine for lower back pain relief",
			YoutubeURL:        "https://www.youtube.com/watch?v=4vTJHUDB5ak",
			CategoryID:        categories[0].ID, // Back & Spine
			Duration:          intPtr(10),
			DifficultyLevel:   "beginner",
			EquipmentRequired: []string{"Yoga Mat"},
			BodyParts:         []string{"Back", "Core"},
			Tags:              []string{"stretching", "back pain", "beginner"},
		},
		{
			Title:             "Neck and Shoulder Relief",
			Description:       "Simple exercises to relieve neck and shoulder tension",
			YoutubeURL:        "https://www.youtube.com/watch?v=akgQbxhrhOc",
			CategoryID:        findCategoryByName(categories, "Neck & Shoulders"),
			Duration:          intPtr(8),
			DifficultyLevel:   "beginner",
			EquipmentRequired: []string{"None"},
			BodyParts:         []string{"Neck", "Shoulders"},
			Tags:              []string{"neck pain", "shoulder tension", "office workers"},
		},
		{
			Title:             "Knee Strengthening Exercises",
			Description:       "Strengthening exercises for knee stability and pain relief",
			YoutubeURL:        "https://www.youtube.com/watch?v=MEQRHUoLGgI",
			CategoryID:        findCategoryByName(categories, "Knee & Hip"),
			Duration:          intPtr(15),
			DifficultyLevel:   "intermediate",
			EquipmentRequired: []string{"Resistance Bands"},
			BodyParts:         []string{"Legs", "Glutes"},
			Tags:              []string{"knee pain", "strengthening", "stability"},
		},
	}

	for _, videoData := range sampleVideos {
		// Check if video already exists
		existing, _ := s.getVideoByYouTubeURL(videoData.YoutubeURL)
		if existing != nil {
			continue // Skip if already exists
		}

		_, err := s.CreateVideo(videoData)
		if err != nil {
			return fmt.Errorf("failed to create sample video '%s': %w", videoData.Title, err)
		}
	}

	return nil
}

// Helper functions
func intPtr(i int) *int {
	return &i
}

func findCategoryByName(categories []models.VideoCategory, name string) string {
	for _, cat := range categories {
		if strings.Contains(cat.Name, name) {
			return cat.ID
		}
	}
	return categories[0].ID // Fallback to first category
}

func (s *VideoService) getVideoByYouTubeURL(url string) (*models.ExerciseVideo, error) {
	query := `SELECT id FROM exercise_videos WHERE youtube_url = $1`
	var id string
	err := s.db.QueryRow(query, url).Scan(&id)
	if err != nil {
		return nil, err
	}
	return s.GetVideoByID(id)
}

// ImportResult represents the result of a batch import operation
type ImportResult struct {
	TotalRows    int            `json:"total_rows"`
	SuccessCount int            `json:"success_count"`
	SkippedCount int            `json:"skipped_count"`
	ErrorCount   int            `json:"error_count"`
	Errors       []ImportError  `json:"errors,omitempty"`
	Warnings     []ImportError  `json:"warnings,omitempty"`
}

// ImportError represents an error or warning during import
type ImportError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

// CSVVideoData represents a video record from CSV
type CSVVideoData struct {
	Title        string `csv:"title"`
	Description  string `csv:"description"`
	YoutubeURL   string `csv:"youtube_url"`
	CategoryName string `csv:"category_name"`
	Difficulty   string `csv:"difficulty"`
	Duration     string `csv:"duration"`
	Equipment    string `csv:"equipment"`
	BodyParts    string `csv:"body_parts"`
	Tags         string `csv:"tags"`
	Active       string `csv:"active"`
}

// ImportVideosFromCSV imports videos from a CSV file
func (s *VideoService) ImportVideosFromCSV(filename string, dryRun bool, skipErrors bool) (*ImportResult, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV file: %w", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("CSV file is empty")
	}

	// Get categories for name-to-ID mapping
	categories, err := s.GetCategories()
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}

	categoryMap := make(map[string]string)
	for _, cat := range categories {
		categoryMap[strings.ToLower(cat.Name)] = cat.ID
	}

	result := &ImportResult{
		TotalRows: len(records) - 1, // Exclude header
		Errors:    []ImportError{},
		Warnings:  []ImportError{},
	}

	// Parse header
	header := records[0]
	columnMap := make(map[string]int)
	for i, col := range header {
		columnMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	// Validate required columns
	requiredColumns := []string{"title", "youtube_url", "category_name"}
	for _, col := range requiredColumns {
		if _, exists := columnMap[col]; !exists {
			return nil, fmt.Errorf("required column '%s' not found in CSV", col)
		}
	}

	// Process each row
	for rowIndex, record := range records[1:] {
		rowNum := rowIndex + 2 // +2 because we skip header and arrays are 0-indexed

		videoData, err := s.parseCSVRow(record, columnMap, categoryMap, rowNum)
		if err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, ImportError{
				Row:     rowNum,
				Message: err.Error(),
			})
			if !skipErrors {
				return result, fmt.Errorf("error on row %d: %w", rowNum, err)
			}
			continue
		}

		// Check for duplicates
		existing, _ := s.getVideoByYouTubeURL(videoData.YoutubeURL)
		if existing != nil {
			result.SkippedCount++
			result.Warnings = append(result.Warnings, ImportError{
				Row:     rowNum,
				Message: fmt.Sprintf("Video with URL '%s' already exists, skipping", videoData.YoutubeURL),
			})
			continue
		}

		// Create video if not in dry-run mode
		if !dryRun {
			_, err = s.CreateVideo(*videoData)
			if err != nil {
				result.ErrorCount++
				result.Errors = append(result.Errors, ImportError{
					Row:     rowNum,
					Message: fmt.Sprintf("Failed to create video: %s", err.Error()),
				})
				if !skipErrors {
					return result, fmt.Errorf("failed to create video on row %d: %w", rowNum, err)
				}
				continue
			}
		}

		result.SuccessCount++
	}

	return result, nil
}

// parseCSVRow parses a single CSV row into VideoFormData
func (s *VideoService) parseCSVRow(record []string, columnMap map[string]int, categoryMap map[string]string, rowNum int) (*models.VideoFormData, error) {
	getValue := func(colName string) string {
		if idx, exists := columnMap[colName]; exists && idx < len(record) {
			return strings.TrimSpace(record[idx])
		}
		return ""
	}

	// Required fields
	title := getValue("title")
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}

	youtubeURL := getValue("youtube_url")
	if youtubeURL == "" {
		return nil, fmt.Errorf("youtube_url is required")
	}

	categoryName := getValue("category_name")
	if categoryName == "" {
		return nil, fmt.Errorf("category_name is required")
	}

	// Find category ID
	categoryID, exists := categoryMap[strings.ToLower(categoryName)]
	if !exists {
		return nil, fmt.Errorf("category '%s' not found", categoryName)
	}

	// Optional fields with defaults
	description := getValue("description")
	
	difficulty := getValue("difficulty")
	if difficulty == "" {
		difficulty = "beginner"
	}
	if difficulty != "beginner" && difficulty != "intermediate" && difficulty != "advanced" {
		return nil, fmt.Errorf("difficulty must be 'beginner', 'intermediate', or 'advanced', got '%s'", difficulty)
	}

	// Parse duration
	var duration *int
	durationStr := getValue("duration")
	if durationStr != "" {
		d, err := strconv.Atoi(durationStr)
		if err != nil {
			return nil, fmt.Errorf("invalid duration '%s': must be a number", durationStr)
		}
		if d > 0 {
			duration = &d
		}
	}

	// Parse arrays (semicolon-separated)
	parseArray := func(value string) []string {
		if value == "" {
			return []string{}
		}
		parts := strings.Split(value, ";")
		result := make([]string, 0, len(parts))
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed != "" {
				result = append(result, trimmed)
			}
		}
		return result
	}

	equipment := parseArray(getValue("equipment"))
	bodyParts := parseArray(getValue("body_parts"))
	tags := parseArray(getValue("tags"))

	return &models.VideoFormData{
		Title:             title,
		Description:       description,
		YoutubeURL:        youtubeURL,
		CategoryID:        categoryID,
		Duration:          duration,
		DifficultyLevel:   difficulty,
		EquipmentRequired: equipment,
		BodyParts:         bodyParts,
		Tags:              tags,
	}, nil
}

// GetCategoryByName retrieves a category by name (case-insensitive)
func (s *VideoService) GetCategoryByName(name string) (*models.VideoCategory, error) {
	query := `
		SELECT id, name, description, icon, sort_order, created_at, updated_at
		FROM video_categories
		WHERE LOWER(name) = LOWER($1)
	`
	
	var category models.VideoCategory
	err := s.db.QueryRow(query, name).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Icon,
		&category.SortOrder,
		&category.CreatedAt,
		&category.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("category '%s' not found", name)
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return &category, nil
}