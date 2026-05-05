#!/usr/bin/env python3
"""
waltid-cli: CLI tool for issuing verifiable credentials using walt.id

This tool provides a command-line interface for issuing W3C Verifiable Credentials
using the walt.id Issuer API via OID4VCI protocol.

Usage:
    waltid-cli onboard --key-type <ed25519|secp256k1|secp256r1> --did-method <key|jwk|web|cheqd>
    waltid-cli issue-credential --issuer-key <jwk-json> --issuer-did <did> --credential-type <type> --subject-did <did> [--sd-jwt]
    waltid-cli serve --port <port>
    waltid-cli storage --provider <s3|nextcloud> --config <path>
    waltid-cli store --credential <file> --storage <provider>

For more details, see: https://docs.walt.id/community-stack/issuer/getting-started
"""

import argparse
import json
import sys
import os
import base64
import hashlib
import hmac
import time
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from urllib.parse import urlparse, quote

# Default walt.id Issuer API endpoint
DEFAULT_ISSUER_URL = "https://issuer.demo.walt.id"

# Work server URLs (for Nextcloud S3 storage)
WORK_STORAGE_URLS = [
    os.environ.get("WORK_STORAGE_URL", "https://work-1-oziqncwhvinsxsug.prod-runtime.all-hands.dev"),
    "https://work-2-oziqncwhvinsxsug.prod-runtime.all-hands.dev",
]
WORK_STORAGE_PORTS = [12000, 12001]

# Supported credential types
CREDENTIAL_TYPES = [
    "UniversityDegree",
    "VerifiableId",
    "eID",
    "BankID",
    "EAID",
]


def generate_signature(secret_key: str, method: str, path: str, date: str, content_type: str = "") -> str:
    """Generate AWS S3 signature v4."""
    def sign(key: bytes, message: str) -> bytes:
        return hmac.new(key, message.encode('utf-8'), hashlib.sha256).digest()
    
    # Simple signature for basic auth or mock
    message = f"{method}\n{path}\n{date}\n{content_type}"
    return base64.b64encode(sign(secret_key.encode(), message)).decode()


