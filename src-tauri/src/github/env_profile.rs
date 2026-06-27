/// Parse newline-separated KEY=value environment profile lines.
pub fn parse_env_profile(content: &str) -> Vec<(String, String)> {
    content
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                return None;
            }
            let (key, value) = trimmed.split_once('=')?;
            let key = key.trim();
            if key.is_empty() {
                return None;
            }
            Some((key.to_string(), value.trim().to_string()))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::parse_env_profile;

    #[test]
    fn parses_key_value_pairs() {
        let pairs = parse_env_profile("FOO=bar\n# comment\nBAZ=qux\n");
        assert_eq!(pairs.len(), 2);
        assert_eq!(pairs[0], ("FOO".to_string(), "bar".to_string()));
        assert_eq!(pairs[1], ("BAZ".to_string(), "qux".to_string()));
    }
}
