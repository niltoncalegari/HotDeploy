use super::types::WorkflowOptions;

pub fn generate_workflow_yaml(options: &WorkflowOptions) -> String {
    let trigger = match options.trigger.as_str() {
        "pull_request" => "pull_request:\n    branches: [main]".to_string(),
        "manual" => "workflow_dispatch:".to_string(),
        _ => "push:\n    branches: [main]".to_string(),
    };

    let runs_on = if options.runner_type == "self-hosted" {
        "self-hosted".to_string()
    } else {
        "ubuntu-latest".to_string()
    };

    let test_step = if options.include_test_step {
        r#"      - name: Run tests
        run: |
          if [ -f package.json ]; then npm ci && npm test; else echo "No package.json — skip tests"; fi
"#
    } else {
        ""
    };

    let deploy_step = if options.runner_type == "self-hosted" {
        format!(
            r#"      - name: Deploy Docker Project
        run: |
          curl -fsSL -X POST "https://developers.hostinger.com/api/vps/v1/virtual-machines/${{{{ secrets.HOSTINGER_VM_ID }}}}/docker/{project}/update" \
            -H "Authorization: Bearer ${{{{ secrets.HOSTINGER_API_KEY }}}}" \
            -H "Content-Type: application/json"
"#,
            project = options.docker_project_name
        )
    } else {
        format!(
            r#"      - name: Deploy to Hostinger VPS
        uses: hostinger/deploy-on-vps@v2
        with:
          api-key: ${{{{ secrets.HOSTINGER_API_KEY }}}}
          virtual-machine: ${{{{ secrets.HOSTINGER_VM_ID }}}}
          project-name: {project}
          docker-compose-path: docker-compose.yaml
"#,
            project = options.docker_project_name
        )
    };

    format!(
        r#"name: HotDeploy CI/CD

on:
  {trigger}

jobs:
  deploy:
    runs-on: {runs_on}
    steps:
      - uses: actions/checkout@v4
{test_step}{deploy_step}"#
    )
}

#[cfg(test)]
mod tests {
    use super::generate_workflow_yaml;
    use crate::github::types::WorkflowOptions;

    #[test]
    fn generates_self_hosted_workflow() {
        let yaml = generate_workflow_yaml(&WorkflowOptions {
            docker_project_name: "my-app".into(),
            vm_id: 123,
            trigger: "push".into(),
            runner_type: "self-hosted".into(),
            include_test_step: true,
        });

        assert!(yaml.contains("runs-on: self-hosted"));
        assert!(yaml.contains("my-app"));
        assert!(yaml.contains("Run tests"));
    }

    #[test]
    fn generates_hosted_runner_workflow() {
        let yaml = generate_workflow_yaml(&WorkflowOptions {
            docker_project_name: "api".into(),
            vm_id: 1,
            trigger: "manual".into(),
            runner_type: "github-hosted".into(),
            include_test_step: false,
        });

        assert!(yaml.contains("runs-on: ubuntu-latest"));
        assert!(yaml.contains("hostinger/deploy-on-vps@v2"));
        assert!(yaml.contains("workflow_dispatch:"));
    }
}
