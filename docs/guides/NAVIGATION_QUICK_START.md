# Navigation System - Quick Start Guide

## What's New

Your PitWall AI app now has a professional navigation system with:

- **Collapsible Sidebar**: Icons + labels, collapses to icon-only
- **Topbar**: Car selector, global actions, breadcrumbs
- **Command Palette**: Press `Cmd+K` or `G` to jump anywhere
- **Keyboard Shortcuts**: J/K to cycle cars, Space for play/pause, P for pit window
- **Persistent State**: Your sidebar and car selection are remembered

## How to Use

### Navigation

1. **Sidebar**: Click the menu icon (top-left of sidebar) to collapse/expand
2. **Command Palette**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) or just `G`
3. **Car Selection**: Use the dropdown in the topbar, or press `J`/`K` to cycle
4. **Breadcrumbs**: Shows your current location (e.g., Dashboard → Car → Lap 12)

### Keyboard Shortcuts

- `Cmd+K` or `G` - Open command palette
- `J` - Next car
- `K` - Previous car
- `Space` - Play/pause (when on pages with live feeds)
- `P` - Open pit window optimizer (when available)

### Pages Using New Navigation

All pages except the landing page (`/`) and About page (`/about`) now use the new navigation system.

## Customization

### Adding Navigation Items

Edit `src/components/Nav/AppNav.tsx`:

```typescript
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: Gauge },
  // Add your items here
];
```

### Providing Car Options

The car selector will show mock cars by default. To use real data, pass `carOptions` to `AppLayout`:

```typescript
// In your route component or App.tsx
<AppLayout carOptions={[
  { id: 'car-1', label: 'Car #1' },
  { id: 'car-2', label: 'Car #2' },
]}>
  {children}
</AppLayout>
```

### Adding Quick Actions

The sidebar has quick action buttons at the bottom. Wire them up in `AppNav.tsx`:

```typescript
<Button onClick={() => {
  // Your pit call logic here
}}>
  Quick Pit Call
</Button>
```

## Testing

1. Start the dev server: `npm run dev`
2. Navigate to `/dashboard` (or any page except `/`)
3. Try:
   - Collapsing/expanding the sidebar
   - Pressing `Cmd+K` to open command palette
   - Pressing `J`/`K` to cycle cars
   - Selecting a car from the dropdown
   - Navigating between pages

## Troubleshooting

### Navigation not showing?

- Make sure you're not on `/` or `/about` (these don't use the layout)
- Check browser console for errors
- Verify all imports are correct

### Keyboard shortcuts not working?

- Make sure you're not typing in an input field
- Check that `useKeyboardShortcuts` is being called in `AppLayout`
- Verify car options are provided if using J/K shortcuts

### Car selection not persisting?

- Check browser localStorage (should see `pitwall-ui-storage`)
- Clear localStorage if needed: `localStorage.removeItem('pitwall-ui-storage')`

## Next Steps

1. **Connect to real data**: Replace mock car options with API data
2. **Wire up actions**: Implement "Quick Pit Call" and "Demo Seeds" functionality
3. **Add more shortcuts**: Extend `useKeyboardShortcuts` for your needs
4. **Customize styling**: Adjust colors, spacing in `AppNav.tsx`

## Files to Know

- `src/components/Nav/AppNav.tsx` - Main navigation component
- `src/components/Nav/CommandPalette.tsx` - Command palette
- `src/components/layout/AppLayout.tsx` - Layout wrapper
- `src/stores/uiStore.ts` - State management
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcuts

For more details, see `NAVIGATION_UPGRADE.md`.

