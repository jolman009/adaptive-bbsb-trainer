import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { ScenarioFilter, createEmptyFilter, isFilterActive } from '@/types/scenarioFilter';
import { Sport, Level, Category, Position } from '@/types/scenario';

interface FilterPanelProps {
  filter: ScenarioFilter;
  onFilterChange: (filter: ScenarioFilter) => void;
  sports: Sport[];
  levels: Level[];
  categories: Category[];
  positions: Position[];
  scenarioCount: number;
}

/**
 * FilterPanel Component
 *
 * Provides UI for filtering scenarios by:
 * - Sport (baseball, softball)
 * - Level (8u, 10u, 12u, high-school, college)
 * - Category (bases-empty, bases-loaded, etc.)
 * - Position (pitcher, catcher, infield, outfield)
 *
 * Multi-select dropdowns with visual feedback on active filters.
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onFilterChange,
  sports,
  levels,
  categories,
  positions,
  scenarioCount,
}) => {
  const handleSportChange = (event: any) => {
    const selectedSports = event.target.value;
    onFilterChange({
      ...filter,
      sports: Array.isArray(selectedSports) ? selectedSports : [selectedSports],
    });
  };

  const handleLevelChange = (event: any) => {
    const selectedLevels = event.target.value;
    onFilterChange({
      ...filter,
      levels: Array.isArray(selectedLevels) ? selectedLevels : [selectedLevels],
    });
  };

  const handleCategoryChange = (event: any) => {
    const selectedCategories = event.target.value;
    onFilterChange({
      ...filter,
      categories: Array.isArray(selectedCategories) ? selectedCategories : [selectedCategories],
    });
  };

  const handlePositionChange = (event: any) => {
    const selectedPositions = event.target.value;
    onFilterChange({
      ...filter,
      positions: Array.isArray(selectedPositions) ? selectedPositions : [selectedPositions],
    });
  };

  const handleResetFilters = () => {
    onFilterChange(createEmptyFilter());
  };

  const active = isFilterActive(filter);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Filter Scenarios
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {scenarioCount} scenario{scenarioCount !== 1 ? 's' : ''} available
              {active ? ' (filtered)' : ''}
            </Typography>
          </Box>

          {/* Filter Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Sport Filter */}
            <FormControl sx={{ minWidth: 150, flex: 1 }}>
              <InputLabel>Sport</InputLabel>
              <Select
                multiple
                value={filter.sports}
                onChange={handleSportChange}
                label="Sport"
                renderValue={(selected) =>
                  selected.length === 0 ? 'All' : `${selected.length} selected`
                }
              >
                {sports.map((sport) => (
                  <MenuItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Level Filter */}
            <FormControl sx={{ minWidth: 150, flex: 1 }}>
              <InputLabel>Level</InputLabel>
              <Select
                multiple
                value={filter.levels}
                onChange={handleLevelChange}
                label="Level"
                renderValue={(selected) =>
                  selected.length === 0 ? 'All' : `${selected.length} selected`
                }
              >
                {levels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Category Filter */}
            <FormControl sx={{ minWidth: 150, flex: 1 }}>
              <InputLabel>Category</InputLabel>
              <Select
                multiple
                value={filter.categories}
                onChange={handleCategoryChange}
                label="Category"
                renderValue={(selected) =>
                  selected.length === 0 ? 'All' : `${selected.length} selected`
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Position Filter */}
            <FormControl sx={{ minWidth: 150, flex: 1 }}>
              <InputLabel>Position</InputLabel>
              <Select
                multiple
                value={filter.positions}
                onChange={handlePositionChange}
                label="Position"
                renderValue={(selected) =>
                  selected.length === 0 ? 'All' : `${selected.length} selected`
                }
              >
                {positions.map((position) => (
                  <MenuItem key={position} value={position}>
                    {position.charAt(0).toUpperCase() + position.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Active Filters Display */}
          {active && (
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filter.sports.map((sport) => (
                  <Chip key={sport} label={sport} size="small" color="primary" variant="outlined" />
                ))}
                {filter.levels.map((level) => (
                  <Chip key={level} label={level.toUpperCase()} size="small" color="primary" variant="outlined" />
                ))}
                {filter.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {filter.positions.map((position) => (
                  <Chip key={position} label={position} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          {/* Reset Button */}
          {active && (
            <Button variant="outlined" size="small" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
