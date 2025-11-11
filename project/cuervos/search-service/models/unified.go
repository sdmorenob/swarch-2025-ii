package models

import (
	"fmt"
	"time"

	notespb "search-service/grpc/generated/notes"
	taskspb "search-service/grpc/generated/tasks"
)

type Tag struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type Category struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UnifiedSearchResult struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Tags      []Tag     `json:"tags"`
	Category  *Category `json:"category,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UnifiedSearchResponse struct {
	Results []UnifiedSearchResult `json:"results"`
	Total   int64                 `json:"total"`
	Notes   int64                 `json:"notes"`
	Tasks   int64                 `json:"tasks"`
}

// ConvertNoteResult convierte un resultado de nota de gRPC a UnifiedSearchResult
func ConvertNoteResult(note *notespb.NoteSearchResult) UnifiedSearchResult {
	var tags []Tag
	for _, t := range note.Tags {
		tags = append(tags, Tag{ID: t.Id, Name: t.Name, Color: t.Color})
	}

	var category *Category
	if note.Category != nil && note.Category.Name != "" {
		category = &Category{ID: note.Category.Id, Name: note.Category.Name, Color: note.Category.Color}
	}

	var updatedAt time.Time
	if note.UpdatedAt != "" {
		if ts, err := time.Parse(time.RFC3339, note.UpdatedAt); err == nil {
			updatedAt = ts
		}
	}

	return UnifiedSearchResult{
		ID:        note.Id,
		Type:      "note",
		Title:     note.Title,
		Content:   note.Content,
		Tags:      tags,
		Category:  category,
		UpdatedAt: updatedAt,
	}
}

// ConvertTaskResult convierte un resultado de tarea de gRPC a UnifiedSearchResult
func ConvertTaskResult(task *taskspb.TaskSearchResult) UnifiedSearchResult {
	var tags []Tag
	for _, t := range task.Tags {
		tags = append(tags, Tag{ID: t.Id, Name: t.Name, Color: t.Color})
	}

	var category *Category
	if task.Category != nil && task.Category.Name != "" {
		category = &Category{ID: task.Category.Id, Name: task.Category.Name, Color: task.Category.Color}
	}

	var updatedAt time.Time
	if task.UpdatedAt != "" {
		if ts, err := time.Parse(time.RFC3339, task.UpdatedAt); err == nil {
			updatedAt = ts
		}
	}

	return UnifiedSearchResult{
		ID:        fmt.Sprintf("%d", task.Id),
		Type:      "task",
		Title:     task.Title,
		Content:   task.Description,
		Tags:      tags,
		Category:  category,
		UpdatedAt: updatedAt,
	}
}