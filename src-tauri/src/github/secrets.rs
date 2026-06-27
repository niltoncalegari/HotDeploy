use base64::{engine::general_purpose::STANDARD as BASE64, Engine};

use super::error::GitHubError;

pub fn encrypt_secret_value(
    public_key_b64: &str,
    secret_value: &str,
) -> Result<String, GitHubError> {
    sodiumoxide::init().map_err(|_| GitHubError::Encryption("sodium init failed".into()))?;

    let key_bytes = BASE64
        .decode(public_key_b64)
        .map_err(|error| GitHubError::Encryption(error.to_string()))?;

    let public_key = sodiumoxide::crypto::box_::PublicKey::from_slice(&key_bytes)
        .ok_or_else(|| GitHubError::Encryption("invalid GitHub public key length".into()))?;

    let sealed = sodiumoxide::crypto::sealedbox::seal(secret_value.as_bytes(), &public_key);
    Ok(BASE64.encode(sealed))
}

#[cfg(test)]
mod tests {
    use base64::Engine;

    use super::encrypt_secret_value;

    #[test]
    fn encrypt_produces_base64_output() {
        sodiumoxide::init().unwrap();
        let (public_key, _secret_key) = sodiumoxide::crypto::box_::gen_keypair();
        let public_key_b64 = base64::engine::general_purpose::STANDARD.encode(public_key.as_ref());

        let encrypted = encrypt_secret_value(&public_key_b64, "supersecret").expect("encrypt");
        assert!(!encrypted.is_empty());
        assert_ne!(encrypted, "supersecret");
    }
}
