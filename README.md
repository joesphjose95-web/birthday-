# LineReady

LineReady is a static, mobile-first operations board for frontline teams. It includes task tracking, incident logging, shift handoff notes, local browser persistence, and JSON shift export.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:4173`.

In VS Code, you can also use `Terminal > Run Task > Run LineReady`, or open the Run and Debug panel and choose `Run LineReady Server`.

## Host It

### Netlify

1. Go to `https://app.netlify.com/drop`.
2. Drag this project folder into the upload area.
3. Netlify will publish the app and give you a public URL.

### Vercel

1. Create a new Vercel project.
2. Import this folder from GitHub, or upload it through the Vercel CLI.
3. Use the default static-site settings. No build command is required.

### GitHub Pages

1. Create a GitHub repository and push these files.
2. In the repository, open `Settings > Pages`.
3. Set the source to the `main` branch and root folder.
4. GitHub will publish the app at the Pages URL it shows.

## Notes

This version stores data in each worker's browser. For shared team data, connect the forms to a backend such as Supabase, Firebase, Airtable, or a custom API.
