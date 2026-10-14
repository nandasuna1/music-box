# 🚀 EAS Update Guide — Publishing JS Fixes Without App Store Resubmission

## Overview

EAS Update (powered by `expo-updates`) allows you to publish JavaScript-only fixes directly to users without requiring a new build or App Store/Play Store submission. This dramatically reduces the time to fix production bugs (minutes instead of days).

---

## Architecture

```
Your Code (app.json + eas.json)
    ↓
EAS Build Service
    ↓
Native App (iOS/Android) + Runtime (Hermes/JavaScriptCore)
    ↓
On App Launch or Periodic Check:
    ↓
EAS Update Service (u.expo.dev)
    ↓
Check for Updates on Channel (production, preview, development)
    ↓
Download if Available → Apply → Restart or Next Launch
```

---

## Channels Configured

| Channel | Environment | When to Publish | Build Target |
|---------|-------------|-----------------|--------------|
| **production** | Main release | After testing in preview | Public App Store |
| **preview** | QA testing | Before production release | Internal/TestFlight |
| **development** | Local dev | During development | Dev client only |

---

## Publishing a JS Fix to Production

### Step 1: Make Your Code Changes

```bash
# Fix your bug in app code, services, or components
# Example: Fix a navigation issue in app/(protected)/(tabs)/index.tsx
```

### Step 2: Build and Test Locally

```bash
# Ensure the fix works in dev
npm run lint
npx tsc --noEmit
npm test
npm start
```

### Step 3: Publish to Preview Channel

```bash
# This pushes the update to the preview channel for QA testing
eas update --channel preview --message "Fix: navigation crash on album view"
```

### Step 4: Test on Preview (Optional)

```bash
# Build a preview version if not already built
eas build --platform android --profile preview
# or
eas build --platform ios --profile preview

# Install on test device and verify the fix
```

### Step 5: Publish to Production Channel

```bash
# Once verified, publish to production
eas update --channel production --message "Fix: navigation crash on album view (v1.0.1)"
```

### Step 6: Verify Deployment

```bash
# View all published updates
eas update:list

# View production channel specifically
eas update:list --channel production
```

---

## What Can Be Updated

✅ **Can Update Over-the-Air:**
- JavaScript code (components, hooks, services)
- Assets (images, fonts)
- Styling changes
- Logic fixes
- API endpoint changes (if backward compatible)

❌ **Cannot Update Over-the-Air (Requires New Build):**
- Native dependencies (`expo-secure-store`, `@react-native-google-signin`, etc.)
- Native code changes
- Expo SDK version upgrades
- `app.json` configuration changes (e.g., permissions)
- New plugins

---

## Monitoring Updates

### Check Update Status in App

```typescript
// Add to your app to monitor update status:
import * as Updates from 'expo-updates';

useEffect(() => {
  const checkUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        console.log('Update available, reloading...');
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (e) {
      logger.error('Update check failed', { error: e });
    }
  };

  checkUpdates();
}, []);
```

### Sentry Integration

All update events are logged to Sentry automatically. Monitor the Sentry dashboard for:
- Update download failures
- Rollback events
- Performance degradation after updates

---

## Rollback Strategy

If a published update causes issues:

1. **Rollback to Previous Version:**
   ```bash
   # Publish a fix (or previous working version) to production
   eas update --channel production --message "Rollback: revert to v1.0.0"
   ```

2. **Check Rollout Progress:**
   ```bash
   # Monitor update adoption
   eas update:list --channel production --limit 10
   ```

3. **Emergency Considerations:**
   - Updates take effect on next app restart
   - Users with the app open won't get the update until restart
   - For critical security issues, prefer a native build + App Store push

---

## Disaster Recovery

### Scenario: Published Update Breaks the App

**Timeline:**
- T=0: Bad update published to production
- T=5: First reports in Sentry dashboard
- T=10: Identify the issue
- T=15: Fix deployed (users who restart get the fix)
- T=30: 95% of users have the fix

**Action Plan:**
1. Publish fix immediately: `eas update --channel production --message "Hotfix: revert breaking change"`
2. Monitor Sentry for crash reduction
3. Post-mortem: Add tests to prevent regression

---

## Best Practices

1. **Always test in preview first** before publishing to production
2. **Use descriptive messages** so you can track what was changed
3. **Monitor Sentry** after each production update for 1–2 hours
4. **Keep native builds stable** — only push JS updates via EAS Update
5. **Version your fixes** — include version number in update messages
6. **Document breaking changes** — if API contracts change, communicate to users

---

## Troubleshooting

### "Update Not Appearing on Device"

1. Check the update was published: `eas update:list --channel production`
2. Ensure app uses correct `projectId` in `app.json`
3. Verify `updates.url` matches your EAS project
4. Device must have app version ≥ the version that added EAS Update support
5. Force restart app: kill app → reopen

### "Updates Not Checking for Updates"

1. Verify `expo-updates` is installed: `npm list expo-updates`
2. Verify `updates.url` in `app.json` is correct
3. Check Sentry for update check errors
4. Ensure network connectivity on device

### "Cannot Build with EAS Update"

- Ensure `expo-updates` is in `package.json`
- Ensure `"expo-updates"` is in `app.json` plugins
- Run `npm install` and `expo prebuild --clean` if needed

---

## References

- [Expo Updates Documentation](https://docs.expo.dev/eas-update/getting-started/)
- [EAS CLI Reference](https://docs.expo.dev/eas-cli/introduction/)
- [Channels & Branching](https://docs.expo.dev/eas-update/channels/)
- [Channel Branching in CI/CD](https://docs.expo.dev/eas-update/github-actions/)
