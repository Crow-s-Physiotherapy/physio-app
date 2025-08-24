package cmd

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"text/tabwriter"

	"fisio-data-manager/internal/database"
	"fisio-data-manager/internal/models"
	"fisio-data-manager/internal/services"
	"github.com/spf13/cobra"
)

var videosCmd = &cobra.Command{
	Use:   "videos",
	Short: "Manage exercise videos and categories",
	Long:  `Commands for managing exercise videos and video categories in the database.`,
}

var videosListCmd = &cobra.Command{
	Use:   "list",
	Short: "List exercise videos",
	Long:  `List all exercise videos with optional filtering by category and difficulty.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		
		categoryID, _ := cmd.Flags().GetString("category")
		difficulty, _ := cmd.Flags().GetString("difficulty")
		format, _ := cmd.Flags().GetString("format")
		
		videos, err := service.GetVideos(categoryID, difficulty)
		if err != nil {
			return err
		}

		switch format {
		case "json":
			return outputVideosJSON(videos)
		case "csv":
			return outputVideosCSV(videos)
		default:
			return outputVideosTable(videos)
		}
	},
}

var videosAddCmd = &cobra.Command{
	Use:   "add",
	Short: "Add a new exercise video",
	Long:  `Add a new exercise video to the database.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		
		title, _ := cmd.Flags().GetString("title")
		description, _ := cmd.Flags().GetString("description")
		url, _ := cmd.Flags().GetString("url")
		categoryID, _ := cmd.Flags().GetString("category-id")
		difficulty, _ := cmd.Flags().GetString("difficulty")
		duration, _ := cmd.Flags().GetInt("duration")
		equipment, _ := cmd.Flags().GetStringSlice("equipment")
		bodyParts, _ := cmd.Flags().GetStringSlice("body-parts")
		tags, _ := cmd.Flags().GetStringSlice("tags")
		var durationPtr *int
		if duration > 0 {
			durationPtr = &duration
		}

		videoData := models.VideoFormData{
			Title:             title,
			Description:       description,
			YoutubeURL:        url,
			CategoryID:        categoryID,
			Duration:          durationPtr,
			DifficultyLevel:   difficulty,
			EquipmentRequired: equipment,
			BodyParts:         bodyParts,
			Tags:              tags,
		}

		video, err := service.CreateVideo(videoData)
		if err != nil {
			return err
		}

		fmt.Printf("✅ Successfully created video: %s (ID: %s)\n", video.Title, video.ID)
		return nil
	},
}

var videosUpdateCmd = &cobra.Command{
	Use:   "update [video-id]",
	Short: "Update an existing exercise video",
	Long:  `Update an existing exercise video in the database.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		videoID := args[0]
		
		// Get existing video
		existing, err := service.GetVideoByID(videoID)
		if err != nil {
			return err
		}

		// Get flags (only update if provided)
		title, _ := cmd.Flags().GetString("title")
		description, _ := cmd.Flags().GetString("description")
		url, _ := cmd.Flags().GetString("url")
		categoryID, _ := cmd.Flags().GetString("category-id")
		difficulty, _ := cmd.Flags().GetString("difficulty")
		duration, _ := cmd.Flags().GetInt("duration")
		equipment, _ := cmd.Flags().GetStringSlice("equipment")
		bodyParts, _ := cmd.Flags().GetStringSlice("body-parts")
		tags, _ := cmd.Flags().GetStringSlice("tags")
		// Use existing values if not provided
		if title == "" {
			title = existing.Title
		}
		if description == "" {
			description = existing.Description
		}
		if url == "" {
			url = existing.YoutubeURL
		}
		if categoryID == "" {
			categoryID = existing.CategoryID
		}
		if difficulty == "" {
			difficulty = existing.DifficultyLevel
		}

		var durationPtr *int
		if duration > 0 {
			durationPtr = &duration
		} else {
			durationPtr = existing.Duration
		}

		if len(equipment) == 0 {
			equipment = existing.EquipmentRequired
		}
		if len(bodyParts) == 0 {
			bodyParts = existing.BodyParts
		}
		if len(tags) == 0 {
			tags = existing.Tags
		}

		videoData := models.VideoFormData{
			Title:             title,
			Description:       description,
			YoutubeURL:        url,
			CategoryID:        categoryID,
			Duration:          durationPtr,
			DifficultyLevel:   difficulty,
			EquipmentRequired: equipment,
			BodyParts:         bodyParts,
			Tags:              tags,
		}

		video, err := service.UpdateVideo(videoID, videoData)
		if err != nil {
			return err
		}

		fmt.Printf("✅ Successfully updated video: %s (ID: %s)\n", video.Title, video.ID)
		return nil
	},
}

var videosDeleteCmd = &cobra.Command{
	Use:   "delete [video-id-or-url]",
	Short: "Delete an exercise video",
	Long: `Delete an exercise video from the database (soft delete).
	
You can delete by either:
- Video ID: delete abc123-def456-...
- YouTube URL: delete https://youtube.com/watch?v=abc123`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		identifier := args[0]
		
		byURL, _ := cmd.Flags().GetBool("by-url")
		
		// Auto-detect if it's a URL
		isURL := strings.Contains(identifier, "youtube.com") || strings.Contains(identifier, "youtu.be")
		
		if byURL || isURL {
			// Delete by URL
			err = service.DeleteVideoByURL(identifier)
			if err != nil {
				return err
			}
			fmt.Printf("✅ Successfully deleted video with URL: %s\n", identifier)
		} else {
			// Delete by ID
			err = service.DeleteVideo(identifier)
			if err != nil {
				return err
			}
			fmt.Printf("✅ Successfully deleted video (ID: %s)\n", identifier)
		}
		
		return nil
	},
}

