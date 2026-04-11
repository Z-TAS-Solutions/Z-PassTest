# Z-PassTEST

Z-PassTEST is a lightweight testing utility designed to validate the passkey (WebAuthn) functionality of the Multi-Factor Authentication (MFA) module in Z-TAS.

This tool allows users to quickly register and authenticate passkeys using only an email address, making it ideal for development, debugging, and QA workflows.

---

## Overview

Z-PassTEST provides a minimal interface to interact with WebAuthn-based passkey flows. It abstracts away complexity and focuses on verifying that the backend endpoints behave correctly during:

* Passkey registration
* Passkey authentication (login)

The system communicates with Z-TAS via a set of RESTful API endpoints.

---

## Features

* Simple email-based passkey registration
* End-to-end WebAuthn flow testing
* Minimal setup required
* Useful for debugging MFA integration issues

---

## How It Works

1. The user enters their email address.
2. The system initiates a WebAuthn registration or authentication flow.
3. The browser handles passkey operations (e.g., biometrics, device authentication).
4. The responses are sent to the backend endpoints for verification.

---

## API Endpoints

All endpoints are grouped under:

```
/api/v1/webauthn
```

### Passkey Registration

* **Begin Registration**

  ```
  POST /api/v1/webauthn/register/begin
  ```

* **Finish Registration**

  ```
  POST /api/v1/webauthn/register/finish
  ```

### Passkey Authentication

* **Begin Login**

  ```
  POST /api/v1/webauthn/login/begin
  ```

* **Finish Login**

  ```
  POST /api/v1/webauthn/login/finish
  ```

---

## Usage

1. Start the Z-TAS backend service.
2. Register User and Verify OTP (Follow API DOC)
2. Run Z-PassTEST.
3. Enter a valid email address.
4. Choose to register or log in using a passkey.
5. Complete the browser prompt for passkey verification.

---

## Requirements

* A modern browser with WebAuthn/passkey support

  * Chrome, Edge, Safari, or Firefox (latest versions recommended)
* HTTPS environment (required for WebAuthn in most browsers)
* Running instance of Z-TAS backend

---

## Notes

* Passkeys are device and browser dependent.
* Ensure that your testing environment supports secure contexts (HTTPS or localhost).
* This tool is intended for testing and validation purposes only, not for production use.

---

## License

Cyberlow License Baby ;)

---

## Contribution

Contributions, issues, and feature requests are welcome. Please follow standard pull request practices.