class S3Storage:
    """S3-compatible storage backend (including Nextcloud S3)."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.endpoint = config.get("endpoint", "")
        self.bucket = config.get("bucket", "waltid-credentials")
        self.access_key = config.get("access_key", "")
        self.secret_key = config.get("secret_key", "")
        self.region = config.get("region", "us-east-1")
        self.use_ssl = config.get("use_ssl", True)
        self.use_path_style = config.get("use_path_style", True)
        self.port = config.get("port", 443)
        
    def _get_base_url(self) -> str:
        protocol = "https" if self.use_ssl else "http"
        if self.use_path_style:
            return f"{protocol}://{self.endpoint}:{self.port}/{self.bucket}"
        return f"{protocol}://{self.bucket}.{self.endpoint}:{self.port}"
    
    def _make_auth_header(self, method: str, path: str) -> Dict[str, str]:
        """Create authorization headers for S3 request."""
        date = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        amz_date = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        
        # Simple header-based auth (can be extended for AWS Signature v4)
        auth = base64.b64encode(
            f"{self.access_key}:{self.secret_key}".encode()
        ).decode()
        
        return {
            "Authorization": f"Basic {auth}",
            "x-amz-date": amz_date,
            "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        }
    
    def store_credential(self, credential_id: str, data: str) -> bool:
        """Store a credential in S3."""
        path = f"/{quote(credential_id)}"
        url = f"{self._get_base_url()}{path}"
        
        headers = self._make_auth_header("PUT", path)
        headers["Content-Type"] = "application/json"
        headers["Content-Length"] = str(len(data))
        
        try:
            response = requests.put(
                url, 
                data=data.encode(), 
                headers=headers,
                timeout=30
            )
            return response.status_code in (200, 201, 204)
        except requests.RequestException as e:
            print(f"Storage error: {e}", file=sys.stderr)
            return False
    
    def get_credential(self, credential_id: str) -> Optional[str]:
        """Retrieve a credential from S3."""
        path = f"/{quote(credential_id)}"
        url = f"{self._get_base_url()}{path}"
        
        headers = self._make_auth_header("GET", path)
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return response.text
            return None
        except requests.RequestException:
            return None
    
    def list_credentials(self, prefix: str = "") -> list:
        """List stored credentials."""
        path = f"/?prefix={quote(prefix)}"
        url = f"{self._get_base_url().split('/' + self.bucket)[0]}/{self.bucket}{path}"
        
        headers = self._make_auth_header("GET", path)
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                # Parse XML or return simple list
                return [prefix]
            return []
        except requests.RequestException:
            return []


class NextcloudStorage:
    """Nextcloud S3 storage backend (uses S3-compatible API or WebDAV)."""
    
    def __init__(self, config: Dict[str, Any]):
        # Use the first server as primary
        self.server_index = config.get("server_index", 0)
        base_url = WORK_STORAGE_URLS[self.server_index] if self.server_index < len(WORK_STORAGE_URLS) else WORK_STORAGE_URLS[0]
        base_port = WORK_STORAGE_PORTS[self.server_index] if self.server_index < len(WORK_STORAGE_PORTS) else WORK_STORAGE_PORTS[0]
        
        self.nextcloud_url = config.get("nextcloud_url", base_url)
        self.nextcloud_port = int(config.get("nextcloud_port", str(base_port)))
        
        # Nextcloud uses S3 backend internally
        self.s3 = S3Storage({
            "endpoint": self.nextcloud_url.replace("https://", "").replace("http://", ""),
            "port": self.nextcloud_port,
            "bucket": config.get("bucket", "waltid-credentials"),
            "access_key": config.get("access_key", ""),
            "secret_key": config.get("secret_key", ""),
            "region": config.get("region", "us-east-1"),
            "use_ssl": config.get("use_ssl", True),
            "use_path_style": True,  # Nextcloud requires path style
        })
        self.webdav_url = config.get("webdav_url", f"{self.nextcloud_url}/remote.php/dav/files/")
        self.username = config.get("username", "")
        self.password = config.get("password", "")
        
    def store_credential(self, credential_id: str, data: str) -> bool:
        """Store credential via WebDAV (preferred for Nextcloud) or S3."""
        if self.webdav_url and self.username:
            return self._store_via_webdav(credential_id, data)
        return self.s3.store_credential(credential_id, data)
    
    def _store_via_webdav(self, credential_id: str, data: str) -> bool:
        """Store via Nextcloud WebDAV."""
        url = f"{self.webdav_url}/waltid-credentials/{quote(credential_id)}"
        auth = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        }
        
        try:
            response = requests.put(url, data=data.encode(), headers=headers, timeout=30)
            return response.status_code in (200, 201, 204)
        except requests.RequestException:
            return False
    
    def get_credential(self, credential_id: str) -> Optional[str]:
        """Retrieve credential via WebDAV or S3."""
        if self.webdav_url and self.username:
            return self._get_via_webdav(credential_id)
        return self.s3.get_credential(credential_id)
    
    def _get_via_webdav(self, credential_id: str) -> Optional[str]:
        """Get via Nextcloud WebDAV."""
        url = f"{self.webdav_url}/waltid-credentials/{quote(credential_id)}"
        auth = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth}",
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return response.text
            return None
        except requests.RequestException:
            return None


def load_storage_config(config_path: str) -> Dict[str, Any]:
    """Load storage configuration from file."""
    with open(config_path, "r") as f:
        return json.load(f)


def save_credential_to_storage(
    credential_file: str, 
    provider: str,
    config: Dict[str, Any]
) -> bool:
    """Store a credential file to the configured storage."""
    # Load credential data
    with open(credential_file, "r") as f:
        credential_data = f.read()
    
    # Extract credential ID from data or use filename
    try:
        cred_json = json.loads(credential_data)
        credential_id = cred_json.get("id", os.path.basename(credential_file))
    except json.JSONDecodeError:
        credential_id = os.path.basename(credential_file)
    
    # Store based on provider
    if provider == "nextcloud":
        storage = NextcloudStorage(config)
        return storage.store_credential(credential_id, credential_data)
    elif provider == "s3":
        storage = S3Storage(config)
        return storage.store_credential(credential_id, credential_data)
    else:
        print(f"Unknown provider: {provider}", file=sys.stderr)
        return False


def onboard_issuer(
    key_type: str = "ed25519",
    did_method: str = "key",
    issuer_url: str = DEFAULT_ISSUER_URL
) -> Dict[str, Any]:
    """
    Create an issuer signing key and DID for credential issuance.
    
    Args:
        key_type: Key algorithm (ed25519, secp256k1, secp256r1, RSA)
        did_method: DID method (key, jwk, web, cheqd)
        issuer_url: URL of the walt.id Issuer API
        
    Returns:
        Dictionary containing issuerKey and issuerDid
    """
    url = f"{issuer_url}/onboard/issuer"
    
    payload = {
        "key": {
            "backend": "jwk",
            "keyType": key_type
        },
        "did": {
            "method": did_method
        }
    }
    
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    return response.json()


def issue_jwt_credential(
    issuer_key: Dict[str, Any],
    issuer_did: str,
    credential_type: str = "UniversityDegree",
    credential_data: Optional[Dict[str, Any]] = None,
    subject_did: Optional[str] = None,
    issuer_url: str = DEFAULT_ISSUER_URL
) -> str:
    """
    Issue a W3C Verifiable Credential as JWT.
    
    Args:
        issuer_key: The issuer key in JWK format
        issuer_did: The issuer DID
        credential_type: Type of credential to issue (e.g., UniversityDegree, VerifiableId)
        credential_data: Custom credential data (optional)
        subject_did: DID of the credential subject/holder
        issuer_url: URL of the walt.id Issuer API
        
    Returns:
        Credential Offer URL that can be scanned by a wallet
    """
    url = f"{issuer_url}/openid4vc/jwt/issue"
    
    # Default credential data for UniversityDegree
    if credential_data is None:
        credential_data = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "type": [
                "VerifiableCredential",
                credential_type
            ],
            "issuer": {
                "id": issuer_did
            },
            "credentialSubject": {
                "id": subject_did or "did:example:ebfeb1f712ebc6f1c276e12ec21",
                "degree": {
                    "type": "BachelorDegree",
                    "name": "Bachelor of Science and Arts"
                }
            }
        }
    
    # Handle credential type mapping
    config_id = f"{credential_type}_jwt_vc_json"
    
    payload = {
        "issuerKey": {
            "type": "jwk",
            "jwk": issuer_key
        },
        "issuerDid": issuer_did,
        "credentialConfigurationId": config_id,
        "credentialData": credential_data,
        "mapping": {
            "id": "",
            "issuer": {"id": ""},
            "credentialSubject": {"id": ""},
            "issuanceDate": "",
            "expirationDate": ""
        },
        "authenticationMethod": "PRE_AUTHORIZED",
        "standardVersion": "DRAFT13"
    }
    
    headers = {
        "accept": "text/plain",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    return response.text


def issue_sdjwt_credential(
    issuer_key: Dict[str, Any],
    issuer_did: str,
    credential_type: str = "UniversityDegree",
    credential_data: Optional[Dict[str, Any]] = None,
    subject_did: Optional[str] = None,
    issuer_url: str = DEFAULT_ISSUER_URL
) -> str:
    """
    Issue a W3C Verifiable Credential as SD-JWT (Selective Disclosure JWT).
    
    Args:
        issuer_key: The issuer key in JWK format
        issuer_did: The issuer DID
        credential_type: Type of credential to issue
        credential_data: Custom credential data (optional)
        subject_did: DID of the credential subject/holder
        issuer_url: URL of the walt.id Issuer API
        
    Returns:
        Credential Offer URL that can be scanned by a wallet
    """
    url = f"{issuer_url}/openid4vc/sdjwt/issue"
    
    if credential_data is None:
        credential_data = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "type": [
                "VerifiableCredential",
                credential_type
            ],
            "issuer": {
                "id": issuer_did
            },
            "credentialSubject": {
                "id": subject_did or "did:example:ebfeb1f712ebc6f1c276e12ec21",
                "degree": {
                    "type": "BachelorDegree",
                    "name": "Bachelor of Science and Arts"
                }
            }
        }
    
    config_id = f"{credential_type}_vc+sd-jwt"
    
    payload = {
        "issuerKey": {
            "type": "jwk",
            "jwk": issuer_key
        },
        "issuerDid": issuer_did,
        "credentialConfigurationId": config_id,
        "credentialData": credential_data,
        "mapping": {
            "id": "",
            "issuer": {"id": ""},
            "credentialSubject": {"id": ""},
            "issuanceDate": "",
            "expirationDate": ""
        },
        "authenticationMethod": "PRE_AUTHORIZED",
        "standardVersion": "DRAFT13"
    }
    
    headers = {
        "accept": "text/plain",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    return response.text


def parse_jwk(jwk_str: str) -> Dict[str, Any]:
    """Parse JWK from JSON string."""
    if isinstance(jwk_str, dict):
        return jwk_str
    return json.loads(jwk_str)


def main():
    parser = argparse.ArgumentParser(
        description="waltid-cli: CLI tool for issuing verifiable credentials using walt.id",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Onboard command
    onboard_parser = subparsers.add_parser(
        "onboard",
        help="Create issuer signing key and DID"
    )
    onboard_parser.add_argument(
        "--key-type",
        choices=["ed25519", "secp256k1", "secp256r1", "RSA"],
        default="ed25519",
        help="Key algorithm (default: ed25519)"
    )
    onboard_parser.add_argument(
        "--did-method",
        choices=["key", "jwk", "web", "cheqd"],
        default="key",
        help="DID method (default: key)"
    )
    onboard_parser.add_argument(
        "--url",
        default=DEFAULT_ISSUER_URL,
        help=f"Issuer API URL (default: {DEFAULT_ISSUER_URL})"
    )
    onboard_parser.add_argument(
        "--output",
        "-o",
        help="Output file for key and DID (optional)"
    )
    
    # Issue credential command
    issue_parser = subparsers.add_parser(
        "issue-credential",
        help="Issue a verifiable credential"
    )
    issue_parser.add_argument(
        "--issuer-key",
        required=True,
        help="Issuer key in JWK format (JSON string or @file:path)"
    )
    issue_parser.add_argument(
        "--issuer-did",
        required=True,
        help="Issuer DID"
    )
    issue_parser.add_argument(
        "--credential-type",
        default="UniversityDegree",
        help=f"Credential type (default: UniversityDegree)"
    )
    issue_parser.add_argument(
        "--subject-did",
        help="Subject/holder DID"
    )
    issue_parser.add_argument(
        "--sd-jwt",
        action="store_true",
        help="Issue SD-JWT instead of JWT"
    )
    issue_parser.add_argument(
        "--url",
        default=DEFAULT_ISSUER_URL,
        help=f"Issuer API URL (default: {DEFAULT_ISSUER_URL})"
    )
    issue_parser.add_argument(
        "--output",
        "-o",
        help="Output file for credential offer URL (optional)"
    )
    
    # Serve command (for local development)
    serve_parser = subparsers.add_parser(
        "serve",
        help="Start local walt.id issuer API (requires Docker)"
    )
    serve_parser.add_argument(
        "--port",
        type=int,
        default=7002,
        help="Port to listen on (default: 7002)"
    )
    
    # Storage configuration command
    storage_parser = subparsers.add_parser(
        "storage",
        help="Configure storage backend"
    )
    storage_parser.add_argument(
        "--provider",
        choices=["s3", "nextcloud"],
        required=True,
        help="Storage provider type"
    )
    storage_parser.add_argument(
        "--config",
        help="Path to storage configuration JSON file"
    )
    storage_parser.add_argument(
        "--endpoint",
        help="S3 endpoint hostname"
    )
    storage_parser.add_argument(
        "--bucket",
        default="waltid-credentials",
        help="S3 bucket name"
    )
    storage_parser.add_argument(
        "--access-key",
        help="S3 access key"
    )
    storage_parser.add_argument(
        "--secret-key",
        help="S3 secret key"
    )
    storage_parser.add_argument(
        "--server",
        type=int,
        choices=[0, 1],
        default=0,
        help="Work server to use (0=work-1, 1=work-2)"
    )
    storage_parser.add_argument(
        "--output",
        "-o",
        help="Output file for storage config"
    )
    
    # Store credential command
    store_parser = subparsers.add_parser(
        "store",
        help="Store credential to configured storage"
    )
    store_parser.add_argument(
        "--credential",
        required=True,
        help="Credential file to store"
    )
    store_parser.add_argument(
        "--storage",
        choices=["s3", "nextcloud"],
        required=True,
        help="Storage provider"
    )
    store_parser.add_argument(
        "--config",
        help="Path to storage configuration file"
    )
    
    args = parser.parse_args()
    
    if args.command == "onboard":
        try:
            result = onboard_issuer(
                key_type=args.key_type,
                did_method=args.did_method,
                issuer_url=args.url
            )
            print(json.dumps(result, indent=2))
            
            if args.output:
                with open(args.output, "w") as f:
                    json.dump(result, f, indent=2)
                print(f"\nSaved to {args.output}")
                
        except requests.RequestException as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
            
    elif args.command == "issue-credential":
        # Parse issuer key
        issuer_key_str = args.issuer_key
        if issuer_key_str.startswith("@file:"):
            with open(issuer_key_str[6:], "r") as f:
                key_data = json.load(f)
                issuer_key = key_data.get("issuerKey", key_data).get("jwk", key_data)
        else:
            issuer_key = parse_jwk(issuer_key_str)
        
        try:
            if args.sd_jwt:
                offer_url = issue_sdjwt_credential(
                    issuer_key=issuer_key,
                    issuer_did=args.issuer_did,
                    credential_type=args.credential_type,
                    subject_did=args.subject_did,
                    issuer_url=args.url
                )
            else:
                offer_url = issue_jwt_credential(
                    issuer_key=issuer_key,
                    issuer_did=args.issuer_did,
                    credential_type=args.credential_type,
                    subject_did=args.subject_did,
                    issuer_url=args.url
                )
            
            print(offer_url)
            
            if args.output:
                with open(args.output, "w") as f:
                    f.write(offer_url)
                print(f"\nSaved to {args.output}")
                
        except requests.RequestException as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
            
    elif args.command == "serve":
        print("Starting local walt.id issuer API...")
        print(f"\nTo start the issuer API, run:")
        print(f"  docker run -p {args.port}:7001 waltid/issuer-api")
        print(f"\nThen access the API at: http://localhost:{args.port}")
        print(f"Swagger UI: http://localhost:{args.port}/swagger")
        
    elif args.command == "storage":
        # Build storage config
        config = {}
        
        if args.config:
            # Load from file first
            with open(args.config, "r") as f:
                config = json.load(f)
        
        # Override with CLI args
        if args.provider == "s3" or args.provider == "nextcloud":
            config["provider"] = args.provider
            config["endpoint"] = args.endpoint or config.get("endpoint", "")
            config["bucket"] = args.bucket
            config["access_key"] = args.access_key or config.get("access_key", "")
            config["secret_key"] = args.secret_key or config.get("secret_key", "")
            config["server_index"] = args.server
            
            # Nextcloud-specific overrides
            if args.provider == "nextcloud":
                # Use the selected work server
                server_url = WORK_STORAGE_URLS[args.server]
                server_port = WORK_STORAGE_PORTS[args.server]
                
                config["nextcloud_url"] = config.get("nextcloud_url", server_url)
                config["nextcloud_port"] = config.get("nextcloud_port", str(server_port))
                config["webdav_url"] = config.get("webdav_url", f"{server_url}/remote.php/dav/files/")
        
        print(json.dumps(config, indent=2))
        
        if args.output:
            with open(args.output, "w") as f:
                json.dump(config, f, indent=2)
            print(f"\nSaved to {args.output}")
            
    elif args.command == "store":
        # Load config
        config = {}
        if args.config:
            with open(args.config, "r") as f:
                config = json.load(f)
        
        # Try to store credential
        success = save_credential_to_storage(
            credential_file=args.credential,
            provider=args.storage,
            config=config
        )
        
        if success:
            print(f"Credential stored successfully in {args.storage}")
            sys.exit(0)
        else:
            print(f"Failed to store credential in {args.storage}", file=sys.stderr)
            sys.exit(1)
        
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()