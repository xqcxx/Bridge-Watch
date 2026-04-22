# Dashboard Customization

## Capabilities

- Add/remove widgets from the dashboard canvas.
- Drag-and-drop reorder of widgets in the customization panel.
- Per-widget size controls (`small`, `medium`, `large`).
- Preset layouts (`default`, `compact`, `operations`, `analyst`).
- Reset to default layout.
- Layout export/import via JSON payload.
- Local persistence through browser storage.
- Responsive adaptation through CSS grid span classes.

## Main files

- `src/hooks/useDashboardLayout.ts`
- `src/components/dashboard/WidgetGallery.tsx`
- `src/pages/Dashboard.tsx`

## Persistence format

```json
{
  "widgets": [
    { "id": "quick-stats", "enabled": true, "size": "medium" },
    { "id": "asset-health", "enabled": true, "size": "large" },
    { "id": "bridge-status", "enabled": true, "size": "medium" }
  ]
}
```
