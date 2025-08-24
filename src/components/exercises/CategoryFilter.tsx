import React, { useState, useEffect } from 'react';
import type {
  VideoCategory,
  VideoDifficulty,
  VideoFilters,
} from '../../types/video';
// Removed unused imports EXERCISE_BODY_PARTS, EQUIPMENT_TYPES
import {
  getVideoCategories,
  getUniqueBodyParts,
  getUniqueEquipmentTypes,
} from '../../services/videoService';
import { useToast } from '../../contexts/ToastContext';

interface CategoryFilterProps {
  filters: VideoFilters;
  onFiltersChange: (filters: VideoFilters) => void;
  className?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  filters,
  onFiltersChange,
  className = '',
}) => {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, bodyPartsData, equipmentData] =
          await Promise.all([
            getVideoCategories(),
            getUniqueBodyParts(),
            getUniqueEquipmentTypes(),
          ]);

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.categories);
        }
        setBodyParts(bodyPartsData);
        setEquipmentTypes(equipmentData);
      } catch (error) {
        console.error('Error loading filter options:', error);
        toast.error('Failed to load filter options. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof VideoFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleArrayFilterChange = (
    key: keyof VideoFilters,
    value: string,
    checked: boolean
  ) => {
    const currentArray = (filters[key] as string[]) || [];
    let newArray: string[];

    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }

    onFiltersChange({
      ...filters,
      [key]: newArray.length > 0 ? newArray : undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof VideoFilters];
    return (
      value !== undefined &&
      value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );
  });

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Content */}
      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block`}>
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search videos..."
              value={filters.searchQuery || ''}
              onChange={e =>
                handleFilterChange('searchQuery', e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category
            </label>
            <select
              id="category"
              value={filters.categoryId || ''}
              onChange={e =>
                handleFilterChange('categoryId', e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={filters.difficulty || ''}
              onChange={e =>
                handleFilterChange(
                  'difficulty',
                  (e.target.value as VideoDifficulty) || undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Duration Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={filters.durationMin || ''}
                onChange={e =>
                  handleFilterChange(
                    'durationMin',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={filters.durationMax || ''}
                onChange={e =>
                  handleFilterChange(
                    'durationMax',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Body Parts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Areas
            </label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {bodyParts.map(bodyPart => (
                <label key={bodyPart} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.bodyParts || []).includes(bodyPart)}
                    onChange={e =>
                      handleArrayFilterChange(
                        'bodyParts',
                        bodyPart,
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{bodyPart}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment
            </label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {equipmentTypes.map(equipment => (
                <label key={equipment} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.equipmentRequired || []).includes(
                      equipment
                    )}
                    onChange={e =>
                      handleArrayFilterChange(
                        'equipmentRequired',
                        equipment,
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {equipment}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