var categoriesListCmd = &cobra.Command{
	Use:   "categories",
	Short: "List video categories",
	Long:  `List all video categories.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		categories, err := service.GetCategories()
		if err != nil {
			return err
		}

		format, _ := cmd.Flags().GetString("format")
		
		switch format {
		case "json":
			return outputCategoriesJSON(categories)
		default:
			return outputCategoriesTable(categories)
		}
	},
}

var categoriesAddCmd = &cobra.Command{
	Use:   "add-category",
	Short: "Add a new video category",
	Long:  `Add a new video category to the database.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		
		name, _ := cmd.Flags().GetString("name")
		description, _ := cmd.Flags().GetString("description")
		icon, _ := cmd.Flags().GetString("icon")
		sortOrder, _ := cmd.Flags().GetInt("sort-order")

		var iconPtr *string
		if icon != "" {
			iconPtr = &icon
		}

		categoryData := models.CategoryFormData{
			Name:        name,
			Description: description,
			Icon:        iconPtr,
			SortOrder:   sortOrder,
		}

		category, err := service.CreateCategory(categoryData)
		if err != nil {
			return err
		}

		fmt.Printf("✅ Successfully created category: %s (ID: %s)\n", category.Name, category.ID)
		return nil
	},
}

var categoriesUpdateCmd = &cobra.Command{
	Use:   "update-category [category-name]",
	Short: "Update an existing video category",
	Long:  `Update an existing video category in the database.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		categoryName := args[0]
		
		// Get existing category by name
		existing, err := service.GetCategoryByName(categoryName)
		if err != nil {
			return err
		}

		// Get flags (only update if provided)
		name, _ := cmd.Flags().GetString("name")
		description, _ := cmd.Flags().GetString("description")
		icon, _ := cmd.Flags().GetString("icon")
		sortOrder, _ := cmd.Flags().GetInt("sort-order")

		// Use existing values if not provided
		if name == "" {
			name = existing.Name
		}
		if description == "" {
			description = existing.Description
		}
		
		var iconPtr *string
		if icon != "" {
			iconPtr = &icon
		} else {
			iconPtr = existing.Icon
		}

		if sortOrder == 0 {
			sortOrder = existing.SortOrder
		}

		categoryData := models.CategoryFormData{
			Name:        name,
			Description: description,
			Icon:        iconPtr,
			SortOrder:   sortOrder,
		}

		category, err := service.UpdateCategory(existing.ID, categoryData)
		if err != nil {
			return err
		}

		fmt.Printf("✅ Successfully updated category: %s (ID: %s)\n", category.Name, category.ID)
		return nil
	},
}

var categoriesDeleteCmd = &cobra.Command{
	Use:   "delete-category [category-name]",
	Short: "Delete a video category",
	Long:  `Delete a video category from the database (hard delete). Warning: This will also delete all videos in this category.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		categoryName := args[0]
		
		// Get category by name for confirmation
		category, err := service.GetCategoryByName(categoryName)
		if err != nil {
			return err
		}

		confirm, _ := cmd.Flags().GetBool("confirm")
		if !confirm {
			fmt.Printf("⚠️  This will permanently delete category '%s' and ALL videos in this category.\n", category.Name)
			fmt.Printf("To confirm deletion, use: --confirm flag\n")
			return nil
		}

		err = service.DeleteCategory(category.ID)
		if err != nil {
			return err
		}

		fmt.Printf("✅ Successfully deleted category: %s (ID: %s)\n", category.Name, category.ID)
		return nil
	},
}

