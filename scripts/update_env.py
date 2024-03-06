import base64
import json
from base64 import b64encode
from hashlib import sha256
from pathlib import Path

import requests
from nacl import encoding, public


def get_repo_pubkey(owner: str, repo: str, token: str):
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    response = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/public-key", headers=headers
    )
    if response.status_code > 300:
        raise Exception(response.text)
    return response.text


def get_secret(owner: str, repo: str, secret_name: str, token: str):
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    response = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/{secret_name}",
        headers=headers,
    )
    if response.status_code > 300:
        raise Exception(response.text)
    return response.text


def create_secrets(
    owner: str, repo: str, secret_name: str, key_id: str, enc_value: str, token: str
):
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = json.dumps({"encrypted_value": enc_value, "key_id": key_id})

    response = requests.put(
        f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/{secret_name}",
        headers=headers,
        data=data,
    )
    if response.status_code > 300:
        raise Exception(response.text)
    return response.text


def encrypt(public_key_enc: str, secret_value: str) -> str:
    """Encrypt a Unicode string using the public key."""
    public_key = public.PublicKey(public_key_enc.encode("utf-8"), encoding.Base64Encoder())  # type: ignore
    sealed_box = public.SealedBox(public_key)
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return b64encode(encrypted).decode("utf-8")


if __name__ == "__main__":
    try:
        owner = "weiiiii0622"
        repo = "NTU-Grade-Viewer"
        token = open(Path(__file__).parent / "../.github/token", encoding="utf-8").read().strip()

        # Get public key for encrypt secret
        res = json.loads(get_repo_pubkey(owner, repo, token))
        pubkey = res["key"]
        key_id = res["key_id"]

        # Create/update secret by base64 encoded `.env`
        secret_name = "ENV_FILE_BASE64"
        env_base64 = base64.b64encode(open(Path(__file__).parent / "../.env", "rb").read()).decode()
        enc_value = encrypt(pubkey, env_base64)
        create_secrets(owner, repo, secret_name, key_id, enc_value, token)

        # Update sha256
        h = sha256(open(Path(__file__).parent / "../.env", "rb").read()).digest()
        open(Path(__file__).parent / "../.env.sha256", "+wb").write(h.hex().encode())
    except Exception as e:

        print("Error: update ENV_FILE secrets failed.")
        print(e)
        exit(1)
