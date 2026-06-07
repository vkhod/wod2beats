"""ONE-TIME setup: authorize WOD2Beats to manage a YouTube account, and print
the refresh token to paste into .env as YOUTUBE_REFRESH_TOKEN.

Run from the project root:   python -m scripts.connect_youtube

IMPORTANT: sign in with the account the playlists should be published to
(e.g. the gym's iPad account). This is the 'YouTube authorization' phase —
separate from the per-session Cognito login. You only do this once per account."""
from google_auth_oauthlib.flow import InstalledAppFlow

from app.config import settings

SCOPES = ["https://www.googleapis.com/auth/youtube"]


def main():
    flow = InstalledAppFlow.from_client_config(
        {
            "installed": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://localhost"],
            }
        },
        scopes=SCOPES,
    )
    # access_type=offline + prompt=consent is what forces a refresh token to be returned.
    creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")

    print("\n=== Add this line to your .env ===")
    print(f"YOUTUBE_REFRESH_TOKEN={creds.refresh_token}")
    print("==================================\n")


if __name__ == "__main__":
    main()