var seedVideosCmd = &cobra.Command{
	Use:   "seed",
	Short: "Seed database with sample videos",
	Long:  `Seed the database with sample exercise videos for testing.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		err = service.SeedSampleVideos()
		if err != nil {
			return err
		}

		fmt.Println("✅ Successfully seeded database with sample videos")
		return nil
	},
}

var videosImportCmd = &cobra.Command{
	Use:   "import [csv-file]",
	Short: "Import videos from CSV file",
	Long: `Import multiple exercise videos from a CSV file.

CSV Format:
The CSV file should have the following columns (with header row):
- title: Video title (required)
- description: Video description
- youtube_url: YouTube URL (required)
- category_name: Category name (will be matched to existing categories)
- difficulty: Difficulty level (beginner, intermediate, advanced)
- duration: Duration in minutes (optional)
- equipment: Required equipment (semicolon-separated)
- body_parts: Target body parts (semicolon-separated)
- tags: Tags (semicolon-separated)

Example CSV content:
title,description,youtube_url,category_name,difficulty,duration,equipment,body_parts,tags
"Back Stretch Routine","Gentle stretching for lower back","https://youtube.com/watch?v=abc123","Back & Spine",beginner,10,"Yoga Mat","Back;Core","stretching;back pain"
"Shoulder Mobility","Improve shoulder range of motion","https://youtube.com/watch?v=def456","Neck & Shoulders",intermediate,15,"None","Shoulders;Arms","mobility;shoulders"`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		db, err := database.Connect()
		if err != nil {
			return err
		}
		defer db.Close()

		service := services.NewVideoService(db)
		csvFile := args[0]
		
		dryRun, _ := cmd.Flags().GetBool("dry-run")
		skipErrors, _ := cmd.Flags().GetBool("skip-errors")
		
		result, err := service.ImportVideosFromCSV(csvFile, dryRun, skipErrors)
		if err != nil {
			return err
		}

		// Display results
		fmt.Printf("📊 IMPORT RESULTS\n")
		fmt.Printf("================\n")
		fmt.Printf("Total rows processed: %d\n", result.TotalRows)
		fmt.Printf("Successfully imported: %d\n", result.SuccessCount)
		fmt.Printf("Skipped (duplicates): %d\n", result.SkippedCount)
		fmt.Printf("Failed: %d\n", result.ErrorCount)
		
		if len(result.Errors) > 0 {
			fmt.Printf("\n❌ ERRORS:\n")
			for i, err := range result.Errors {
				fmt.Printf("Row %d: %s\n", err.Row, err.Message)
				if i >= 9 { // Limit to first 10 errors
					remaining := len(result.Errors) - 10
					if remaining > 0 {
						fmt.Printf("... and %d more errors\n", remaining)
					}
					break
				}
			}
		}
		
		if len(result.Warnings) > 0 {
			fmt.Printf("\n⚠️  WARNINGS:\n")
			for i, warning := range result.Warnings {
				fmt.Printf("Row %d: %s\n", warning.Row, warning.Message)
				if i >= 9 { // Limit to first 10 warnings
					remaining := len(result.Warnings) - 10
					if remaining > 0 {
						fmt.Printf("... and %d more warnings\n", remaining)
					}
					break
				}
			}
		}
		
		if dryRun {
			fmt.Printf("\n🔍 DRY RUN MODE - No changes were made to the database\n")
		} else if result.SuccessCount > 0 {
			fmt.Printf("\n✅ Import completed successfully!\n")
		}
		
		return nil
	},
}

var videosTemplateCmd = &cobra.Command{
	Use:   "template",
	Short: "Generate CSV template for video import",
	Long:  `Generate a CSV template file that can be used for batch video import.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		filename, _ := cmd.Flags().GetString("output")
		withExamples, _ := cmd.Flags().GetBool("with-examples")
		
		return generateCSVTemplate(filename, withExamples)
	},
}

