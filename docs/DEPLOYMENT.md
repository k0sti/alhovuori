# Deployment Guide

## Overview

The project uses GitHub Actions to automatically deploy the survey app to GitHub Pages when changes are pushed to the `main` branch.

## GitHub Pages Setup

### Initial Setup

1. **Enable GitHub Pages** for your repository:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - Save

2. **Add Supabase secrets** to GitHub:
   - Go to repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_API_KEY`: Your Supabase anon/public key

### Deployment URL

The survey app deploys to:
```
https://[username].github.io/alhovuori/
```

For example: `https://alhovuori.github.io/alhovuori/`

## Automatic Deployment

### Survey App

The survey app automatically deploys when:
- You push to the `main` branch
- Changes affect these paths:
  - `packages/survey/**`
  - `shared/**`
  - `.github/workflows/deploy-survey.yaml`

**Workflow:** `.github/workflows/deploy-survey.yaml`

### Manual Deployment

To manually trigger a deployment:

1. Go to repository → Actions → "Build and Deploy Survey to GitHub Pages"
2. Click "Run workflow"
3. Select branch (usually `main`)
4. Click "Run workflow"

## Build Process

The deployment workflow:

1. Checks out the repository
2. Installs Bun
3. Runs `bun install` to install dependencies
4. Runs `bun run build:survey` with environment variables
5. Uploads `packages/survey/dist/` as artifact
6. Deploys to GitHub Pages

## Environment Variables

### Build-time Variables

These are set in the workflow file:

- `VITE_SUPABASE_URL`: From GitHub Secrets
- `VITE_SUPABASE_API_KEY`: From GitHub Secrets
- `VITE_BASE_PATH`: Set to `/alhovuori/` for subdirectory deployment

### Adding New Variables

1. Add to `.env` locally
2. Add to GitHub Secrets (for sensitive data)
3. Add to workflow file in `env:` section:
   ```yaml
   env:
     VITE_MY_VAR: ${{ secrets.VITE_MY_VAR }}
   ```

## Deployment Checklist

Before deploying:

- [ ] All changes committed
- [ ] Build succeeds locally: `bun run build:survey`
- [ ] No TypeScript errors
- [ ] Environment variables are set in GitHub Secrets
- [ ] Changes pushed to `main` branch

After deployment:

- [ ] Check Actions tab for workflow status
- [ ] Verify deployment succeeded (green checkmark)
- [ ] Visit deployed URL and test functionality
- [ ] Check browser console for errors

## Troubleshooting

### Deployment fails

**Check workflow logs:**
1. Go to Actions tab
2. Click on failed workflow run
3. Expand failed step to see error

**Common issues:**

- **Missing secrets**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_API_KEY` to GitHub Secrets
- **Build errors**: Fix TypeScript errors locally first
- **Path issues**: Ensure `VITE_BASE_PATH` is set correctly

### Site doesn't load after deployment

- Check if GitHub Pages is enabled (Settings → Pages)
- Verify deployment completed successfully
- Clear browser cache and reload
- Check browser console for errors

### Assets not loading (404s)

- Ensure `VITE_BASE_PATH` matches your repository name
- Check `vite.config.ts` uses `process.env.VITE_BASE_PATH`
- Verify all asset paths are relative, not absolute

### Supabase connection fails

- Verify GitHub Secrets are set correctly
- Check Supabase project is active
- Test API key in local development first
- Check browser console for CORS errors

### Old version still showing

- GitHub Pages cache may be delayed (up to 10 minutes)
- Hard refresh browser: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Check if deployment actually ran (Actions tab)

## Custom Domain (Optional)

To use a custom domain:

1. Add CNAME file to `packages/survey/public/CNAME`:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add A records pointing to GitHub Pages IPs
   - Or add CNAME record pointing to `[username].github.io`

3. Enable HTTPS in repository Settings → Pages

4. Update `VITE_BASE_PATH` to `/`:
   ```yaml
   env:
     VITE_BASE_PATH: /
   ```

## Deployment Optimization

### Bundle Size

Current bundle size: ~7 MB (uncompressed)

To reduce size:
- Enable code splitting in `vite.config.ts`
- Use dynamic imports for large dependencies
- Remove unused dependencies

### Caching

GitHub Pages automatically sets cache headers. To improve:
- Use content hashing (Vite does this by default)
- Minimize changes to vendor bundles
- Use CDN for static assets (optional)

## Multiple Environments

To create staging/production environments:

### Staging Deployment

1. Create new branch: `staging`
2. Duplicate workflow: `.github/workflows/deploy-survey-staging.yaml`
3. Modify to deploy to different Pages environment
4. Use different Supabase project/secrets

### Environment-specific Secrets

Name secrets with prefixes:
- `STAGING_VITE_SUPABASE_URL`
- `PROD_VITE_SUPABASE_URL`

Update workflow to use correct secrets:
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.PROD_VITE_SUPABASE_URL }}
```

## Monitoring

### Deployment Status

- Watch Actions tab for build status
- Enable email notifications: Settings → Notifications → Actions
- Use GitHub mobile app for push notifications

### Error Tracking

Currently no error tracking. To add:

1. Sign up for service (Sentry, LogRocket, etc.)
2. Add SDK to `packages/survey/src/app.ts`
3. Add API key to GitHub Secrets
4. Monitor errors in dashboard

### Analytics

To add web analytics:

1. Sign up for service (Google Analytics, Plausible, etc.)
2. Add tracking code to `packages/survey/index.html`
3. Add tracking ID to environment variables

## Rollback

To rollback a deployment:

1. Find last working commit: `git log`
2. Revert to that commit: `git revert <commit-hash>`
3. Push to main: `git push origin main`
4. Wait for automatic deployment

Or use GitHub Pages deployment history:
1. Go to Settings → Pages
2. View deployment history
3. Redeploy previous version

## Alternative Deployment Platforms

### Vercel

1. Install Vercel CLI: `bun add -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Set environment variables in Vercel dashboard

### Netlify

1. Connect repository to Netlify
2. Build command: `bun run build:survey`
3. Publish directory: `packages/survey/dist`
4. Add environment variables in Netlify dashboard

### Cloudflare Pages

1. Connect repository to Cloudflare Pages
2. Build command: `bun run build:survey`
3. Build output: `packages/survey/dist`
4. Add environment variables in Cloudflare dashboard

## Security Considerations

- Never commit `.env` file
- Use environment variables for sensitive data
- Rotate API keys regularly
- Enable branch protection for `main`
- Review pull requests before merging
- Use Supabase Row Level Security (RLS)
- Enable HTTPS (automatic with GitHub Pages)

## Support

If deployment fails:

1. Check workflow logs (Actions tab)
2. Review this documentation
3. Check GitHub Pages status: https://www.githubstatus.com/
4. Open issue in repository with error details
