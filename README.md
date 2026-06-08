# StudentOffRezzMobileApp

## Mobile Testing Notes

The app now supports `EXPO_PUBLIC_API_BASE_URL`.

- To use the deployed backend on Heroku, set `EXPO_PUBLIC_API_BASE_URL=https://thabstay-1c4cd9c3caf4.herokuapp.com`
- To test backend changes from a real phone on the same Wi-Fi, set `EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3001`
- If you provide a URL ending with `/api`, the app will still work

Frontend report changes in `services/reportService.js` need the phone to load a fresh JavaScript bundle.
Backend report changes need the phone to call the updated backend URL above.

## If Web Updates But Phone Does Not

If the browser shows the latest changes but the phone does not, the phone is usually opening an older installed APK or build.

Use one of these workflows:

- Development client or Expo Go: run `npm run start:tunnel` and open the project from the QR code on the phone
- Development client only: run `npm run start:dev-client` and open the development build on the phone
- Installed preview APK: rebuild and reinstall the APK after code changes, or use EAS Update

For local backend testing from your phone:

1. Start the backend on your computer
2. Create a root `.env` file from `.env.example`
3. Set `EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:3001`
4. Run `npm run start:tunnel`
5. Reload the app on the phone
