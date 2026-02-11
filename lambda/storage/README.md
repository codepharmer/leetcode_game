# Storage Lambda (Google ID Token + S3)

Function: `leetcode-game-storage` (us-east-1)

This Lambda is invoked via a Lambda Function URL and stores per-user app data in S3.

## Auth

Clients send a Google ID token in:

- `Authorization: Bearer <id_token>`

The function validates the token via Google's tokeninfo endpoint and uses the token's `sub` as the user id.

## API

- `GET /storage/<key>` -> `{ "value": "<string>" }` or `{ "value": null }`
- `PUT /storage/<key>` body: `{ "value": "<string|null>" }`

Objects are stored at:

- `s3://$DATA_BUCKET/users/<sub>/<key>`

## Env Vars

- `DATA_BUCKET`
- `GOOGLE_CLIENT_ID`

## CORS (Function URL)

CORS is configured on the Lambda Function URL (not in `index.py`).

Current allowed origins should include:

- `https://patternmatch.nosson.ai`
- `https://algogame.nosson.ai`
- `https://leetcode-game.nosson.ai`
- `http://localhost:5173`
- `https://d1j0mzlts1p4o3.cloudfront.net`

View/update:

```powershell
aws lambda get-function-url-config --function-name leetcode-game-storage --region us-east-1 --profile default

aws lambda update-function-url-config --region us-east-1 --profile default `
  --cli-input-json file://lambda-function-url-config.json
```

Note: `lambda-function-url-config.json` is gitignored (account-specific).

## Update Code (Local)

From repo root:

```powershell
python -c "import zipfile; z=zipfile.ZipFile('lambda/storage/function.bin','w',compression=zipfile.ZIP_DEFLATED); z.write('lambda/storage/index.py','index.py'); z.close()"

aws lambda update-function-code --function-name leetcode-game-storage `
  --zip-file fileb://lambda/storage/function.bin `
  --region us-east-1 --profile default
```