func init() {
	rootCmd.AddCommand(videosCmd)
	
	// Add subcommands
	videosCmd.AddCommand(videosListCmd)
	videosCmd.AddCommand(videosAddCmd)
	videosCmd.AddCommand(videosUpdateCmd)
	videosCmd.AddCommand(videosDeleteCmd)
	videosCmd.AddCommand(categoriesListCmd)
	videosCmd.AddCommand(categoriesAddCmd)
	videosCmd.AddCommand(categoriesUpdateCmd)
	videosCmd.AddCommand(categoriesDeleteCmd)
	videosCmd.AddCommand(seedVideosCmd)
	videosCmd.AddCommand(videosImportCmd)
	videosCmd.AddCommand(videosTemplateCmd)

	// List command flags
	videosListCmd.Flags().String("category", "", "Filter by category ID")
	videosListCmd.Flags().String("difficulty", "", "Filter by difficulty (beginner, intermediate, advanced)")
	videosListCmd.Flags().String("format", "table", "Output format (table, json, csv)")

	// Add command flags
	videosAddCmd.Flags().String("title", "", "Video title (required)")
	videosAddCmd.Flags().String("description", "", "Video description")
	videosAddCmd.Flags().String("url", "", "YouTube URL (required)")
	videosAddCmd.Flags().String("category-id", "", "Category ID (required)")
	videosAddCmd.Flags().String("difficulty", "beginner", "Difficulty level")
	videosAddCmd.Flags().Int("duration", 0, "Duration in minutes")
	videosAddCmd.Flags().StringSlice("equipment", []string{}, "Required equipment")
	videosAddCmd.Flags().StringSlice("body-parts", []string{}, "Target body parts")
	videosAddCmd.Flags().StringSlice("tags", []string{}, "Tags")

	videosAddCmd.MarkFlagRequired("title")
	videosAddCmd.MarkFlagRequired("url")
	videosAddCmd.MarkFlagRequired("category-id")

	// Update command flags (same as add but optional)
	videosUpdateCmd.Flags().String("title", "", "Video title")
	videosUpdateCmd.Flags().String("description", "", "Video description")
	videosUpdateCmd.Flags().String("url", "", "YouTube URL")
	videosUpdateCmd.Flags().String("category-id", "", "Category ID")
	videosUpdateCmd.Flags().String("difficulty", "", "Difficulty level")
	videosUpdateCmd.Flags().Int("duration", 0, "Duration in minutes")
	videosUpdateCmd.Flags().StringSlice("equipment", []string{}, "Required equipment")
	videosUpdateCmd.Flags().StringSlice("body-parts", []string{}, "Target body parts")
	videosUpdateCmd.Flags().StringSlice("tags", []string{}, "Tags")


	// Delete command flags
	videosDeleteCmd.Flags().Bool("by-url", false, "Delete by YouTube URL instead of ID")

	// Categories command flags
	categoriesListCmd.Flags().String("format", "table", "Output format (table, json)")

	// Add category command flags
	categoriesAddCmd.Flags().String("name", "", "Category name (required)")
	categoriesAddCmd.Flags().String("description", "", "Category description")
	categoriesAddCmd.Flags().String("icon", "", "Category icon")
	categoriesAddCmd.Flags().Int("sort-order", 0, "Sort order")
	categoriesAddCmd.MarkFlagRequired("name")

	// Update category command flags
	categoriesUpdateCmd.Flags().String("name", "", "Category name")
	categoriesUpdateCmd.Flags().String("description", "", "Category description")
	categoriesUpdateCmd.Flags().String("icon", "", "Category icon")
	categoriesUpdateCmd.Flags().Int("sort-order", 0, "Sort order")

	// Delete category command flags
	categoriesDeleteCmd.Flags().Bool("confirm", false, "Confirm deletion (required)")

	// Import command flags
	videosImportCmd.Flags().Bool("dry-run", false, "Preview import without making changes")
	videosImportCmd.Flags().Bool("skip-errors", false, "Continue import even if some rows fail")

	// Template command flags
	videosTemplateCmd.Flags().String("output", "video_import_template.csv", "Output filename for template")
	videosTemplateCmd.Flags().Bool("with-examples", false, "Include example rows in template")
}

// Output functions
func outputVideosTable(videos []models.ExerciseVideo) error {
	if len(videos) == 0 {
		fmt.Println("No videos found.")
		return nil
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tTITLE\tCATEGORY\tDIFFICULTY\tDURATION\tCREATED")
	
	for _, video := range videos {
		duration := "N/A"
		if video.Duration != nil {
			duration = fmt.Sprintf("%dm", *video.Duration)
		}
		
		category := "N/A"
		if video.CategoryName != nil {
			category = *video.CategoryName
		}

		fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\t%s\n",
			video.ID,
			truncateString(video.Title, 30),
			category,
			video.DifficultyLevel,
			duration,
			video.CreatedAt.Format("2006-01-02"),
		)
	}
	
	return w.Flush()
}

