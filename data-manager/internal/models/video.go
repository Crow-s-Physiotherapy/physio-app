package models

import (
	"encoding/json"
	"fmt"
	"time"
)

// VideoCategory represents a video category
type VideoCategory struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        *string   `json:"icon,omitempty"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ExerciseVideo represents an exercise video
type ExerciseVideo struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	YoutubeID         string    `json:"youtube_id"`
	YoutubeURL        string    `json:"youtube_url"`
	CategoryID        string    `json:"category_id"`
	Duration          *int      `json:"duration,omitempty"`
	DifficultyLevel   string    `json:"difficulty_level"`
	EquipmentRequired []string  `json:"equipment_required"`
	BodyParts         []string  `json:"body_parts"`
	Tags              []string  `json:"tags"`
	ThumbnailURL      *string   `json:"thumbnail_url,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
	
	// Joined fields
	CategoryName        *string `json:"category_name,omitempty"`
	CategoryDescription *string `json:"category_description,omitempty"`
}

// VideoFormData represents form data for creating/updating videos
type VideoFormData struct {
	Title             string   `json:"title"`
	Description       string   `json:"description"`
	YoutubeURL        string   `json:"youtube_url"`
	CategoryID        string   `json:"category_id"`
	Duration          *int     `json:"duration,omitempty"`
	DifficultyLevel   string   `json:"difficulty_level"`
	EquipmentRequired []string `json:"equipment_required"`
	BodyParts         []string `json:"body_parts"`
	Tags              []string `json:"tags"`
}

// CategoryFormData represents form data for creating/updating categories
type CategoryFormData struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Icon        *string `json:"icon,omitempty"`
	SortOrder   int     `json:"sort_order"`
}

// ToJSON converts the video to JSON string
func (v *ExerciseVideo) ToJSON() (string, error) {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ToJSON converts the category to JSON string
func (c *VideoCategory) ToJSON() (string, error) {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// Validate validates the video form data
func (v *VideoFormData) Validate() error {
	if v.Title == "" {
		return fmt.Errorf("title is required")
	}
	if v.YoutubeURL == "" {
		return fmt.Errorf("youtube URL is required")
	}
	if v.CategoryID == "" {
		return fmt.Errorf("category ID is required")
	}
	if v.DifficultyLevel != "" && v.DifficultyLevel != "beginner" && v.DifficultyLevel != "intermediate" && v.DifficultyLevel != "advanced" {
		return fmt.Errorf("difficulty level must be 'beginner', 'intermediate', or 'advanced'")
	}
	return nil
}

// Validate validates the category form data
func (c *CategoryFormData) Validate() error {
	if c.Name == "" {
		return fmt.Errorf("name is required")
	}
	return nil
}