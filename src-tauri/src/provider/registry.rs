use super::digitalocean::DigitalOceanProvider;
use super::error::ProviderError;
use super::hostinger::HostingerProvider;
use super::traits::VpsProvider;

pub fn build_provider(provider_id: &str) -> Result<Box<dyn VpsProvider>, ProviderError> {
    match provider_id {
        "hostinger" => Ok(Box::new(HostingerProvider::from_keychain()?)),
        "digitalocean" => Ok(Box::new(DigitalOceanProvider::from_keychain()?)),
        other => Err(ProviderError::UnknownProvider(other.to_string())),
    }
}

pub fn default_provider_id() -> &'static str {
    "hostinger"
}

pub fn resolve_provider_id(provider: Option<String>) -> String {
    provider.unwrap_or_else(|| default_provider_id().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_to_hostinger() {
        assert_eq!(resolve_provider_id(None), "hostinger");
    }

    #[test]
    fn rejects_unknown_provider() {
        assert!(matches!(
            build_provider("hetzner"),
            Err(ProviderError::UnknownProvider(_))
        ));
    }
}