func outputVideosJSON(videos []models.ExerciseVideo) error {
	data, err := json.MarshalIndent(videos, "", "  ")
	if err != nil {
		return err
	}
	fmt.Println(string(data))
	return nil
}

func outputVideosCSV(videos []models.ExerciseVideo) error {
	writer := csv.NewWriter(os.Stdout)
	defer writer.Flush()

	// Write header
	header := []string{"ID", "Title", "Description", "YouTube URL", "Category", "Difficulty", "Duration", "Equipment", "Body Parts", "Tags", "Created"}
	if err := writer.Write(header); err != nil {
		return err
	}

	// Write data
	for _, video := range videos {
		duration := ""
		if video.Duration != nil {
			duration = strconv.Itoa(*video.Duration)
		}
		
		category := ""
		if video.CategoryName != nil {
			category = *video.CategoryName
		}

		record := []string{
			video.ID,
			video.Title,
			video.Description,
			video.YoutubeURL,
			category,
			video.DifficultyLevel,
			duration,
			strings.Join(video.EquipmentRequired, "; "),
			strings.Join(video.BodyParts, "; "),
			strings.Join(video.Tags, "; "),
			video.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}

	return nil
}

func outputCategoriesTable(categories []models.VideoCategory) error {
	if len(categories) == 0 {
		fmt.Println("No categories found.")
		return nil
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tNAME\tDESCRIPTION\tSORT ORDER")
	
	for _, category := range categories {
		fmt.Fprintf(w, "%s\t%s\t%s\t%d\n",
			category.ID[:8]+"...",
			category.Name,
			truncateString(category.Description, 40),
			category.SortOrder,
		)
	}
	
	return w.Flush()
}

func outputCategoriesJSON(categories []models.VideoCategory) error {
	data, err := json.MarshalIndent(categories, "", "  ")
	if err != nil {
		return err
	}
	fmt.Println(string(data))
	return nil
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}





// generateCSVTemplate creates a CSV template file for video import
func generateCSVTemplate(filename string, withExamples bool) error {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create template file: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	header := []string{
		"title",
		"description", 
		"youtube_url",
		"category_name",
		"difficulty",
		"duration",
		"equipment",
		"body_parts",
		"tags",
	}
	if err := writer.Write(header); err != nil {
		return fmt.Errorf("failed to write header: %w", err)
	}

	// Write example rows if requested
	if withExamples {
		examples := [][]string{
			{
				"Back Stretch Routine",
				"Gentle stretching routine for lower back pain relief",
				"https://www.youtube.com/watch?v=4vTJHUDB5ak",
				"Back & Spine",
				"beginner",
				"10",
				"Yoga Mat",
				"Back;Core",
				"stretching;back pain;beginner",
			},
			{
				"Neck and Shoulder Relief",
				"Simple exercises to relieve neck and shoulder tension",
				"https://www.youtube.com/watch?v=akgQbxrhOc",
				"Neck & Shoulders",
				"beginner",
				"8",
				"None",
				"Neck;Shoulders",
				"neck pain;shoulder tension;office workers",
			},
			{
				"Knee Strengthening Exercises",
				"Strengthening exercises for knee stability and pain relief",
				"https://www.youtube.com/watch?v=MEQRHUoLGgI",
				"Knee & Hip",
				"intermediate",
				"15",
				"Resistance Bands",
				"Legs;Glutes",
				"knee pain;strengthening;stability",
			},
		}

		for _, example := range examples {
			if err := writer.Write(example); err != nil {
				return fmt.Errorf("failed to write example row: %w", err)
			}
		}
	}

	fmt.Printf("✅ CSV template created: %s\n", filename)
	if withExamples {
		fmt.Println("📝 Template includes example rows for reference")
	}
	
	fmt.Println("\n📋 CSV Format Guide:")
	fmt.Println("- title: Video title (required)")
	fmt.Println("- description: Video description (optional)")
	fmt.Println("- youtube_url: Full YouTube URL (required)")
	fmt.Println("- category_name: Category name (must match existing category)")
	fmt.Println("- difficulty: beginner, intermediate, or advanced")
	fmt.Println("- duration: Duration in minutes (optional)")
	fmt.Println("- equipment: Semicolon-separated list (e.g., 'Yoga Mat;Resistance Bands')")
	fmt.Println("- body_parts: Semicolon-separated list (e.g., 'Back;Core;Legs')")
	fmt.Println("- tags: Semicolon-separated list (e.g., 'stretching;back pain')")
	
	return nil
}