# Theme Customization Guide

This guide explains how to change the common design and background colors for the entire Dap-Admin project.

## Quick Color Change

To change the entire color scheme of the application, edit the file:

**`src/assets/layout/_theme-config.scss`**

### Available Color Themes

The file includes 6 pre-configured color themes. To switch themes:

1. **Blue Theme (Current)** - Default indigo/blue theme
2. **Purple Theme** - Purple/violet theme
3. **Green Theme** - Green/emerald theme
4. **Red Theme** - Red/crimson theme
5. **Orange Theme** - Orange/amber theme
6. **Teal Theme** - Teal/cyan theme

### How to Change Themes

1. Open `src/assets/layout/_theme-config.scss`
2. Find the "PRIMARY COLOR SCHEME" section
3. Comment out the current theme (Option 1: Blue Theme)
4. Uncomment your desired theme (e.g., Option 2: Purple Theme)
5. Save the file and rebuild the application

### Example: Switching to Purple Theme

```scss
/* Comment out the blue theme */
/* --theme-primary: #6366f1;
--theme-primary-dark: #4f46e5;
--theme-primary-light: #818cf8; */

/* Uncomment the purple theme */
--theme-primary: #8b5cf6;
--theme-primary-dark: #7c3aed;
--theme-primary-light: #a78bfa;
```

## Custom Color Values

You can also set your own custom colors by modifying these variables:

### Primary Colors
- `--theme-primary`: Main brand color
- `--theme-primary-dark`: Darker shade for hover states
- `--theme-primary-light`: Lighter shade for highlights

### Secondary Colors
- `--theme-secondary`: Complementary color
- `--theme-secondary-dark`: Darker secondary shade
- `--theme-secondary-light`: Lighter secondary shade

### Background Colors
- `--theme-bg-primary`: Main background color
- `--theme-bg-secondary`: Secondary background
- `--theme-bg-tertiary`: Tertiary background
- `--theme-bg-card`: Card background color

### Text Colors
- `--theme-text-primary`: Primary text color
- `--theme-text-secondary`: Secondary text color
- `--theme-text-muted`: Muted text color
- `--theme-text-light`: Light text for dark backgrounds

## Available CSS Classes

The theme includes several utility classes you can use in your components:

### Background Classes
- `.bg-gradient-primary` - Primary gradient background
- `.bg-gradient-secondary` - Secondary gradient background
- `.bg-gradient-accent` - Accent gradient background
- `.glass-effect` - Glass morphism effect (light theme)
- `.glass-effect-dark` - Glass morphism effect (dark theme)

### Button Classes
- `.btn-custom-primary` - Primary button style
- `.btn-custom-secondary` - Secondary button style
- `.btn-gradient-primary` - Gradient primary button
- `.btn-gradient-secondary` - Gradient secondary button

### Card Classes
- `.card-custom` - Basic custom card
- `.card-elevated` - Elevated card with hover effects

### Form Classes
- `.input-custom` - Custom input styling
- `.input-enhanced` - Enhanced input with animations

### Status Classes
- `.status-success` - Success status indicator
- `.status-warning` - Warning status indicator
- `.status-danger` - Danger status indicator
- `.status-info` - Info status indicator

### Navigation Classes
- `.nav-item-custom` - Custom navigation item
- `.nav-item-custom.active` - Active navigation item

### Animation Classes
- `.loading-dots` - Loading animation with dots
- `.pulse-custom` - Pulse animation
- `.spinner-custom` - Custom loading spinner

### Utility Classes
- `.fab` - Floating action button

## Tailwind CSS Integration

The theme is integrated with Tailwind CSS. You can use custom color classes:

```html
<!-- Background colors -->
<div class="bg-custom-primary">Primary background</div>
<div class="bg-custom-secondary">Secondary background</div>
<div class="bg-custom-bg-primary">Main background</div>

<!-- Text colors -->
<p class="text-custom-primary">Primary text</p>
<p class="text-custom-text-secondary">Secondary text</p>

<!-- Border colors -->
<div class="border-custom-border-light">Light border</div>
```

## Dark Theme Support

The theme automatically supports dark mode. When the `app-dark` class is applied to the root element, all colors will switch to their dark variants.

## File Structure

```
src/assets/layout/
├── _theme-config.scss          # Main theme configuration
├── _custom-theme.scss          # Custom styling utilities
├── variables/
│   ├── _common.scss           # Common CSS variables
│   ├── _light.scss            # Light theme variables
│   └── _dark.scss             # Dark theme variables
└── layout.scss                # Main layout imports
```

## Best Practices

1. **Use CSS Variables**: Always use the CSS custom properties (variables) instead of hardcoded colors
2. **Test Both Themes**: Always test your changes in both light and dark modes
3. **Accessibility**: Ensure sufficient contrast ratios between text and background colors
4. **Consistency**: Use the predefined color palette to maintain visual consistency

## Troubleshooting

### Colors Not Updating
1. Clear your browser cache
2. Rebuild the application (`ng build` or `npm run build`)
3. Check that the theme config file is properly imported

### Dark Mode Issues
1. Ensure the `app-dark` class is applied to the root element
2. Check that dark theme variables are properly defined
3. Verify that dark mode styles are not being overridden

### Performance Issues
1. Use CSS variables instead of SCSS variables for better performance
2. Minimize the use of complex gradients in performance-critical areas
3. Consider using `will-change` CSS property for animated elements

## Examples

### Using Custom Colors in Components

```typescript
// In your component
@Component({
  selector: 'app-example',
  template: `
    <div class="card-elevated">
      <h2 class="text-custom-primary">Custom Title</h2>
      <p class="text-custom-text-secondary">Custom description</p>
      <button class="btn-gradient-primary">Custom Button</button>
    </div>
  `
})
export class ExampleComponent {}
```

### Dynamic Theme Switching

```typescript
// Toggle dark mode
toggleDarkMode() {
  const root = document.documentElement;
  if (root.classList.contains('app-dark')) {
    root.classList.remove('app-dark');
  } else {
    root.classList.add('app-dark');
  }
}
```

This comprehensive theming system allows you to easily change the entire design of your application by modifying just a few variables in the theme configuration file.
